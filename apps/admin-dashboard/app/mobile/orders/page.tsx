import React from 'react';
import { ShoppingBag, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getStore } from '../../actions';
import { prisma } from '@coffeeshop/database';

export const dynamic = 'force-dynamic';

export default async function MobileOrdersPage() {
  const store = await getStore();
  let orders = [];

  if (store) {
    orders = await prisma.supplierOrder.findMany({
      where: { storeId: store.id },
      include: { vendor: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>Mes Commandes</h1>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontWeight: 700 }}>Aucune commande pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order: any) => (
            <div key={order.id} style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                <span style={{ padding: '4px 8px', background: order.status === 'DELIVERED' ? '#D1FAE5' : '#FEF3C7', color: order.status === 'DELIVERED' ? '#065F46' : '#92400E', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>
                  {order.status === 'DELIVERED' ? 'LIVRÉE' : 'EN COURS'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>{order.vendor?.companyName || 'Marketplace'}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>{order.items.length} articles</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 950, color: '#111827' }}>{Number(order.total).toFixed(3)} <span style={{ fontSize: '12px' }}>DT</span></div>
                <button style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
