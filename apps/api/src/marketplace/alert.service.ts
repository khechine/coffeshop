import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { InteractionService } from './interaction.service';

const db = prisma as any;

/**
 * AlertService — Phase 4 Anti-Leakage
 *
 * Monitors relationships and triggers alerts when:
 * - leakageRiskScore reaches threshold (≥ 70 warning, ≥ 85 critical)
 * - A relationship goes from DISCOVERED to CHURNED without ordering
 * - Unusual interaction spike detected (many views, no conversion in 7d)
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly interactionService: InteractionService) {}

  // ── Main Alert Scan ─────────────────────────────────────────────────────

  /**
   * Run a full leakage scan across all active relationships.
   * Intended to be called on a schedule (cron) or manually by SuperAdmin.
   */
  async runLeakageScan(): Promise<{
    scanned: number;
    warnings: number;
    critical: number;
    alerts: any[];
  }> {
    // Find all relationships with recent activity but no orders
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const atRiskRelationships = await db.storeVendorRelationship.findMany({
      where: {
        status: { in: ['DISCOVERED', 'CONTACTED'] },
        lastActivityAt: { gte: since30d },
        totalOrders: 0,
      },
      include: {
        store: { select: { name: true, city: true, phone: true } },
        vendor: { select: { companyName: true, city: true } },
      },
      orderBy: { leakageRiskScore: 'desc' },
      take: 200,
    });

    const alerts: any[] = [];
    let warnings = 0;
    let critical = 0;

    for (const rel of atRiskRelationships) {
      // Recompute score
      const score = await this.interactionService.computeLeakageScore(
        rel.storeId,
        rel.vendorId,
      );

      const daysSince = Math.floor(
        (Date.now() - new Date(rel.discoveredAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (score >= 85) {
        critical++;
        alerts.push(this.buildAlert('CRITICAL', rel, score, daysSince));
        this.logger.error(
          `[ALERTE CRITIQUE] Leakage probable: ${rel.store?.name} → ${rel.vendor?.companyName} | Score: ${score} | Jours: ${daysSince}`,
        );
      } else if (score >= 70) {
        warnings++;
        alerts.push(this.buildAlert('WARNING', rel, score, daysSince));
        this.logger.warn(
          `[ALERTE] Risque élevé: ${rel.store?.name} → ${rel.vendor?.companyName} | Score: ${score}`,
        );
      }
    }

    this.logger.log(
      `[LeakageScan] Scanné: ${atRiskRelationships.length} | ⚠️ ${warnings} warnings | 🚨 ${critical} critiques`,
    );

    return {
      scanned: atRiskRelationships.length,
      warnings,
      critical,
      alerts,
    };
  }

  // ── Spike Detection ────────────────────────────────────────────────────

  /**
   * Detects unusual view spikes: > 5 interactions in 7 days with 0 orders.
   */
  async detectSpikes(): Promise<any[]> {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const spikes = await db.vendorInteraction.groupBy({
      by: ['storeId', 'vendorId'],
      where: { createdAt: { gte: since7d } },
      _count: { id: true },
      having: { id: { _count: { gt: 5 } } },
    });

    const results = [];
    for (const spike of spikes) {
      const orderCount = await prisma.supplierOrder.count({
        where: { storeId: spike.storeId, vendorId: spike.vendorId },
      });

      if (orderCount === 0) {
        results.push({
          storeId: spike.storeId,
          vendorId: spike.vendorId,
          interactionsIn7d: (spike._count as any).id,
          orders: 0,
          verdict: 'SPIKE_NO_CONVERSION',
        });
      }
    }

    return results;
  }

  // ── Platform Health Summary ────────────────────────────────────────────

  async getPlatformHealthSummary() {
    const [
      totalRelationships,
      activeOrdered,
      discoveredNoOrder,
      highRisk,
      flagged,
      recentInteractions,
      recentOrders,
    ] = await Promise.all([
      db.storeVendorRelationship.count(),
      db.storeVendorRelationship.count({ where: { status: 'ORDERED' } }),
      db.storeVendorRelationship.count({
        where: { status: 'DISCOVERED', totalOrders: 0 },
      }),
      db.storeVendorRelationship.count({
        where: { leakageRiskScore: { gte: 70 } },
      }),
      db.storeVendorRelationship.count({ where: { isFlagged: true } }),
      db.vendorInteraction.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.supplierOrder.count({
        where: {
          vendorId: { not: null },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const leakageRate =
      totalRelationships > 0
        ? ((discoveredNoOrder / totalRelationships) * 100).toFixed(1)
        : '0';

    return {
      health: {
        score: Math.round(100 - Number(leakageRate)),
        label:
          Number(leakageRate) < 20
            ? 'Excellente'
            : Number(leakageRate) < 40
            ? 'Bonne'
            : Number(leakageRate) < 60
            ? 'Moyenne'
            : 'Critique',
      },
      relationships: {
        total: totalRelationships,
        activeOrdered,
        discoveredNoOrder,
        conversionRate:
          totalRelationships > 0
            ? ((activeOrdered / totalRelationships) * 100).toFixed(1) + '%'
            : '0%',
      },
      risk: { highRisk, flagged, leakageRate: leakageRate + '%' },
      weeklyActivity: {
        interactions7d: recentInteractions,
        marketplaceOrders7d: recentOrders,
        weeklyConversion:
          recentInteractions > 0
            ? ((recentOrders / recentInteractions) * 100).toFixed(1) + '%'
            : '0%',
      },
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private buildAlert(level: 'WARNING' | 'CRITICAL', rel: any, score: number, daysSince: number) {
    return {
      level,
      storeId: rel.storeId,
      storeName: rel.store?.name,
      storeCity: rel.store?.city,
      vendorId: rel.vendorId,
      vendorName: rel.vendor?.companyName,
      score,
      daysSinceDiscovery: daysSince,
      totalInteractions: rel.totalInteractions,
      totalOrders: rel.totalOrders,
      isFlagged: rel.isFlagged,
      message:
        level === 'CRITICAL'
          ? `🚨 Bypass probable : ${rel.store?.name} consulte ${rel.vendor?.companyName} depuis ${daysSince} jours sans commande.`
          : `⚠️ Risque élevé : ${rel.store?.name} a ${rel.totalInteractions} interactions avec ${rel.vendor?.companyName} sans conversion.`,
    };
  }
}
