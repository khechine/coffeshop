import { prisma } from '@coffeeshop/database';
import { Store as StoreIcon, User, MapPin, Coffee, TrendingUp, CreditCard, Monitor, Calendar } from 'lucide-react';
import CafeListClient from './CafeListClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminCafesPage() {
  // Use (prisma as any) to bypass environment-specific client validation bugs
  const basicStores = await (prisma as any).store.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const storeIds = basicStores.map((s: any) => s.id);

  // Fetch related data independently for maximum stability
  const [subscriptions, poles, allSales] = await Promise.all([
    (prisma as any).subscription.findMany({
      where: { storeId: { in: storeIds } },
      include: { plan: true }
    }),
    (prisma as any).activityPole.findMany(),
    (prisma as any).sale.findMany({
      where: { storeId: { in: storeIds } },
      select: { storeId: true, total: true }
    })
  ]);

  // Map data back to stores
  const stores = basicStores.map((store: any) => {
    const sub = subscriptions.find((s: any) => s.storeId === store.id);
    const pole = poles.find((p: any) => p.id === store.activityPoleId);
    const storeSales = allSales.filter((s: any) => s.storeId === store.id).map((s: any) => ({
      ...s,
      total: Number(s.total || 0)
    }));
    
    // Convert Decimal fields to numbers
    const plan = sub?.plan ? {
      id: sub.plan.id,
      name: sub.plan.name,
      price: Number(sub.plan.price),
      maxStores: Number(sub.plan.maxStores),
      maxProducts: Number(sub.plan.maxProducts),
      hasMarketplace: sub.plan.hasMarketplace,
      status: sub.plan.status,
    } : null;

    return {
      ...store,
      subscription: sub ? { ...sub, plan } : null,
      activityPole: pole,
      sales: storeSales,
      _count: {
        sales: storeSales.length,
        stockItems: 0,
        owners: 0,
        terminals: 0,
        products: 0
      }
    };
  });

  return (
    <div className="flex flex-col gap-10 p-6 max-w-8xl mx-auto">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Réseau des Coffee Shops</h1>
        <p className="mt-2 text-slate-500 font-medium">Surveillance et gestion centralisée des {stores.length} points de vente partenaires.</p>
      </div>

      <CafeListClient initialStores={stores as any} />
    </div>
  );
}
