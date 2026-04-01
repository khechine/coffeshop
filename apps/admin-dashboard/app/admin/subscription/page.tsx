import { prisma } from '@coffeeshop/database';
import { CreditCard, CheckCircle2, Zap, BarChart3, Shield, Headphones, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function SubscriptionManagement() {
  const store = await getStore();
  if (!store) return <div>Accès refusé</div>;

  let subscription = await prisma.subscription.findUnique({
    where: { storeId: store.id },
    include: { plan: true }
  });

  // Robust fetch for plan details if client is stale
  if (subscription && subscription.plan) {
    const rawPlan: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Plan" WHERE id = $1`, subscription.planId);
    if (rawPlan[0]) {
        subscription = { 
            ...subscription, 
            plan: { ...subscription.plan, ...rawPlan[0] } 
        } as any;
    }
  }

  const currentPlan = subscription ? {
    name: subscription.plan.name,
    price: Number(subscription.plan.price),
    status: subscription.status,
    renewsAt: subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('fr-FR') : 'N/A',
    startedAt: subscription.createdAt ? new Date(subscription.createdAt).toLocaleDateString('fr-FR') : 'N/A',
    maxStores: subscription.plan.maxStores,
    maxProducts: subscription.plan.maxProducts,
    features: [
      { label: `Jusqu'à ${subscription.plan.maxStores} Point(s) de Vente`, icon: <Shield size={16} /> },
      { label: `${subscription.plan.maxProducts} Produits max. au catalogue`, icon: <CheckCircle2 size={16} /> },
      { label: 'Ventes POS Illimitées', icon: <Zap size={16} /> },
      (subscription.plan as any).hasMarketplace && { label: 'Marketplace B2B Active', icon: <CheckCircle2 size={16} /> },
      { label: 'Support Chat 24h/7j', icon: <Headphones size={16} /> },
    ].filter(Boolean) as any[]
  } : null;

  const usageKpis = [
    { label: 'Produits utilisés', value: await prisma.product.count({ where: { storeId: store.id } }), max: currentPlan?.maxProducts || 50, unit: 'produits' },
    { label: 'Points de Vente actifs', value: 1, max: currentPlan?.maxStores || 1, unit: 'POS' },
    { label: 'Tables configurées', value: await prisma.storeTable.count({ where: { storeId: store.id } }), max: '∞', unit: 'Tables' },
  ];

  // Fetch other plans to switch to
  let allPlans: any[] = [];
  try {
     allPlans = await prisma.plan.findMany({ where: { status: 'ACTIVE' } });
  } catch(e) {
     allPlans = await prisma.$queryRawUnsafe(`SELECT * FROM "Plan" WHERE status = 'ACTIVE'`);
  }
  const otherPlans = allPlans.filter(p => p.id !== subscription?.planId);

  // Invoices (Mocked for now)
  const invoices: any[] = []; 

  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Mon Abonnement SaaS</h1>
          <p className="text-slate-500 font-medium mt-2">Gérez votre forfait, consultez votre utilisation et votre historique de facturation.</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-none">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {currentPlan ? 'Service Actif' : 'Période d\'essai'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Current Plan */}
        <div className="xl:col-span-2 space-y-8">
          {currentPlan ? (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[40px] overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none group relative">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
              
              <div className="p-8 md:p-10 bg-gradient-to-br from-indigo-600 to-violet-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl -mr-32 -mt-32" />
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                  <div>
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-3">Plan Actuel</div>
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4">{currentPlan.name}</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Abonnement Actif
                    </div>
                  </div>
                  <div className="md:text-right">
                    <div className="text-6xl font-black text-white tracking-tighter">
                      {currentPlan.price}
                      <span className="text-lg font-bold opacity-60 ml-2 italic">DT / mois</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-10 p-6 bg-black/20 backdrop-blur-xl rounded-[32px] border border-white/10 relative z-10">
                  <div className="space-y-1">
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-wider">Commencé le</div>
                    <div className="text-sm font-bold text-white">{currentPlan.startedAt}</div>
                  </div>
                  <div className="space-y-1 border-x border-white/10 px-4">
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-wider">Renouvellement</div>
                    <div className="text-sm font-bold text-white">{currentPlan.renewsAt}</div>
                  </div>
                  <div className="space-y-1 pl-4">
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-wider">Cycle</div>
                    <div className="text-sm font-bold text-white uppercase tracking-widest">Mensuel</div>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10 space-y-8">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-6">✓ Inclus dans votre forfait</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentPlan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 transition-all hover:scale-[1.02]">
                        <span className="text-emerald-500 bg-emerald-500/10 p-2 rounded-xl">{f.icon}</span>
                        {f.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <p className="text-xs text-slate-400 font-medium italic">Besoin de plus de fonctionnalités ? Explorez nos forfaits premium ci-dessous.</p>
                  <button className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                    <AlertCircle size={14} /> Annuler l'abonnement
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-[40px] p-20 text-center flex flex-col items-center shadow-sm dark:shadow-none">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-slate-100 dark:border-slate-800 shadow-inner">
                <AlertCircle size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Aucun abonnement actif</h3>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed mb-10">
                Vous utilisez actuellement la période d'essai ou n'avez pas encore choisi de forfait pour votre établissement.
              </p>
              <button className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest">
                Choisir un forfait
              </button>
            </div>
          )}

          {/* Other Plans Grid */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              Plans Disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherPlans.map((plan: any) => (
                <div key={plan.id} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 rounded-[40px] backdrop-blur-md shadow-sm dark:shadow-none hover:border-indigo-500/30 transition-all group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{Number(plan.price)}</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">DT / mois</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <Zap size={20} />
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={12} strokeWidth={3} /></div>
                      {plan.maxStores} Point(s) de Vente
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={12} strokeWidth={3} /></div>
                      {plan.maxProducts} Produits max.
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={12} strokeWidth={3} /></div>
                      Ventes POS Illimitées
                    </li>
                  </ul>

                  <button className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs hover:bg-indigo-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                    Basculer sur ce plan <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Usage & Invoices */}
        <div className="space-y-8">
          {/* Usage KPIs */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 rounded-[40px] backdrop-blur-md shadow-sm dark:shadow-none">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <BarChart3 size={14} className="text-indigo-500" /> Utilisation du Forfait
            </h3>
            <div className="space-y-8">
              {usageKpis.map(u => {
                const maxVal = typeof u.max === 'number' ? u.max : 1;
                const pct = typeof u.max === 'number' ? Math.round((u.value / maxVal) * 100) : 0;
                return (
                  <div key={u.label} className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{u.label}</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {u.value} <span className="text-xs font-bold text-slate-400 italic">/ {u.max} {u.unit}</span>
                        </div>
                      </div>
                      <div className={`text-xs font-black ${pct > 80 ? 'text-rose-500' : 'text-indigo-500'}`}>
                        {pct}%
                      </div>
                    </div>
                    {typeof u.max === 'number' && (
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${
                            pct > 80 ? 'bg-rose-500 shadow-rose-500/20' : 
                            pct > 60 ? 'bg-amber-500 shadow-amber-500/20' : 
                            'bg-indigo-500 shadow-indigo-500/20'
                          }`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 rounded-[40px] backdrop-blur-md shadow-sm dark:shadow-none">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" /> Historique Factures
            </h3>
            <div className="space-y-3">
              {invoices.length === 0 ? (
                 <div className="py-10 text-center bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <CreditCard size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700 opacity-50" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Aucune facture</p>
                 </div>
              ) : invoices.map(inv => (
                <div key={inv.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md cursor-pointer group">
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors italic">#{inv.id}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">{inv.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">{inv.amount} DT</div>
                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">Payé ✓</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-[0.2em]">
              Voir tous les reçus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
