'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Layers, AlertTriangle, PlusCircle, MinusCircle, Wallet, TrendingUp, Sparkles, Upload, FileText, Check, Loader2, Receipt } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createStockItem, updateStockItem, deleteStockItem, adjustStock, analyzeInvoiceAction, importInvoiceItemsAction } from '../../actions';

interface StockItem { 
  id: string; 
  name: string; 
  unit: string; 
  quantity: any; 
  minThreshold: any;
  cost: any;
  taxRate: any;
}

/* TVA rates available in Tunisia */
const TVA_RATES = [
  { value: 0, label: '0% (Exonéré)' },
  { value: 0.07, label: '7%' },
  { value: 0.13, label: '13%' },
  { value: 0.19, label: '19%' },
];

function formatTvaLabel(rate: number): string {
  const pct = Math.round(rate * 100);
  if (pct === 0) return 'Exonéré';
  return `${pct}%`;
}

function getTvaBadgeColor(rate: number): { bg: string; color: string } {
  const pct = Math.round(rate * 100);
  if (pct === 0) return { bg: '#ECFDF5', color: '#059669' };
  if (pct === 7) return { bg: '#FEF3C7', color: '#92400E' };
  if (pct === 13) return { bg: '#FFF7ED', color: '#C2410C' };
  return { bg: '#EEF2FF', color: '#4F46E5' };
}

