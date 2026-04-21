'use server';

import { prisma } from '@coffeeshop/database';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Server Actions for Anti-Leakage Monitoring
 * Directly interacts with the database for performance and simplicity in the admin dashboard.
 */

async function checkSuperAdmin() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  
  if (user?.role !== 'SUPERADMIN') {
    throw new Error('Accès réservé aux super-administrateurs');
  }
}

export async function getMonitoringStats() {
  await checkSuperAdmin();
  
  const [total, highRisk, flagged, activeOrdered] = await Promise.all([
    (prisma as any).storeVendorRelationship.count(),
    (prisma as any).storeVendorRelationship.count({ where: { leakageRiskScore: { gte: 70 } } }),
    (prisma as any).storeVendorRelationship.count({ where: { isFlagged: true } }),
    (prisma as any).storeVendorRelationship.count({ where: { status: 'ORDERED' } }),
  ]);
  
  return {
    totalRelationships: total,
    activeOrdered,
    highRiskCount: highRisk,
    flaggedCount: flagged,
    leakageRiskRate: total > 0 ? ((highRisk / total) * 100).toFixed(1) + '%' : '0%',
  };
}

export async function getRiskReport() {
  await checkSuperAdmin();
  
  const relationships = await (prisma as any).storeVendorRelationship.findMany({
    where: { leakageRiskScore: { gte: 50 } },
    include: {
      store: { select: { name: true, city: true } },
      vendor: { select: { companyName: true, city: true } },
    },
    orderBy: { leakageRiskScore: 'desc' },
    take: 50
  });
  
  return relationships.map((r: any) => ({
    id: r.id,
    storeId: r.storeId,
    storeName: r.store?.name,
    vendorId: r.vendorId,
    vendorName: r.vendor?.companyName,
    score: r.leakageRiskScore,
    status: r.status,
    isFlagged: r.isFlagged,
    flagReason: r.flagReason,
    discoveredAt: r.discoveredAt,
    totalInteractions: r.totalInteractions,
    totalOrders: r.totalOrders,
  }));
}

export async function flagRelationship(storeId: string, vendorId: string, reason: string) {
  await checkSuperAdmin();
  
  await (prisma as any).storeVendorRelationship.update({
    where: { storeId_vendorId: { storeId, vendorId } },
    data: {
      isFlagged: true,
      flagReason: reason || 'Signalé par le superadmin'
    }
  });
  
  revalidatePath('/superadmin/marketplace/monitoring');
}

export async function unflagRelationship(storeId: string, vendorId: string) {
  await checkSuperAdmin();
  
  await (prisma as any).storeVendorRelationship.update({
    where: { storeId_vendorId: { storeId, vendorId } },
    data: {
      isFlagged: false,
      flagReason: null
    }
  });
  
  revalidatePath('/superadmin/marketplace/monitoring');
}

export async function getRelationshipHistory(storeId: string, vendorId: string) {
  await checkSuperAdmin();
  
  const [relationship, interactions] = await Promise.all([
    (prisma as any).storeVendorRelationship.findUnique({
      where: { storeId_vendorId: { storeId, vendorId } },
      include: {
        store: { select: { name: true } },
        vendor: { select: { companyName: true } }
      }
    }),
    (prisma as any).vendorInteraction.findMany({
      where: { storeId, vendorId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ]);
  
  return { relationship, interactions };
}

/**
 * Recompute scores for high-risk pairs
 * Replicates the scoring logic from the API to avoid dependency on internal API networking
 */
export async function runEmergencyScan() {
  await checkSuperAdmin();
  
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const relationships = await (prisma as any).storeVendorRelationship.findMany({
    where: { lastActivityAt: { gte: since30d } },
    select: { storeId: true, vendorId: true, discoveredAt: true, totalOrders: true }
  });
  
  for (const rel of relationships) {
    const [interactions, orders] = await Promise.all([
      (prisma as any).vendorInteraction.count({
        where: { storeId: rel.storeId, vendorId: rel.vendorId, createdAt: { gte: since30d } }
      }),
      (prisma as any).supplierOrder.count({
        where: { storeId: rel.storeId, vendorId: rel.vendorId, createdAt: { gte: since30d } }
      })
    ]);
    
    let score = 0;
    if (interactions > 0) {
      const conversionRate = orders / interactions;
      score = Math.round((1 - Math.min(conversionRate, 1)) * 80);
    }
    
    if (rel.totalOrders === 0) {
      const daysSinceDiscovery = Math.floor((Date.now() - new Date(rel.discoveredAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceDiscovery > 30) score = Math.min(100, score + 20);
    }
    
    await (prisma as any).storeVendorRelationship.update({
      where: { storeId_vendorId: { storeId: rel.storeId, vendorId: rel.vendorId } },
      data: { leakageRiskScore: score }
    });
  }
  
  revalidatePath('/superadmin/marketplace/monitoring');
  return { scanned: relationships.length };
}
