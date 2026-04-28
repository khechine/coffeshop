'use client';

import React, { useState, useTransition } from 'react';
import { 
  Building2, MapPin, Phone, Mail, 
  Package, CheckCircle2, XCircle, Search, 
  BarChart3, Calendar, ShieldCheck, ShoppingBag,
  ExternalLink, Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { approveVendorAction, rejectVendorAction } from '../../actions';

type VendorWithDetails = any;

export default function VendorsListClient({ initialVendors = [] }: { initialVendors: VendorWithDetails[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [isPending, startTransition] = useTransition();

  const cities = Array.from(new Set(initialVendors.map(v => v.city).filter(Boolean)));

  const filteredVendors = initialVendors.filter(v => {
    const companyName = v.companyName || '';
    const vendorId = String(v.id || '');
    const matchesSearch = companyName.toLowerCase().includes(search.toLowerCase()) || 
                          vendorId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesCity = cityFilter === 'ALL' || v.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

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

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher par nom d'entreprise ou ID..."
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
            <option value="PENDING">En attente (Nouvelle)</option>
            <option value="ACTIVE">Actifs / Certifiés</option>
            <option value="REJECTED">Refusés</option>
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

      {/* Grid of Vendors */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVendors.map(v => {
          const statusColors: any = {
            'ACTIVE': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', label: 'ACTIF / CERTIFIÉ' },
            'PENDING': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', label: 'EN ATTENTE' },
            'REJECTED': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', label: 'REFUSÉ' }
          };
          const colors = statusColors[v.status] || statusColors['PENDING'];

          return (
            <div key={v.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:scale-[1.01] flex flex-col justify-between">
              <div onClick={() => router.push(`/superadmin/vendors/${v.id}`)} className="cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-black text-xl border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {v.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {v.companyName}
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <code className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">VND-{v.id.slice(-6)}</code>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${colors.bg} ${colors.text}`}>
                    {colors.label}
                  </span>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                  {v.description || "Aucune description fournie par le vendeur."}
                </p>

                {/* Vendor Metadata */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-xs font-bold truncate">{v.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-xs font-bold">{v.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="text-xs font-bold">{v.city || 'Tunis'} — {v.address || '—'}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 border border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <ShoppingBag size={14} className="text-indigo-500" />
                      <span className="text-sm font-black text-slate-900 dark:text-white">{v.products?.length || v.vendorProducts?.length || 0}</span>
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Produits</div>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Wallet size={14} className="text-emerald-500" />
                      <span className="text-sm font-black text-slate-900 dark:text-white">{Number(v.wallet?.balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Solde DT</div>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <BarChart3 size={14} className="text-amber-500" />
                      <span className="text-sm font-black text-slate-900 dark:text-white">KPI</span>
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Performance</div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                {v.status === 'PENDING' ? (
                  <>
                    <button 
                      onClick={() => handleReject(v.id)}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={16} /> Rejeter
                    </button>
                    <button 
                      onClick={() => handleApprove(v.id)}
                      disabled={isPending}
                      className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Approuver le compte
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      if (v.status === 'ACTIVE') handleReject(v.id);
                      else handleApprove(v.id);
                    }}
                    disabled={isPending}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs transition-all border ${
                      v.status === 'ACTIVE' 
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {v.status === 'ACTIVE' ? (
                      <><XCircle size={16} /> Désactiver le vendeur</>
                    ) : (
                      <><CheckCircle2 size={16} /> Ré-activer le vendeur</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
