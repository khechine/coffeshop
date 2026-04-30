'use client';

import React, { useState, useTransition } from 'react';
import { Tag, Plus, Trash2, CheckCircle, XCircle, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { 
  createMarketplaceCategoryAction, 
  deleteMarketplaceCategoryAction,
  resolveCategoryProposal,
  refuseAndMergeSubcategoryAction
} from '../../../actions';

export default function MktCategoriesClient({ categories, pendingSubcategories }: any) {
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [mergeModal, setMergeModal] = useState<{ subId: string; name: string } | null>(null);
  const [targetSubId, setTargetSubId] = useState('');

  // Form states
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await resolveCategoryProposal(id, 'approve');
      window.location.reload();
    });
  };

  const handleMerge = () => {
    if (!mergeModal || !targetSubId) return;
    startTransition(async () => {
      await refuseAndMergeSubcategoryAction(mergeModal.subId, targetSubId);
      setMergeModal(null);
      window.location.reload();
    });
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Taxonomie Marketplace</h1>
          <p className="text-slate-500 font-medium mt-1">Gérez les catégories globales et validez les propositions des vendeurs.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
        >
          <Plus size={18} /> Nouvelle Catégorie
        </button>
      </div>

      {/* PENDING PROPOSALS */}
      {pendingSubcategories.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[32px] p-8">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                 <Tag size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-amber-900">Propositions en attente</h2>
                 <p className="text-amber-700 text-sm font-bold">{pendingSubcategories.length} nouvelles sous-catégories proposées par les vendeurs</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSubcategories.map((sub: any) => (
                <div key={sub.id} className="bg-white p-5 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm">
                   <div>
                      <div className="text-xs font-black text-amber-500 uppercase mb-1">{sub.category?.name}</div>
                      <div className="font-bold text-slate-900 text-lg">{sub.name}</div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(sub.id)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                        title="Approuver (Devient global)"
                      >
                         <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => setMergeModal({ subId: sub.id, name: sub.name })}
                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        title="Refuser et Fusionner"
                      >
                         <XCircle size={20} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* MASTER TAXONOMY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {categories.map((cat: any) => (
           <div key={cat.id} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || '📦'}</span>
                    <h3 className="font-black text-slate-900">{cat.name}</h3>
                 </div>
                 <button onClick={() => deleteMarketplaceCategoryAction(cat.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                 </button>
              </div>
              <div className="p-6 space-y-3">
                 {cat.subcategories.map((sub: any) => (
                   <div key={sub.id} className="flex items-center justify-between text-sm font-bold text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                         <ChevronRight size={14} className="text-slate-400" />
                         {sub.name}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {sub.status}
                      </span>
                   </div>
                 ))}
                 <button className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-xs font-black text-slate-400 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> Ajouter une sous-catégorie
                 </button>
              </div>
           </div>
         ))}
      </div>

      {/* MERGE MODAL */}
      {mergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={40} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900">Refuser et Fusionner</h2>
                 <p className="text-slate-500 font-medium mt-2">
                    La proposition <span className="text-rose-600 font-black">"{mergeModal.name}"</span> sera supprimée. 
                    Tous les produits associés seront transférés vers :
                 </p>
              </div>

              <div className="space-y-4 mb-8">
                 <label className="text-xs font-black uppercase text-slate-500 tracking-widest block pl-2">Choisir la sous-catégorie cible</label>
                 <select 
                   value={targetSubId}
                   onChange={e => setTargetSubId(e.target.value)}
                   className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                 >
                    <option value="">-- Sélectionner --</option>
                    {categories.map((cat: any) => (
                      <optgroup key={cat.id} label={cat.name}>
                        {cat.subcategories.filter((s: any) => s.id !== mergeModal.subId).map((sub: any) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                 </select>
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={() => setMergeModal(null)}
                  className="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-colors"
                 >
                    Annuler
                 </button>
                 <button 
                  onClick={handleMerge}
                  disabled={!targetSubId || isPending}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                 >
                    Confirmer la Fusion <ArrowRight size={18} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