export default function StockClient({ 
  stockItems, 
  vendors, 
  suppliers, 
  globalUnits 
}: { 
  stockItems: any[]; 
  vendors: any[]; 
  suppliers: any[]; 
  globalUnits: any[] 
}) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', unitId: '', quantity: '', minThreshold: '', cost: '', taxRate: '0.19', preferredVendorId: '', preferredSupplierId: '' });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');

  // AI Scanner & Manual Invoice States
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [mappedItems, setMappedItems] = useState<any[]>([]);

  const openCreate = () => { 
    setEditing(null); 
    setForm({ name: '', unitId: '', quantity: '0', minThreshold: '0', cost: '0', taxRate: '0.19', preferredVendorId: '', preferredSupplierId: '' }); 
    setModalOpen(true); 
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ 
      name: item.name, 
      unitId: item.unitId || '',
      quantity: String(Number(item.quantity)), 
      minThreshold: String(Number(item.minThreshold)),
      cost: String(Number(item.cost || 0)),
      taxRate: String(Number(item.taxRate ?? 0.19)),
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
        taxRate: parseFloat(form.taxRate),
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
    startTransition(async () => { 
      await deleteStockItem(deleteTarget.id); 
      setDeleteTarget(null); 
    });
  };

  // AI Invoice Scanner file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    setScanError('');
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const result = await analyzeInvoiceAction(base64);
        setScanResult(result);
        
        // Auto-map detected items to existing stock items
        const initialMapping = (result.items || []).map((item: any) => {
          // simple check for name matching
          const bestMatch = stockItems.find(si => 
            si.name.toLowerCase().includes(item.name.toLowerCase()) || 
            item.name.toLowerCase().includes(si.name.toLowerCase())
          );
          const tvaRate = item.tva ? item.tva / 100 : 0.19; // Gemini returns e.g. 19 for 19%
          return {
            name: item.name,
            quantity: item.quantity || 1,
            cost: item.price || 0,
            taxRate: tvaRate,
            stockItemId: bestMatch ? bestMatch.id : 'NEW',
            unitId: bestMatch ? bestMatch.unitId : (globalUnits[0]?.id || '')
          };
        });
        setMappedItems(initialMapping);
      } catch (err: any) {
        setScanError(err.message || "Impossible d'analyser la facture. Assurez-vous d'avoir configuré votre clé API.");
      } finally {
        setScanLoading(false);
      }
    };
    reader.onerror = () => {
      setScanError("Erreur lors de la lecture du fichier.");
      setScanLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleMappedItemChange = (index: number, key: string, value: any) => {
    setMappedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;
    
    startTransition(async () => {
      try {
        await importInvoiceItemsAction(mappedItems, scanResult.supplierName);
        setScanModalOpen(false);
        setManualModalOpen(false);
        setScanResult(null);
        alert("Facture enregistrée avec succès ! Le stock et le fournisseur ont été mis à jour.");
      } catch (err: any) {
        setScanError(err.message || "Erreur lors de l'importation.");
      }
    });
  };

  const totalInventoryValue = stockItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.cost || 0)), 0);
  const totalTva = stockItems.reduce((acc, item) => {
    const ht = Number(item.quantity) * Number(item.cost || 0);
    return acc + ht * Number(item.taxRate ?? 0.19);
  }, 0);

  // Scanner totals
  const scanTotalHT = mappedItems.reduce((acc, i) => acc + (i.quantity * i.cost), 0);
  const scanTotalTVA = mappedItems.reduce((acc, i) => acc + (i.quantity * i.cost * (i.taxRate || 0)), 0);
  const scanTotalTTC = scanTotalHT + scanTotalTVA;

  const field: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <>
      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Wallet size={24} />
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valeur Stock HT</div>
             <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{totalInventoryValue.toFixed(3)} <span style={{ fontSize: '13px', color: '#94A3B8' }}>DT</span></div>
           </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Receipt size={24} />
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TVA Déductible</div>
             <div style={{ fontSize: '24px', fontWeight: 900, color: '#F59E0B' }}>{totalTva.toFixed(3)} <span style={{ fontSize: '13px', color: '#94A3B8' }}>DT</span></div>
           </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <TrendingUp size={24} />
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Articles en Alerte</div>
             <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length}</div>
           </div>
        </div>
      </div>

      {/* ── Stock Table ── */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title"><Layers size={16} /> État des Stocks</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={() => { 
              setScanResult({ supplierName: '' }); 
              setMappedItems([{ name: '', quantity: 1, cost: 0, taxRate: 0.19, stockItemId: '', unitId: '' }]);
              setManualModalOpen(true); 
            }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} className="text-success" /> Saisie Manuelle Facture
            </button>
            <button className="btn btn-outline" onClick={() => { setScanModalOpen(true); setScanResult(null); setScanError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} className="text-primary" /> Scanner Facture IA
            </button>
            <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Ajouter Matière Première
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Quantité</th>
                <th>Coût Unit. HT</th>
                <th>TVA</th>
                <th>Valeur HT</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map(item => {
                const isCritical = Number(item.quantity) <= Number(item.minThreshold);
                const costHT = Number(item.cost || 0);
                const rate = Number(item.taxRate ?? 0.19);
                const valueHT = Number(item.quantity) * costHT;
                const valueTVA = valueHT * rate;
                const valueTTC = valueHT + valueTVA;
                const pct = Math.min(100, Math.max(3, (Number(item.quantity) / Math.max(Number(item.minThreshold) * 2, 0.001)) * 100));
                const tvaBadge = getTvaBadgeColor(rate);
                
                return (
                  <tr key={item.id}>
                    <td data-label="Article">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="mobile-hide" style={{ width: 36, height: 36, borderRadius: '10px', background: isCritical ? '#FEE2E2' : '#D1FAE5', color: isCritical ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isCritical ? <AlertTriangle size={16} /> : <Layers size={16} />}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Unité: {item.unit?.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Quantité">
                      <div style={{ fontWeight: 800, color: isCritical ? '#EF4444' : '#1E293B', textAlign: 'right' }}>
                        {Number(item.quantity).toFixed(2)} {item.unit?.name || ''}
                      </div>
                      <div className="progress-track" style={{ marginTop: 6, width: 60, marginLeft: 'auto' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: isCritical ? '#EF4444' : pct < 60 ? '#F59E0B' : '#10B981' }} />
                      </div>
                    </td>
                    <td data-label="Coût HT">
                      <span style={{ fontWeight: 600, color: '#64748B' }}>{costHT.toFixed(3)} DT</span>
                    </td>
                    <td data-label="TVA">
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800,
                        background: tvaBadge.bg, color: tvaBadge.color
                      }}>
                        {formatTvaLabel(rate)}
                      </span>
                    </td>
                    <td data-label="Valeur HT">
                      <div>
                        <div style={{ fontWeight: 800, color: '#1E293B' }}>{valueHT.toFixed(3)} DT</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>TTC: {valueTTC.toFixed(3)} DT</div>
                      </div>
                    </td>
                    <td data-label="Statut">
                      {isCritical
                        ? <span className="badge red">⚠ Réappro</span>
                        : <span className="badge green">✓ OK</span>
                      }
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
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
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                  <p style={{ fontWeight: 600 }}>Aucun stock. Ajoutez vos matières premières.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
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
              <label style={label}>Coût Unitaire HT (DT)</label>
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

          {/* TVA Rate Selector */}
          <div>
            <label style={label}>
              <Receipt size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Taux de TVA
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {TVA_RATES.map(r => {
                const isSelected = parseFloat(form.taxRate) === r.value;
                const colors = getTvaBadgeColor(r.value);
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, taxRate: String(r.value) }))}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? colors.bg : '#F8FAFC',
                      color: isSelected ? colors.color : '#94A3B8',
                      border: isSelected ? `2px solid ${colors.color}` : '1.5px solid #E2E8F0',
                      boxShadow: isSelected ? `0 2px 8px ${colors.color}22` : 'none',
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            {/* TTC Preview */}
            {parseFloat(form.cost) > 0 && (
              <div style={{ marginTop: '8px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Prix TTC unitaire :</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
                  {(parseFloat(form.cost) * (1 + parseFloat(form.taxRate))).toFixed(3)} DT
                </span>
              </div>
            )}
          </div>

          <div>
            <label style={label}>Fournisseur Préféré</label>
            <select style={field} value={form.preferredSupplierId} onChange={e => setForm(f => ({ ...f, preferredSupplierId: e.target.value }))}>
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

      {/* === AI Invoice Scanner Modal === */}
      <Modal open={scanModalOpen} onClose={() => setScanModalOpen(false)} title="Scanner une Facture d'Achat IA" width={780}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!scanResult && !scanLoading && (
            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s' }}
                 onClick={() => document.getElementById('invoice-file-input')?.click()}>
              <input type="file" id="invoice-file-input" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Upload size={28} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: '0 0 4px' }}>Téléverser ou prendre en photo</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Sélectionnez une image de facture (.png, .jpg, .jpeg)</p>
            </div>
          )}

          {scanLoading && (
            <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Loader2 size={40} className="spin text-primary" />
              <div style={{ fontWeight: 800, color: '#1E293B' }}>Analyse par l'Intelligence Artificielle en cours...</div>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '300px', margin: 0 }}>Gemini extrait le fournisseur, les produits, les quantités, les coûts et la TVA.</p>
            </div>
          )}

          {scanError && (
            <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: '12px', fontSize: '14px', fontWeight: 700 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <AlertTriangle size={18} /> Erreur de scan
              </div>
              {scanError}
              <button className="btn btn-outline" style={{ marginTop: '12px', width: '100%', color: '#EF4444', borderColor: '#FCA5A5' }} onClick={() => { setScanResult(null); setScanError(''); }}>Réessayer</button>
            </div>
          )}

          {scanResult && (
            <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800, textTransform: 'uppercase' }}>Fournisseur Détecté</div>
                  <input style={{ ...field, padding: '4px 8px', fontSize: '16px', fontWeight: 700, border: 'none', background: 'transparent', width: 'fit-content' }} 
                         value={scanResult.supplierName || ''} 
                         onChange={e => setScanResult({ ...scanResult, supplierName: e.target.value })} 
                         placeholder="Nom du Fournisseur" 
                         required />
                </div>
              </div>

              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Article Détecté</th>
                      <th>Association Stock</th>
                      <th>Quantité</th>
                      <th>Coût Unit HT</th>
                      <th>TVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedItems.map((item, idx) => {
                      const lineHT = item.quantity * item.cost;
                      const lineTVA = lineHT * (item.taxRate || 0);
                      const tvaBadge = getTvaBadgeColor(item.taxRate || 0);
                      return (
                        <tr key={idx}>
                          <td>
                            <input style={{ ...field, padding: '6px' }} value={item.name} onChange={e => handleMappedItemChange(idx, 'name', e.target.value)} required />
                          </td>
                          <td>
                            <select style={{ ...field, padding: '6px' }} value={item.stockItemId} onChange={e => handleMappedItemChange(idx, 'stockItemId', e.target.value)}>
                              <option value="NEW">-- Créer Nouveau --</option>
                              {stockItems.map(si => (
                                <option key={si.id} value={si.id}>{si.name} ({si.unit?.name || '—'})</option>
                              ))}
                            </select>
                            
                            {item.stockItemId === 'NEW' && (
                              <select style={{ ...field, padding: '4px', marginTop: '4px', fontSize: '11px' }} value={item.unitId} onChange={e => handleMappedItemChange(idx, 'unitId', e.target.value)} required>
                                <option value="">-- Unité --</option>
                                {globalUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                            )}
                          </td>
                          <td style={{ width: '80px' }}>
                            <input style={{ ...field, padding: '6px', textAlign: 'center' }} type="number" step="any" value={item.quantity} onChange={e => handleMappedItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} required />
                          </td>
                          <td style={{ width: '100px' }}>
                            <input style={{ ...field, padding: '6px', textAlign: 'center' }} type="number" step="any" value={item.cost} onChange={e => handleMappedItemChange(idx, 'cost', parseFloat(e.target.value) || 0)} required />
                          </td>
                          <td style={{ width: '100px' }}>
                            <select 
                              style={{ ...field, padding: '6px', background: tvaBadge.bg, color: tvaBadge.color, fontWeight: 700, borderColor: tvaBadge.color + '44' }} 
                              value={item.taxRate} 
                              onChange={e => handleMappedItemChange(idx, 'taxRate', parseFloat(e.target.value))}
                            >
                              {TVA_RATES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Totals HT / TVA / TTC ── */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
                padding: '16px', background: 'linear-gradient(135deg, #F8FAFC, #EEF2FF)', 
                borderRadius: '14px', border: '1px solid #E2E8F0'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total HT</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B' }}>{scanTotalHT.toFixed(3)} <span style={{ fontSize: '12px', color: '#94A3B8' }}>DT</span></div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>TVA</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#F59E0B' }}>{scanTotalTVA.toFixed(3)} <span style={{ fontSize: '12px', color: '#94A3B8' }}>DT</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total TTC</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#4F46E5' }}>{scanTotalTTC.toFixed(3)} <span style={{ fontSize: '12px', color: '#94A3B8' }}>DT</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setScanResult(null); }}>Annuler / Scanner un autre</button>
                <button type="submit" className="btn btn-success" style={{ flex: 2 }} disabled={isPending}>
                  {isPending ? 'Enregistrement...' : <><Check size={18} /> Valider & Importer en Stock</>}
                </button>
              </div>
            </form>
          )}

        </div>
      </Modal>

      {/* === Manual Invoice Modal === */}
      <Modal open={manualModalOpen} onClose={() => setManualModalOpen(false)} title="Saisie Manuelle d'une Facture d'Achat" width={800}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {scanResult && (
            <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Fournisseur</div>
                  <input style={{ ...field, padding: '6px 12px', fontSize: '16px', fontWeight: 700, width: '100%', marginTop: '4px' }} 
                         value={scanResult.supplierName || ''} 
                         onChange={e => setScanResult({ ...scanResult, supplierName: e.target.value })} 
                         placeholder="Nom du Fournisseur" 
                         required />
                </div>
              </div>

              <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                <table className="data-table" style={{ fontSize: '13px', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Article Acheté</th>
                      <th>Association Stock</th>
                      <th>Qté</th>
                      <th>Prix Unitaire HT</th>
                      <th>TVA</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedItems.map((item, idx) => {
                      const tvaBadge = getTvaBadgeColor(item.taxRate || 0);
                      return (
                        <tr key={idx}>
                          <td>
                            <input style={{ ...field, padding: '6px' }} value={item.name} onChange={e => handleMappedItemChange(idx, 'name', e.target.value)} required placeholder="Nom article" />
                          </td>
                          <td>
                            <select style={{ ...field, padding: '6px' }} value={item.stockItemId} onChange={e => {
                              const v = e.target.value;
                              handleMappedItemChange(idx, 'stockItemId', v);
                              if (v !== 'NEW' && v !== '') {
                                const stockItem = stockItems.find(s => s.id === v);
                                if (stockItem) {
                                  if (!item.name) handleMappedItemChange(idx, 'name', stockItem.name);
                                  handleMappedItemChange(idx, 'taxRate', Number(stockItem.taxRate ?? 0.19));
                                }
                              }
                            }} required>
                              <option value="">-- Sélectionner --</option>
                              <option value="NEW">+ Créer Nouveau</option>
                              {stockItems.map(si => (
                                <option key={si.id} value={si.id}>{si.name} ({si.unit?.name || '—'})</option>
                              ))}
                            </select>
                            
                            {item.stockItemId === 'NEW' && (
                              <select style={{ ...field, padding: '4px', marginTop: '4px', fontSize: '11px' }} value={item.unitId} onChange={e => handleMappedItemChange(idx, 'unitId', e.target.value)} required>
                                <option value="">-- Unité --</option>
                                {globalUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                            )}
                          </td>
                          <td style={{ width: '80px' }}>
                            <input style={{ ...field, padding: '6px', textAlign: 'center' }} type="number" step="any" value={item.quantity} onChange={e => handleMappedItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} required />
                          </td>
                          <td style={{ width: '110px' }}>
                            <input style={{ ...field, padding: '6px', textAlign: 'center' }} type="number" step="any" value={item.cost} onChange={e => handleMappedItemChange(idx, 'cost', parseFloat(e.target.value) || 0)} required />
                          </td>
                          <td style={{ width: '100px' }}>
                            <select 
                              style={{ ...field, padding: '6px', background: tvaBadge.bg, color: tvaBadge.color, fontWeight: 700, borderColor: tvaBadge.color + '44' }} 
                              value={item.taxRate} 
                              onChange={e => handleMappedItemChange(idx, 'taxRate', parseFloat(e.target.value))}
                            >
                              {TVA_RATES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {mappedItems.length > 1 && (
                              <button type="button" className="btn btn-ghost" style={{ padding: 4, color: '#EF4444' }} onClick={() => setMappedItems(prev => prev.filter((_, i) => i !== idx))}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button type="button" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setMappedItems(prev => [...prev, { name: '', quantity: 1, cost: 0, taxRate: 0.19, stockItemId: '', unitId: '' }])}>
                  + Ajouter une Ligne
                </button>
              </div>

              {/* ── Totals HT / TVA / TTC ── */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
                padding: '16px', background: 'linear-gradient(135deg, #F8FAFC, #EEF2FF)', 
                borderRadius: '14px', border: '1px solid #E2E8F0'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total HT</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B' }}>{scanTotalHT.toFixed(3)} <span style={{ fontSize: '12px', color: '#94A3B8' }}>DT</span></div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>TVA</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#F59E0B' }}>{scanTotalTVA.toFixed(3)} <span style={{ fontSize: '12px', color: '#94A3B8' }}>DT</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total TTC</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#4F46E5' }}>{scanTotalTTC.toFixed(3)} <span style={{ fontSize: '12px', color: '#94A3B8' }}>DT</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setManualModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-success" style={{ flex: 2 }} disabled={isPending || mappedItems.length === 0}>
                  {isPending ? 'Enregistrement...' : <><Check size={18} /> Valider & Importer en Stock</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* === Adjust Stock Modal === */}
      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title={`Ajustement Stock — ${adjustTarget?.name}`} width={380}>
        <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Stock Actuel</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>{Number(adjustTarget?.quantity).toFixed(2)} <span style={{ fontSize: '14px', color: '#94A3B8' }}>{adjustTarget?.unit?.name}</span></div>
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
