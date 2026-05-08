import { prisma } from '@coffeeshop/database';
import { ShoppingCart, Users, Store, ShieldCheck, MapPin, Package, CreditCard, TrendingUp, AlertCircle, Clock, Truck, Wallet } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard() {
  // Financial Metrics
  const activeSubscriptions = await (prisma as any).subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true }
  });
  
  const mrr = activeSubscriptions.reduce((acc: number, sub: any) => acc + Number(sub.plan?.price || 0), 0);

  const commissionsTx = await (prisma as any).storeWalletTransaction.aggregate({
    where: { type: 'MARKETPLACE_COMMISSION' },
    _sum: { amount: true }
  });
  const totalCommissions = Math.abs(Number(commissionsTx._sum.amount || 0));

  const walletsAgg = await (prisma as any).storeWallet.aggregate({
    _sum: { balance: true }
  });
  const netWalletBalance = Number(walletsAgg._sum.balance || 0);

  // Restore Missing Context
  const ordersAgg = await prisma.supplierOrder.aggregate({
    where: { vendorId: { not: null } },
    _sum: { total: true }
  });
  const totalGMV = Number(ordersAgg._sum.total || 0);

  const pendingVendors = await prisma.vendorProfile.findMany({ 
    where: { status: 'PENDING' },
    include: { user: true }
  });

  const recentOrders = await prisma.supplierOrder.findMany({
    where: { vendorId: { not: null } },
    include: { vendor: true, store: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const stats = [
    { label: 'MRR (Abonnements)', value: `${mrr.toFixed(0)} DT`, icon: CreditCard, color: '#4F46E5', trend: 'Revenu Mensuel' },
    { label: 'Commissions B2B', value: `${totalCommissions.toFixed(2)} DT`, icon: TrendingUp, color: '#10B981', trend: 'Total Cumulé' },
    { label: 'Volume Marketplace', value: `${totalGMV.toFixed(2)} DT`, icon: ShoppingCart, color: '#7C3AED', trend: 'GMV Global' },
    { label: 'Solde Wallets Clients', value: `${netWalletBalance.toFixed(2)} DT`, icon: Wallet, color: netWalletBalance < 0 ? '#EF4444' : '#10B981', trend: 'Risque/Credit' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Tableau de Bord</h1>
          <p className="mt-2 text-slate-500 font-medium">Contrôle global de l'écosystème Marketplace Tunisia</p>
        </div>
        <div className="flex gap-4">
           <Link href="/superadmin/vendors" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 transition-all">Valider les Inscriptions</Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <s.icon size={24} className="text-slate-400 group-hover:text-white" />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.trend}</div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{s.value}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Pending Validations */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
               <Clock size={24} className="text-amber-500" /> 
               <span>Demandes d'accès ({pendingVendors.length})</span>
             </h3>
             <Link href="/superadmin/vendors" className="text-sm font-black text-indigo-600 hover:underline">Tout voir</Link>
           </div>
           
           <div className="space-y-4">
              {pendingVendors.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aucune inscription en attente</p>
                </div>
              ) : (
                pendingVendors.map(v => (
                  <div key={v.id} className="group flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-950/30 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 text-2xl font-black text-indigo-600 shadow-sm">
                         {v.companyName.charAt(0)}
                       </div>
                       <div>
                         <div className="font-black text-slate-900 dark:text-white text-lg leading-tight">{v.companyName}</div>
                         <div className="text-sm text-slate-500 font-medium">{v.user.email} • {v.city}</div>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">Approuver</button>
                       <button className="px-6 py-3 bg-white dark:bg-slate-800 text-rose-500 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs hover:bg-rose-50 transition-all">Rejeter</button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* MRR Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
           <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-8">
             <Package size={24} className="text-indigo-600" /> 
             <span>Distribution MRR</span>
           </h3>
           
           <div className="space-y-6">
              {Array.from(new Set(activeSubscriptions.map((s: any) => s.plan?.name))).map(planName => {
                const count = activeSubscriptions.filter((s: any) => s.plan?.name === planName).length;
                const planMrr = activeSubscriptions.filter((s: any) => s.plan?.name === planName).reduce((acc: number, s: any) => acc + Number(s.plan?.price || 0), 0);
                const percentage = (planMrr / mrr) * 100;
                
                return (
                  <div key={planName as string}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{planName as string}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{count} Abonnés</div>
                      </div>
                      <div className="text-sm font-black text-indigo-600">{planMrr.toFixed(0)} DT</div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Global Orders Feed */}
        <div className="bg-slate-900 dark:bg-black rounded-[40px] p-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
           {/* Abstract Decoration */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
           
           <div className="relative z-10">
             <h3 className="text-xl font-black text-white flex items-center gap-3 mb-8">
               <TrendingUp size={24} className="text-emerald-400" /> 
               <span>Flux B2B Live</span>
             </h3>
             
             <div className="space-y-8">
                {recentOrders.map(o => (
                  <div key={o.id} className="relative pl-8 border-l-2 border-slate-800 group">
                    <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-slate-800 group-hover:bg-emerald-500 transition-colors" />
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-white text-sm">{o.store.name}</span>
                        <span className="text-sm font-black text-emerald-400">{Number(o.total).toFixed(2)} DT</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                        Chez <span className="text-indigo-400">{o.vendor?.companyName}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-1">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             
             <Link href="/superadmin/marketplace" className="block mt-10 py-4 text-center bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
               Voir tout l'historique
             </Link>
           </div>
        </div>
      </div>

    </div>
  );
}
