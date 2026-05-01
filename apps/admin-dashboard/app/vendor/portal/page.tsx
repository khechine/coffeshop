import { getVendorPortalData } from '../../actions';
import { ShoppingBag, Package, TrendingUp, TrendingDown, Clock, ChevronRight, MapPin, Calendar, Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement ou Profil non trouvé...</div>;

  // ── Calcul dynamique évolution CA ──
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthOrders = portalData.orders.filter((o: any) => new Date(o.createdAt) >= startOfThisMonth);
  const lastMonthOrders = portalData.orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return d >= startOfLastMonth && d < startOfThisMonth;
  });

  const thisMonthRevenue = thisMonthOrders.reduce((acc: number, o: any) => acc + Number(o.total), 0);
  const lastMonthRevenue = lastMonthOrders.reduce((acc: number, o: any) => acc + Number(o.total), 0);
  const totalRevenue = portalData.orders.reduce((acc: number, o: any) => acc + Number(o.total), 0);

  let evolutionPct: number | null = null;
  if (lastMonthRevenue > 0) {
    evolutionPct = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  }

  const walletBalance = portalData.wallet?.balance ?? 0;
  const isWalletNegative = walletBalance < 0;
  const pendingOrders = portalData.orders.filter((o: any) => o.status === 'PENDING').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start mb-6 relative">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Bonjour,</p>
            <h2 className="text-2xl font-black">{portalData.companyName}</h2>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-3 relative">
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-black">{portalData.orders.length}</div>
            <div className="text-blue-100 text-xs">Commandes</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-black">{portalData.products.length}</div>
            <div className="text-blue-100 text-xs">Produits</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-black">{pendingOrders}</div>
            <div className="text-blue-100 text-xs">En attente</div>
          </div>
          {/* Wallet Balance */}
          <Link href="/vendor/portal/wallet" className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm hover:bg-white/20 transition-all group">
            <div className={`text-xl font-black truncate ${isWalletNegative ? 'text-red-300' : 'text-emerald-300'}`}>
              {walletBalance.toFixed(1)}
            </div>
            <div className="text-blue-100 text-xs flex items-center justify-center gap-1">
              <Wallet size={10} /> Solde DT
            </div>
          </Link>
        </div>
      </div>

      {/* Wallet Alert if negative */}
      {isWalletNegative && (
        <Link href="/vendor/portal/wallet" className="block bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
              <Wallet size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-800 dark:text-red-300 text-sm">Solde négatif : {walletBalance.toFixed(3)} DT</p>
              <p className="text-red-600/70 dark:text-red-400/70 text-xs">Rechargez votre portefeuille pour maintenir votre visibilité marketplace</p>
            </div>
            <ChevronRight size={18} className="text-red-400" />
          </div>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/vendor/portal/catalog" className="bg-white dark:bg-slate-900/40 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/50 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Package size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white">Mon Catalogue</h3>
              <p className="text-slate-500 text-sm">{portalData.products.length} produits</p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </div>
        </Link>

        <Link href="/vendor/portal/orders" className="bg-white dark:bg-slate-900/40 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/50 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <ShoppingBag size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white">Commandes</h3>
              <p className="text-slate-500 text-sm">{pendingOrders} en attente</p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </div>
        </Link>

        {/* Wallet card */}
        <Link href="/vendor/portal/wallet" className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900/40 rounded-2xl p-5 shadow-sm border border-indigo-100 dark:border-indigo-500/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <Wallet size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white">Portefeuille</h3>
              <p className={`text-sm font-black ${isWalletNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                {walletBalance.toFixed(3)} DT
              </p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </div>
        </Link>

        <Link href="/vendor/portal/sales" className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-900/40 rounded-2xl p-5 shadow-sm border border-emerald-100 dark:border-emerald-500/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white">Analyses Ventes</h3>
              <p className="text-slate-500 text-sm">Tableaux de bord</p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </div>
        </Link>

        {portalData.isPremium && (
          <>
            <Link href="/vendor/portal/pos" className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-500/10 dark:to-slate-900/40 rounded-2xl p-5 shadow-sm border border-violet-100 dark:border-violet-500/20 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                  <MapPin size={24} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">Points de Vente</h3>
                  <p className="text-slate-500 text-sm">{portalData.posList?.length || 0} branches</p>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </Link>

            <Link href="/vendor/portal/crm" className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-500/10 dark:to-slate-900/40 rounded-2xl p-5 shadow-sm border border-rose-100 dark:border-rose-500/20 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 rounded-xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <TrendingUp size={24} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">CRM & Marketing</h3>
                  <p className="text-slate-500 text-sm">{portalData.customers?.length || 0} clients</p>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Revenue Card */}
      <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Chiffre d&apos;Affaires</h3>
          {evolutionPct !== null ? (
            <span className={`text-sm font-medium flex items-center gap-1 ${evolutionPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {evolutionPct >= 0 
                ? <ArrowUpRight size={14} /> 
                : <ArrowDownRight size={14} />}
              {evolutionPct >= 0 ? '+' : ''}{evolutionPct.toFixed(1)}% vs mois dernier
            </span>
          ) : (
            <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
              <Minus size={12} /> Pas assez de données
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-black text-slate-900 dark:text-white">
            {totalRevenue.toFixed(3)}
          </span>
          <span className="text-slate-500 font-medium">DT</span>
        </div>
        {evolutionPct !== null && (
          <div className="flex gap-6 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">{thisMonthRevenue.toFixed(3)} DT</span>
              <span className="ml-1">ce mois</span>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">{lastMonthRevenue.toFixed(3)} DT</span>
              <span className="ml-1">mois dernier</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Transactions Récentes</h3>
          <Link href="/vendor/portal/orders" className="text-blue-600 text-sm font-medium">
            Voir tout
          </Link>
        </div>

        {portalData.orders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500">Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {portalData.orders.slice(0, 5).map((o: any) => (
              <div key={o.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center">
                  <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{o.store.name}</p>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <MapPin size={12} /> {o.store.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{Number(o.total).toFixed(3)} DT</p>
                  <p className="text-slate-500 text-xs flex items-center gap-1 justify-end">
                    <Calendar size={12} /> {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  o.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {o.status === 'PENDING' ? 'En attente' : 'Terminée'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
