'use client';

import React, { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Users, TrendingUp, Mail, Filter, Star, ShieldAlert, 
  Tag as TagIcon, Plus, Send, Phone, MessageCircle, 
  ExternalLink, ChevronRight, Search, LayoutGrid, X
} from 'lucide-react';
import { updateVendorCustomerAction, createVendorCampaignAction } from '../../../actions';

interface VendorCrmClientProps {
  initialCustomers: any[];
  initialCampaigns: any[];
}

export default function VendorCrmClient({ initialCustomers, initialCampaigns }: VendorCrmClientProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [activeTab, setActiveTab] = useState<'customers' | 'campaigns'>('customers');
  const [customers, setCustomers] = useState(initialCustomers);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'EMAIL' as const,
    content: '',
    targetTags: [] as string[]
  });

  const handleUpdateCustomer = (id: string, data: { category?: string; tags?: string[] }) => {
    startTransition(async () => {
      await updateVendorCustomerAction(id, data);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      if (selectedCust && selectedCust.id === id) {
        setSelectedCust((prev: any) => ({ ...prev, ...data }));
      }
    });
  };

  const handleSendCampaign = () => {
    if (!campaignForm.name || !campaignForm.content) return;
    startTransition(async () => {
      const newCampaign = await createVendorCampaignAction(campaignForm);
      setCampaigns(prev => [newCampaign, ...prev]);
      setCampaignForm({ name: '', type: 'EMAIL', content: '', targetTags: [] });
      alert('Campagne envoyée avec succès !');
    });
  };

  const filteredCustomers = customers.filter(c => 
    c.store?.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Total Clients</p>
              <p className="text-3xl font-black text-slate-900">{customers.length}</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500">Points de vente actifs</div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Ventes B2B</p>
              <p className="text-3xl font-black text-slate-900">{customers.reduce((acc, c) => acc + Number(c.totalSpent), 0).toFixed(0)} DT</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500">Chiffre d'affaires Marketplace</div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Campagnes</p>
              <p className="text-3xl font-black text-slate-900">{campaigns.length}</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500">Emails & SMS envoyés</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-[20px] w-fit">
        <button 
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-[16px] font-black text-sm transition-all ${activeTab === 'customers' ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={16} /> Base Clients
        </button>
        <button 
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-[16px] font-black text-sm transition-all ${activeTab === 'campaigns' ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Mail size={16} /> Marketing & Promo
        </button>
      </div>

      {activeTab === 'customers' && (
        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="font-black text-2xl text-slate-900">Mes Partenaires B2B</h3>
              <p className="text-slate-400 font-bold text-sm">Liste des coffeeshops ayant commandé via la marketplace</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un client..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl w-72 focus:ring-2 focus:ring-rose-500/20 font-bold text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Segment</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commandes</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total HT</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <Users size={48} className="mx-auto text-slate-200 mb-4" />
                       <p className="text-slate-400 font-bold text-lg">Aucun client trouvé</p>
                    </td>
                  </tr>
                ) : filteredCustomers.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-lg">
                          {c.store?.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 leading-tight">{c.store?.name}</h4>
                          <p className="text-xs font-bold text-slate-400">{c.store?.city || 'Tunis'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                          c.category === 'VIP' ? 'bg-amber-100 text-amber-700' :
                          c.category === 'CHURN_RISK' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {c.category || 'REGULAR'}
                        </span>
                        {c.tags?.map((t: string) => (
                          <span key={t} className="bg-blue-50 text-blue-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-slate-700">{c.orderCount}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-emerald-600 text-lg">{Number(c.totalSpent).toFixed(3)} DT</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedCust(c)}
                            className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                            title="Taguer le client"
                          >
                            <TagIcon size={16} />
                          </button>
                          <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                            <MessageCircle size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Campaign Form */}
          <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
            <h3 className="font-black text-2xl text-slate-900 mb-6">Nouvelle Campagne</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de la campagne</label>
                <input 
                  type="text" 
                  value={campaignForm.name}
                  onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Promo Ouverture Ramadan"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type d'envoi</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'EMAIL', icon: Mail, label: 'Email' },
                    { id: 'SMS', icon: MessageCircle, label: 'SMS' },
                    { id: 'WHATSAPP', icon: Phone, label: 'WhatsApp' }
                  ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setCampaignForm(f => ({ ...f, type: t.id as any }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${campaignForm.type === t.id ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                    >
                      <t.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                <textarea 
                  rows={6}
                  value={campaignForm.content}
                  onChange={e => setCampaignForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Écrivez votre message ici..."
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-900"
                />
              </div>

              <button 
                onClick={handleSendCampaign}
                disabled={isPending}
                className="w-full py-5 bg-rose-600 text-white rounded-[20px] font-black text-lg shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
              >
                {isPending ? 'Envoi...' : <><Send size={20} /> Lancer la campagne</>}
              </button>
            </div>
          </div>

          {/* Campaign History */}
          <div className="space-y-6">
            <h3 className="font-black text-2xl text-slate-900">Historique</h3>
            {campaigns.length === 0 ? (
              <div className="bg-slate-50 rounded-[40px] p-12 text-center border-2 border-dashed border-slate-200">
                 <Mail size={48} className="mx-auto text-slate-200 mb-4" />
                 <p className="text-slate-400 font-bold">Aucune campagne envoyée</p>
              </div>
            ) : campaigns.map((c) => (
              <div key={c.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    c.type === 'EMAIL' ? 'bg-blue-50 text-blue-600' :
                    c.type === 'SMS' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {c.type === 'EMAIL' ? <Mail size={20} /> : <Phone size={20} />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{c.name}</h4>
                    <p className="text-xs font-bold text-slate-400">{new Date(c.sentAt).toLocaleDateString()} • {c.status}</p>
                  </div>
                </div>
                <button className="text-slate-300 hover:text-slate-500"><ChevronRight size={20} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {selectedCust && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-2xl text-slate-900">Taguer {selectedCust.store?.name}</h3>
              <button onClick={() => setSelectedCust(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="text-slate-400 font-bold text-sm mb-8">Segmenter et taguer vos clients B2B.</p>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {['VIP', 'REGULAR', 'CHURN_RISK'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => handleUpdateCustomer(selectedCust.id, { category: cat })}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${selectedCust.category === cat ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-md shadow-rose-500/10' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags personnalisés (séparés par virgule)</label>
                <input 
                  type="text"
                  defaultValue={selectedCust.tags?.join(', ')}
                  onBlur={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                    handleUpdateCustomer(selectedCust.id, { tags });
                  }}
                  placeholder="Ex: Boulangerie, Sousse, GrosVolume"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 font-bold">Appuyez en dehors du champ pour sauvegarder les tags.</p>
              </div>
              {/* Order History */}
              <div className="space-y-3 border-t border-slate-50 pt-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dernières Commandes</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedCust.store?.supplierOrders?.length > 0 ? (
                    selectedCust.store.supplierOrders.map((o: any) => (
                      <div key={o.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs font-bold">
                        <div>
                          <div className="text-slate-900">#{o.id.slice(-6).toUpperCase()}</div>
                          <div className="text-slate-400 text-[10px]">{new Date(o.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-indigo-600">{Number(o.total).toFixed(3)} DT</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-[10px]">Aucune commande trouvée</div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedCust(null)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all mt-4"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
