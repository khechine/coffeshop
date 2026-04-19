'use client';

import React, { useTransition, useState } from 'react';
import { Tag, Plus, Trash2, X, PlusCircle, Coffee, Star, Heart, Smile, Zap, Home, Box, ShoppingBag, ChevronRight, ChevronDown, Edit2 } from 'lucide-react';
import { createProductCategoryAction, deleteProductCategoryAction, updateProductCategoryAction } from '../../../actions';

const ICONS: Record<string, React.FC<any>> = {
  Tag, Coffee, Star, Heart, Smile, Zap, Home, Box, ShoppingBag
};

const COLORS = ['#6366F1', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#3B82F6', '#64748B'];

export default function CategoryListClient({ initialCategories }: { initialCategories: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [parentId, setParentId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const toggleParent = (id: string) => {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      try {
        if (editingId) {
          await updateProductCategoryAction(editingId, {
            name: newName.trim(),
            color: selectedColor,
            icon: selectedIcon,
            parentId: parentId || undefined
          });
        } else {
          await createProductCategoryAction({
            name: newName.trim(),
            color: selectedColor,
            icon: selectedIcon,
            parentId: parentId || undefined
          });
        }
        cancelEdit();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setSelectedColor(cat.color || COLORS[0]);
    setSelectedIcon(cat.icon || 'Tag');
    setParentId(cat.parentId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon('Tag');
    setParentId('');
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

  const parents = initialCategories.filter(c => !c.parentId);
  const getChildren = (pid: string) => initialCategories.filter(c => c.parentId === pid);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Create Section */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm border-2 border-indigo-100 bg-indigo-50/10">
        <form onSubmit={handleCreate} className="flex flex-col gap-6">
          <div className="flex gap-4 items-center">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl" style={{ backgroundColor: selectedColor + '20', color: selectedColor }}>
              {React.createElement(ICONS[selectedIcon] || Tag, { size: 24 })}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                {editingId ? "Édition de Catégorie" : "Nouvelle Catégorie"}
              </label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Spécialités du mois..."
                className="w-full bg-transparent border-none rounded-xl py-2 font-bold text-lg focus:ring-0 placeholder:text-slate-300"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Catégorie Parente (Optionnel)</label>
              <select 
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 font-bold text-sm focus:ring-indigo-500"
              >
                <option value="">Aucune (Catégorie Parente)</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  disabled={isPending}
                  className="px-6 py-4 bg-slate-100 text-slate-500 font-black text-sm rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
              )}
              <button 
                type="submit" 
                disabled={isPending || !newName.trim()}
                className="px-8 py-4 text-white font-black text-sm rounded-2xl shadow-xl disabled:opacity-50 transition-all hover:scale-105"
                style={{ backgroundColor: selectedColor, boxShadow: `0 10px 20px -10px ${selectedColor}` }}
              >
                {editingId ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </div>
          
          <div className="flex gap-8 items-start border-t border-slate-200/60 pt-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Couleur</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button 
                    key={c} 
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === c ? 'scale-125 border-slate-900' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Icône</label>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(ICONS).map(iconName => {
                  const IconCmp = ICONS[iconName];
                  return (
                    <button 
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-2 rounded-xl transition-colors ${selectedIcon === iconName ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <IconCmp size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        {parents.map(parent => {
          const children = getChildren(parent.id);
          const isExpanded = expandedParents[parent.id];
          const ParentIcon = ICONS[parent.icon || 'Tag'] || Tag;
          
          return (
            <div key={parent.id} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm transition-all">
              <div className="p-4 flex items-center justify-between group hover:bg-slate-50">
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleParent(parent.id)}>
                  <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    {children.length > 0 ? (isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />) : <div className="w-5" />}
                  </button>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: (parent.color || '#6366F1') + '20', color: parent.color || '#6366F1' }}>
                    <ParentIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{parent.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{parent._count?.products || 0} Produits • {children.length} Sous-catégories</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => startEdit(parent)}
                    disabled={isPending}
                    className="p-3 text-slate-300 hover:text-indigo-500 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(parent.id, (parent._count?.products || 0) + children.reduce((acc, c) => acc + (c._count?.products || 0), 0))}
                    disabled={isPending}
                    className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {isExpanded && children.length > 0 && (
                <div className="bg-slate-50/50 p-4 pl-20 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {children.map(child => {
                    const ChildIcon = ICONS[child.icon || 'Tag'] || Tag;
                    return (
                      <div key={child.id} className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: (child.color || '#6366F1') + '15', color: child.color || '#6366F1' }}>
                            <ChildIcon size={16} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-700 uppercase tracking-tight text-xs">{child.name}</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{child._count?.products || 0} Produits</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => startEdit(child)}
                            disabled={isPending}
                            className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(child.id, child._count?.products || 0)}
                            disabled={isPending}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {initialCategories.length === 0 && (
          <div className="py-20 text-center text-slate-300 font-black text-xs uppercase tracking-widest italic border-2 border-dashed border-slate-100 rounded-[32px]">
            Aucune catégorie créée pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
