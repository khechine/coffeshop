'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { ShoppingBag, ChevronRight, Package, Clock, CheckCircle2, Truck, FileText } from 'lucide-react';
import { sanitizeUrl } from '../../lib/imageUtils';

export default function OrdersClient({ orders, store }: any) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#FEF3C7', text: '#D97706', label: 'En attente' };
      case 'CONFIRMED': return { bg: '#DBEAFE', text: '#2563EB', label: 'Confirmée' };
      case 'SHIPPED': return { bg: '#E0E7FF', text: '#4F46E5', label: 'Expédiée' };
      case 'DELIVERED': return { bg: '#DCFCE7', text: '#16A34A', label: 'Livrée' };
      case 'CANCELLED': return { bg: '#FEE2E2', text: '#DC2626', label: 'Annulée' };
      default: return { bg: '#F3F4F6', text: '#6B7280', label: status };
    }
  };

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader store={store} />

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: '#111827', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>Mes Commandes</h1>
            <p style={{ color: '#6B7280', margin: '4px 0 0' }}>Suivez l'état de vos commandes passées sur la marketplace.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
          {/* Orders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <p style={{ color: '#6B7280' }}>Vous n'avez pas encore de commandes.</p>
                <Link href="/marketplace" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 20px', background: '#E31E24', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                  Explorer la Marketplace
                </Link>
              </div>
            ) : (
              orders.map((order: any) => {
                const status = getStatusColor(order.status);
                return (
                  <div 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ 
                      background: '#fff', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      border: `2px solid ${selectedOrder?.id === order.id ? '#111827' : 'transparent'}`,
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', 
                        padding: '4px 8px', borderRadius: '4px',
                        background: status.bg,
                        color: status.text
                      }}>
                        {status.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(order.createdAt)}</span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
                      Commande #{order.id.slice(0,8)}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6B7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={14} /> {order.items.length} article(s)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#111827' }}>
                        {Number(order.total).toFixed(2)} DT
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Details */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', border: '1px solid #E5E7EB', minHeight: '600px' }}>
            {selectedOrder ? (
              <div>
                <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '24px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0 }}>Détails de la Commande</h2>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>#{selectedOrder.id}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
                    <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Fournisseur</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{selectedOrder.vendor?.companyName || 'Fournisseur inconnu'}</span>
                    </div>
                    <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Date</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Total</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#E31E24' }}>{Number(selectedOrder.total).toFixed(2)} DT</span>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', marginBottom: '20px' }}>Articles ({selectedOrder.items.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Package size={24} color="#9CA3AF" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#111827' }}>{item.name || 'Produit'}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Quantité: {item.quantity}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 900, color: '#111827' }}>
                        {(Number(item.price) * Number(item.quantity)).toFixed(2)} DT
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/marketplace/messages?userId=${selectedOrder.vendor?.userId}`} style={{ padding: '12px 24px', background: '#111827', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                     Contacter le fournisseur
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#6B7280' }}>
                <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <p>Sélectionnez une commande pour voir les détails.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
