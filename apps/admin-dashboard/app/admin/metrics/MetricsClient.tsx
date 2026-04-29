'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingCart, Package, 
  AlertTriangle, BarChart3, PieChart, Coffee, Zap
} from 'lucide-react';

import { useRouter } from 'next/navigation';

interface MetricsData {
  salesCount: number;
  revenue: number;
  avgOrderValue: number;
  productsCount: number;
  stockItemsCount: number;
  lowStockCount: number;
  inventoryValue: number;
  staffCount: number;
  expenses: number;
  profit: number;
  recentSales: any[];
  topProducts: { name: string; qty: number; revenue: number; category: string }[];
  salesByDay: { date: string; total: number }[];
  salesByCategory: { category: string; total: number }[];
  salesByPayment: { method: string; count: number }[];
}

const formatCurrency = (val: number) => val.toFixed(3) + ' DT';
const formatNumber = (val: number) => val.toLocaleString('fr-TN');

export default function MetricsClient({ data, storeName, initialPeriod = 'week' }: { data: MetricsData; storeName: string; initialPeriod?: 'today' | 'week' | 'month' }) {
  const router = useRouter();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>(initialPeriod);

  const cards = [
    { label: 'Ventes totales', value: formatNumber(data.salesCount), icon: ShoppingCart, color: '#6366F1', bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Chiffre d\'affaires', value: formatCurrency(data.revenue), icon: DollarSign, color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Panier moyen', value: formatCurrency(data.avgOrderValue), icon: Zap, color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Produits', value: formatNumber(data.productsCount), icon: Package, color: '#EC4899', bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' },
    { label: 'Stock valeur', value: formatCurrency(data.inventoryValue), icon: BarChart3, color: '#8B5CF6', bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
    { label: 'Stock critique', value: data.lowStockCount, icon: AlertTriangle, color: data.lowStockCount > 0 ? '#EF4444' : '#64748B', bg: data.lowStockCount > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-50', text: data.lowStockCount > 0 ? 'text-red-600' : 'text-slate-500' },
  ];

  const maxRevenue = Math.max(...data.salesByDay.map(d => d.total), 1);

  return (
    <div className="page-content space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Metrics</h1>
          <p className="text-slate-500 font-medium mt-1">Analyse des performances de {storeName}</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          {(['today', 'week', 'month'] as const).map(p => (
            <button key={p} 
              onClick={() => {
                setPeriod(p);
                router.push(`/admin/metrics?period=${p}`);
              }} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              {p === 'today' ? "Aujourd'hui" : p === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, idx) => (
          <div key={idx} className={`${card.bg} border-0 rounded-2xl p-5`}>
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon size={20} className={card.text} />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.label}</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" /> Ventes quotidiennes
          </h3>
          <div className="space-y-3">
            {data.salesByDay.slice(-7).map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-500 font-medium">{day.date}</div>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" style={{ width: `${(day.total / maxRevenue) * 100}%` }} />
                </div>
                <div className="w-24 text-right text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(day.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Coffee size={18} className="text-pink-500" /> Top Produits
          </h3>
          <div className="space-y-3">
            {data.topProducts.slice(0, 5).map((prod, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-black text-slate-500">{idx + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{prod.name}</div>
                  <div className="text-xs text-slate-500">{prod.qty} unités · {prod.category}</div>
                </div>
                <div className="text-sm font-black text-emerald-600">{formatCurrency(prod.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-500" /> Mode de paiement
          </h3>
          <div className="space-y-3">
            {data.salesByPayment.map((pm, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{pm.method}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{pm.count} ventes</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-violet-500" /> Ventes par catégorie
          </h3>
          <div className="space-y-3">
            {data.salesByCategory.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'][idx % 5] }} />
                <div className="flex-1 text-sm font-bold text-slate-900 dark:text-white">{cat.category}</div>
                <div className="text-sm font-black text-slate-700 dark:text-slate-300">{formatCurrency(cat.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <ShoppingCart size={18} className="text-indigo-500" /> Dernières ventes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-xs font-black text-slate-400 uppercase py-3 px-2">ID</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase py-3 px-2">Date</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase py-3 px-2">Caissier</th>
                <th className="text-right text-xs font-black text-slate-400 uppercase py-3 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.slice(0, 10).map((sale: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3 px-2 text-xs font-mono text-slate-500">#{sale.id?.slice(-6) || 'N/A'}</td>
                  <td className="py-3 px-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-2 text-sm font-bold text-slate-900 dark:text-white">{sale.barista?.name || sale.takenBy?.name || '-'}</td>
                  <td className="py-3 px-2 text-right text-sm font-black text-emerald-600">{formatCurrency(Number(sale.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
