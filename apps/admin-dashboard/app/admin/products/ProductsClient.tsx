'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Coffee, Package, Search, Filter, ChevronDown, Settings, Eye, EyeOff } from 'lucide-react';
import Modal from '../../../components/Modal';
import { deleteProduct } from '../../actions';

interface Product { 
  id: string; name: string; price: any; taxRate: any; active: boolean; unit: string;
  category: { id: string; name: string; color?: string; icon?: string }; 
  recipe: { id: string; quantity: any; stockItem: { id: string; name: string; unit: string; cost: any } }[] 
}
interface Category { id: string; name: string; color?: string }

const DEFAULT_COLORS: Record<string, string> = { 
  'Café': '#F59E0B', 'Boissons': '#06B6D4', 'Restauration': '#10B981', 
  'Desserts': '#EC4899', 'Emballage': '#6366F1',
};

export default function ProductsClient({ products, categories, stockItems, globalUnits }: { products: Product[]; categories: Category[]; stockItems: any[]; globalUnits: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category.id === filterCat;
    return matchSearch && matchCat;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => { 
      try { await deleteProduct(deleteTarget.id); setDeleteTarget(null); } 
      catch (e: any) { alert(e.message); }
    });
  };

  const getColor = (p: Product) => (p.category as any).color || DEFAULT_COLORS[p.category.name] || '#6366F1';

  return (
    <>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        marginBottom: '28px', padding: '16px 20px',
        background: '#fff', borderRadius: '20px', border: '1px solid #F1F5F9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            style={{
              width: '100%', padding: '10px 14px 10px 40px', borderRadius: '12px',
              border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600,
              outline: 'none', background: '#F8FAFC',
            }}
          />
        </div>
        <select
          value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0',
            fontSize: '13px', fontWeight: 600, background: '#F8FAFC', outline: 'none',
          }}
        >
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
          <button onClick={() => setViewMode('grid')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: viewMode === 'grid' ? '#fff' : 'transparent', color: viewMode === 'grid' ? '#1E293B' : '#94A3B8', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Grille</button>
          <button onClick={() => setViewMode('table')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: viewMode === 'table' ? '#fff' : 'transparent', color: viewMode === 'table' ? '#1E293B' : '#94A3B8', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Tableau</button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => router.push('/admin/products/categories')}>
            <Settings size={14} /> Catégories
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/admin/products/new')}>
            <Plus size={14} /> Nouveau
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filtered.map(p => {
            const color = getColor(p);
            const taxRate = Number(p.taxRate || 0.19);
            const priceHt = Number(p.price) / (1 + taxRate);
            const cogs = p.recipe.reduce((acc, r) => acc + (Number(r.stockItem.cost || 0) * Number(r.quantity)), 0);
            const profit = priceHt - cogs;
            const isActive = p.active ?? true;
            return (
              <div key={p.id} style={{
                borderRadius: '24px', background: '#fff', border: '1px solid #F1F5F9',
                overflow: 'hidden', opacity: isActive ? 1 : 0.6,
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onClick={() => router.push(`/admin/products/${p.id}`)}
              >
                {/* Color header strip */}
                <div style={{ height: '6px', background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '14px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Coffee size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>{p.name}</div>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: `${color}15`, color, textTransform: 'uppercase' }}>
                          {p.category.name}
                        </span>
                      </div>
                    </div>
                    {!isActive && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#64748B' }}>Archivé</span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '14px', background: '#F8FAFC' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Prix TTC</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>{Number(p.price).toFixed(3)} <span style={{ fontSize: '11px', color: '#94A3B8' }}>DT</span></div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '14px', background: profit >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Profit HT</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: profit >= 0 ? '#10B981' : '#EF4444' }}>
                        {profit > 0 ? '+' : ''}{profit.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                      {p.recipe.length} ingrédient{p.recipe.length !== 1 ? 's' : ''} · TVA {Math.round(Number(p.taxRate || 0.19) * 100)}%
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => router.push(`/admin/products/${p.id}`)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px 8px', color: '#EF4444' }} onClick={() => setDeleteTarget(p)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View (original) */
        <div className="card" style={{ borderRadius: '20px' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produit</th><th>Statut</th><th>Catégorie</th>
                  <th>Prix HT / TVA</th><th>Prix TTC</th><th>Profit (HT)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const color = getColor(p);
                  const taxRate = Number(p.taxRate || 0.19);
                  const priceHt = Number(p.price) / (1 + taxRate);
                  const cogs = p.recipe.reduce((acc, r) => acc + (Number(r.stockItem.cost || 0) * Number(r.quantity)), 0);
                  const profit = priceHt - cogs;
                  const isActive = p.active ?? true;
                  return (
                    <tr key={p.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Coffee size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1E293B' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{p.recipe.length} ingrédients</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge" style={{ background: isActive ? '#D1FAE5' : '#F1F5F9', color: isActive ? '#065F46' : '#64748B' }}>{isActive ? 'Actif' : 'Archivé'}</span></td>
                      <td><span className="badge" style={{ background: `${color}18`, color }}>{p.category.name}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#475569', fontSize: '14px' }}>{priceHt.toFixed(3)} DT</div>
                        <div style={{ fontSize: '10px', color: '#6366F1', fontWeight: 800 }}>TVA: {Math.round(taxRate * 100)}%</div>
                      </td>
                      <td><strong style={{ fontSize: '16px', color: '#1E293B' }}>{Number(p.price).toFixed(3)}</strong><span style={{ color: '#94A3B8', fontSize: '12px' }}> DT</span></td>
                      <td>
                        <div style={{ fontWeight: 800, color: profit > 0 ? '#10B981' : '#EF4444', fontSize: '15px' }}>{profit > 0 ? '+' : ''}{profit.toFixed(3)} DT</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>Marge: {priceHt > 0 ? ((profit / priceHt) * 100).toFixed(0) : 0}%</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => router.push(`/admin/products/${p.id}`)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', color: '#EF4444' }} onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>
          Aucun produit trouvé.
        </div>
      )}

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
