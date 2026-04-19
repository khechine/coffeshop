'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Coffee, Package, Calculator, Archive, CheckCircle, Folder, Settings, Tag as TagIcon } from 'lucide-react';
import Modal from '../../../components/Modal';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  createProductCategoryAction as createCategory, 
  deleteProductCategoryAction as deleteCategory 
} from '../../actions';

interface Product { 
  id: string; 
  name: string; 
  price: any; 
  taxRate: any;
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const openCreate = () => router.push('/admin/products/new');
  const openEdit = (p: Product) => router.push(`/admin/products/${p.id}`);

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

  const handleAddCategory = () => router.push('/admin/products/categories');

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Package size={16} /> Tous les Produits</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={handleAddCategory}><Settings size={14} style={{ marginRight: 6 }} /> Gérer catégories</button>
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
                <th>Prix HT / TVA</th>
                <th>Prix TTC</th>
                <th>Profit (HT)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const catColor = CATEGORY_COLORS[p.category.name] || '#6366F1';
                const taxRate = Number(p.taxRate || 0.19);
                const priceHt = Number(p.price) / (1 + taxRate);
                const taxAmount = Number(p.price) - priceHt;
                const pCogs = p.recipe.reduce((acc, r) => acc + (Number(r.stockItem.cost || 0) * Number(r.quantity)), 0);
                const pProfitHt = priceHt - pCogs;
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
                        {p.category.name}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#475569', fontSize: '14px' }}>{priceHt.toFixed(3)} DT</div>
                      <div style={{ fontSize: '10px', color: '#6366F1', fontWeight: 800 }}>TVA: {Math.round(taxRate * 100)}% (+{taxAmount.toFixed(3)})</div>
                    </td>
                    <td><strong style={{ fontSize: '16px', color: '#1E293B' }}>{Number(p.price).toFixed(3)}</strong><span style={{ color: '#94A3B8', fontSize: '12px' }}> DT</span></td>
                    <td>
                      <div style={{ fontWeight: 800, color: pProfitHt > 0 ? '#10B981' : '#EF4444', fontSize: '15px' }}>{pProfitHt > 0 ? '+' : ''}{pProfitHt.toFixed(3)} DT</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>Marge/HT: {priceHt > 0 ? ((pProfitHt / priceHt) * 100).toFixed(0) : 0}%</div>
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

