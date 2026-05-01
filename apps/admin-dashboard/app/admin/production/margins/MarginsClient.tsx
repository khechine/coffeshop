'use client';

import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  ArrowUpRight, ArrowDownRight, Info, Search,
  ChefHat, Layers, AlertTriangle
} from 'lucide-react';

export default function MarginsClient({ initialMargins }: { initialMargins: any[] }) {
  const [search, setSearch] = useState('');

  const filteredMargins = initialMargins.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const averageMargin = initialMargins.length > 0 
    ? initialMargins.reduce((acc, curr) => acc + curr.marginPercent, 0) / initialMargins.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coûts & Marges</h1>
          <p className="text-slate-500 text-sm font-medium">Analyse automatique basée sur vos recettes</p>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl">
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Marge Moyenne</div>
          <div className="text-2xl font-black text-indigo-600">{averageMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <TrendingUp size={28} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Plus Rentable</div>
            <div className="text-lg font-black text-slate-900 truncate max-w-[150px]">
              {initialMargins.sort((a, b) => b.marginPercent - a.marginPercent)[0]?.name || '-'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
            <TrendingDown size={28} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Moins Rentable</div>
            <div className="text-lg font-black text-slate-900 truncate max-w-[150px]">
              {initialMargins.sort((a, b) => a.marginPercent - b.marginPercent)[0]?.name || '-'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
            <AlertTriangle size={28} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Marge Faible (&lt;30%)</div>
            <div className="text-lg font-black text-slate-900">
              {initialMargins.filter(m => m.marginPercent < 30).length} Produits
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Filtrer par produit..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid of Margins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMargins.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                <ChefHat size={24} />
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-black border ${
                item.marginPercent > 60 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                item.marginPercent > 30 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {item.marginPercent.toFixed(1)}% Marge
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-6 truncate">{item.name}</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Prix de vente</span>
                <span className="font-black text-slate-900">{item.price.toFixed(3)} DT</span>
              </div>
              
              <div className="h-px bg-slate-50 w-full" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Coût Revient (Recette)</span>
                <span className="font-bold text-slate-600">{item.cost.toFixed(3)} DT</span>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Bénéfice Brut / Unité</span>
                <span className="font-black text-emerald-600">{item.margin.toFixed(3)} DT</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50">
              <button className="w-full py-3 rounded-xl bg-slate-50 text-slate-500 text-xs font-black hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                <Layers size={14} />
                Détail de la Recette
              </button>
            </div>
          </div>
        ))}

        {filteredMargins.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
             <Info className="mx-auto text-slate-200 mb-4" size={48} />
             <p className="text-slate-400 font-bold">Aucun produit configuré avec une recette</p>
          </div>
        )}
      </div>
    </div>
  );
}
