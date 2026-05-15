'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Users, TrendingUp, Mail, Filter, Star, ShieldAlert, 
  Tag as TagIcon, Plus, Send, Phone, MessageCircle, 
  ExternalLink, ChevronRight, Search, LayoutGrid, X,
  Upload, FileText, Download, Save, Trash2, Info, ListPlus, Zap
} from 'lucide-react';
import { 
  updateVendorCustomerAction, 
  createVendorCampaignAction, 
  getAvailableStoresAction, 
  addVendorCustomerAction,
  createManualVendorCustomerAction,
  importVendorCustomersCSVAction,
  createVendorClientListAction,
  getVendorClientListsAction,
  getVendorMarketingTemplatesAction,
  createVendorMarketingTemplateAction,
  deleteVendorMarketingTemplateAction
} from '../../../actions';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
};

interface VendorCrmClientProps {
  initialCustomers: any[];
  initialCampaigns: any[];
  initialLists: any[];
  initialTemplates: any[];
}

export default function VendorCrmClient({ 
  initialCustomers, 
  initialCampaigns, 
  initialLists,
  initialTemplates
}: VendorCrmClientProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [activeTab, setActiveTab] = useState<'customers' | 'campaigns' | 'lists' | 'templates'>('customers');
  const [customers, setCustomers] = useState(initialCustomers);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [lists, setLists] = useState(initialLists);
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  useEffect(() => {
    if (selectedCust) {
      setTagInput(selectedCust.tags?.join(', ') || '');
    }
  }, [selectedCust]);
  const [isPending, startTransition] = useTransition();

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'EMAIL' as const,
    content: '',
    targetTags: [] as string[],
    targetListId: ''
  });

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    type: 'EMAIL',
    content: ''
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'REGULAR',
    tags: ''
  });

  const [storeSearch, setStoreSearch] = useState('');
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [isSearchingStores, setIsSearchingStores] = useState(false);

  const [tagInput, setTagInput] = useState('');


  const handleUpdateCustomer = (id: string, data: { category?: string; tags?: string[] }) => {
    startTransition(async () => {
      await updateVendorCustomerAction(id, data);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      if (selectedCust && selectedCust.id === id) {
        setSelectedCust((prev: any) => ({ ...prev, ...data }));
      }
    });
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.content) return;
    startTransition(async () => {
      const newTemplate = await createVendorMarketingTemplateAction(templateForm);
      setTemplates(prev => [newTemplate, ...prev.filter(t => t.id !== newTemplate.id)]);
      setIsTemplateModalOpen(false);
      setTemplateForm({ id: '', name: '', type: 'EMAIL', content: '' });
      alert('Modèle enregistré !');
    });
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm('Supprimer ce modèle ?')) return;
    startTransition(async () => {
      await deleteVendorMarketingTemplateAction(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    });
  };

  const handleSendCampaign = () => {
    if (!campaignForm.name || !campaignForm.content) return;
    startTransition(async () => {
      // Calculate recipient count
      let count = 0;
      if (campaignForm.targetListId) {
        const list = lists.find(l => l.id === campaignForm.targetListId);
        count = list?._count?.customers || 0;
      } else if (campaignForm.targetTags.length > 0) {
        count = customers.filter(c => c.tags?.some((t: string) => campaignForm.targetTags.includes(t))).length;
      } else {
        count = customers.length;
      }

      const newCampaign = await createVendorCampaignAction({
        ...campaignForm,
        recipientCount: count
      } as any);
      
      setCampaigns(prev => [newCampaign, ...prev]);
      setCampaignForm({ name: '', type: 'EMAIL', content: '', targetTags: [], targetListId: '' });
      alert('Campagne envoyée avec succès !');
    });
  };

  const handleCreateList = () => {
    if (!newListName || selectedCustomerIds.length === 0) return;
    startTransition(async () => {
      const newList = await createVendorClientListAction(newListName, selectedCustomerIds);
      setLists(prev => [newList, ...prev]);
      setNewListName('');
      setSelectedCustomerIds([]);
      setIsListModalOpen(false);
      alert('Liste de clients créée !');
    });
  };

  const handleSearchStores = async (val: string) => {
    setStoreSearch(val);
    if (val.length < 2) {
      setAvailableStores([]);
      return;
    }
    setIsSearchingStores(true);
    try {
      const stores = await getAvailableStoresAction(val);
      setAvailableStores(stores);
    } finally {
      setIsSearchingStores(false);
    }
  };

  const handleAddCustomer = async (storeId: string) => {
    startTransition(async () => {
      const newCustomer = await addVendorCustomerAction(storeId);
      setCustomers(prev => [newCustomer, ...prev]);
      setIsAddModalOpen(false);
      setStoreSearch('');
      setAvailableStores([]);
    });
  };

  const handleAddManualCustomer = async () => {
    if (!manualForm.name) return;
    startTransition(async () => {
      const tags = manualForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      const newCustomer = await createManualVendorCustomerAction({
        ...manualForm,
        tags
      });
      setCustomers(prev => [newCustomer, ...prev]);
      setIsManualModalOpen(false);
      setManualForm({ name: '', email: '', phone: '', category: 'REGULAR', tags: '' });
    });
  };

  const handleImportCSV = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const data = lines.slice(1).map(line => {
        const [name, email, phone, category, tags] = line.split(',');
        if (!name) return null;
        return {
          name: name.trim(),
          email: email?.trim(),
          phone: phone?.trim(),
          category: category?.trim() || 'REGULAR',
          tags: tags?.split(';').map(t => t.trim()).filter(Boolean) || []
        };
      }).filter(Boolean);

      startTransition(async () => {
        const imported = await importVendorCustomersCSVAction(data);
        setCustomers(prev => [...imported, ...prev]);
        setIsImportModalOpen(false);
        alert(`${imported.length} clients importés avec succès !`);
      });
    };
    reader.readAsText(file);
  };

  const filteredCustomers = customers.filter(c => 
    (c.store?.name || c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
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
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mb-12">
          <button 
            onClick={() => setActiveTab('customers')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'customers' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Base Clients
          </button>
          <button 
            onClick={() => setActiveTab('lists')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'lists' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mes Listes
          </button>
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'campaigns' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Campagnes
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'templates' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Modèles
          </button>
        </div>

      {activeTab === 'customers' && (
        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="font-black text-2xl text-slate-900">Mes Partenaires B2B</h3>
              <p className="text-slate-400 font-bold text-sm">Liste des coffeeshops ayant commandé via la marketplace</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedCustomerIds.length > 0 && (
                <button 
                  onClick={() => setIsListModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                >
                  <ListPlus size={18} /> Créer Liste ({selectedCustomerIds.length})
                </button>
              )}
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition-all"
              >
                <Upload size={18} /> Importer CSV
              </button>
              <button 
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition-all"
              >
                <Plus size={18} /> Nouveau Client
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
              >
                <Search size={18} /> Réseau Coffeeshop
              </button>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl w-56 focus:ring-2 focus:ring-rose-500/20 font-bold text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-left">
                    <input 
                      type="checkbox" 
                      onChange={e => {
                        if (e.target.checked) setSelectedCustomerIds(filteredCustomers.map(c => c.id));
                        else setSelectedCustomerIds([]);
                      }}
                      checked={selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Segment</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commandes</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total HT</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                       <Users size={48} className="mx-auto text-slate-200 mb-4" />
                       <p className="text-slate-400 font-bold text-lg">Aucun client trouvé</p>
                    </td>
                  </tr>
                ) : filteredCustomers.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <input 
                        type="checkbox" 
                        checked={selectedCustomerIds.includes(c.id)}
                        onChange={() => {
                          setSelectedCustomerIds(prev => 
                            prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-lg">
                          {(c.store?.name || c.name || '?').charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 leading-tight">{c.store?.name || c.name}</h4>
                          <p className="text-xs font-bold text-slate-400">{c.store?.city || c.email || c.phone || 'Partenaire externe'}</p>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Utiliser un modèle</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {templates.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setCampaignForm(f => ({ ...f, content: t.content }))}
                      className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cibler par Liste Enregistrée</label>
                <select 
                  value={campaignForm.targetListId}
                  onChange={e => setCampaignForm(f => ({ ...f, targetListId: e.target.value, targetTags: [] }))}
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 appearance-none"
                >
                  <option value="">-- Aucune liste (utiliser les tags) --</option>
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l._count?.customers || 0} clients)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cibler par Tags</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {(() => {
                    const selectedList = lists.find(l => l.id === campaignForm.targetListId);
                    const availableTags = selectedList 
                      ? Array.from(new Set(selectedList.customers.flatMap((c: any) => c.tags || [])))
                      : Array.from(new Set(customers.flatMap(c => c.tags || [])));

                    return availableTags.map((tag: any) => (
                      <button 
                        key={tag}
                        onClick={() => {
                          const tags = campaignForm.targetTags.includes(tag)
                            ? campaignForm.targetTags.filter(t => t !== tag)
                            : [...campaignForm.targetTags, tag];
                          setCampaignForm(f => ({ ...f, targetTags: tags }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black border-2 transition-all ${campaignForm.targetTags.includes(tag) ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 bg-white text-slate-400'}`}
                      >
                        {tag}
                      </button>
                    ));
                  })()}
                  {campaignForm.targetTags.length === 0 && <span className="text-[10px] text-slate-400 italic font-bold">Tous les clients (aucun tag sélectionné)</span>}
                </div>
              </div>

              <div className="space-y-2 quill-container">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                <ReactQuill 
                  theme="snow"
                  modules={quillModules}
                  value={campaignForm.content}
                  onChange={val => setCampaignForm(f => ({ ...f, content: val }))}
                  style={{ height: '200px', marginBottom: '50px' }}
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
              <h3 className="font-black text-2xl text-slate-900">Taguer {selectedCust.store?.name || selectedCust.name}</h3>
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
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Ex: Boulangerie, Sousse, GrosVolume"
                    className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-900"
                  />
                  <button 
                    onClick={() => {
                      const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
                      handleUpdateCustomer(selectedCust.id, { tags });
                    }}
                    className="px-6 bg-rose-600 text-white rounded-2xl font-black text-xs hover:bg-rose-700 transition-all"
                  >
                    OK
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">Appuyez sur OK pour sauvegarder les tags.</p>
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

      {/* Manual Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-2xl text-slate-900">Nouvelle Fiche Client</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="text-slate-400 font-bold text-sm mb-8">Créez manuellement un client hors réseau marketplace.</p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom / Enseigne</label>
                <input 
                  type="text" 
                  value={manualForm.name}
                  onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Pâtisserie Moderne"
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    value={manualForm.email}
                    onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="contact@client.tn"
                    className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                  <input 
                    type="text" 
                    value={manualForm.phone}
                    onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="55 123 456"
                    className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags (séparés par virgule)</label>
                <input 
                  type="text" 
                  value={manualForm.tags}
                  onChange={e => setManualForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Ex: Fidèle, Ramadan, Sousse"
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-900"
                />
              </div>

              <button 
                onClick={handleAddManualCustomer}
                disabled={isPending || !manualForm.name}
                className="w-full py-5 bg-rose-600 text-white rounded-[20px] font-black text-lg shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all mt-4 flex items-center justify-center gap-2"
              >
                {isPending ? 'Création...' : <><Save size={20} /> Créer le client</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-2xl text-slate-900">Importer via CSV</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="text-slate-400 font-bold text-sm mb-8">Importez massivement vos clients B2B depuis un fichier Excel/CSV.</p>

            <div className="space-y-6">
              <div className="p-8 border-4 border-dashed border-slate-100 rounded-[32px] text-center bg-slate-50/50">
                <Upload size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold mb-4">Glissez votre fichier ici ou cliquez pour parcourir</p>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={e => e.target.files?.[0] && handleImportCSV(e.target.files[0])}
                  className="hidden" 
                  id="csv-upload" 
                />
                <label 
                  htmlFor="csv-upload"
                  className="inline-block px-8 py-3 bg-white border border-slate-200 rounded-xl font-black text-sm text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Choisir un fichier
                </label>
              </div>

              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <h4 className="text-amber-800 font-black text-xs uppercase mb-2 flex items-center gap-2"><Info size={14}/> Format Requis</h4>
                <p className="text-amber-700 text-[10px] leading-relaxed font-bold">
                  Le fichier doit être au format CSV (séparateur virgule) avec les colonnes suivantes : <br/>
                  <code className="bg-white px-1 rounded">nom, email, telephone, categorie, tags</code><br/>
                  Les tags doivent être séparés par des points-virgules (;) dans la colonne tags.
                </p>
                <button className="mt-4 flex items-center gap-2 text-amber-800 text-[10px] font-black hover:underline">
                  <Download size={14} /> Télécharger le modèle CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'lists' && (
        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="font-black text-xl text-slate-900">Mes Listes de Clients</h2>
              <p className="text-slate-400 font-bold text-sm">Listes enregistrées pour vos campagnes ciblées.</p>
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.length === 0 ? (
              <div className="col-span-full py-24 text-center">
                 <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                 <p className="text-slate-400 font-bold text-lg">Aucune liste enregistrée</p>
                 <p className="text-slate-400 text-sm">Sélectionnez des clients dans votre base pour créer une liste.</p>
              </div>
            ) : lists.map((list: any) => (
              <div key={list.id} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-rose-200 hover:bg-rose-50/20 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <span className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 shadow-sm">
                    {list._count?.customers || 0} CLIENTS
                  </span>
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-2">{list.name}</h3>
                <p className="text-slate-400 font-bold text-xs mb-8 italic">Créée le {new Date(list.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setCampaignForm(f => ({ ...f, targetListId: list.id }));
                      setActiveTab('campaigns');
                    }}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-rose-600 transition-all"
                  >
                    Lancer Campagne
                  </button>
                  <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save List Modal */}
      {isListModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-2xl text-slate-900">Enregistrer la liste</h3>
              <button onClick={() => setIsListModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="text-slate-400 font-bold text-sm mb-8">Donnez un nom à cette sélection de {selectedCustomerIds.length} clients.</p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de la liste</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Ex: Clients Fidèles Sousse"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900"
                />
              </div>

              <button 
                onClick={handleCreateList}
                disabled={isPending || !newListName}
                className="w-full py-5 bg-emerald-600 text-white rounded-[20px] font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all mt-4 flex items-center justify-center gap-2"
              >
                {isPending ? 'Enregistrement...' : <><Save size={20} /> Enregistrer la liste</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="font-black text-xl text-slate-900">Modèles de Marketing</h2>
              <p className="text-slate-400 font-bold text-sm">Préparez vos messages types pour gagner du temps.</p>
            </div>
            <button 
              onClick={() => {
                setTemplateForm({ id: '', name: '', type: 'EMAIL', content: '' });
                setIsTemplateModalOpen(true);
              }}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-rose-600 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Créer un modèle
            </button>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {templates.length === 0 ? (
              <div className="col-span-full py-24 text-center">
                 <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                 <p className="text-slate-400 font-bold text-lg">Aucun modèle enregistré</p>
              </div>
            ) : templates.map((template: any) => (
              <div key={template.id} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-rose-200 hover:bg-rose-50/20 transition-all group relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
                    {template.type === 'EMAIL' ? <Mail size={24} /> : <MessageCircle size={24} />}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setTemplateForm(template);
                        setIsTemplateModalOpen(true);
                      }}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-2">{template.name}</h3>
                <div className="text-slate-400 text-sm line-clamp-3 mb-8" dangerouslySetInnerHTML={{ __html: template.content }} />
                <button 
                  onClick={() => {
                    setCampaignForm(f => ({ ...f, content: template.content, name: template.name }));
                    setActiveTab('campaigns');
                  }}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs hover:bg-rose-600 transition-all"
                >
                  Utiliser ce modèle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 mb-4">
                <Mail size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Messages Envoyés</p>
              <p className="text-3xl font-black text-slate-900">{campaigns.reduce((acc, c) => acc + (c.recipientCount || 0), 0)}</p>
            </div>
            
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow border-b-4 border-b-emerald-500">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                <Users size={20} />
              </div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Taux d'Ouverture</p>
              <p className="text-3xl font-black text-slate-900">
                {campaigns.length > 0 ? ((campaigns.reduce((acc, c) => acc + (c.openCount || 0), 0) / campaigns.reduce((acc, c) => acc + (c.recipientCount || 1), 0)) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow border-b-4 border-b-blue-500">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <TrendingUp size={20} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Taux de Clic</p>
              <p className="text-3xl font-black text-slate-900">
                {campaigns.length > 0 ? ((campaigns.reduce((acc, c) => acc + (c.clickCount || 0), 0) / campaigns.reduce((acc, c) => acc + (c.recipientCount || 1), 0)) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-900/20">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-rose-500 mb-4">
                <Zap size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversion B2B</p>
              <p className="text-3xl font-black text-white">4.2%</p>
              <p className="text-[10px] font-bold text-rose-400 mt-2">+1.2% ce mois</p>
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="font-black text-xl text-slate-900">Historique des Campagnes</h2>
                <p className="text-slate-400 font-bold text-sm">Suivez la performance de vos envois.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Campagne</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cible</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ouvertures</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-blue-600 uppercase tracking-widest">Clics</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                    <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map((campaign: any) => (
                    <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${campaign.type === 'EMAIL' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {campaign.type === 'EMAIL' ? <Mail size={18} /> : <MessageCircle size={18} />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{campaign.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{campaign.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-1">
                          {campaign.targetListId ? (
                            <span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-black text-slate-600">LISTE: {lists.find(l => l.id === campaign.targetListId)?.name}</span>
                          ) : campaign.targetTags.length > 0 ? (
                            campaign.targetTags.map((tag: string) => (
                              <span key={tag} className="bg-rose-50 px-2 py-1 rounded-md text-[10px] font-black text-rose-600 uppercase">{tag}</span>
                            ))
                          ) : (
                            <span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-black text-slate-400 uppercase tracking-widest">TOUTE LA BASE</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center font-black text-slate-900">{campaign.recipientCount || 0}</td>
                      <td className="px-6 py-6 text-center">
                        <span className="font-black text-emerald-600">{campaign.openCount || 0}</span>
                        <p className="text-[10px] font-bold text-slate-400">{campaign.recipientCount > 0 ? ((campaign.openCount / campaign.recipientCount) * 100).toFixed(0) : 0}%</p>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="font-black text-blue-600">{campaign.clickCount || 0}</span>
                        <p className="text-[10px] font-bold text-slate-400">{campaign.recipientCount > 0 ? ((campaign.clickCount / campaign.recipientCount) * 100).toFixed(0) : 0}%</p>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${campaign.status === 'SENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right text-sm font-bold text-slate-400 italic">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-2xl text-slate-900">{templateForm.id ? 'Modifier' : 'Créer'} un modèle</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="text-slate-400 font-bold text-sm mb-8">Utilisez des variables comme {"{{name}}"} pour personnaliser.</p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du modèle</label>
                  <input 
                    type="text" 
                    value={templateForm.name}
                    onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Offre Bienvenue"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de canal</label>
                  <select 
                    value={templateForm.type}
                    onChange={e => setTemplateForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 transition-all"
                  >
                    <option value="EMAIL">Email Professionnel</option>
                    <option value="WHATSAPP">WhatsApp B2B</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contenu du message</label>
                <div className="quill-container">
                  <ReactQuill 
                    theme="snow"
                    value={templateForm.content}
                    onChange={val => setTemplateForm(f => ({ ...f, content: val }))}
                    placeholder="Votre message ici..."
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['{{name}}', '{{storeName}}', '{{city}}', '{{category}}', '{{totalSpent}}'].map(v => (
                    <span key={v} className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded cursor-pointer hover:bg-rose-100 hover:text-rose-600 transition-colors">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[20px] font-black text-lg hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveTemplate}
                  disabled={isPending || !templateForm.name || !templateForm.content}
                  className="flex-[2] py-5 bg-rose-600 text-white rounded-[20px] font-black text-lg shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                >
                  {isPending ? 'Enregistrement...' : <><Save size={20} /> Enregistrer le modèle</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .quill-container .ql-toolbar {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          border-color: #E2E8F0;
          background: #F8FAFC;
          border-bottom: none;
        }
        .quill-container .ql-toolbar + .ql-toolbar {
          display: none !important;
        }
        .quill-container .ql-container {
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          border-color: #E2E8F0;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          background: #fff;
        }
        .quill-container .ql-editor {
          min-height: 150px;
        }
      `}</style>
    </div>
  );
}
