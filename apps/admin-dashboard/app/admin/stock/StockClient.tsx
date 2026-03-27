'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Layers, AlertTriangle, PlusCircle, MinusCircle, Wallet, TrendingUp } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createStockItem, updateStockItem, deleteStockItem, adjustStock } from '../../actions';

interface StockItem { 
  id: string; 
  name: string; 
  unit: string; 
  quantity: any; 
  minThreshold: any;
  cost: any;
}

export default function StockClient({ stockItems, vendors, suppliers, globalUnits }: { stockItems: any[]; vendors: any[]; suppliers: any[]; globalUnits: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', unitId: '', quantity: '', minThreshold: '', cost: '', preferredVendorId: '', preferredSupplierId: '' });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');

  const openCreate = () => { setEditing(null); setForm({ name: '', unitId: '', quantity: '0', minThreshold: '0', cost: '0', preferredVendorId: '', preferredSupplierId: '' }); setModalOpen(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ 
      name: item.name, 
      unitId: item.unitId || '',
      quantity: String(Number(item.quantity)), 
      minThreshold: String(Number(item.minThreshold)),
      cost: String(Number(item.cost || 0)),
      preferredVendorId: item.preferredVendorId || '',
      preferredSupplierId: item.preferredSupplierId || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const data = { 
        name: form.name, 
        unitId: form.unitId || undefined,
        quantity: parseFloat(form.quantity), 
        minThreshold: parseFloat(form.minThreshold),
        cost: parseFloat(form.cost),
        preferredVendorId: form.preferredVendorId || undefined,
        preferredSupplierId: form.preferredSupplierId || undefined
      };
      if (editing) await updateStockItem(editing.id, data);
      else await createStockItem(data);
      setModalOpen(false);
    });
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    startTransition(async () => {
      await adjustStock(adjustTarget.id, parseFloat(adjustDelta));
      setAdjustTarget(null);
      setAdjustDelta('');
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => { await deleteStockItem(deleteTarget.id); setDeleteTarget(null); });
  };

  const totalInventoryValue = stockItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.cost || 0)), 0);

  const field: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Wallet size={24} />
           </div>
           <div>
             <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Valeur Totale du Stock</div>
             <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{totalInventoryValue.toFixed(3)} DT</div>
           </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <TrendingUp size={24} />
           </div>
           <div>
             <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Articles en Alerte</div>
             <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length}</div>
           </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><Layers size={16} /> État des Stocks</span>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Ajouter Matière Première</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Quantité</th>
              <th>Coût Unitaire</th>
              <th>Valeur (Sum)</th>
              <th>Statut B2B</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map(item => {
              const isCritical = Number(item.quantity) <= Number(item.minThreshold);
              const value = Number(item.quantity) * Number(item.cost || 0);
              const pct = Math.min(100, Math.max(3, (Number(item.quantity) / Math.max(Number(item.minThreshold) * 2, 0.001)) * 100));
              
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: isCritical ? '#FEE2E2' : '#D1FAE5', color: isCritical ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isCritical ? <AlertTriangle size={16} /> : <Layers size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Unité: {item.unit?.name || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: isCritical ? '#EF4444' : '#1E293B' }}>
                      {Number(item.quantity).toFixed(2)} {item.unit?.name || ''}
                    </div>
                    <div className="progress-track" style={{ marginTop: 6, width: 60 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: isCritical ? '#EF4444' : pct < 60 ? '#F59E0B' : '#10B981' }} />
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#64748B' }}>{Number(item.cost || 0).toFixed(3)} DT</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#10B981' }}>{value.toFixed(3)} DT</span>
                  </td>
                  <td>
                    {isCritical
                      ? <span className="badge red">⚠ Réappro</span>
                      : <span className="badge green">✓ OK</span>
                    }
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" title="Ajuster le stock" style={{ padding: '6px 10px', color: '#10B981', marginRight: '4px' }} onClick={() => { setAdjustTarget(item); setAdjustDelta(''); }}>
                      <PlusCircle size={14} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '6px 10px', marginRight: '4px' }} onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '6px 10px', color: '#EF4444' }} onClick={() => setDeleteTarget(item)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
            {stockItems.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                <p style={{ fontWeight: 600 }}>Aucun stock. Ajoutez vos matières premières.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* === Create / Edit Modal === */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier l\'Article de Stock' : 'Nouvelle Matière Première'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={label}>Nom de l'Article</label>
            <input style={field} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Grains de café, Lait..." required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={label}>Unité</label>
              <select style={field} value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}>
                <option value="">-- Sélectionner --</option>
                {globalUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Coût Unitaire (DT)</label>
              <input style={field} type="number" step="any" min="0" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={label}>Quantité Actuelle</label>
              <input style={field} type="number" step="any" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            </div>
            <div>
              <label style={label}>Seuil d'Alerte</label>
              <input style={field} type="number" step="any" min="0" value={form.minThreshold} onChange={e => setForm(f => ({ ...f, minThreshold: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label style={label}>Fournisseur Préféré</label>
            <select style={field} value={form.preferredSupplierId} onChange={e => setForm(f => ({ ...f, preferredSupplierId: e.target.value, preferredVendorId: '' }))}>
              <option value="">-- Mes Fournisseurs --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
              {isPending ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust & Delete modals same as before... (omitted for brevity in replace, but usually I should include them if I replace entire file) */}
      
      {/* === Adjust Stock Modal === */}
      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title={`Ajustement Stock — ${adjustTarget?.name}`} width={380}>
        <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Stock Actuel</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>{Number(adjustTarget?.quantity).toFixed(2)} <span style={{ fontSize: '14px', color: '#94A3B8' }}>{adjustTarget?.unit}</span></div>
          </div>
          <div>
            <label style={label}>Quantité à Ajouter (+ positif, − négatif)</label>
            <input style={field} type="number" step="any" value={adjustDelta} onChange={e => setAdjustDelta(e.target.value)} placeholder="ex: +5.5 ou -2" required />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAdjustTarget(null)}>Annuler</button>
            <button type="submit" className="btn btn-success" style={{ flex: 2 }} disabled={isPending}>
              {isPending ? '...' : 'Appliquer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* === Delete === */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la Suppression" width={400}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={24} color="#EF4444" />
          </div>
          <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '16px', marginBottom: '8px' }}>Supprimer "{deleteTarget?.name}" ?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Annuler</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={isPending}>Supprimer</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
