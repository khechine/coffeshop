import { prisma } from '@coffeeshop/database';
import { Store as StoreIcon, User, MapPin, Coffee, TrendingUp, CreditCard, Monitor, Calendar } from 'lucide-react';
import CafeListClient from './CafeListClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminCafesPage() {
  const stores = await prisma.store.findMany({
    include: { 
      _count: { select: { sales: true, stockItems: true, owners: true, terminals: true, products: true } },
      subscription: { include: { plan: true } },
      activityPole: true,
      sales: { select: { total: true } }
    },
    orderBy: { createdAt: 'desc' }
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
