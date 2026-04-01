'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Truck, Package, Send, ChevronDown } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createSupplier, updateSupplier, deleteSupplier, createSupplierOrder, updateOrderStatus, deleteSupplierOrder } from '../../actions';

interface Supplier { id: string; name: string; contact: string | null; phone: string | null; orders: any[] }
interface StockItem { id: string; name: string; unit: string; quantity: any }
interface Order { id: string; status: string; total: any; createdAt: any; supplier: { id: string; name: string }; store: { name: string }; items: { id: string; quantity: any; price: any; stockItem: { name: string; unit: string } }[] }

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  PENDING:   { label: 'En Attente',  badge: 'orange' },
  CONFIRMED: { label: 'Confirmée',   badge: 'blue' },
  SHIPPED:   { label: 'Expédiée',    badge: 'purple' },
  DELIVERED: { label: 'Livrée',      badge: 'green' },
  CANCELLED: { label: 'Annulée',     badge: 'red' },
  PAID:      { label: 'Payée',       badge: 'green' },
};

export default function VendorClient({ suppliers, allOrders, stockItems }: { suppliers: Supplier[]; allOrders: Order[]; stockItems: StockItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<'orders' | 'suppliers'>('orders');

  // Supplier CRUD
  const [suppModal, setSuppModal] = useState(false);
  const [editingSupp, setEditingSupp] = useState<Supplier | null>(null);
  const [suppForm, setSuppForm] = useState({ name: '', contact: '', phone: '' });
  const [deleteSuppTarget, setDeleteSuppTarget] = useState<Supplier | null>(null);

  // Order CRUD
  const [orderModal, setOrderModal] = useState(false);
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState({ supplierId: '', items: [{ stockItemId: '', quantity: '', price: '' }] });

  const field: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  const openCreateSupp = () => { setEditingSupp(null); setSuppForm({ name: '', contact: '', phone: '' }); setSuppModal(true); };
  const openEditSupp = (s: Supplier) => { setEditingSupp(s); setSuppForm({ name: s.name, contact: s.contact || '', phone: s.phone || '' }); setSuppModal(true); };

  const handleSuppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingSupp) await updateSupplier(editingSupp.id, suppForm);
      else await createSupplier(suppForm);
      setSuppModal(false);
    });
  };

  const handleDeleteSupp = async () => {
    if (!deleteSuppTarget) return;
    startTransition(async () => { await deleteSupplier(deleteSuppTarget.id); setDeleteSuppTarget(null); });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createSupplierOrder({
        supplierId: orderForm.supplierId,
        items: orderForm.items.filter(i => i.stockItemId).map(i => ({ stockItemId: i.stockItemId, quantity: parseFloat(i.quantity), price: parseFloat(i.price) })),
      });
      setOrderModal(false);
      setOrderForm({ supplierId: '', items: [{ stockItemId: '', quantity: '', price: '' }] });
    });
  };

  const addOrderLine = () => setOrderForm(f => ({ ...f, items: [...f.items, { stockItemId: '', quantity: '', price: '' }] }));
  const removeOrderLine = (idx: number) => setOrderForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateOrderLine = (idx: number, key: string, val: string) => setOrderForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [key]: val } : it) }));

  const handleStatusChange = (orderId: string, status: string) => {
    startTransition(async () => { await updateOrderStatus(orderId, status); });
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderTarget) return;
    startTransition(async () => { await deleteSupplierOrder(deleteOrderTarget.id); setDeleteOrderTarget(null); });
  };

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '12px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
        {[{ key: 'orders', label: '📦 Commandes' }, { key: 'suppliers', label: '🏭 Fournisseurs' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all .15s', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#4F46E5' : '#64748B', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ ORDERS TAB ═══ */}
      {tab === 'orders' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Package size={16} /> Commandes de Réapprovisionnement</span>
            <button className="btn btn-primary" onClick={() => setOrderModal(true)} disabled={suppliers.length === 0}>
              <Plus size={14} /> Nouvelle Commande
            </button>
          </div>

          {allOrders.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
              <Package size={40} style={{ margin: '0 auto 12px', opacity: .3 }} />
              <p style={{ fontWeight: 600 }}>Aucune commande. Créez votre première commande B2B.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {allOrders.map((order, idx) => {
                const statusConf = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                return (
                  <div key={order.id} style={{ padding: '20px 24px', borderBottom: idx < allOrders.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className={`badge ${statusConf.badge}`}>{statusConf.label}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94A3B8' }}>#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '16px' }}>
                          {order.supplier.name} → {order.store.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 900, color: '#4F46E5' }}>{Number(order.total).toFixed(3)} DT</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} disabled={isPending}
                            style={{ ...field, width: 'auto', padding: '6px 10px', fontSize: '12px', background: '#fff' }}>
                            {Object.entries(STATUS_MAP).map(([val, conf]) => <option key={val} value={val}>{conf.label}</option>)}
                          </select>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', color: '#EF4444' }} onClick={() => setDeleteOrderTarget(order)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {order.items.map((item: any) => (
                          <span key={item.id} className="badge gray">
                            {Number(item.quantity)} {item.stockItem?.unit || ''} {item.stockItem?.name || item.name} × {Number(item.price).toFixed(3)} DT
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ SUPPLIERS TAB ═══ */}
      {tab === 'suppliers' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Truck size={16} /> Fournisseurs</span>
            <button className="btn btn-primary" onClick={openCreateSupp}><Plus size={14} /> Nouveau Fournisseur</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fournisseur</th>
                  <th>Contact</th>
                  <th>Téléphone</th>
                  <th>Commandes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: '#1E293B' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748B' }}>{s.contact || '—'}</td>
                    <td style={{ color: '#64748B' }}>{s.phone || '—'}</td>
                    <td><span className="badge blue">{s.orders.length} commandes</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', marginRight: '4px' }} onClick={() => openEditSupp(s)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', color: '#EF4444' }} onClick={() => setDeleteSuppTarget(s)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                    <p style={{ fontWeight: 600 }}>Aucun fournisseur. Ajoutez-en un.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === Supplier Modal === */}
      <Modal open={suppModal} onClose={() => setSuppModal(false)} title={editingSupp ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}>
        <form onSubmit={handleSuppSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={label}>Nom du Fournisseur</label><input style={field} value={suppForm.name} onChange={e => setSuppForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Grossiste Ben Yedder" required /></div>
          <div><label style={label}>Contact (nom du responsable)</label><input style={field} value={suppForm.contact} onChange={e => setSuppForm(f => ({ ...f, contact: e.target.value }))} placeholder="ex: M. Kamel B." /></div>
          <div><label style={label}>Téléphone</label><input style={field} value={suppForm.phone} onChange={e => setSuppForm(f => ({ ...f, phone: e.target.value }))} placeholder="+216 XX XXX XXX" /></div>
          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSuppModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>{isPending ? '...' : (editingSupp ? 'Mettre à Jour' : 'Créer')}</button>
          </div>
        </form>
      </Modal>

      {/* === Order Modal === */}
      <Modal open={orderModal} onClose={() => setOrderModal(false)} title="Nouvelle Commande B2B" width={560}>
        <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={label}>Fournisseur</label>
            <select style={field} value={orderForm.supplierId} onChange={e => setOrderForm(f => ({ ...f, supplierId: e.target.value }))} required>
              <option value="">-- Sélectionner un fournisseur --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ ...label, marginBottom: 0 }}>Articles à Commander</label>
              <button type="button" className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={addOrderLine}><Plus size={12} /> Ajouter ligne</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {orderForm.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <select style={field} value={item.stockItemId} onChange={e => updateOrderLine(idx, 'stockItemId', e.target.value)}>
                    <option value="">-- Article --</option>
                    {stockItems.map(si => <option key={si.id} value={si.id}>{si.name} ({si.unit})</option>)}
                  </select>
                  <input style={field} type="number" step="any" min="0" placeholder="Qté" value={item.quantity} onChange={e => updateOrderLine(idx, 'quantity', e.target.value)} />
                  <input style={field} type="number" step="any" min="0" placeholder="Prix/u DT" value={item.price} onChange={e => updateOrderLine(idx, 'price', e.target.value)} />
                  <button type="button" style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: '#FEE2E2', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => removeOrderLine(idx)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: '#64748B' }}>Total Estimé</span>
            <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: '18px' }}>
              {orderForm.items.reduce((acc, i) => acc + (parseFloat(i.quantity || '0') * parseFloat(i.price || '0')), 0).toFixed(3)} DT
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOrderModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
              {isPending ? '...' : <><Send size={14} /> Envoyer la Commande</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Supplier */}
      <Modal open={!!deleteSuppTarget} onClose={() => setDeleteSuppTarget(null)} title="Supprimer Fournisseur" width={400}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Trash2 size={24} color="#EF4444" /></div>
          <p style={{ fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Supprimer "{deleteSuppTarget?.name}" ?</p>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>Toutes ses commandes seront également supprimées.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteSuppTarget(null)}>Annuler</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteSupp} disabled={isPending}>{isPending ? '...' : 'Supprimer'}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Order */}
      <Modal open={!!deleteOrderTarget} onClose={() => setDeleteOrderTarget(null)} title="Supprimer Commande" width={400}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Trash2 size={24} color="#EF4444" /></div>
          <p style={{ fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Supprimer cette commande ?</p>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>Référence: #{deleteOrderTarget?.id.slice(-6).toUpperCase()}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteOrderTarget(null)}>Annuler</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteOrder} disabled={isPending}>{isPending ? '...' : 'Supprimer'}</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
