import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

const db = prisma as any;

/**
 * ContractService — Phase 3 Anti-Leakage
 *
 * Manages the contractual traceability layer:
 * - Generates a legally-trackable "first contact certificate" for each relationship
 * - Provides analytics tied to exclusive platform services
 * - Manages BNPL (Buy Now Pay Later) eligibility based on platform history
 */
@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  // ── First Contact Certificate ────────────────────────────────────────────

  /**
   * Returns a structured proof-of-contact certificate.
   * Contains: discoveredAt, firstOrderAt, platform session, total volume.
   * Can be used as legal evidence in case of bypass dispute.
   */
  async getRelationshipCertificate(storeId: string, vendorId: string) {
    const [relationship, interactions, orders] = await Promise.all([
      db.storeVendorRelationship.findUnique({
        where: { storeId_vendorId: { storeId, vendorId } },
        include: {
          store: { select: { name: true, city: true } },
          vendor: { select: { companyName: true, city: true } },
        },
      }),
      db.vendorInteraction.count({ where: { storeId, vendorId } }),
      prisma.supplierOrder.findMany({
        where: { storeId, vendorId },
        select: { id: true, total: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!relationship) return null;

    const totalRevenue = orders.reduce(
      (sum: number, o: any) => sum + Number(o.total),
      0,
    );

    return {
      certificate: {
        type: 'MARKETPLACE_FIRST_CONTACT_PROOF',
        generatedAt: new Date().toISOString(),
        platform: 'CoffeeShop B2B Marketplace',
      },
      store: {
        id: storeId,
        name: relationship.store?.name,
        city: relationship.store?.city,
      },
      vendor: {
        id: vendorId,
        name: relationship.vendor?.companyName,
        city: relationship.vendor?.city,
      },
      timeline: {
        discoveredAt: relationship.discoveredAt,
        firstContactAt: relationship.firstContactAt,
        firstOrderAt: relationship.firstOrderAt,
        lastOrderAt: relationship.lastOrderAt,
        daysSinceDiscovery: Math.floor(
          (Date.now() - new Date(relationship.discoveredAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      },
      metrics: {
        status: relationship.status,
        totalInteractions: interactions,
        totalOrders: orders.length,
        totalRevenueOnPlatform: totalRevenue.toFixed(3) + ' DT',
        leakageRiskScore: relationship.leakageRiskScore,
        isFlagged: relationship.isFlagged,
      },
      orders: orders.map((o: any) => ({
        id: o.id,
        date: o.createdAt,
        total: Number(o.total).toFixed(3) + ' DT',
        status: o.status,
      })),
    };
  }

  // ── Platform Analytics (Exclusive Service) ─────────────────────────────

  /**
   * Exclusive platform analytics for a vendor:
   * who's viewing, conversion rates, top buyers.
   * Available ONLY through the platform — incentive to stay in-circuit.
   */
  async getVendorAnalytics(vendorId: string) {
    const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const db2 = db;

    const [interactions, orders, relationships] = await Promise.all([
      db2.vendorInteraction.groupBy({
        by: ['type', 'storeId'],
        where: { vendorId, createdAt: { gte: since90d } },
        _count: { id: true },
      }),
      prisma.supplierOrder.findMany({
        where: { vendorId, createdAt: { gte: since90d } },
        select: { storeId: true, total: true, status: true, createdAt: true },
      }),
      db2.storeVendorRelationship.findMany({
        where: { vendorId },
        select: {
          storeId: true,
          status: true,
          leakageRiskScore: true,
          totalOrders: true,
          totalRevenue: true,
          discoveredAt: true,
        },
        orderBy: { totalRevenue: 'desc' },
        take: 20,
      }),
    ]);

    // Aggregate by interaction type
    const byType: Record<string, number> = {};
    for (const row of interactions) {
      byType[row.type] = (byType[row.type] || 0) + (row._count as any).id;
    }

    // Unique store viewers
    const viewers = new Set(interactions.map((i: any) => i.storeId));

    // Revenue on platform
    const platformRevenue = orders
      .filter((o: any) => o.status !== 'CANCELLED')
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);

    // Conversion rate
    const viewsCount = byType['VIEW_PRODUCT'] || 0 + (byType['VIEW_PROFILE'] || 0);
    const ordersCount = orders.length;
    const conversionRate = viewsCount > 0 ? ((ordersCount / viewsCount) * 100).toFixed(1) : '0';

    return {
      period: '90 derniers jours',
      traffic: {
        uniqueStoreViewers: viewers.size,
        totalInteractions: interactions.reduce((s: number, r: any) => s + r._count.id, 0),
        byType,
      },
      revenue: {
        totalOnPlatform: platformRevenue.toFixed(3) + ' DT',
        ordersCount,
        conversionRate: conversionRate + '%',
      },
      topBuyers: relationships.slice(0, 5).map((r: any) => ({
        storeId: r.storeId,
        status: r.status,
        totalOrders: r.totalOrders,
        totalRevenue: Number(r.totalRevenue).toFixed(3) + ' DT',
        loyaltyDays: Math.floor(
          (Date.now() - new Date(r.discoveredAt).getTime()) / (1000 * 60 * 60 * 24),
        ),
      })),
      riskSignals: {
        highRiskRelationships: relationships.filter((r: any) => r.leakageRiskScore >= 70).length,
        atRiskRevenuePotential:
          relationships
            .filter((r: any) => r.leakageRiskScore >= 70 && r.totalOrders === 0)
            .length + ' prospects potentiellement perdus',
      },
    };
  }

  // ── BNPL Eligibility (Exclusive Service) ────────────────────────────────

  /**
   * Calculates BNPL (Buy Now Pay Later) eligibility for a store/vendor pair.
   * Only available for stores with a platform transaction history.
   * This is an exclusive service that cannot be obtained if going direct.
   */
  async getBNPLEligibility(storeId: string, vendorId: string) {
    const orders = await prisma.supplierOrder.findMany({
      where: { storeId, vendorId, status: 'DELIVERED' },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (orders.length === 0) {
      return {
        eligible: false,
        reason: 'Aucune commande complète sur la plateforme. Historique requis pour BNPL.',
        minimumOrders: 3,
        currentOrders: 0,
      };
    }

    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const avgOrder = totalSpent / orders.length;

    // Min 3 delivered orders to be BNPL eligible
    if (orders.length < 3) {
      return {
        eligible: false,
        reason: `${3 - orders.length} commande(s) supplémentaire(s) nécessaire(s) avant éligibilité BNPL.`,
        minimumOrders: 3,
        currentOrders: orders.length,
        totalSpent: totalSpent.toFixed(3) + ' DT',
      };
    }

    // BNPL limit = 2× average order, capped at 5000 DT
    const limit = Math.min(avgOrder * 2, 5000);

    return {
      eligible: true,
      limit: limit.toFixed(3) + ' DT',
      terms: '30 jours net sans intérêt',
      basedOn: `${orders.length} commandes sur la plateforme`,
      totalHistoryOnPlatform: totalSpent.toFixed(3) + ' DT',
      note: 'Ce service est exclusivement disponible pour les partenaires de la marketplace.',
    };
  }
}
