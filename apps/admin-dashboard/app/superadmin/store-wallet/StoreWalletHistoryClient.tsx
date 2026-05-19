'use client';

import React, { useState, useMemo } from 'react';
import { 
  CreditCard, ArrowUpRight, ArrowDownLeft, 
  Calendar, Search, Filter, Store, ExternalLink, Briefcase
} from 'lucide-react';

interface UnifiedTx {
  id: string;
  createdAt: string;
  amount: number;
  type: string;
  description: string;
  entityType: 'STORE' | 'VENDOR';
  entityName: string;
}

export default function StoreWalletHistoryClient({ 
  initialStoreTransactions,
  initialVendorTransactions
}: { 
  initialStoreTransactions: any[];
  initialVendorTransactions: any[];
}) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'STORE' | 'VENDOR'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const unifiedTransactions = useMemo<UnifiedTx[]>(() => {
    const stores: UnifiedTx[] = initialStoreTransactions.map(tx => ({
      id: `store_${tx.id}`,
      createdAt: tx.createdAt,
      amount: Number(tx.amount),
      type: tx.type,
      description: tx.description || '',
      entityType: 'STORE',
      entityName: tx.wallet?.store?.name || 'Inconnu'
    }));

    const vendors: UnifiedTx[] = initialVendorTransactions.map(tx => ({
      id: `vendor_${tx.id}`,
      createdAt: tx.createdAt,
      amount: Number(tx.amount),
      type: tx.type,
      description: tx.description || '',
      entityType: 'VENDOR',
      entityName: tx.wallet?.vendor?.companyName || 'Inconnu'
    }));

    return [...stores, ...vendors].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialStoreTransactions, initialVendorTransactions]);

  // Extract unique transaction types for the filter dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set(unifiedTransactions.map(tx => tx.type));
    return Array.from(types).sort();
  }, [unifiedTransactions]);

  const filtered = unifiedTransactions.filter(tx => {
    const matchesSearch = tx.entityName.toLowerCase().includes(search.toLowerCase()) || tx.description.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'ALL' || tx.entityType === activeTab;
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    
    return matchesSearch && matchesTab && matchesType;
  });

  return (
    <div className="flex flex-col gap-10 p-6 max-w-8xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[32px] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Commissions & Flux</h1>
          <p className="mt-2 text-slate-500 font-medium tracking-tight">Supervisez l'ensemble des transactions des Boutiques et Fournisseurs.</p>
        </div>

        {/* Entity Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 lg:flex-none items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setActiveTab('STORE')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'STORE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Store size={14} /> Boutiques
          </button>
          <button
            onClick={() => setActiveTab('VENDOR')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'VENDOR' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Briefcase size={14} /> Fournisseurs
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] shadow-sm">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par nom ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all"
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-all"
            >
              <option value="ALL">TOUS LES TYPES</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entité</th>
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 w-32">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 w-64">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.entityType === 'STORE' 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {tx.entityType === 'STORE' ? <Store size={14} /> : <Briefcase size={14} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300 line-clamp-1">{tx.entityName}</span>
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">
                            {tx.entityType === 'STORE' ? 'Boutique' : 'Fournisseur'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 max-w-xs">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{tx.description}</span>
                    </td>
                    <td className="py-4 w-40">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                        tx.type.includes('COMMISSION') ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                        tx.type === 'WITHDRAWAL' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-4 text-right font-black text-sm w-32 ${
                      tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(3)} DT
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
