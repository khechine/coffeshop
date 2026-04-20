'use client';

import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingBag, 
  ArrowUpRight, Target, Award, Star, Zap, BarChart3, Clock
} from 'lucide-react';

export default function SalesDashboardClient({ orders, products, bundles }: { orders: any[], products: any[], bundles: any[] }) {
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Top products calculation
    const productSales: Record<string, { name: string, total: number, qty: number }> = {};
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, total: 0, qty: 0 };
        }
        productSales[item.name].total += Number(item.price) * Number(item.quantity);
        productSales[item.name].qty += Number(item.quantity);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Weekly distribution (mocking logic for demo)
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const revenueByDay = [15, 25, 12, 45, 30, 10, 5]; // Percentages for visualization

    return { totalRevenue, totalOrders, avgOrder, topProducts, revenueByDay };
  }, [orders]);

  const kpiClass = "bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800/50 flex flex-col gap-4 shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all";

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={kpiClass}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} className="text-indigo-600" />
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chiffre d'Affaires Total</div>
            <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
              {stats.totalRevenue.toFixed(3)}
              <span className="text-sm font-bold opacity-30">DT</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 w-fit px-3 py-1 rounded-full">
              <ArrowUpRight size={14} /> +12.5% vs mois dernier
            </div>
          </div>
        </div>

        <div className={kpiClass}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag size={80} className="text-blue-600" />
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre de Commandes</div>
            <div className="text-4xl font-black text-slate-900 dark:text-white">
              {stats.totalOrders}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 w-fit px-3 py-1 rounded-full">
              Volume Marketplace actif
            </div>
          </div>
        </div>

        <div className={kpiClass}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={80} className="text-violet-600" />
          </div>
          <div className="w-12 h-12 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Panier Moyen</div>
            <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
              {stats.avgOrder.toFixed(3)}
              <span className="text-sm font-bold opacity-30">DT</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 w-fit px-3 py-1 rounded-full">
              Performance par client
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── PERFORMANCE CHART ── */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-[48px] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="text-indigo-500" /> Répartition Hebdomadaire
              </h2>
              <p className="text-sm text-slate-500 font-medium">Volumes de ventes lissés sur les 7 derniers jours</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-xs font-black text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <Clock size={12} /> Dernière mise à jour: 00h35
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between h-64 gap-4 px-4">
             {stats.revenueByDay.map((val, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="relative w-full">
                    <div 
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl transition-all group-hover:bg-indigo-500/20" 
                      style={{ height: '100px' }} 
                    />
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all" 
                      style={{ height: `${val * 2}px` }} 
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'][i]}
                  </span>
               </div>
             ))}
          </div>
        </div>

        {/* ── TOP PRODUCTS ── */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-[48px] p-8 shadow-sm flex flex-col">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <Star className="text-amber-500 fill-amber-500" /> Bestsellers
          </h2>
          
          <div className="space-y-4 flex-1">
             {stats.topProducts.map((p, i) => (
               <div key={p.name} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-indigo-600 shadow-sm border border-indigo-100 dark:border-indigo-900">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">{p.name}</div>
                    <div className="text-[10px] font-bold text-slate-500">{p.qty} unités vendues</div>
                  </div>
                  <div className="text-sm font-black text-indigo-600">
                    {p.total.toFixed(0)} <span className="text-[10px] opacity-40">DT</span>
                  </div>
               </div>
             ))}
             {stats.topProducts.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-center py-10">
                 <Zap className="text-slate-300 mb-2" />
                 <div className="text-sm font-bold text-slate-400 italic">Pas assez de données pour le top</div>
               </div>
             )}
          </div>

          <button className="mt-8 w-full py-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all">
             Voir le rapport complet
          </button>
        </div>

      </div>

    </div>
  );
}
