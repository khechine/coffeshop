'use client';

import React, { useTransition } from 'react';
import { ShoppingBag, MapPin, Phone, User, Calendar, Truck } from 'lucide-react';
import { updateSupplierOrderStatus } from '../../../actions';

export default function VendorOrderListClient({ orders }: { orders: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (orderId: string, status: any) => {
    startTransition(async () => {
      await updateSupplierOrderStatus(orderId, status);
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'En attente', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'CONFIRMED': return { label: 'Confirmée', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'SHIPPED': return { label: 'Expédiée', class: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
      case 'DELIVERED': return { label: 'Livrée', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'CANCELLED': return { label: 'Annulée', class: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
      default: return { label: status, class: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    }
  };

  const handleContact = (phone: string) => {
    window.open(`https://wa.me/${phone?.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {orders.map((order: any) => {
        const statusConfig = getStatusConfig(order.status);
        return (
          <div 
            key={order.id} 
            className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[40px] p-6 md:p-10 backdrop-blur-md transition-all hover:border-indigo-500/30 group relative overflow-hidden shadow-sm dark:shadow-none"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 pb-8 border-b border-slate-100 dark:border-slate-800/50 mb-8 relative z-10">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
                    Réf #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusConfig.class}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight mb-2">
                    {order.store.name}
                  </h3>
                  <div className="flex flex-wrap gap-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <MapPin size={12} className="text-indigo-600 dark:text-indigo-400" /> 
                      </div>
                      {order.store.city}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Calendar size={12} className="text-indigo-600 dark:text-indigo-400" /> 
                      </div>
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-auto">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm min-w-[200px] shadow-inner">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 lg:text-right">Total Commande</div>
                  <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 flex items-baseline lg:justify-end gap-1.5">
                    {Number(order.total).toFixed(3)} 
                    <span className="text-sm font-bold opacity-40">DT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                  <ShoppingBag size={14} className="text-indigo-600 dark:text-indigo-500" /> Détails des articles
                </div>
                <div className="bg-white dark:bg-slate-950/20 rounded-3xl border border-slate-100 dark:border-slate-800/30 overflow-hidden shadow-sm dark:shadow-none">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/40">
                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Article</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Qté</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Prix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                      {order.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">Prix unitaire: {Number(item.price).toFixed(3)} DT</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-xs font-black text-indigo-600 dark:text-indigo-400">
                              {Number(item.quantity)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white text-sm">
                            {(Number(item.price) * Number(item.quantity)).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-end gap-4">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                  <User size={14} className="text-indigo-600 dark:text-indigo-500" /> Actions rapides
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleContact(order.store.phone)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all group/wa shadow-sm dark:shadow-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 group-hover/wa:scale-110 transition-transform">
                      <Phone size={18} />
                    </div>
                    WhatsApp
                  </button>
                  
                  <button 
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white transition-transform">
                      <MapPin size={18} />
                    </div>
                    Itinéraire
                  </button>
                </div>

                {order.status === 'PENDING' ? (
                  <div className="space-y-3 pt-2">
                    <div className="relative flex items-center gap-3 bg-white dark:bg-slate-950/50 px-5 py-4 rounded-[24px] border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 transition-colors shadow-sm dark:shadow-none">
                      <Truck size={20} className="text-indigo-600 dark:text-indigo-400" />
                      <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-900 dark:text-slate-200 cursor-pointer flex-1">
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Choisir un livreur...</option>
                        <option value="1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sami Express (Moto)</option>
                        <option value="2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Moez Transport (Camion)</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => handleStatusChange(order.id, 'SHIPPED')}
                      disabled={isPending}
                      className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 uppercase tracking-widest"
                    >
                      {isPending ? 'Confirmation...' : 'Confirmer l\'expédition'}
                    </button>
                  </div>
                ) : order.status === 'SHIPPED' ? (
                  <button 
                    onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] bg-emerald-600 text-white font-black text-sm hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 uppercase tracking-widest mt-2"
                  >
                    {isPending ? 'Mise à jour...' : 'Marquer comme livré'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 bg-white dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-[60px] text-center px-10 shadow-sm dark:shadow-none">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-slate-100 dark:border-slate-800">
            <ShoppingBag size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Aucune commande</h3>
          <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
            Votre boîte de réception est vide. Les nouvelles commandes B2B de vos clients apparaîtront ici.
          </p>
        </div>
      )}
    </div>
  );
}
