'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  ShoppingBag, MapPin, Clock, AlertTriangle, CheckCircle2, 
  ChevronRight, Filter, Bell, BellRing, Package, ArrowRight,
  Users, Tag, X
} from 'lucide-react';
import Link from 'next/link';
import { updateVendorCustomerAction, updateSupplierOrderStatus, approveMarketplaceOrderAction, addVendorCustomerAction } from '../../../actions';

export default function VendorOrdersClient({ initialOrders, initialAlerts }: any) {
  const [orders, setOrders] = useState(initialOrders);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isPending, startTransition] = useTransition();
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [filterPos, setFilterPos] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [taggingCust, setTaggingCust] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (taggingCust) {
      setTagInput(taggingCust.tags?.join(', ') || '');
    }
  }, [taggingCust]);

  const handleUpdateCustomer = (id: string, data: { category?: string; tags?: string[] }) => {
    startTransition(async () => {
      let realId = id;
      
      // If this is a new customer (no existing CRM record), create one first
      if (id.startsWith('new_')) {
        const storeId = id.replace('new_', '');
        try {
          const newCustomer = await addVendorCustomerAction(storeId);
          realId = newCustomer.id;
          // Update taggingCust with real ID
          setTaggingCust((prev: any) => prev ? { ...prev, id: realId } : prev);
        } catch (e: any) {
          console.error('Failed to create CRM record:', e);
          alert('Erreur lors de la création du client CRM. Veuillez réessayer.');
          return;
        }
      }
      
      await updateVendorCustomerAction(realId, data);
      // Update local state to reflect tags
      setOrders((prev: any) => prev.map((o: any) => {
        const vcId = o.store?.vendorCustomers?.[0]?.id;
        if (vcId === realId || vcId === id) {
          return {
            ...o,
            store: {
              ...o.store,
              vendorCustomers: [{ ...(o.store.vendorCustomers?.[0] || {}), id: realId, ...data }]
            }
          };
        }
        return o;
      }));
      setTaggingCust((prev: any) => (prev?.id === realId || prev?.id === id) ? { ...prev, id: realId, ...data } : prev);
    });
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setLoadingOrderId(orderId);
    startTransition(async () => {
      try {
        await updateSupplierOrderStatus(orderId, newStatus as any);
        // When vendor confirms, also trigger the settlement/approval flow
        if (newStatus === 'CONFIRMED') {
          try {
            await approveMarketplaceOrderAction(orderId, 'VENDOR');
          } catch (e) {
            console.log('Settlement approval note:', e);
          }
        }
        setOrders((prev: any) => prev.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o));
      } finally {
        setLoadingOrderId(null);
      }
    });
  };

  // Sound alert for new orders
  useEffect(() => {
    const playSound = () => {
       const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
       audio.play().catch(e => console.log('Audio autoplay blocked'));
    };

    // Check if new orders arrived (simulated refresh logic here or in parent)
    // For now, let's just show how we'd handle it
  }, [orders.length]);

  const posList = Array.from(new Set(orders.map((o: any) => o.vendorPos?.name).filter(Boolean)));

  const filteredOrders = orders.filter((o: any) => {
    if (filterPos !== 'all' && o.vendorPos?.name !== filterPos) return false;
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CONFIRMED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* HEADER & ALERTS SUMMARY */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestion des Commandes</h1>
          <p className="text-slate-500 font-medium mt-2">Suivi centralisé et alertes temps réel pour tous vos points de vente.</p>
        </div>
        
        {alerts.length > 0 && (
          <div className="flex gap-3 bg-rose-50 border-2 border-rose-100 p-4 rounded-3xl animate-pulse">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <BellRing size={24} />
            </div>
            <div>
              <div className="text-rose-900 font-black text-sm">{alerts.length} Alertes Critiques</div>
              <div className="text-rose-600 text-xs font-bold">Action immédiate requise</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT COLUMN: FILTERS & ALERTS LIST */}
        <div className="lg:col-span-1 space-y-6">
           {posList.length > 0 && (
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Filtrer par Magasin</label>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setFilterPos('all')}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all ${filterPos === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      Tous les magasins
                    </button>
                    {posList.map((pos: any) => (
                      <button 
                        key={pos}
                        onClick={() => setFilterPos(pos)}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all ${filterPos === pos ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
           )}

           {/* ACTIVE ALERTS LIST */}
           <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Alertes Actives</h2>
              {alerts.map((alert: any, i: number) => (
                <div key={i} className={`p-4 rounded-2xl border-l-4 shadow-sm flex gap-3 ${alert.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-500' : 'bg-amber-50 border-amber-500'}`}>
                   {alert.type === 'SLA_DELAY' ? <Clock className="text-rose-500 shrink-0" size={18} /> : <Package className="text-amber-500 shrink-0" size={18} />}
                   <div className="text-xs font-bold leading-tight">
                      <div className={alert.severity === 'CRITICAL' ? 'text-rose-900' : 'text-amber-900'}>{alert.message}</div>
                      <div className="opacity-60 mt-1 uppercase text-[9px]">{alert.posName}</div>
                   </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-xs font-bold">
                  Aucune alerte en cours
                </div>
              )}
           </div>
        </div>

        {/* MAIN COLUMN: ORDERS LIST */}
        <div className="lg:col-span-3 space-y-4">
           {filteredOrders.map((order: any) => (
             <div key={order.id} className="bg-white border border-slate-100 rounded-[32px] p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                {/* Delayed Indicator Overlay */}
                {alerts.some((a: any) => a.orderId === order.id) && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 animate-pulse" />
                )}

                <div className="flex flex-col md:flex-row justify-between gap-6">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                         <ShoppingBag size={24} />
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-black text-slate-900">#{order.id.slice(-6)}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                               {order.status}
                            </span>
                         </div>
                         <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5"><MapPin size={14} className="text-indigo-500" /> {(order.status === 'PENDING' || order.status === 'CANCELLED') ? 'Client masqué' : (order.store?.name || 'Inconnu')}</div>
                            <div className="flex items-center gap-1.5"><Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString()}</div>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-6">
                      <div className="text-right">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant Total</div>
                         <div className="text-2xl font-black text-slate-900">{Number(order.total).toFixed(3)} <span className="text-xs">DT</span></div>
                      </div>
                      {(order.status !== 'PENDING' && order.status !== 'CANCELLED') && (
                        <>
                          <Link 
                            href={`/vendor/portal/crm?search=${encodeURIComponent(order.store?.name || '')}`}
                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-2"
                          >
                             <Users size={12} /> CRM
                          </Link>
                          <button 
                            onClick={() => {
                               const vc = order.store?.vendorCustomers?.[0] || { id: `new_${order.store?.id}` };
                               setTaggingCust({ ...vc, store: order.store });
                            }}
                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                            title="Taguer le client"
                          >
                             <Tag size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                      >
                         <ChevronRight size={20} className={`transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`} />
                      </button>
                   </div>
                </div>

                {/* Expanded Details */}
                {expandedOrderId === order.id && (
                  <div className="mt-6 pt-6 border-t border-slate-50 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Articles commandés</div>
                     {order.items?.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-center text-sm font-bold text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                             x{item.quantity}
                           </div>
                           <span>{item.name || 'Produit'}</span>
                         </div>
                         <span>{Number(Number(item.price) * item.quantity).toFixed(3)} DT</span>
                       </div>
                     ))}
                  </div>
                )}

                {/* Order Actions based on status */}
                {order.status === 'PENDING' ? (
                  <div className="mt-4 border-t border-slate-50 pt-4 flex gap-3">
                    <button 
                      onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                      disabled={loadingOrderId === order.id}
                      className="w-1/3 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                      {loadingOrderId === order.id ? '...' : 'Rejeter'}
                    </button>
                    <button 
                      onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                      disabled={loadingOrderId === order.id}
                      className="w-2/3 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {loadingOrderId === order.id ? 'Validation...' : 'Accepter la commande'}
                    </button>
                  </div>
                ) : order.status === 'CONFIRMED' ? (
                  <div className="mt-4 border-t border-slate-50 pt-4 flex gap-3">
                    <button 
                      onClick={() => handleStatusChange(order.id, 'SHIPPED')}
                      disabled={loadingOrderId === order.id}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {loadingOrderId === order.id ? 'Envoi...' : 'Confirmer l\'expédition'}
                    </button>
                  </div>
                ) : order.status === 'SHIPPED' ? (
                  <div className="mt-4 border-t border-slate-50 pt-4">
                    <button 
                      onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                      disabled={loadingOrderId === order.id}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {loadingOrderId === order.id ? 'Mise à jour...' : 'Marquer comme livré'}
                    </button>
                  </div>
                ) : null}

                {/* ITEMS PREVIEW */}
                <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                   {order.items.map((it: any) => (
                     <div key={it.id} className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                        {it.name} <span className="text-indigo-600 ml-1">x{Number(it.quantity)}</span>
                     </div>
                   ))}
                </div>
             </div>
           ))}

           {filteredOrders.length === 0 && (
             <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                <div className="text-lg font-black text-slate-900 mb-2">Aucune commande</div>
                <p className="text-slate-500 text-sm">Les commandes apparaîtront ici dès qu'un client passera une commande sur la Marketplace.</p>
             </div>
           )}
        </div>

      </div>
      {taggingCust && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-2xl text-slate-900">Taguer {taggingCust.store?.name}</h3>
              <button onClick={() => setTaggingCust(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <p className="text-slate-400 font-bold text-sm mb-8">Segmenter ce client B2B directement depuis sa commande.</p>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {['VIP', 'REGULAR', 'CHURN_RISK'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => handleUpdateCustomer(taggingCust.id, { category: cat })}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${taggingCust.category === cat ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-md shadow-rose-500/10' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags personnalisés</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Ex: Boulangerie, Sousse"
                    className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-900"
                  />
                  <button 
                    onClick={() => {
                      const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
                      handleUpdateCustomer(taggingCust.id, { tags });
                    }}
                    className="px-6 bg-rose-600 text-white rounded-2xl font-black text-xs hover:bg-rose-700 transition-all"
                  >
                    OK
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setTaggingCust(null)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all mt-4"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
