'use client';

import { useState } from 'react';
import { 
  Plus, Search, Filter, Calendar, Clock, User, Phone, 
  ChevronRight, MoreHorizontal, CheckCircle2, AlertCircle,
  Package, DollarSign, FileText, Download, Printer,
  Edit, Trash2, Banknote
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createSpecialOrderAction, updateSpecialOrderStatusAction, updateSpecialOrderAction, deleteSpecialOrderAction, paySpecialOrderAction } from '../../../../app/actions';

export default function ProductionOrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  
  // New Order Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    deliveryTime: '10:00',
    notes: '',
    depositAmount: 0
  });

  const filteredOrders = orders.filter(o => 
    o.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    o.productName?.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateSpecialOrderStatusAction(id, status);
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        ...formData,
        deliveryDate: new Date(formData.deliveryDate),
        totalPrice: formData.quantity * formData.unitPrice
      };

      if (editingOrder) {
        const res = await updateSpecialOrderAction(editingOrder.id, orderData);
        setOrders(orders.map(o => o.id === editingOrder.id ? { ...o, ...res } : o));
      } else {
        const res = await createSpecialOrderAction(orderData);
        setOrders([res, ...orders]);
      }
      setIsModalOpen(false);
      setEditingOrder(null);
      resetForm();
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '', clientPhone: '', productName: '',
      quantity: 1, unitPrice: 0, deliveryDate: format(new Date(), 'yyyy-MM-dd'),
      deliveryTime: '10:00', notes: '', depositAmount: 0
    });
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData({
      clientName: order.clientName || '',
      clientPhone: order.clientPhone || '',
      productName: order.productName || '',
      quantity: Number(order.quantity) || 1,
      unitPrice: Number(order.unitPrice) || 0,
      deliveryDate: format(new Date(order.deliveryDate), 'yyyy-MM-dd'),
      deliveryTime: order.deliveryTime || '10:00',
      notes: order.notes || '',
      depositAmount: Number(order.depositAmount) || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      await deleteSpecialOrderAction(id);
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const handlePay = async (id: string) => {
    if (confirm("Valider le paiement de cette commande ? Un ticket de vente sera généré.")) {
      await paySpecialOrderAction(id, 'CASH');
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'DELIVERED' } : o));
      // Optional: trigger print via global print context
      alert("Commande payée et ticket généré !");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'READY': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DELIVERED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Commandes</h1>
          <p className="text-slate-500 text-sm font-medium">Gérez vos commandes clients et acomptes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingOrder(null); resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus size={20} />
            Nouvelle Commande
          </button>
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un client, un produit..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{orders.filter(o => o.status === 'PENDING').length}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">À Confirmer</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{orders.filter(o => o.status === 'READY').length}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Prêtes</div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Client & Commande</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Échéance</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Montant</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{order.clientName}</span>
                      <span className="text-xs text-slate-400 font-medium">{order.orderNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{order.productName}</span>
                      <span className="text-xs text-slate-400 font-medium">Qté: {Number(order.quantity)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-600">
                        {format(new Date(order.deliveryDate), 'dd MMM', { locale: fr })}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">à {order.deliveryTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">{Number(order.totalPrice).toFixed(3)} DT</span>
                      {Number(order.depositAmount) > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold">Acompte: {Number(order.depositAmount).toFixed(3)} DT</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-1">
                      {order.status !== 'DELIVERED' && (
                        <button 
                          onClick={() => handlePay(order.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Payer la commande"
                        >
                          <Banknote size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(order)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Modifier la commande"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Supprimer la commande"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                        <Package size={40} />
                      </div>
                      <p className="text-slate-400 font-bold">Aucune commande trouvée</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">{editingOrder ? 'Modifier la Commande' : 'Nouvelle Commande Client'}</h2>
                <p className="text-sm text-slate-500 font-medium">Saisissez les détails de la commande</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Client</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="text"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                      placeholder="Nom du client"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="tel"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                      placeholder="00 000 000"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Produit à préparer</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                    placeholder="ex: Gâteau d'anniversaire Chocolat"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Quantité</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Prix Unitaire</label>
                  <div className="relative">
                    <input 
                      required
                      type="number"
                      step="0.001"
                      className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">DT</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Total</label>
                  <div className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-indigo-50/50 font-black text-indigo-600 flex items-center justify-between">
                    <span>{(formData.quantity * formData.unitPrice).toFixed(3)}</span>
                    <span className="text-[10px]">DT</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Date de livraison</label>
                  <input 
                    required
                    type="date"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Heure</label>
                  <input 
                    type="time"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] px-6 py-4 rounded-2xl font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Sauvegarde...' : (editingOrder ? 'Enregistrer les modifications' : 'Valider la Commande')}
                  {!loading && <ChevronRight size={20} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
