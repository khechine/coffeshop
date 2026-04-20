'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Coffee, 
  Package, 
  Calculator, 
  CheckCircle, 
  Archive, 
  Trash2,
  Percent,
  TrendingUp,
  Info
} from 'lucide-react';
import { createProduct, updateProduct } from '../../actions';

export interface Product { 
  id: string; 
  name: string; 
  price: any;
  taxRate: any;
  active: boolean;
  unit: string;
  category: { id: string; name: string }; 
  canBeTakeaway: boolean;
  recipe: { id: string; quantity: any; consumeType: string; isPackaging: boolean; stockItem: { id: string; name: string; unit: string; cost: any } }[] 
}

export interface Category { id: string; name: string }
export interface StockItem { id: string; name: string; unit: string; cost: any }

const TAX_RATES = [
  { label: 'Exonéré (0%)', value: 0 },
  { label: 'Réduit (7%)', value: 0.07 },
  { label: 'Interm. (13%)', value: 0.13 },
  { label: 'Normal (19%)', value: 0.19 },
];

interface ProductFormProps {
  initialData?: Product | null;
  categories: Category[];
  stockItems: StockItem[];
  globalUnits: any[];
}

export default function ProductForm({ initialData, categories, stockItems, globalUnits }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<{ 
    name: string; unitId: string; price: string; taxRate: number;
    categoryId: string; active: boolean; canBeTakeaway: boolean;
    recipe: { stockItemId: string; quantity: number; consumeType: string }[] 
  }>({ 
    name: initialData?.name || '', 
    price: initialData ? String(Number(initialData.price)) : '', 
    unitId: (initialData as any)?.unitId || '',
    taxRate: initialData ? Number(initialData.taxRate ?? 0.19) : 0.19,
    categoryId: initialData?.category.id || (categories[0]?.id || ''), 
    active: initialData?.active ?? true,
    canBeTakeaway: initialData?.canBeTakeaway ?? true,
    recipe: initialData ? initialData.recipe.map(r => ({ 
      stockItemId: r.stockItem.id, 
      quantity: Number(r.quantity),
      consumeType: r.consumeType || 'BOTH'
    })) : []
  });

  const addRecipeItem = () => setForm(f => ({ ...f, recipe: [...f.recipe, { stockItemId: '', quantity: 0, consumeType: 'BOTH' }] }));
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
  const priceHt = priceInput / (1 + form.taxRate);
  const taxAmount = priceHt * form.taxRate;
  const profit = priceHt - cogs;
  const margin = priceHt > 0 ? (profit / priceHt) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const data = { 
        name: form.name, 
        price: parseFloat(form.price), 
        unitId: form.unitId || undefined,
        taxRate: form.taxRate,
        categoryId: form.categoryId,
        active: form.active,
        canBeTakeaway: form.canBeTakeaway,
        recipe: form.recipe.filter(r => r.stockItemId && r.quantity > 0).map(r => ({
          stockItemId: r.stockItemId,
          quantity: r.quantity,
          consumeType: r.consumeType
        }))
      };
      if (initialData) await updateProduct(initialData.id, data);
      else await createProduct(data);
      router.push('/admin/products');
      router.refresh();
    });
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.025em' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: 600, outline: 'none', transition: 'all 0.2s', background: '#fff' };

  return (
    <div className="product-form-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px 100px' }}>
      {/* Top Bar */}
      <div className="product-form-header" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <button 
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
          >
            <ArrowLeft size={18} /> <span className="mobile-hide">Retour</span>
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: '#6366F1', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
          >
            <Save size={18} /> {isPending ? '...' : 'Enregistrer'}
          </button>
        </div>
        
        <h1 style={{ margin: 0, fontSize: '22px', md: '28px', fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>
          {initialData ? 'Modifier le Produit' : 'Nouveau Produit'}
        </h1>
      </div>

      <div className="product-form-layout" style={{ display: 'flex', flexDirection: 'column', lg: 'row', gap: '32px' }}>
        <div className="form-main-column" style={{ flex: '1.5', order: 2, lg: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 1: Informations Générales */}
          <section style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Informations Générales</h2>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Nom du Produit</label>
                <input 
                  style={inputStyle} 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="ex: Double Expresso Macchiato..." 
                  required 
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={labelStyle}>Catégorie</label>
                  <select 
                    style={inputStyle} 
                    value={form.categoryId} 
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} 
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={labelStyle}>Unité de Vente</label>
                  <select 
                    style={inputStyle} 
                    value={form.unitId} 
                    onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}
                  >
                    <option value="">Sélectionner l'unité</option>
                    {globalUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Statut du Produit</label>
                <div style={{ display: 'flex', flexDirection: 'column', md: 'row', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setForm(f => ({ ...f, active: true }))}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: form.active ? '2px solid #10B981' : '2px solid #E2E8F0', background: form.active ? '#F0FDF4' : '#fff', color: form.active ? '#15803D' : '#64748B', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <CheckCircle size={18} /> Actif <span className="mobile-hide">(Visible sur POS)</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setForm(f => ({ ...f, active: false }))}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: !form.active ? '2px solid #EF4444' : '2px solid #E2E8F0', background: !form.active ? '#FEF2F2' : '#fff', color: !form.active ? '#B91C1C' : '#64748B', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Archive size={18} /> Archivé <span className="mobile-hide">(Caché)</span>
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Option "À Emporter"</label>
                <button 
                  type="button" 
                  onClick={() => setForm(f => ({ ...f, canBeTakeaway: !f.canBeTakeaway }))}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: form.canBeTakeaway ? '2px solid #6366F1' : '2px solid #E2E8F0', background: form.canBeTakeaway ? '#EEF2FF' : '#fff', color: form.canBeTakeaway ? '#4F46E5' : '#64748B', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <Package size={20} /> {form.canBeTakeaway ? 'Disponible à emporter' : 'Uniquement sur place'}
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Recette & Matières */}
          <section style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Composition & Recette</h2>
              </div>
              <button 
                type="button" 
                onClick={addRecipeItem}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#6366F1', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
              >
                + Ajouter une matière
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {form.recipe.map((item, idx) => {
                const stock = stockItems.find(s => s.id === item.stockItemId);
                return (
                  <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start', background: '#F8FAFC', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flex: '1 1 250px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Matière Première</label>
                      <select 
                        style={{ ...inputStyle, padding: '10px 14px', fontSize: '14px', border: '1.5px solid #CBD5E1' }} 
                        value={item.stockItemId} 
                        onChange={e => updateRecipeItem(idx, 'stockItemId', e.target.value)} 
                        required
                      >
                        <option value="">Choisir...</option>
                        {stockItems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                      </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Quantité</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          style={{ ...inputStyle, padding: '10px 40px 10px 14px', fontSize: '14px', border: '1.5px solid #CBD5E1', textAlign: 'right' }} 
                          type="number" step="0.001" 
                          value={item.quantity} 
                          onChange={e => updateRecipeItem(idx, 'quantity', parseFloat(e.target.value))} 
                          required 
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>
                          {stock?.unit || ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Condition</label>
                      <select 
                        style={{ ...inputStyle, padding: '10px 14px', fontSize: '13px', border: '1.5px solid #CBD5E1' }} 
                        value={item.consumeType} 
                        onChange={e => updateRecipeItem(idx, 'consumeType', e.target.value)}
                      >
                        <option value="BOTH">Les deux</option>
                        <option value="DINE_IN">Sur place</option>
                        <option value="TAKEAWAY">À emporter</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                      <button 
                        type="button" 
                        onClick={() => removeRecipeItem(idx)} 
                        style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {form.recipe.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', background: '#F8FAFC', borderRadius: '20px', border: '2px dashed #E2E8F0', color: '#94A3B8', fontSize: '14px' }}>
                  Aucun ingrédient défini. Ajoutez des matières premières pour calculer le profit.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="form-sidebar" style={{ flex: '1', order: 1, lg: 2, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 3: Finance & TVA */}
          <section className="finance-section sticky-top" style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'static', lg: 'sticky', top: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Percent size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Tarification & Fiscalité</h2>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Prix de Vente TTC (DT)</label>
                <input 
                  style={{ ...inputStyle, fontSize: '24px', fontWeight: 900, color: '#6366F1', border: '3px solid #6366F1' }} 
                  type="number" step="0.001" min="0" 
                  value={form.price} 
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} 
                  placeholder="0.000" 
                  required 
                />
              </div>

              <div>
                <label style={labelStyle}>Taux de TVA</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {TAX_RATES.map(rate => (
                    <button
                      key={rate.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, taxRate: rate.value }))}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: form.taxRate === rate.value ? '2px solid #6366F1' : '1px solid #E2E8F0', background: form.taxRate === rate.value ? '#EEF2FF' : '#fff', color: form.taxRate === rate.value ? '#6366F1' : '#64748B', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Prix Hors Taxe (HT)</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>{priceHt.toFixed(3)} DT</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Montant TVA</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#6366F1' }}>{taxAmount.toFixed(3)} DT</span>
                 </div>
                 <div style={{ height: '1px', background: '#E2E8F0', margin: '8px 0' }} />
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#6366F1' }}>Total TTC</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#6366F1' }}>{priceInput.toFixed(3)} DT</span>
                 </div>
              </div>

              {/* Profit Analyzer */}
              <div style={{ background: '#1E1B4B', borderRadius: '20px', padding: '24px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#818CF8' }}>
                  <TrendingUp size={18} />
                  <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em' }}>ANALYSE DE RENTABILITÉ</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#818CF8', marginBottom: '4px' }}>COÛT MATIÈRE</div>
                    <div style={{ fontSize: '20px', fontWeight: 900 }}>{cogs.toFixed(3)} DT</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#818CF8', marginBottom: '4px' }}>PROFIT (par HT)</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: profit > 0 ? '#34D399' : '#F87171' }}>+{profit.toFixed(3)} DT</div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' }}>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#818CF8', marginBottom: '2px' }}>MARGE BRUTE RÉELLE</div>
                   <div style={{ fontSize: '28px', fontWeight: 900, color: '#34D399' }}>{margin.toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
