'use client';

import React, { useState } from 'react';
import { 
  CreditCard, ArrowUpRight, ArrowDownLeft, 
  Calendar, Search, Filter, Store, ExternalLink 
} from 'lucide-react';

export default function StoreWalletHistoryClient({ initialTransactions }: { initialTransactions: any[] }) {
  const [search, setSearch] = useState('');

  const filtered = initialTransactions.filter(tx => 
    tx.wallet.store.name.toLowerCase().includes(search.toLowerCase()) ||
    tx.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10 p-6 max-w-8xl mx-auto">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[32px] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Flux Financiers Boutique</h1>
          <p className="mt-2 text-slate-500 font-medium tracking-tight">Suivi global des commissions marketplace et rechargements wallets.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] shadow-sm">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher par boutique ou description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Boutique</th>
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map((tx) => (
                <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Store size={14} />
                      </div>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">{tx.wallet.store.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tx.description}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                      tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`py-4 text-right font-black text-sm ${
                    Number(tx.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {Number(tx.amount) >= 0 ? '+' : ''}{Number(tx.amount).toFixed(3)} DT
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
