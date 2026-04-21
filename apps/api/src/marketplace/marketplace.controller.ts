import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { MarketplaceAuthGuard } from '../auth/marketplace.guard';
import { prisma } from '@coffeeshop/database';

/**
 * MarketplaceController — Phase 2 Anti-Leakage
 *
 * Exposes endpoints for:
 * - Logging vendor profile/product views from the frontend
 * - SuperAdmin monitoring: at-risk relationships, flagged stores
 */
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly interactionService: InteractionService) {}

  // ── Interaction Logging ─────────────────────────────────────────────────

  /**
   * Called by the frontend whenever a coffee shop views a vendor profile.
   */
  @UseGuards(MarketplaceAuthGuard)
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

  // ── SuperAdmin Monitoring ───────────────────────────────────────────────

  /**
   * Dashboard SuperAdmin: list all at-risk relationships (score > threshold).
   */
  @Get('admin/risk-report')
  async getRiskReport() {
    const relationships = await prisma.storeVendorRelationship.findMany({
      where: { leakageRiskScore: { gte: 50 } },
      include: {
        store: { select: { id: true, name: true, city: true } },
        vendor: { select: { id: true, companyName: true, city: true } },
      },
      orderBy: { leakageRiskScore: 'desc' },
      take: 100,
    });

    return relationships.map(r => ({
      storeId: r.storeId,
      storeName: (r.store as any)?.name,
      vendorId: r.vendorId,
      vendorName: (r.vendor as any)?.companyName,
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
   * Dashboard SuperAdmin: detailed interaction history for a specific pair.
   */
  @Get('admin/history/:storeId/:vendorId')
  async getRelationshipHistory(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
  ) {
    const [relationship, interactions] = await Promise.all([
      prisma.storeVendorRelationship.findUnique({
        where: { storeId_vendorId: { storeId, vendorId } },
        include: {
          store: { select: { name: true } },
          vendor: { select: { companyName: true } },
        },
      }),
      prisma.vendorInteraction.findMany({
        where: { storeId, vendorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return { relationship, interactions };
  }

  /**
   * Manually flag a relationship as suspicious.
   */
  @Post('admin/flag/:storeId/:vendorId')
  async flagRelationship(
    @Param('storeId') storeId: string,
    @Param('vendorId') vendorId: string,
    @Body() body: { reason?: string },
  ) {
    await prisma.storeVendorRelationship.updateMany({
      where: { storeId, vendorId },
      data: {
        isFlagged: true,
        flagReason: body.reason || 'Signalé manuellement par le superadmin',
      },
    });
    return { ok: true };
  }
}
