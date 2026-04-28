'use client';

import React, { useState, useTransition } from 'react';
import { PlusCircle, Edit2, Trash2, Save, ToggleLeft, ToggleRight, X, Crown, Check, ShoppingCart, Store, Package, CreditCard, ChevronRight } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createPlanAction, updatePlanAction, deletePlanAction, togglePlanStatusAction } from '../../actions';
import { getPlanFeatures } from '../../../lib/planFeatures';

export default function PlansClient({ initialPlans = [] }: { initialPlans: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, maxStores: 1, maxProducts: 50, hasMarketplace: true });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', price: 0, maxStores: 1, maxProducts: 50, hasMarketplace: true });
    setModalOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    setForm({ 
      name: plan.name, 
      price: Number(plan.price), 
      maxStores: plan.maxStores, 
      maxProducts: plan.maxProducts,
      hasMarketplace: plan.hasMarketplace ?? true
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    startTransition(async () => {
      try {
        if (editing) {
          await updatePlanAction(editing.id, form);
          setSuccessMsg('Plan mis à jour avec succès !');
        } else {
          await createPlanAction(form);
          setSuccessMsg('Plan créé avec succès !');
        }
        setTimeout(() => {
          setModalOpen(false);
          setSuccessMsg('');
        }, 1500);
      } catch (err: any) {
        alert("Erreur: " + err.message);
      }
    });
  };

  const toggleStatus = (id: string) => {
    startTransition(async () => {
      await togglePlanStatusAction(id);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deletePlanAction(id);
        setDeleteTarget(null);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const COLOR_SEQUENCES = ['bg-emerald-500', 'bg-indigo-600', 'bg-violet-600', 'bg-amber-500', 'bg-rose-500'];
  const TEXT_SEQUENCES = ['text-emerald-500', 'text-indigo-600', 'text-violet-600', 'text-amber-500', 'text-rose-500'];

  return (
    <div className="flex flex-col gap-10">
      
      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[32px] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Plans & Tarification</h1>
          <p className="mt-2 text-slate-500 font-medium tracking-tight">Définissez les offres SaaS et les limites opérationnelles pour les marchands.</p>
        </div>
        <button 
          onClick={openCreate}
          className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2"
        >
          <PlusCircle size={20} /> Créer un Forfait
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {initialPlans.map((plan, idx) => {
          const colorClass = COLOR_SEQUENCES[idx % COLOR_SEQUENCES.length];
          const textClass = TEXT_SEQUENCES[idx % TEXT_SEQUENCES.length];
          const isInactive = plan.status === 'INACTIVE';
          const planDef = getPlanFeatures(plan.name);
          
          return (
            <div key={plan.id} className={`group bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${isInactive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              
              <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{plan.name}</h2>
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isInactive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isInactive ? <X size={10} strokeWidth={4} /> : <Check size={10} strokeWidth={4} />}
                        {isInactive ? 'Brouillon' : 'Actif'}
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleStatus(plan.id)} className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors ${isInactive ? 'bg-slate-50 text-slate-400 hover:text-emerald-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                    {isInactive ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
                  </button>
                  <button onClick={() => openEdit(plan)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget(plan)} className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={`text-5xl font-black ${textClass} mb-8 tracking-tighter flex items-baseline gap-1`}>
                {Number(plan.price)}<span className="text-lg font-black text-slate-400 tracking-normal">DT<span className="text-[10px] uppercase ml-1">/mois</span></span>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  { label: 'Points de Vente', value: plan.maxStores, icon: Store },
                  { label: 'Produits Max.', value: plan.maxProducts, icon: Package },
                  { label: 'Marketplace', value: plan.hasMarketplace ? 'Inclus' : 'Non', icon: ShoppingCart },
                ].map(feat => (
                  <div key={feat.label} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-500/20">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${colorClass} bg-opacity-10 flex items-center justify-center ${textClass}`}>
                         <feat.icon size={14} />
                      </div>
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{feat.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{feat.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-900 rounded-[32px] mb-6 shadow-xl shadow-slate-900/20">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Crown size={12} className="text-amber-500" /> Services inclus
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {planDef.features.map(f => (
                    <div key={f.label} className={`flex items-center gap-2.5 text-[11px] font-bold ${f.included ? 'text-white' : 'text-slate-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${f.included ? colorClass : 'bg-slate-700'}`} />
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Abonnés Actifs</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{plan.activeCount ?? 0}</span>
                 </div>
                 <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                 <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MRR Estimé</span>
                    <span className={`text-lg font-black ${textClass}`}>{(Number(plan.price) * (plan.activeCount ?? 0)).toFixed(0)} DT</span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le Forfait' : 'Nouveau Forfait'}>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nom du forfait</label>
            <input 
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              placeholder="ex: Essentiel, Pro, Enterprise" 
              className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
              required 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Prix Mensuel (DT)</label>
            <div className="relative">
              <input 
                type="number" 
                value={form.price} 
                onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} 
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                required 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">DT / MOIS</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nb. POS Max</label>
              <input 
                type="number" 
                value={form.maxStores} 
                onChange={e => setForm(f => ({ ...f, maxStores: parseInt(e.target.value) }))} 
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nb. Produits Max</label>
              <input 
                type="number" 
                value={form.maxProducts} 
                onChange={e => setForm(f => ({ ...f, maxProducts: parseInt(e.target.value) }))} 
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                required 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <input 
              type="checkbox" 
              id="hasMarketplace" 
              checked={form.hasMarketplace} 
              onChange={e => setForm(f => ({ ...f, hasMarketplace: e.target.checked }))} 
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
            />
            <label htmlFor="hasMarketplace" className="text-sm font-black text-slate-900 dark:text-white cursor-pointer">Inclure l'accès au Marketplace B2B</label>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black text-sm" onClick={() => setModalOpen(false)}>Annuler</button>
            <button 
              type="submit" 
              className={`flex-[2] py-4 rounded-2xl text-white font-black text-sm transition-all shadow-xl ${successMsg ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-500'}`}
              disabled={isPending || !!successMsg}
            >
              {isPending ? 'Enregistrement...' : successMsg ? 'Configuration OK ✓' : <span className="flex items-center justify-center gap-2"><Save size={18} /> {editing ? 'Mettre à jour' : 'Créer le Forfait'}</span>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le Forfait" width={400}>
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto">
             <Trash2 size={40} />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Êtes-vous sûr de vouloir supprimer définitivement le forfait <strong className="text-slate-900 dark:text-white">{deleteTarget?.name}</strong> ?</p>
          <div className="flex gap-4">
            <button className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-black text-sm" onClick={() => setDeleteTarget(null)}>Annuler</button>
            <button className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black text-sm hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/30" onClick={() => handleDelete(deleteTarget.id)} disabled={isPending}>
                Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
