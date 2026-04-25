'use client';

import React, { useState, useTransition } from 'react';
import { 
  Building2, MapPin, Phone, Mail, 
  Package, CheckCircle2, XCircle, Search, 
  BarChart3, Calendar, ShieldCheck, ShoppingBag,
  ArrowLeft, ExternalLink, Tag, Filter,
  ChevronRight, Box
} from 'lucide-react';
import Link from 'next/link';
import { approveVendorAction, rejectVendorAction } from '../../../actions';

export default function VendorDetailClient({ vendor }: { vendor: any }) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [productSearch, setProductSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredProducts = vendor.products.filter((p: any) => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveVendorAction(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      try {
        await rejectVendorAction(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const statusColors: any = {
    'ACTIVE': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
    'PENDING': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
    'REJECTED': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/20' }
  };
  const colors = statusColors[vendor.status] || statusColors['PENDING'];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/superadmin/vendors" 
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-900/50 w-fit px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft size={14} /> Retour à la liste
        </Link>
        
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-600/30">
              {vendor.companyName.charAt(0)}
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{vendor.companyName}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {vendor.status}
                </span>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
                  <Calendar size={14} /> Membre depuis {new Date(vendor.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             {vendor.status === 'PENDING' ? (
               <>
                 <button 
                  onClick={() => handleReject(vendor.id)}
                  disabled={isPending}
                  className="px-6 py-3 rounded-2xl border-2 border-rose-100 dark:border-rose-500/20 text-rose-500 font-black text-sm hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all transition-colors"
                 >
                   Rejeter la candidature
                 </button>
                 <button 
                  onClick={() => handleApprove(vendor.id)}
                  disabled={isPending}
                  className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20"
                 >
                   Certifier & Activer le compte
                 </button>
               </>
             ) : (
               <button 
                onClick={() => {
                  if (vendor.status === 'ACTIVE') handleReject(vendor.id);
                  else handleApprove(vendor.id);
                }}
                disabled={isPending}
                className={`px-8 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
                  vendor.status === 'ACTIVE' 
                    ? 'border-rose-100 dark:border-rose-500/20 text-rose-500 hover:bg-rose-50' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
               >
                 {vendor.status === 'ACTIVE' ? 'Suspendre ce vendeur' : 'Ré-activer le compte'}
               </button>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Vendor Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">À propos</h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                {vendor.description || "Aucune biographie disponible pour ce vendeur."}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Contact & Localisation</h3>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"><Mail size={16} /></div>
                <span className="text-xs font-black truncate">{vendor.user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"><Phone size={16} /></div>
                <span className="text-xs font-black">{vendor.phone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"><MapPin size={16} /></div>
                <div className="text-xs font-black">
                  <div>{vendor.city || 'Tunis'}</div>
                  <div className="opacity-50 font-bold">{vendor.address || '—'}</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Commission Marketplace</h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Taux par Défaut</span>
                <span className="text-lg font-black text-indigo-600">{(Number(vendor.commissionRate || 0.01) * 100).toFixed(1)}%</span>
              </div>
              
              {(() => {
                 let tiersList = [];
                 try {
                     if (vendor.commissionTiers) {
                         tiersList = typeof vendor.commissionTiers === 'string' ? JSON.parse(vendor.commissionTiers) : vendor.commissionTiers;
                     }
                 } catch(e) {}
                 
                 if (Array.isArray(tiersList) && tiersList.length > 0) {
                     return (
                         <div className="space-y-2">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paliers Volume Actifs</div>
                           {tiersList.sort((a: any, b: any) => a.minAmount - b.minAmount).map((tier: any, i: number) => (
                             <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                               <span className="text-xs font-bold text-slate-500">Dès {tier.minAmount} DT</span>
                               <span className="text-sm font-black text-emerald-500">{(tier.rate * 100).toFixed(1)}%</span>
                             </div>
                           ))}
                         </div>
                     );
                 }
                 return null;
              })()}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-2xl font-black text-indigo-600 mb-1">{vendor.products?.length || 0}</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Produits</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-2xl font-black text-amber-500 mb-1">{vendor.orders?.length || 0}</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Commandes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area (Tabs) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section Selector */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-3xl w-fit shadow-sm">
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                activeTab === 'catalog' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package size={18} /> Catalogue de Produits
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                activeTab === 'orders' 
                  ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag size={18} /> Historique des Commandes
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
            {activeTab === 'catalog' ? (
              <div className="flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Chercher dans le catalogue..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{filteredProducts.length} articles trouvés</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest first:pl-8">Produit</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix Unitaire</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p: any) => (
                        <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-6 first:pl-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-105">
                                <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100&auto=format&fit=crop'} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">{p.name}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {p.id.slice(-8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-950 rounded-lg w-fit border border-slate-100 dark:border-slate-800">
                              <Tag size={12} className="text-indigo-400" />
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{p.category?.name || 'Général'}</span>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              {Number(p.price).toFixed(3)} DT
                              <span className="text-xs text-slate-400 font-bold ml-1">/ {p.unit}</span>
                            </div>
                          </td>
                          <td className="p-6 text-right pr-8">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-20 text-center text-slate-400 font-black text-xs uppercase tracking-widest italic bg-slate-50/20 underline decoration-indigo-500/20 underline-offset-8">
                            Aucun produit ne correspond à votre recherche.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <ShoppingBag size={18} className="text-amber-500" /> Flux des Commandes B2B
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sourcing et distribution Marketplace</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest first:pl-8">Date & ID</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client (Café)</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Articles</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant Total</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.orders.map((o: any) => {
                        const orderStatusColors: any = {
                          'PENDING': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600' },
                          'CONFIRMED': { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600' },
                          'SHIPPED': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
                          'DELIVERED': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
                          'CANCELLED': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600' }
                        };
                        const os = orderStatusColors[o.status] || orderStatusColors['PENDING'];

                        return (
                          <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-6 first:pl-8">
                              <div className="flex flex-col">
                                <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">#{o.id.slice(-6)}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-950 rounded-lg flex items-center justify-center text-slate-900 dark:text-white font-black text-[10px] border border-slate-200 dark:border-slate-800">
                                  {o.store?.name?.charAt(0) || 'C'}
                                </div>
                                <div className="text-xs font-black text-slate-700 dark:text-slate-300">{o.store?.name || 'Café Inconnu'}</div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2 group cursor-help">
                                <Box size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-xs font-bold text-slate-500">{o.items.length} articles</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="text-sm font-black text-slate-900 dark:text-white">{Number(o.total).toFixed(3)} DT</div>
                            </td>
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${os.bg} ${os.text}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="p-6 text-right pr-8">
                              <button className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors underline decoration-indigo-500/20 underline-offset-4">VOIR BON</button>
                            </td>
                          </tr>
                        );
                      })}
                      {vendor.orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-20 text-center text-slate-400 font-black text-xs uppercase tracking-widest italic bg-slate-50/20">
                            Aucune commande n'a encore été passée chez ce fournisseur.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
