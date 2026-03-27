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

  const handleContact = (phone: string) => {
    window.open(`https://wa.me/${phone?.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {orders.map((order: any) => (
        <div key={order.id} className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>COMMANDE #{order.id.slice(-6).toUpperCase()}</span>
                <span className={`badge ${order.status === 'PENDING' ? 'orange' : (order.status === 'CANCELLED' ? 'red' : 'green')}`}>{order.status}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{order.store.name}</h3>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748B' }}>
                   <MapPin size={14} /> {order.store.city}, {order.store.address}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748B' }}>
                   <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                 </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>TOTAL À RECEVOIR</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#4F46E5' }}>{Number(order.total).toFixed(3)} DT</div>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
             <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Articles commandés</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {order.items.map((item: any) => (
                 <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                   <div style={{ fontWeight: 600, color: '#1E293B' }}>{item.name} <span style={{ color: '#94A3B8', fontWeight: 400 }}>× {Number(item.quantity)}</span></div>
                   <div style={{ fontWeight: 700, color: '#4F46E5' }}>{(Number(item.price) * Number(item.quantity)).toFixed(3)} DT</div>
                 </div>
               ))}
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
             <button 
               onClick={() => handleContact(order.store.phone)}
               className="btn btn-outline" 
               style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
             >
               <Phone size={14} /> Contacter le café
             </button>
             {order.status === 'PENDING' && (
               <div style={{ display: 'flex', gap: '12px' }}>
                 <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', background: '#EEF2FF', padding: '0 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                   <Truck size={14} color="#6366F1" />
                   <select style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, outline: 'none', color: '#1E1B4B', padding: '10px 0' }}>
                     <option value="">Attribuer un livreur...</option>
                     <option value="1">Sami Express (Vélo)</option>
                     <option value="2">Moez Transport (Camion)</option>
                     <option value="3">Ahmed Livraison (Moto)</option>
                   </select>
                 </div>
                 <button 
                   onClick={() => handleStatusChange(order.id, 'SHIPPED')}
                   disabled={isPending}
                   className="btn btn-primary" 
                   style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                 >
                   Envoyer
                 </button>
               </div>
             )}
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
          <ShoppingBag size={48} style={{ color: '#E2E8F0', marginBottom: '16px' }} />
          <h3>Aucune commande reçue</h3>
          <p style={{ color: '#64748B' }}>Vos commandes marketplace s'afficheront ici dès qu'un café passera commande.</p>
        </div>
      )}
    </div>
  );
}
