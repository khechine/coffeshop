import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

export type InteractionType =
  | 'VIEW_PROFILE'
  | 'VIEW_PRODUCT'
  | 'VIEW_CATALOG'
  | 'SEND_MESSAGE'
  | 'REQUEST_QUOTE'
  | 'PLACE_ORDER';

const db = prisma as any; // new models not yet in local TS types — safe cast

/**
 * InteractionService — Phase 2 Anti-Leakage
 *
 * Logs every meaningful touchpoint between a CoffeeShop and a Vendor.
 * Updates the StoreVendorRelationship lifecycle status automatically.
 * Triggers BehaviorScoring after each interaction.
 */
@Injectable()
export class InteractionService {
  private readonly logger = new Logger(InteractionService.name);

  async log(
    storeId: string,
    vendorId: string,
    type: InteractionType,
    metadata?: Record<string, unknown>,
  ) {
    try {
      // 1. Create the interaction event
      await db.vendorInteraction.create({
        data: { storeId, vendorId, type, metadata: metadata ?? {} },
      });

      // 2. Upsert the formal relationship
      const statusForType = this.getStatusForType(type);
      const now = new Date();

      await db.storeVendorRelationship.upsert({
        where: { storeId_vendorId: { storeId, vendorId } },
        create: {
          storeId,
          vendorId,
          status: statusForType,
          discoveredAt: now,
          lastActivityAt: now,
          totalInteractions: 1,
          ...(type === 'PLACE_ORDER' ? { firstOrderAt: now, lastOrderAt: now } : {}),
        },
        update: {
          status: statusForType,
          lastActivityAt: now,
          totalInteractions: { increment: 1 },
          ...(type === 'SEND_MESSAGE' ? { firstContactAt: now } : {}),
          ...(type === 'PLACE_ORDER' ? { lastOrderAt: now } : {}),
        },
      });

      // 3. Recompute leakage risk score (async, non-blocking)
      this.computeLeakageScore(storeId, vendorId).catch(() => {});
    } catch (err) {
      // Never crash the main flow for tracking failures
      this.logger.warn(`[AntiLeakage] Failed to log interaction: ${err}`);
    }
  }

  async logOrder(storeId: string, vendorId: string, orderTotal: number) {
    await this.log(storeId, vendorId, 'PLACE_ORDER', { orderTotal });

    try {
      await db.storeVendorRelationship.updateMany({
        where: { storeId, vendorId },
        data: {
          totalOrders: { increment: 1 },
          totalRevenue: { increment: orderTotal },
          status: 'ORDERED',
        },
      });
    } catch {}
  }

  // ── Score Calculation ─────────────────────────────────────────────────────

  async computeLeakageScore(storeId: string, vendorId: string): Promise<number> {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [interactions, orders, relationship] = await Promise.all([
      db.vendorInteraction.count({
        where: { storeId, vendorId, createdAt: { gte: since30d } },
      }),
      prisma.supplierOrder.count({
        where: { storeId, vendorId, createdAt: { gte: since30d } },
      }),
      db.storeVendorRelationship.findUnique({
        where: { storeId_vendorId: { storeId, vendorId } },
        select: { totalOrders: true, discoveredAt: true },
      }),
    ]);

    // Score formula:
    // High score = many views, few orders → leakage risk
    // Low score  = views followed by orders → healthy platform usage
    let score = 0;

    if (interactions > 0) {
      const conversionRate = orders / interactions;
      score = Math.round((1 - Math.min(conversionRate, 1)) * 80);
    }

    // Bonus risk: discovered 30+ days ago, never ordered
    if (relationship && relationship.totalOrders === 0) {
      const daysSinceDiscovery = Math.floor(
        (Date.now() - new Date(relationship.discoveredAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceDiscovery > 30) score = Math.min(100, score + 20);
    }

    // Persist the score
    await db.storeVendorRelationship.updateMany({
      where: { storeId, vendorId },
      data: { leakageRiskScore: score },
    });

    // Auto-flag if high risk (≥ 80)
    if (score >= 80) {
      await db.storeVendorRelationship.updateMany({
        where: { storeId, vendorId, isFlagged: false },
        data: { isFlagged: true, flagReason: `Score de risque élevé: ${score}/100` },
      });
      this.logger.warn(
        `[AntiLeakage] 🚨 High risk: store=${storeId} vendor=${vendorId} score=${score}`,
      );
    }

    return score;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getStatusForType(type: InteractionType): string {
    switch (type) {
      case 'PLACE_ORDER':
        return 'ORDERED';
      case 'SEND_MESSAGE':
      case 'REQUEST_QUOTE':
        return 'CONTACTED';
      default:
        return 'DISCOVERED';
    }
  }
}
