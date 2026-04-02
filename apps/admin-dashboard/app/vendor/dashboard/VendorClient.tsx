'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Truck, Package, Send, ChevronDown, Calendar } from 'lucide-react';
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

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600";
  const labelClass = "block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider";

  const totalSpent = allOrders.reduce((acc, o) => acc + Number(o.total), 0);
  const pendingOrders = allOrders.filter(o => o.status === 'PENDING').length;

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
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card purple">
          <div className="kpi-icon purple">
            <Package size={24} />
          </div>
          <div>
            <p className="kpi-label">Commandes Totales</p>
            <h3 className="kpi-value">{allOrders.length}</h3>
            <div className="text-xs text-slate-500">
              <span className="text-orange-400 font-bold">{pendingOrders}</span> en attente de traitement
            </div>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon green">
            <Truck size={24} />
          </div>
          <div>
            <p className="kpi-label">Dépenses Totales</p>
            <h3 className="kpi-value">{totalSpent.toFixed(3)} DT</h3>
            <div className="text-xs text-slate-500">
              Moyenne de <span className="font-bold">{(totalSpent / (allOrders.length || 1)).toFixed(3)} DT</span> par commande
            </div>
          </div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon blue">
            <Plus size={24} />
          </div>
          <div>
            <p className="kpi-label">Fournisseurs</p>
            <h3 className="kpi-value">{suppliers.length}</h3>
            <div className="text-xs text-slate-500">
              Réseau de partenaires actifs
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-200 dark:bg-slate-900/50 p-1 rounded-2xl w-fit border border-slate-300 dark:border-slate-800/50">
        {[{ key: 'orders', label: 'Commandes', icon: Package }, { key: 'suppliers', label: 'Fournisseurs', icon: Truck }].map(t => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              tab === t.key 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/30'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ ORDERS TAB ═══ */}
      {tab === 'orders' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Package size={20} className="text-indigo-400" />
              Réapprovisionnements
            </h2>
            <button 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors" 
              onClick={() => setOrderModal(true)} 
              disabled={suppliers.length === 0}
            >
              <Plus size={18} /> Nouvelle Commande
            </button>
          </div>

          {allOrders.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Package size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-bold">Aucune commande enregistrée</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {allOrders.map((order) => {
                const statusConf = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                return (
                  <div key={order.id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            statusConf.badge === 'orange' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            statusConf.badge === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            statusConf.badge === 'purple' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            statusConf.badge === 'green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {statusConf.label}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {order.supplier.name} <span className="text-slate-400 dark:text-slate-600 mx-1">→</span> {order.store.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                          <Calendar size={12} />
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-2xl font-black text-indigo-400">{Number(order.total).toFixed(3)} <span className="text-xs opacity-50">DT</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select 
                            value={order.status} 
                            onChange={e => handleStatusChange(order.id, e.target.value)} 
                            disabled={isPending}
                            className="bg-slate-100 dark:bg-slate-800 border-none text-slate-600 dark:text-slate-300 text-xs font-bold py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                          >
                            {Object.entries(STATUS_MAP).map(([val, conf]) => <option key={val} value={val}>{conf.label}</option>)}
                          </select>
                          <button 
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                            onClick={() => setDeleteOrderTarget(order)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-all">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          {Number(item.quantity)} {item.stockItem?.unit || ''} {item.stockItem?.name || item.name} 
                          <span className="text-slate-400 dark:text-slate-500">×</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{Number(item.price).toFixed(3)} DT</span>
                        </div>
                      ))}
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
            <h2 className="text-lg font-black flex items-center gap-2">
              <Truck size={20} className="text-indigo-400" />
              Fournisseurs Partenaires
            </h2>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors" onClick={openCreateSupp}>
              <Plus size={18} /> Nouveau Fournisseur
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-center">Commandes</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-sm">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-medium">{s.contact || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-medium font-mono">{s.phone || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-indigo-500/20 uppercase">
                        {s.orders.length} commandes
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" onClick={() => openEditSupp(s)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all" onClick={() => setDeleteSuppTarget(s)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500 font-bold">
                      Aucun fournisseur ajouté
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === Supplier Modal === */}
      <Modal open={suppModal} onClose={() => setSuppModal(false)} title={editingSupp ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}>
        <form onSubmit={handleSuppSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Nom du Fournisseur</label>
            <input className={inputClass} value={suppForm.name} onChange={e => setSuppForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Grossiste Ben Yedder" required />
          </div>
          <div>
            <label className={labelClass}>Contact (nom du responsable)</label>
            <input className={inputClass} value={suppForm.contact} onChange={e => setSuppForm(f => ({ ...f, contact: e.target.value }))} placeholder="ex: M. Kamel B." />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input className={inputClass} value={suppForm.phone} onChange={e => setSuppForm(f => ({ ...f, phone: e.target.value }))} placeholder="+216 XX XXX XXX" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setSuppModal(false)}>Annuler</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50" disabled={isPending}>
              {isPending ? 'Chargement...' : (editingSupp ? 'Mettre à Jour' : 'Créer Fournisseur')}
            </button>
          </div>
        </form>
      </Modal>

      {/* === Order Modal === */}
      <Modal open={orderModal} onClose={() => setOrderModal(false)} title="Nouvelle Commande B2B" width={600}>
        <form onSubmit={handleOrderSubmit} className="space-y-6">
          <div>
            <label className={labelClass}>Sélectionner le Fournisseur</label>
            <select className={inputClass} value={orderForm.supplierId} onChange={e => setOrderForm(f => ({ ...f, supplierId: e.target.value }))} required>
              <option value="">-- Choisir un partenaire --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className={labelClass + " !mb-0"}>Articles à Commander</label>
              <button type="button" className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/5 border border-indigo-500/10 transition-colors" onClick={addOrderLine}>
                <Plus size={12} /> Ajouter ligne
              </button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {orderForm.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex-1">
                    <select className={inputClass} value={item.stockItemId} onChange={e => updateOrderLine(idx, 'stockItemId', e.target.value)} required>
                      <option value="">-- Article --</option>
                      {stockItems.map(si => <option key={si.id} value={si.id}>{si.name} ({si.unit})</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <input className={inputClass} type="number" step="any" min="0" placeholder="Qté" value={item.quantity} onChange={e => updateOrderLine(idx, 'quantity', e.target.value)} required />
                  </div>
                  <div className="w-32">
                    <input className={inputClass} type="number" step="any" min="0" placeholder="Prix/u" value={item.price} onChange={e => updateOrderLine(idx, 'price', e.target.value)} required />
                  </div>
                  <button type="button" className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors mt-0.5" onClick={() => removeOrderLine(idx)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">Total Estimé</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {orderForm.items.reduce((acc, i) => acc + (parseFloat(i.quantity || '0') * parseFloat(i.price || '0')), 0).toFixed(3)} 
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">DT</span>
              </p>
            </div>
            <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2" disabled={isPending}>
              {isPending ? 'Envoi...' : <><Send size={16} /> Envoyer</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modals with Dark Theme */}
      <Modal open={!!deleteSuppTarget} onClose={() => setDeleteSuppTarget(null)} title="Supprimer Fournisseur" width={400}>
        <div className="text-center p-2">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Supprimer "{deleteSuppTarget?.name}" ?</h3>
          <p className="text-slate-500 dark:text-slate-500 text-sm mb-8 leading-relaxed">Cette action est irréversible. Toutes les commandes liées à ce fournisseur seront définitivement supprimées.</p>
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setDeleteSuppTarget(null)}>Annuler</button>
            <button className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-500 transition-colors" onClick={handleDeleteSupp} disabled={isPending}>{isPending ? '...' : 'Supprimer'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteOrderTarget} onClose={() => setDeleteOrderTarget(null)} title="Supprimer Commande" width={400}>
        <div className="text-center p-2">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Supprimer la commande ?</h3>
          <p className="text-slate-500 text-sm mb-2 font-mono">Référence: #{deleteOrderTarget?.id.slice(-6).toUpperCase()}</p>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">Voulez-vous vraiment retirer cette commande de l'historique ?</p>
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800/50 transition-colors" onClick={() => setDeleteOrderTarget(null)}>Annuler</button>
            <button className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-500 transition-colors" onClick={handleDeleteOrder} disabled={isPending}>{isPending ? '...' : 'Supprimer'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
