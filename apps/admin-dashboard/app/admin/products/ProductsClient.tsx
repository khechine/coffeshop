'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Coffee, Package, Calculator, Archive, CheckCircle, Folder, Settings } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createProduct, updateProduct, deleteProduct, createCategory, deleteCategory } from '../../actions';

interface Product { 
  id: string; 
  name: string; 
  price: any; 
  active: boolean;
  unit: string;
  category: { id: string; name: string }; 
  recipe: { id: string; quantity: any; stockItem: { id: string; name: string; unit: string; cost: any } }[] 
}
interface Category { id: string; name: string }
interface StockItem { id: string; name: string; unit: string; cost: any }

const CATEGORY_COLORS: Record<string, string> = { 
  'Café': '#F59E0B', 
  'Boissons': '#06B6D4', 
  'Restauration': '#10B981', 
  'Desserts': '#EC4899',
  'Emballage': '#6366F1',     // Special category for packaging
};

const PACKAGING_CATEGORY = 'emballage'; // Exact name to match (case-insensitive)

export default function ProductsClient({ products, categories, stockItems, globalUnits }: { products: Product[]; categories: Category[]; stockItems: StockItem[]; globalUnits: any[] }) {
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<{ name: string; unitId: string; price: string; categoryId: string; active: boolean; recipe: { stockItemId: string; quantity: number }[] }>({ 
    name: '', price: '', unitId: '', categoryId: '', active: true, recipe: [] 
  });

  const [catModal, setCatModal] = useState(false);
  const [manageCatModal, setManageCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', parentId: '' });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const openCreate = () => { 
    setEditing(null); 
    setForm({ name: '', price: '', unitId: '', categoryId: categories[0]?.id || '', active: true, recipe: [] }); 
    setModalOpen(true); 
  };
  const openEdit = (p: Product) => { 
    setEditing(p); 
    setForm({ 
      name: p.name, 
      price: String(Number(p.price)), 
      unitId: (p as any).unitId || '',
      categoryId: p.category.id, 
      active: p.active ?? true,
      recipe: p.recipe.map(r => ({ stockItemId: r.stockItem.id, quantity: Number(r.quantity) }))
    }); 
    setModalOpen(true); 
  };

  const addRecipeItem = () => setForm(f => ({ ...f, recipe: [...f.recipe, { stockItemId: '', quantity: 0 }] }));
  const removeRecipeItem = (index: number) => setForm(f => ({ ...f, recipe: f.recipe.filter((_, i) => i !== index) }));
  const updateRecipeItem = (index: number, field: string, value: any) => {
    setForm(f => {
      const newRecipe = [...f.recipe];
      newRecipe[index] = { ...newRecipe[index], [field]: value };
      return { ...f, recipe: newRecipe };
    });
  };

  const calculateCOGS = () => {
    return form.recipe.reduce((acc, r) => {
      const item = stockItems.find(s => s.id === r.stockItemId);
      return acc + (Number(item?.cost || 0) * r.quantity);
    }, 0);
  };

  const cogs = calculateCOGS();
  const priceInput = parseFloat(form.price || '0');
  const profit = priceInput - cogs;
  const margin = priceInput > 0 ? (profit / priceInput) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const data = { 
        name: form.name, 
        price: parseFloat(form.price), 
        unitId: form.unitId || undefined,
        categoryId: form.categoryId,
        active: form.active,
        recipe: form.recipe.filter(r => r.stockItemId && r.quantity > 0)
      };
      if (editing) await updateProduct(editing.id, data);
      else await createProduct(data);
      setModalOpen(false);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => { 
      try {
        await deleteProduct(deleteTarget.id); 
        setDeleteTarget(null); 
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    
    let finalName = catForm.name.trim();
    if (catForm.parentId) {
      const parent = categories.find(c => c.id === catForm.parentId);
      if (parent) finalName = `${parent.name} > ${finalName}`;
    }

    startTransition(async () => {
      await createCategory(finalName);
      setCatForm({ name: '', parentId: '' });
      setCatModal(false);
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  const rootCategories = categories.filter(c => !c.name.includes(' > '));

  const field: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Package size={16} /> Tous les Produits</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => setManageCatModal(true)}><Settings size={14} style={{ marginRight: 6 }} /> Gérer catégories</button>
            <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Nouveau Produit</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Statut</th>
                <th>Catégorie</th>
                <th>Prix de Vente</th>
                <th>Profit Net (Est.)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const catColor = CATEGORY_COLORS[p.category.name] || '#6366F1';
                const pCogs = p.recipe.reduce((acc, r) => acc + (Number(r.stockItem.cost || 0) * Number(r.quantity)), 0);
                const pProfit = Number(p.price) - pCogs;
                const isActive = p.active ?? true;
                return (
                  <tr key={p.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${catColor}18`, color: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.category.name.toLowerCase() === PACKAGING_CATEGORY ? <Package size={16} /> : <Coffee size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{p.recipe.length} ingrédients · Vendu par {p.unit || 'unité'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isActive ? (
                        <span className="badge" style={{ background: '#D1FAE5', color: '#065F46' }}>Actif</span>
                      ) : (
                        <span className="badge" style={{ background: '#F1F5F9', color: '#64748B' }}>Archivé</span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${catColor}18`, color: catColor }}>
                        {p.category.name.toLowerCase() === PACKAGING_CATEGORY ? '📦 ' : ''}{p.category.name}
                      </span>
                      {p.category.name.toLowerCase() === PACKAGING_CATEGORY && (
                        <span className="badge" style={{ background: '#EEF2FF', color: '#6366F1', marginLeft: '6px', fontSize: '10px' }}>POS Popup</span>
                      )}
                    </td>
                    <td><strong style={{ fontSize: '16px', color: '#1E293B' }}>{Number(p.price).toFixed(3)}</strong><span style={{ color: '#94A3B8', fontSize: '12px' }}> DT</span></td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#10B981', fontSize: '15px' }}>+{pProfit.toFixed(3)} DT</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>Marge: {Number(p.price) > 0 ? ((pProfit / Number(p.price)) * 100).toFixed(0) : 0}%</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', marginRight: '4px' }} onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', color: '#EF4444' }} onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* === Create/Edit Product Modal === */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le Produit' : 'Nouveau Produit'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={label}>Nom du Produit</label>
              <input style={field} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Expresso..." required />
            </div>
            <div>
              <label style={label}>Catégorie</label>
              <select style={field} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required>
                <option value="">--</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={label}>Prix de Vente (DT)</label>
              <input style={{ ...field, fontSize: '18px', fontWeight: 900, color: '#1E293B' }} type="number" step="0.001" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1.500" required />
            </div>
            <div>
              <label style={label}>Unité de Vente</label>
              <select style={field} value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}>
                <option value="">-- Sélectionner --</option>
                {globalUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Statut (POS)</label>
              <button 
                type="button" 
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={form.active ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%', padding: '10px' }}
              >
                {form.active ? <><CheckCircle size={14} style={{ marginRight: 6 }} /> Actif</> : <><Archive size={14} style={{ marginRight: 6 }} /> Archivé</>}
              </button>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#4F46E5', fontSize: '13px' }}>
                <Calculator size={16} /> CALCULATEUR DE MARGE
              </div>
              <button type="button" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '8px' }} onClick={addRecipeItem}>+ Matière</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {form.recipe.map((item, idx) => {
                const stock = stockItems.find(s => s.id === item.stockItemId);
                return (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', padding: '8px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <select style={{ ...field, flex: 3, border: 'none', background: 'transparent', padding: 0 }} value={item.stockItemId} onChange={e => updateRecipeItem(idx, 'stockItemId', e.target.value)} required>
                      <option value="">Matière...</option>
                      {stockItems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 2 }}>
                       <input style={{ ...field, padding: '4px 8px', textAlign: 'right' }} type="number" step="0.001" value={item.quantity} onChange={e => updateRecipeItem(idx, 'quantity', parseFloat(e.target.value))} placeholder="Qté" required />
                       <span style={{ fontSize: '11px', color: '#94A3B8' }}>{stock?.unit || ''}</span>
                    </div>
                    <button type="button" onClick={() => removeRecipeItem(idx)} style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>COÛT MATIERES (COGS)</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{cogs.toFixed(3)} DT</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>MARGE BRUTE</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: profit > 0 ? '#10B981' : '#EF4444' }}>
                     {profit.toFixed(3)} DT <span style={{ fontSize: '12px', fontWeight: 700 }}>({margin.toFixed(0)}%)</span>
                  </div>
               </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
              {isPending ? 'Enregistrement...' : (editing ? 'Enregistrer les modifications' : 'Créer le Produit')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Categories Modal */}
      <Modal open={manageCatModal} onClose={() => setManageCatModal(false)} title="Gestion des Catégories" width={500}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#64748B' }}>{categories.length} catégories configurées</div>
              <button className="btn btn-primary" onClick={() => { setCatModal(true); setManageCatModal(false); }}>+ Nouvelle</button>
           </div>

           <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Folder size={16} color="#6366F1" />
                      <span style={{ fontWeight: 600, color: '#1E293B' }}>{c.name}</span>
                   </div>
                   <button 
                    className="btn btn-ghost" 
                    style={{ color: '#EF4444', padding: '6px' }} 
                    onClick={() => handleDeleteCategory(c.id)}
                    disabled={isPending}
                   >
                    <Trash2 size={16} />
                   </button>
                </div>
              ))}
           </div>
        </div>
      </Modal>

      {/* Create Category Modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Nouvelle Catégorie" width={420}>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
          <div>
            <label style={label}>Nom de la Catégorie</label>
            <input style={field} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Chaud, Froid, etc." required />
          </div>
          
          <div>
            <label style={label}>Catégorie Parente (Optionnel)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setCatForm(f => ({ ...f, parentId: '' }))}
                className={!catForm.parentId ? 'badge' : 'badge badge-outline'}
                style={{ cursor: 'pointer', border: 'none', background: !catForm.parentId ? '#6366F1' : '#F1F5F9', color: !catForm.parentId ? '#fff' : '#64748B' }}
              >
                Racine
              </button>
              {rootCategories.map(c => (
                <button 
                  key={c.id}
                  type="button" 
                  onClick={() => setCatForm(f => ({ ...f, parentId: c.id }))}
                  className={catForm.parentId === c.id ? 'badge' : 'badge badge-outline'}
                  style={{ cursor: 'pointer', border: 'none', background: catForm.parentId === c.id ? '#6366F1' : '#F1F5F9', color: catForm.parentId === c.id ? '#fff' : '#64748B' }}
                >
                  <Folder size={10} style={{ marginRight: 4 }} /> {c.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setCatModal(false); setManageCatModal(true); }}>Retour</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>Créer la catégorie</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer" width={400}>
        <div style={{ textAlign: 'center' }}>
          <p>Confirmer la suppression de <strong>{deleteTarget?.name}</strong> ?</p>
          <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>Note: La suppression échouera si le produit a déjà été vendu.</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Non</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Oui, Supprimer</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

