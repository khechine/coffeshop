'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Package, Search, Image as ImageIcon, CheckCircle, Zap, Calendar, Clock, FileSpreadsheet, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../../../../components/Modal';
import { createMarketplaceProductAction, updateMarketplaceProductAction, deleteMarketplaceProductAction } from '../../../actions';

export default function VendorCatalogClient({ initialProducts, categories, globalUnits }: { initialProducts: any[]; categories: any[]; globalUnits: any[] }) {
   const [modalOpen, setModalOpen] = useState(false);
   const [importModalOpen, setImportModalOpen] = useState(false);
   const [toast, setToast] = useState<{ show: boolean, message: string } | null>(null);
   const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

   const showToast = (message: string) => {
     setToast({ show: true, message });
     setTimeout(() => setToast(null), 3000);
   };
  const [form, setForm] = useState<any>({
    name: '',
    price: '',
    unit: 'kg',
    categoryId: '',
    image: '',
    isFeatured: false,
    isFlashSale: false,
    discount: '',
    flashStart: '',
    flashEnd: '',
    minOrderQuantity: '1'
  });

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: p.price.toString(),
      unit: p.unit,
      categoryId: p.categoryId,
      image: p.image || '',
      isFeatured: p.isFeatured,
      isFlashSale: p.isFlashSale,
      discount: p.discount ? p.discount.toString() : '',
      flashStart: p.flashStart ? new Date(p.flashStart).toISOString().slice(0, 16) : '',
      flashEnd: p.flashEnd ? new Date(p.flashEnd).toISOString().slice(0, 16) : '',
      minOrderQuantity: p.minOrderQuantity ? p.minOrderQuantity.toString() : '1'
    });
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setForm({ name: '', price: '', unit: 'kg', categoryId: '', image: '', isFeatured: false, isFlashSale: false, discount: '', flashStart: '', flashEnd: '', minOrderQuantity: '1' });
    setModalOpen(true);
  };

  const handleImport = () => {
    showToast('Importation lancée avec succès !');
    setImportModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        minOrderQuantity: parseFloat(form.minOrderQuantity),
        discount: form.isFlashSale ? parseFloat(form.discount) : null,
        flashStart: form.isFlashSale && form.flashStart ? new Date(form.flashStart).toISOString() : null,
        flashEnd: form.isFlashSale && form.flashEnd ? new Date(form.flashEnd).toISOString() : null
      };

      if (editingId) {
        await updateMarketplaceProductAction(editingId, payload);
      } else {
        await createMarketplaceProductAction(payload);
      }
      setModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      startTransition(async () => {
        await deleteMarketplaceProductAction(id);
      });
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600";
  const labelClass = "block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider";

  return (
    <div className="flex flex-col gap-8">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-800/50 gap-6 shadow-sm dark:shadow-none">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher mes produits..." 
            className={`${inputClass} pl-12 h-12`} 
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-all shadow-sm dark:shadow-none" 
            onClick={() => setImportModalOpen(true)}
          >
            <FileSpreadsheet size={18} /> Importer
          </button>
          <button 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20" 
            onClick={handleCreateNew}
          >
            <Plus size={18} /> Nouveau produit
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {initialProducts.map(p => (
          <div 
            key={p.id} 
            className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-200 dark:border-slate-800/50 overflow-hidden flex flex-col transition-all duration-300 hover:border-indigo-500/30 hover:-translate-y-1 group shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-indigo-500/5"
          >
            <div className="h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
              <img 
                src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} 
                className="w-full h-full object-cover opacity-90 dark:opacity-60 group-hover:opacity-100 dark:group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" 
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                {p.isFeatured && (
                  <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 border border-amber-400/20">
                    🔥 Vedette
                  </div>
                )}
                {p.isFlashSale && (
                  <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 border border-rose-400/20">
                    ⚡ -{p.discount}%
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 flex flex-1 flex-col">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-2">
                {categories.find(c => c.id === p.categoryId)?.name || 'Sans catégorie'}
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {p.name}
              </h4>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-end">
                <div>
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-slate-900 dark:text-white">{Number(p.price).toFixed(3)}</span>
                     <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">DT</span>
                   </div>
                   <div className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">par {p.unit}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(p)} 
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:border-indigo-500 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)} 
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {p.isFlashSale && p.flashEnd && (
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 px-3 py-1.5 rounded-lg">
                  <Clock size={12} /> Fin : {new Date(p.flashEnd).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Produit */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Modifier le Produit" : "Nouveau Produit Marketplace"} width={600}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass}>Nom du produit</label>
            <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ex: Café Grains Robusta" required />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Prix (DT)</label>
              <input className={inputClass} type="number" step="0.001" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
            </div>
            <div>
              <label className={labelClass}>Unité</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} required>
                <option value="" className="text-slate-900">Choisir...</option>
                {globalUnits.map(u => <option key={u.id} value={u.name} className="text-slate-900">{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Qte Min</label>
              <input className={inputClass} type="number" step="0.5" value={form.minOrderQuantity} onChange={e => setForm({...form, minOrderQuantity: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Catégorie</label>
            <select className={`${inputClass} appearance-none cursor-pointer`} value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} required>
              <option value="" className="text-slate-900">Sélectionner une catégorie...</option>
              {categories.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Image (URL)</label>
            <input className={inputClass} value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                checked={form.isFeatured} 
                onChange={e => setForm({...form, isFeatured: e.target.checked})} 
              />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">🔥 Produit Vedette</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 focus:ring-rose-500"
                checked={form.isFlashSale} 
                onChange={e => setForm({...form, isFlashSale: e.target.checked})} 
              />
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">⚡ Vente Flash</span>
            </label>
          </div>

          {form.isFlashSale && (
            <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
               <div>
                 <label className={labelClass + " !text-rose-600 dark:!text-rose-400"}>Remise (%)</label>
                 <input className={inputClass + " !border-rose-200 dark:!border-rose-500/20 focus:!border-rose-500"} type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} placeholder="ex: 15" required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={labelClass + " !text-rose-600 dark:!text-rose-400"}>Début</label>
                    <input className={inputClass + " !border-rose-200 dark:!border-rose-500/20 focus:!border-rose-500"} type="datetime-local" value={form.flashStart} onChange={e => setForm({...form, flashStart: e.target.value})} required />
                 </div>
                 <div>
                    <label className={labelClass + " !text-rose-600 dark:!text-rose-400"}>Fin</label>
                    <input className={inputClass + " !border-rose-200 dark:!border-rose-500/20 focus:!border-rose-500"} type="datetime-local" value={form.flashEnd} onChange={e => setForm({...form, flashEnd: e.target.value})} required />
                 </div>
               </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="flex-[2] px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50" disabled={isPending}>
              {isPending ? 'Action...' : (editingId ? 'Mettre à jour' : 'Publier le produit')}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Importer votre catalogue (CSV)" width={500}>
         <div className="space-y-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
               <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <FileSpreadsheet size={18} className="text-indigo-600 dark:text-indigo-400" /> Structure CSV
               </h3>
               <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Votre fichier doit contenir les colonnes suivantes : <br />
                  <code className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 px-1.5 py-0.5 rounded mt-2 inline-block font-mono">Nom, Prix, Unité, Catégorie, ImageURL</code>
               </p>
               <button 
                  onClick={() => {
                    const blob = new Blob(["Nom,Prix,Unite,Categorie,ImageURL\nCafe Grains,24.500,kg,Cafe,https://...\nLait Entier,1.450,Litre,Laitage,"], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'modele_catalogue_coffeeshop.csv';
                    a.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-black text-xs hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
               >
                  Télécharger le modèle CSV
               </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] p-12 text-center group hover:border-indigo-500/30 transition-colors cursor-pointer relative overflow-hidden">
               <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300 shadow-inner">
                  <Package size={32} />
               </div>
               <div className="text-sm font-black text-slate-900 dark:text-white mb-1">Cliquez pour uploader</div>
               <div className="text-xs text-slate-500 font-bold">ou glissez votre fichier ici</div>
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".csv" />
            </div>

            <div className="flex gap-3">
               <button onClick={() => setImportModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">Annuler</button>
               <button onClick={handleImport} className="flex-[2] px-4 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 transition-colors">Lancer l'importation</button>
            </div>
         </div>
      </Modal>

      {/* Floating Toast */}
      {toast?.show && (
        <div className="fixed bottom-10 right-10 bg-white dark:bg-slate-900 p-4 pr-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 z-[999]">
           <div className="bg-emerald-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={20} />
           </div>
           <div>
              <div className="font-black text-sm text-slate-900 dark:text-white">Succès !</div>
              <div className="text-xs text-slate-500 font-medium">{toast.message}</div>
           </div>
        </div>
      )}
    </div>
  );
}
