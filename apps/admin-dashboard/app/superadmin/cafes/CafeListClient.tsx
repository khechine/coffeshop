'use client';

import React, { useState, useTransition } from 'react';
import { 
  Store as StoreIcon, User, MapPin, Coffee, TrendingUp, 
  CreditCard, Monitor, Calendar, Search, Filter, 
  CheckCircle2, XCircle, Truck, ShieldCheck
} from 'lucide-react';
import StoreActionButtons from './StoreActionButtons';
import { toggleStoreMarketplaceAccess } from '../../actions';

type StoreWithStats = any; // We'll use the type from the server

export default function CafeListClient({ initialStores }: { initialStores: StoreWithStats[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [isPending, startTransition] = useTransition();

  const cities = Array.from(new Set(initialStores.map(s => s.city).filter(Boolean)));

  const filteredStores = initialStores.filter(s => {
    const name = s.name || '';
    const id = String(s.id || '');
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesCity = cityFilter === 'ALL' || s.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const handleToggleMarketplace = (storeId: string, enabled: boolean) => {
    startTransition(async () => {
      try {
        await toggleStoreMarketplaceAccess(storeId, enabled);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher par nom ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
          />
        </div>
        
        <div className="flex gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="PENDING_VERIFICATION">En attente véri.</option>
            <option value="PENDING_DOCS">Docs manquants</option>
            <option value="SUSPENDED">Suspendus</option>
          </select>

          <select 
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les villes</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Stores */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStores.map(s => {
          const totalRevenue = s.sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
          const statusColors: any = {
            'ACTIVE': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
            'PENDING_VERIFICATION': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
            'PENDING_DOCS': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
            'SUSPENDED': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400' }
          };
          const colors = statusColors[s.status] || statusColors['PENDING_DOCS'];

          return (
            <div key={s.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:scale-[1.01]">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <StoreIcon size={24} color="#FFF" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{s.name}</h3>
                    <code className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {s.id}</code>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                  {s.isVerified && <span className="text-[10px] text-emerald-500 font-black tracking-widest flex items-center gap-1"><ShieldCheck size={12} /> VÉRIFIÉ</span>}
                </div>
              </div>

              {/* Special Controls: Marketplace Bypass */}
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 mb-6 border border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${s.forceMarketplaceAccess ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                      <Truck size={16} />
                    </div>
                    <div>
                      <span className="block text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Accès Marketplace Manuel</span>
                      <span className="text-[9px] text-slate-500 font-medium">Bypass l'abonnement en cours</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleMarketplace(s.id, !s.forceMarketplaceAccess)}
                    disabled={isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${s.forceMarketplaceAccess ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.forceMarketplaceAccess ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl flex items-center gap-3">
                   <CreditCard size={18} className="text-slate-400" />
                   <div>
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Plan</div>
                     <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.subscription?.plan.name || 'Aucun'}</div>
                   </div>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl flex items-center gap-3">
                   <MapPin size={18} className="text-slate-400" />
                   <div>
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ville</div>
                     <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.city || '—'}</div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 border border-slate-100 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-900/40 p-3 text-center">
                   <div className="text-sm font-black text-slate-900 dark:text-white">{s._count.sales}</div>
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ventes</div>
                </div>
                <div className="bg-white dark:bg-slate-900/40 p-3 text-center">
                   <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">{totalRevenue.toFixed(2)}</div>
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CA (DT)</div>
                </div>
                <div className="bg-white dark:bg-slate-900/40 p-3 text-center">
                   <div className="text-sm font-black text-slate-900 dark:text-white">{s._count.products}</div>
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Items</div>
                </div>
              </div>

              <StoreActionButtons storeId={s.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
