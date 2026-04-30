import { getVendorPortalData } from '../../actions';
import { ShoppingBag, Package, TrendingUp, Clock, ChevronRight, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement ou Profil non trouvé...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Travel-Style Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Bonjour,</p>
            <h2 className="text-2xl font-black">{portalData.companyName}</h2>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-black">{portalData.orders.length}</div>
            <div className="text-blue-100 text-xs">Commandes</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-black">{portalData.products.length}</div>
            <div className="text-blue-100 text-xs">Produits</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-black">{portalData.orders.filter((o: any) => o.status === 'PENDING').length}</div>
            <div className="text-blue-100 text-xs">En attente</div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Travel Style Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/vendor/portal/catalog" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Package size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Mon Catalogue</h3>
              <p className="text-slate-500 text-sm">{portalData.products.length} produits</p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </div>
        </Link>

        <Link href="/vendor/portal/orders" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <ShoppingBag size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Commandes</h3>
              <p className="text-slate-500 text-sm">
                {portalData.orders.filter((o: any) => o.status === 'PENDING').length} en attente
              </p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </div>
        </Link>

        {portalData.isPremium && (
          <>
            <Link href="/vendor/portal/pos" className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 shadow-sm border border-indigo-100 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <MapPin size={24} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">Mes Points de Vente</h3>
                  <p className="text-slate-500 text-sm">Gérer mes {portalData.posList?.length || 0} branches</p>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </Link>

            <Link href="/vendor/portal/crm" className="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-5 shadow-sm border border-rose-100 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <TrendingUp size={24} className="text-rose-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">CRM & Marketing</h3>
                  <p className="text-slate-500 text-sm">Gérer {portalData.customers?.length || 0} clients</p>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Revenue Card - Travel Style */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Chiffre d'Affaires</h3>
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <TrendingUp size={14} /> +12.5%
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900">
            {portalData.orders.reduce((acc: number, o: any) => acc + Number(o.total), 0).toFixed(3)}
          </span>
          <span className="text-slate-500 font-medium">DT</span>
        </div>
      </div>

      {/* Recent Orders - Travel Style List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Transactions Récentes</h3>
          <Link href="/vendor/portal/orders" className="text-blue-600 text-sm font-medium">
            Voir tout
          </Link>
        </div>
        
        {portalData.orders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500">Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {portalData.orders.slice(0, 5).map((o: any) => (
              <div key={o.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <MapPin size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{o.store.name}</p>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <MapPin size={12} /> {o.store.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{Number(o.total).toFixed(3)} DT</p>
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
