import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ContractService } from './contract.service';
import { MarketplaceAuthGuard } from '../auth/marketplace.guard';
import { SubscriptionGuard } from './subscription.guard';
import { prisma } from '@coffeeshop/database';

const db = prisma as any;

/**
 * MarketplaceController — Phase 2 & 3 Anti-Leakage
 *
 * Phase 2: Interaction logging + SuperAdmin risk monitoring
 * Phase 3: Subscription paywall + Exclusive platform services
 *          (Contract certificates, Vendor analytics, BNPL eligibility)
 */
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly interactionService: InteractionService,
    private readonly contractService: ContractService,
  ) {}

  // ══════════════════════════════════════════════════════
  // PHASE 2 — Interaction Logging
  // ══════════════════════════════════════════════════════

  /**
   * Called by the frontend whenever a coffee shop views a vendor profile/product.
   * Requires active subscription (SubscriptionGuard).
   */
  @UseGuards(MarketplaceAuthGuard, SubscriptionGuard)
  @Post('interactions/log')
  async logInteraction(
    @Body()
    body: {
      storeId: string;
      vendorId: string;
      type: 'VIEW_PROFILE' | 'VIEW_PRODUCT' | 'VIEW_CATALOG' | 'SEND_MESSAGE' | 'REQUEST_QUOTE';
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.interactionService.log(body.storeId, body.vendorId, body.type, body.metadata);
    return { ok: true };
  }

  // ══════════════════════════════════════════════════════
  // PHASE 3 — Exclusive Platform Services
  // ══════════════════════════════════════════════════════

  /**
   * 📄 Legal proof of first contact — Certificate of Relationship
   * Only accessible to parties with an active subscription.
   */
  @UseGuards(MarketplaceAuthGuard, SubscriptionGuard)
  @Get('contract/certificate/:storeId/:vendorId')
  async getRelationshipCertificate(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.contractService.getRelationshipCertificate(storeId, vendorId);
  }

  /**
   * 📊 Vendor analytics dashboard — Exclusive platform service
   * Vendors can only see who viewed them through the platform.
   */
  @UseGuards(MarketplaceAuthGuard)
  @Get('analytics/vendor/:vendorId')
  async getVendorAnalytics(@Param('vendorId') vendorId: string) {
    return this.contractService.getVendorAnalytics(vendorId);
  }

  /**
   * 💳 BNPL Eligibility — Available only for platform partners
   * Stores that bypass the platform lose BNPL access.
   */
  @UseGuards(MarketplaceAuthGuard, SubscriptionGuard)
  @Get('bnpl/eligibility/:storeId/:vendorId')
  async getBNPLEligibility(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.contractService.getBNPLEligibility(storeId, vendorId);
  }

  // ══════════════════════════════════════════════════════
  // SUPERADMIN Monitoring
  // ══════════════════════════════════════════════════════

  /**
   * Dashboard SuperAdmin: all at-risk relationships (score ≥ 50).
   */
  @Get('admin/risk-report')
  async getRiskReport() {
    const relationships = await db.storeVendorRelationship.findMany({
      where: { leakageRiskScore: { gte: 50 } },
      include: {
        store: { select: { id: true, name: true, city: true } },
        vendor: { select: { id: true, companyName: true, city: true } },
      },
      orderBy: { leakageRiskScore: 'desc' },
      take: 100,
    });

    return relationships.map((r: any) => ({
      storeId: r.storeId,
      storeName: r.store?.name,
      vendorId: r.vendorId,
      vendorName: r.vendor?.companyName,
      status: r.status,
      score: r.leakageRiskScore,
      isFlagged: r.isFlagged,
      flagReason: r.flagReason,
      discoveredAt: r.discoveredAt,
      firstOrderAt: r.firstOrderAt,
      totalInteractions: r.totalInteractions,
      totalOrders: r.totalOrders,
      daysSinceDiscovery: Math.floor(
        (Date.now() - new Date(r.discoveredAt).getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }

  /**
   * SuperAdmin: full interaction history for a specific store/vendor pair.
   */
  @Get('admin/history/:storeId/:vendorId')
  async getRelationshipHistory(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    const [relationship, interactions] = await Promise.all([
      db.storeVendorRelationship.findUnique({
        where: { storeId_vendorId: { storeId, vendorId } },
        include: {
          store: { select: { name: true } },
          vendor: { select: { companyName: true } },
        },
      }),
      db.vendorInteraction.findMany({
        where: { storeId, vendorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return { relationship, interactions };
  }

  /**
   * SuperAdmin: manually flag a suspicious relationship.
   */
  @Post('admin/flag/:storeId/:vendorId')
  async flagRelationship(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
    @Body() body: { reason?: string },
  ) {
    await db.storeVendorRelationship.updateMany({
      where: { storeId, vendorId },
      data: {
        isFlagged: true,
        flagReason: body.reason || 'Signalé manuellement par le superadmin',
      },
    });
    return { ok: true };
  }

  /**
   * SuperAdmin: platform-wide leakage summary stats.
   */
  @Get('admin/stats')
  async getPlatformStats() {
    const [
      totalRelationships,
      highRisk,
      flagged,
      activeOrdered,
      recentInteractions,
    ] = await Promise.all([
      db.storeVendorRelationship.count(),
      db.storeVendorRelationship.count({ where: { leakageRiskScore: { gte: 70 } } }),
      db.storeVendorRelationship.count({ where: { isFlagged: true } }),
      db.storeVendorRelationship.count({ where: { status: 'ORDERED' } }),
      db.vendorInteraction.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      summary: {
        totalRelationships,
        activeOrdered,
        highRiskCount: highRisk,
        flaggedCount: flagged,
        leakageRiskRate:
          totalRelationships > 0
            ? ((highRisk / totalRelationships) * 100).toFixed(1) + '%'
            : '0%',
      },
      weeklyActivity: {
        interactions7d: recentInteractions,
      },
    };
  }
}
