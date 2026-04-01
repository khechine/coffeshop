import { getVendorPortalData } from '../../actions';
import { ShoppingBag, Package, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement ou Profil non trouvé...</div>;

  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Tableau de Bord</h2>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 font-black">{portalData.companyName}</span>
            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
            Marketplace B2B
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-none">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connecté en direct</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 shadow-sm dark:shadow-none">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Chiffre d'Affaires</div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {portalData.orders.reduce((acc: number, o: any) => acc + Number(o.total), 0).toFixed(3)}
            </div>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">DT</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <TrendingUp size={12} /> +12.5% ce mois
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300 shadow-sm dark:shadow-none">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Commandes actives</div>
          <div className="text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {portalData.orders.filter((o: any) => o.status === 'PENDING').length}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Clock size={12} /> À traiter rapidement
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-sm dark:shadow-none">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Produits en ligne</div>
          <div className="text-4xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {portalData.products.length}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Package size={12} /> Visibles sur le market
          </div>
        </div>
      </div>

      {portalData.orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-[60px] p-20 text-center flex flex-col items-center shadow-sm dark:shadow-none">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-slate-100 dark:border-slate-800">
            <ShoppingBag size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Attente d'activation</h3>
          <p className="text-slate-500 max-w-md font-medium leading-relaxed mb-10">
            Une fois votre compte validé, vos produits seront visibles sur le marketplace. Profitez-en pour préparer votre catalogue dès maintenant.
          </p>
          <Link 
            href="/vendor/portal/catalog" 
            className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest"
          >
            Gérer le catalogue
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[40px] overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              Dernières Transactions
            </h3>
            <Link href="/vendor/portal/orders" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              Voir tout l'historique
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">Point de Vente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">Ville</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">Total Net</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {portalData.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{o.store.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wider mt-1">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400 font-bold">{o.store.city}</td>
                    <td className="px-8 py-6">
                      <span className="text-lg font-black text-slate-900 dark:text-white">{Number(o.total).toFixed(3)}</span>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-600 ml-1.5 uppercase">DT</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block min-w-[100px] ${
                        o.status === 'PENDING' 
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-500/20' 
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                      }`}>
                        {o.status === 'PENDING' ? 'En attente' : 'Terminée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
