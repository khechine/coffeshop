'use client';

import React, { useTransition, useState } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Sparkles, Pencil, Trash2, Plus, 
  Save, X, FolderTree, Info, ChevronRight, ArrowRightCircle
} from 'lucide-react';
import { 
  resolveCategoryProposal, 
  updateMarketplaceCategoryAction, 
  deleteMarketplaceCategoryAction,
  createMarketplaceCategoryAction,
  migrateSubcategoryAction
} from '../../../actions';

type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  status: string;
  subcategories?: Category[];
  createdAt: Date;
};

type Proposal = {
  id: string;
  name: string;
  categoryId?: string | null;
  status: string;
};

export default function CategoryManagementClient({
  categoryTree,
  pendingProposals,
  userRole,
}: {
  categoryTree: Category[];
  pendingProposals: Proposal[];
  userRole: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  
  const [proposalNames, setProposalNames] = useState<Record<string, string>>(
    Object.fromEntries(pendingProposals.map(p => [p.id, p.name]))
  );
  const [proposalCategoryIds, setProposalCategoryIds] = useState<Record<string, string>>(
    Object.fromEntries(pendingProposals.map(p => [p.id, p.categoryId || '']))
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');

  const [migratingSubId, setMigratingSubId] = useState<string | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState('');

  const handleResolve = (id: string, action: 'approve' | 'reject') => {
    if (userRole !== 'SUPERADMIN') return;
    startTransition(async () => {
      try {
        await resolveCategoryProposal(id, action, proposalNames[id], proposalCategoryIds[id] || undefined);
        setResolved(prev => new Set(Array.from(prev).concat(id)));
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || '');
  };

  const handleUpdate = () => {
    if (!editingId) return;
    startTransition(async () => {
      try {
        await updateMarketplaceCategoryAction(editingId, {
          name: editName,
          icon: editIcon
        });
        setEditingId(null);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;
    startTransition(async () => {
      try {
        await deleteMarketplaceCategoryAction(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleCreate = () => {
    startTransition(async () => {
      try {
        await createMarketplaceCategoryAction({
          name: newName,
          icon: newIcon
        });
        setIsCreating(false);
        setNewName('');
        setNewIcon('📦');
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const startMigrating = (subId: string) => {
    setMigratingSubId(subId);
    setTargetCategoryId('');
  };

  const handleMigrate = () => {
    if (!migratingSubId || !targetCategoryId) return;
    startTransition(async () => {
      try {
        await migrateSubcategoryAction(migratingSubId, targetCategoryId);
        setMigratingSubId(null);
        setTargetCategoryId('');
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestion du Catalogue</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Maintenance de la structure du Marketplace</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> Nouvelle Catégorie
        </button>
      </div>

      {/* ── CREATION FORM (MODAL-LIKE) ── */}
      {isCreating && (
        <div className="bg-indigo-50 dark:bg-indigo-500/5 border-2 border-indigo-200 dark:border-indigo-500/20 rounded-[32px] p-8 animate-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400">Ajouter une nouvelle catégorie</h3>
            <button onClick={() => setIsCreating(false)} className="text-indigo-400 hover:text-indigo-600"><X /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Nom</label>
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Café en grains"
                className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-950 border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Icône (Emoji)</label>
              <input 
                type="text" 
                value={newIcon} 
                onChange={e => setNewIcon(e.target.value)}
                placeholder="📦"
                className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-950 border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => setIsCreating(false)} className="px-6 py-3 text-slate-400 font-black text-sm uppercase">Annuler</button>
            <button 
              onClick={handleCreate}
              className="px-8 py-3 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/20"
            >
              Créer la catégorie
            </button>
          </div>
        </div>
      )}

      {/* ── PENDING PROPOSALS ── */}
      {pendingProposals.filter(p => !resolved.has(p.id)).length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Propositions Vendeurs</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Modération requise</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {pendingProposals.filter(p => !resolved.has(p.id)).map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-500/20 rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <select 
                      value={proposalCategoryIds[p.id]}
                      onChange={e => setProposalCategoryIds({...proposalCategoryIds, [p.id]: e.target.value})}
                      className="bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-[10px] font-black uppercase text-slate-400 px-3 py-1 outline-none"
                    >
                      {categoryTree.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronRight size={14} className="text-slate-300" />
                    <input 
                      type="text"
                      value={proposalNames[p.id]}
                      onChange={e => setProposalNames({...proposalNames, [p.id]: e.target.value})}
                      className="font-black text-slate-900 dark:text-white border-b-2 border-amber-200 dark:border-amber-500/50 focus:border-amber-500 outline-none px-1"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Proposée par un vendeur · ID: {p.id.slice(-6)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleResolve(p.id, 'reject')} className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"><XCircle size={20} /></button>
                  <button onClick={() => handleResolve(p.id, 'approve')} className="px-6 py-3 bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20"><CheckCircle2 size={16} className="inline mr-2" /> Approuver</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CATEGORY TREE ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
            <FolderTree size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Arborescence Active</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Structure visible au catalogue</p>
          </div>
        </div>

        <div className="space-y-4">
          {categoryTree.map(root => (
            <div key={root.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm hover:border-indigo-500/30 transition-colors">
              {/* Root Row */}
              <div className="flex items-center gap-4 px-8 py-5 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                {editingId === root.id ? (
                  <div className="flex-1 flex gap-4 items-center">
                    <input value={editIcon} onChange={e => setEditIcon(e.target.value)} className="w-12 text-center bg-white dark:bg-slate-800 rounded-xl py-2" />
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl font-bold" />
                    <button onClick={handleUpdate} className="p-2 bg-emerald-600 text-white rounded-xl"><Save size={18} /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl"><X size={18} /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl drop-shadow-sm">{root.icon || '📦'}</span>
                    <div className="flex-1">
                      <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{root.name}</span>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(root.subcategories as any[])?.length || 0} sous-catégories</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(root)} className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(root.id)} className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </>
                )}
              </div>

              {/* Subcategories List */}
              <div className="px-8 bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800/50">
                {(root.subcategories as any[])?.map(child => (
                  <div key={child.id} className="flex items-center gap-4 py-4 group">
                    <ChevronRight size={14} className="text-slate-200 dark:text-slate-700 shrink-0" />
                    
                    {editingId === child.id ? (
                      <div className="flex-1 flex gap-4 items-center">
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-bold" />
                        <button onClick={handleUpdate} className="p-2 bg-indigo-600 text-white rounded-xl"><Save size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm font-black text-slate-600 dark:text-slate-400">{child.name}</span>
                          {child.status !== 'ACTIVE' && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">En attente</span>
                          )}
                        </div>
                        {migratingSubId === child.id ? (
                          <div className="flex items-center gap-2">
                            <select 
                              value={targetCategoryId}
                              onChange={e => setTargetCategoryId(e.target.value)}
                              className="text-xs bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1"
                            >
                              <option value="">Choisir...</option>
                              {categoryTree.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                              ))}
                            </select>
                            <button onClick={handleMigrate} className="p-1.5 bg-indigo-600 text-white rounded-lg"><ArrowRightCircle size={14} /></button>
                            <button onClick={() => setMigratingSubId(null)} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startMigrating(child.id)} title="Migrer vers une autre catégorie" className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ArrowRightCircle size={14} /></button>
                            <button onClick={() => startEditing(child)} title="Editer" className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(child.id)} title="Supprimer" className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {(!root.subcategories || (root.subcategories as any[]).length === 0) && !editingId && (
                  <div className="py-4 text-xs text-slate-300 italic flex items-center gap-2">
                    <Info size={12} /> Aucune sous-catégorie pour le moment
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}