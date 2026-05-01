import { prisma } from '@coffeeshop/database';
import { Store as StoreIcon, User, MapPin, Coffee, TrendingUp, CreditCard, Monitor, Calendar, Cake } from 'lucide-react';
import PatisserieListClient from './PatisserieListClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPatisseriesPage() {
  const basicStores = await (prisma as any).store.findMany({
    where: {
      industry: {
        in: ['BAKERY', 'PASTRY_SHOP', 'PASTRY_PRO']
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const storeIds = basicStores.map((s: any) => s.id);

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

  const stores = basicStores.map((store: any) => {
    const sub = subscriptions.find((s: any) => s.storeId === store.id);
    const pole = poles.find((p: any) => p.id === store.activityPoleId);
    const storeSales = allSales.filter((s: any) => s.storeId === store.id).map((s: any) => ({
      ...s,
      total: Number(s.total || 0)
    }));
    
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
        <div className="flex items-center gap-4 mb-2">
           <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
              <Cake size={32} />
           </div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Pâtisseries & Boulangeries</h1>
        </div>
        <p className="mt-2 text-slate-500 font-medium">Gestion des {stores.length} pâtisseries, boulangeries et pâtissiers indépendants du réseau.</p>
      </div>

      <PatisserieListClient initialStores={stores as any} />
    </div>
  );
}
