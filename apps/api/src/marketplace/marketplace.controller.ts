import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ContractService } from './contract.service';
import { AlertService } from './alert.service';
import { MarketplaceAuthGuard } from '../auth/marketplace.guard';
import { SuperAdminGuard } from '../auth/superadmin.guard';
import { SubscriptionGuard } from './subscription.guard';
import { prisma } from '@coffeeshop/database';

const db = prisma as any;

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly interactionService: InteractionService,
    private readonly contractService: ContractService,
    private readonly alertService: AlertService,
  ) {}

  // ══════════════════════════════════════════════════════
  // PHASE 2 — Interaction Logging
  // ══════════════════════════════════════════════════════

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

  @UseGuards(MarketplaceAuthGuard, SubscriptionGuard)
  @Get('contract/certificate/:storeId/:vendorId')
  async getRelationshipCertificate(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.contractService.getRelationshipCertificate(storeId, vendorId);
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('analytics/vendor/:vendorId')
  async getVendorAnalytics(@Param('vendorId') vendorId: string) {
    return this.contractService.getVendorAnalytics(vendorId);
  }

  @UseGuards(MarketplaceAuthGuard, SubscriptionGuard)
  @Get('bnpl/eligibility/:storeId/:vendorId')
  async getBNPLEligibility(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.contractService.getBNPLEligibility(storeId, vendorId);
  }

  // ══════════════════════════════════════════════════════
  // PHASE 4 — SuperAdmin Monitoring (🔒 SUPERADMIN ONLY)
  // ══════════════════════════════════════════════════════

  /** Platform health summary — main dashboard widget */
  @UseGuards(SuperAdminGuard)
  @Get('admin/health')
  async getPlatformHealth() {
    return this.alertService.getPlatformHealthSummary();
  }

  /** Full risk report — relationships with score ≥ 50 */
  @UseGuards(SuperAdminGuard)
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
      storeCity: r.store?.city,
      vendorId: r.vendorId,
      vendorName: r.vendor?.companyName,
      status: r.status,
      score: r.leakageRiskScore,
      scoreLabel:
        r.leakageRiskScore >= 85 ? 'CRITIQUE' :
        r.leakageRiskScore >= 70 ? 'ÉLEVÉ' : 'MOYEN',
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

  /** Run a full automated leakage scan */
  @UseGuards(SuperAdminGuard)
  @Post('admin/scan')
  async runLeakageScan() {
    return this.alertService.runLeakageScan();
  }

  /** Detect interaction spikes: > 5 views in 7d, 0 orders */
  @UseGuards(SuperAdminGuard)
  @Get('admin/spikes')
  async detectSpikes() {
    return this.alertService.detectSpikes();
  }

  /** Platform-wide quick stats */
  @UseGuards(SuperAdminGuard)
  @Get('admin/stats')
  async getPlatformStats() {
    const [total, highRisk, flagged, activeOrdered, recentInteractions] = await Promise.all([
      db.storeVendorRelationship.count(),
      db.storeVendorRelationship.count({ where: { leakageRiskScore: { gte: 70 } } }),
      db.storeVendorRelationship.count({ where: { isFlagged: true } }),
      db.storeVendorRelationship.count({ where: { status: 'ORDERED' } }),
      db.vendorInteraction.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);
    return {
      totalRelationships: total,
      activeOrdered,
      highRiskCount: highRisk,
      flaggedCount: flagged,
      leakageRiskRate: total > 0 ? ((highRisk / total) * 100).toFixed(1) + '%' : '0%',
      weeklyInteractions: recentInteractions,
    };
  }

  /** Detail history for a store/vendor pair */
  @UseGuards(SuperAdminGuard)
  @Get('admin/history/:storeId/:vendorId')
  async getRelationshipHistory(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    const [relationship, interactions] = await Promise.all([
      db.storeVendorRelationship.findUnique({
        where: { storeId_vendorId: { storeId, vendorId } },
        include: {
          store: { select: { name: true, city: true } },
          vendor: { select: { companyName: true, city: true } },
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

  /** Manually flag a suspicious relationship */
  @UseGuards(SuperAdminGuard)
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

  /** Unflag a relationship */
  @UseGuards(SuperAdminGuard)
  @Post('admin/unflag/:storeId/:vendorId')
  async unflagRelationship(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    await db.storeVendorRelationship.updateMany({
      where: { storeId, vendorId },
      data: { isFlagged: false, flagReason: null },
    });
    return { ok: true };
  }
}
