'use client';

import React, { useTransition, useState } from 'react';
import { Tag, Plus, Trash2, X, PlusCircle } from 'lucide-react';
import { createProductCategoryAction, deleteProductCategoryAction } from '../../../../actions';

export default function CategoryListClient({ initialCategories }: { initialCategories: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      try {
        await createProductCategoryAction(newName.trim());
        setNewName('');
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleDelete = (id: string, productCount: number) => {
    if (productCount > 0) {
      alert(`Impossible de supprimer cette catégorie car elle contient ${productCount} produit(s). Réaffectez d'abord les produits à une autre catégorie.`);
      return;
    }
    if (!confirm("Voulez-vous supprimer cette catégorie ?")) return;
    startTransition(async () => {
      try {
        await deleteProductCategoryAction(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Create Section */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm border-2 border-indigo-100 bg-indigo-50/10">
        <form onSubmit={handleCreate} className="flex gap-4 items-center">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <PlusCircle size={24} />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Nouvelle Catégorie</label>
            <input 
              type="text" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Spécialités du mois..."
              className="w-full bg-white border-none rounded-xl py-2 font-bold text-lg focus:ring-0 placeholder:text-slate-200"
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending || !newName.trim()}
            className="px-8 py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all hover:scale-105"
          >
            Ajouter la catégorie
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialCategories.map(cat => (
          <div key={cat.id} className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{cat.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat._count.products} Produits</p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(cat.id, cat._count.products)}
              disabled={isPending}
              className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {initialCategories.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-300 font-black text-xs uppercase tracking-widest italic border-2 border-dashed border-slate-100 rounded-[32px]">
            Aucune catégorie créée pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
