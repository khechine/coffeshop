'use client';

import React, { useState } from 'react';
import { Users, TrendingUp, Mail, Filter, Star, ShieldAlert } from 'lucide-react';

interface VendorCrmClientProps {
  initialCustomers: any[];
  initialCampaigns: any[];
}

export default function VendorCrmClient({ initialCustomers, initialCampaigns }: VendorCrmClientProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'campaigns'>('customers');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'customers' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={16} /> Mes Clients
        </button>
        <button 
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'campaigns' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Mail size={16} /> Campagnes Email/SMS
        </button>
      </div>

      {activeTab === 'customers' && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl text-slate-900">Base de données clients</h3>
            <button className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-slate-600"><Filter size={18} /></button>
          </div>

          <div className="divide-y divide-slate-100">
            {initialCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium">
                Aucun client B2B n'a encore commandé chez vous via la Marketplace.
              </div>
            ) : (
              initialCustomers.map((c) => (
                <div key={c.id} className="py-4 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg">
                      {c.store?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{c.store?.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          c.category === 'VIP' ? 'bg-amber-100 text-amber-700' :
                          c.category === 'CHURN_RISK' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {c.category === 'VIP' && <Star size={10} className="inline mr-1"/>}
                          {c.category === 'CHURN_RISK' && <ShieldAlert size={10} className="inline mr-1"/>}
                          {c.category || 'Standard'}
                        </span>
                        <span className="text-slate-400 text-xs">{c.orderCount} commandes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">{c.totalSpent.toFixed(3)} DT</p>
                    <p className="text-xs font-bold text-slate-400">Total dépensé</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-rose-600" />
          </div>
          <h3 className="font-black text-xl text-slate-900 mb-2">Campagnes Marketing</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Envoyez des offres spéciales, des nouveautés ou des promotions ciblées à vos clients VIP ou réguliers.</p>
          <button className="bg-rose-600 text-white px-6 py-3 rounded-xl font-black shadow-md shadow-rose-600/20 hover:bg-rose-700">
            Créer une campagne
          </button>
        </div>
      )}
    </div>
  );
}
