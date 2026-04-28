'use client';

import React, { useState, useTransition } from 'react';
import { 
  Building2, MapPin, Phone, Mail, 
  Package, CheckCircle2, XCircle, Search, 
  BarChart3, Calendar, ShieldCheck, ShoppingBag,
  ArrowLeft, ExternalLink, Tag, Filter,
  ChevronRight, Box, Wallet, TrendingUp, DollarSign,
  ArrowUpRight, ArrowDownLeft, Clock, AlertTriangle, Check, RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { approveVendorAction, rejectVendorAction, assignCommissionRuleToVendor } from '../../../actions';

export default function VendorDetailClient({ vendor, rules }: { vendor: any, rules: any[] }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'orders' | 'wallet'>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');

  const handleAssignRule = (ruleId: string | null) => {
    startTransition(async () => {
      try {
        await assignCommissionRuleToVendor(vendor.id, ruleId);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

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

  const handleWalletAction = () => {
    if (!walletAmount || isNaN(Number(walletAmount))) return;
    startTransition(async () => {
      try {
        // We'll need to define this action or use an existing one
        const { depositToWalletAction } = await import('../../../actions');
        await depositToWalletAction(vendor.id, Number(walletAmount), walletDesc);
        setShowWalletModal(false);
        setWalletAmount('');
        setWalletDesc('');
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleApproveSettlement = (orderId: string) => {
    startTransition(async () => {
      try {
        const { approveMarketplaceOrderAction } = await import('../../../actions');
        await approveMarketplaceOrderAction(orderId, 'SUPERADMIN');
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
               <button 
                onClick={() => setShowWalletModal(true)}
                className="px-6 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-black text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
               >
                 Reversement / Retrait
               </button>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Volume d'affaires", 
            value: `${vendor.orders.reduce((acc: number, o: any) => acc + Number(o.total), 0).toFixed(3)} DT`, 
            icon: TrendingUp, 
            color: "indigo",
            desc: "Total des ventes marketplace"
          },
          { 
            label: "Commissions Plateforme", 
            value: `${vendor.orders.reduce((acc: number, o: any) => acc + Number(o.settlement?.commissionAmount || 0), 0).toFixed(3)} DT`, 
            icon: DollarSign, 
            color: "rose",
            desc: "Revenus générés par la plateforme"
          },
          { 
            label: "Solde Wallet", 
            value: `${Number(vendor.wallet?.balance || 0).toFixed(3)} DT`, 
            icon: Wallet, 
            color: "emerald",
            desc: "Disponible pour retrait / reversement"
          },
          { 
            label: "Commandes", 
            value: vendor.orders.length, 
            icon: ShoppingBag, 
            color: "amber",
            desc: "Volume total de transactions"
          }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
            <div className={`p-3 bg-${kpi.color}-50 dark:bg-${kpi.color}-500/10 rounded-2xl text-${kpi.color}-600 w-fit`}>
              <kpi.icon size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{kpi.value}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1">{kpi.desc}</div>
            </div>
          </div>
        ))}
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
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Règle Appliquée</label>
                  <select 
                    value={vendor.commissionRuleId || ""} 
                    onChange={(e) => handleAssignRule(e.target.value || null)}
                    disabled={isPending}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">(Par Défaut Global / Individuel)</option>
                    {rules.map(rule => (
                      <option key={rule.id} value={rule.id}>{rule.name} ({(rule.baseRate * 100).toFixed(1)}%)</option>
                    ))}
                  </select>
                </div>

                {vendor.commissionRule ? (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase">Taux de base</span>
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">{(vendor.commissionRule.baseRate * 100).toFixed(1)}%</span>
                    </div>
                    {Array.isArray(vendor.commissionRule.tiers) && vendor.commissionRule.tiers.length > 0 && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-indigo-200/30">
                        {vendor.commissionRule.tiers.sort((a: any, b: any) => a.minAmount - b.minAmount).map((tier: any, i: number) => (
                          <div key={i} className="flex justify-between text-[10px] font-bold">
                            <span className="text-indigo-600/70">Dès {tier.minAmount} DT</span>
                            <span className="text-indigo-700">{(tier.rate * 100).toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Taux Individuel</span>
                      <span className="text-lg font-black text-slate-700">{(Number(vendor.commissionRate || 0.01) * 100).toFixed(1)}%</span>
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
                          <div className="space-y-1 mt-2">
                            {tiersList.sort((a: any, b: any) => a.minAmount - b.minAmount).map((tier: any, i: number) => (
                              <div key={i} className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>Dès {tier.minAmount} DT</span>
                                <span>{(tier.rate * 100).toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
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
          <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-3xl w-fit shadow-sm">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3, color: 'indigo' },
              { id: 'catalog', label: 'Catalogue', icon: Package, color: 'indigo' },
              { id: 'orders', label: 'Commandes', icon: ShoppingBag, color: 'amber' },
              { id: 'wallet', label: 'Portefeuille (Wallet)', icon: Wallet, color: 'emerald' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                  activeTab === tab.id 
                    ? `bg-white dark:bg-slate-800 text-${tab.color}-600 shadow-sm` 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
            {activeTab === 'overview' ? (
              <div className="p-10 text-center space-y-8">
                <div className="max-w-md mx-auto">
                   <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                      <BarChart3 size={40} />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white">Performance du Vendeur</h3>
                   <p className="text-sm text-slate-500 mt-2 font-medium">Récapitulatif des activités récentes et indicateurs clés de performance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                   <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[32px] border border-slate-100 dark:border-slate-800 text-left">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dernière Vente</div>
                      {vendor.orders[0] ? (
                        <div>
                          <div className="text-lg font-black text-slate-900 dark:text-white">{Number(vendor.orders[0].total).toFixed(3)} DT</div>
                          <div className="text-xs font-bold text-slate-400 mt-1">{new Date(vendor.orders[0].createdAt).toLocaleDateString('fr-FR', { dateStyle: 'full' })}</div>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">Aucune commande enregistrée.</div>
                      )}
                   </div>
                   <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[32px] border border-slate-100 dark:border-slate-800 text-left">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Produit le plus vendu</div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                            {vendor.vendorProducts?.[0]?.name?.charAt(0) || '-'}
                         </div>
                         <div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">{vendor.vendorProducts?.[0]?.name || '—'}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{vendor.vendorProducts?.[0]?.category?.name || 'Catalog Item'}</div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : activeTab === 'catalog' ? (
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
            ) : activeTab === 'orders' ? (
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
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.orders.map((o: any) => {
                        const orderStatusColors: any = {
                          'PENDING':   { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600',   label: 'En attente' },
                          'CONFIRMED': { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  text: 'text-indigo-600',  label: 'Acceptée' },
                          'SHIPPED':   { bg: 'bg-blue-50 dark:bg-blue-500/10',      text: 'text-blue-600',    label: 'Expédiée' },
                          'DELIVERED': { bg: 'bg-orange-50 dark:bg-orange-500/10',  text: 'text-orange-600',  label: 'À réceptionner' },
                          'STOCKED':   { bg: 'bg-emerald-50 dark:bg-emerald-500/10',text: 'text-emerald-600', label: 'Finalisée' },
                          'CANCELLED': { bg: 'bg-rose-50 dark:bg-rose-500/10',      text: 'text-rose-600',    label: 'Annulée' },
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
                              {o.settlement ? (
                                <div>
                                  <div className="text-sm font-black text-rose-500">-{Number(o.settlement.commissionAmount).toFixed(3)} DT</div>
                                  <div className="text-[9px] font-bold text-slate-400">Déduit du wallet</div>
                                </div>
                              ) : o.status === 'STOCKED' || o.status === 'DELIVERED' ? (
                                <div className="text-[10px] font-bold text-amber-500">En attente...</div>
                              ) : (
                                <div className="text-[10px] font-bold text-slate-400">—</div>
                              )}
                            </td>
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${os.bg} ${os.text}`}>
                                {os.label}
                              </span>
                            </td>
                            <td className="p-6 text-right pr-8">
                               <div className="flex items-center justify-end gap-3">
                                  {!o.settlement?.superadminApproved && (o.status === 'STOCKED' || o.status === 'DELIVERED') && (
                                     <button 
                                      onClick={() => handleApproveSettlement(o.id)}
                                      disabled={isPending}
                                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-500 transition-colors shadow-sm"
                                     >
                                        Approuver
                                     </button>
                                  )}
                                  <button className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors underline decoration-indigo-500/20 underline-offset-4">VOIR BON</button>
                               </div>
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
            ) : (
              <div className="flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/30 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Wallet size={18} className="text-emerald-500" /> Journal du Wallet
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transactions, commissions et reversements</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <div className="text-[10px] font-black text-slate-400 uppercase">SOLDE ACTUEL</div>
                       <div className="text-lg font-black text-emerald-600 leading-none">{Number(vendor.wallet?.balance || 0).toFixed(3)} DT</div>
                    </div>
                    <button className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-indigo-600 transition-colors shadow-sm">
                       <RefreshCcw size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/20 grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Commissions</div>
                      <div className="text-xl font-black text-rose-600">
                         {vendor.wallet?.transactions?.filter((t: any) => t.type === 'COMMISSION').reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0).toFixed(3)} DT
                      </div>
                   </div>
                   <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-8">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reversements Effectués</div>
                      <div className="text-xl font-black text-emerald-600">
                         {vendor.wallet?.transactions?.filter((t: any) => t.amount < 0 && t.type !== 'COMMISSION').reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0).toFixed(3)} DT
                      </div>
                   </div>
                   <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-8">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernière Opération</div>
                      <div className="text-sm font-black text-slate-700 dark:text-slate-300">
                         {vendor.wallet?.transactions?.[0] ? new Date(vendor.wallet.transactions[0].createdAt).toLocaleDateString('fr-FR') : 'Aucune'}
                      </div>
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50 dark:bg-slate-950">
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest first:pl-8">Date</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Détails</th>
                         </tr>
                      </thead>
                      <tbody>
                         {vendor.wallet?.transactions?.map((t: any) => {
                            const isPositive = Number(t.amount) > 0;
                            return (
                               <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="p-6 first:pl-8">
                                     <div className="text-[10px] font-black text-slate-400 uppercase">{new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                  </td>
                                  <td className="p-6">
                                     <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${
                                       t.type === 'COMMISSION' ? 'bg-rose-50 text-rose-600' : 
                                       t.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600' :
                                       'bg-slate-50 text-slate-600'
                                     }`}>
                                        {t.type === 'COMMISSION' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                        {t.type}
                                     </div>
                                  </td>
                                  <td className="p-6">
                                     <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{t.description || '—'}</div>
                                  </td>
                                  <td className="p-6">
                                     <div className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isPositive ? '+' : ''}{Number(t.amount).toFixed(3)} DT
                                     </div>
                                  </td>
                                  <td className="p-6 text-right pr-8">
                                     <button className="text-slate-300 hover:text-indigo-600"><ChevronRight size={16} /></button>
                                  </td>
                               </tr>
                            );
                         })}
                         {(!vendor.wallet?.transactions || vendor.wallet.transactions.length === 0) && (
                            <tr>
                               <td colSpan={5} className="p-20 text-center text-slate-400 font-black text-xs uppercase tracking-widest italic bg-slate-50/20">
                                  Aucune transaction dans le wallet.
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


      {/* Wallet Action Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white">Reversement Manuel</h3>
                 <button onClick={() => setShowWalletModal(false)} className="text-slate-400 hover:text-slate-900"><XCircle size={24} /></button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Montant (DT)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 50.000"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-bold italic">Utilisez un signe négatif (-) pour effectuer un retrait.</p>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Description / Motif</label>
                    <textarea 
                      placeholder="Indiquez la raison de l'opération..."
                      value={walletDesc}
                      onChange={(e) => setWalletDesc(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                    />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black text-sm"
                 >
                    Annuler
                 </button>
                 <button 
                  onClick={handleWalletAction}
                  disabled={isPending || !walletAmount}
                  className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                 >
                    Confirmer l'opération
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
