'use client';

import React from 'react';
import { ShoppingCart, X, Send, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from './CartContext';
import { useVault } from './VaultContext';
import { sanitizeUrl } from '../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(3);

const VendorGroup = ({ group, updateQty, removeItem }: any) => {
  const { maskName, maskLogo, maskCity, identityVisible } = useVault(group.vendor?.id, group.vendor?.isPremium);
  
  return (
    <div key={group.vendor?.id || 'v'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F3F4F6', overflow: 'hidden', border: '1px solid #E5E7EB', filter: identityVisible ? 'none' : 'blur(4px)' }}>
          <img src={maskLogo(group.vendor?.logoUrl) || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>{maskName(group.vendor?.companyName || 'Fournisseur')}</span>
            {group.vendor?.isPremium && <ShieldCheck size={14} color="#E31E24" fill="#E31E24" />}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} /> {maskCity(group.vendor?.city)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {group.items.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: '#F9FAFB', border: '1px solid #F1F5F9', overflow: 'hidden', flexShrink: 0 }}>
              <img src={sanitizeUrl(item.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>{fmt(item.price)} DT <span style={{ fontWeight: 500, color: '#6B7280', fontSize: '12px' }}>/ unité</span></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: '8px', padding: '4px' }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ width: '30px', textAlign: 'center', fontSize: '13px', fontWeight: 800 }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
               </div>
               <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, updateQty, removeItem, cartTotal, handleCheckout, isOrdering, orderStatus, orderError, dismissError } = useCart();

  // Handle automatic redirect on error
  React.useEffect(() => {
    if (orderError) {
      const timer = setTimeout(() => {
        dismissError();
        window.location.href = '/marketplace';
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderError, dismissError]);

  // Handle redirect on success
  React.useEffect(() => {
    if (orderStatus === 'SUCCESS') {
      const timer = setTimeout(() => {
        alert("Votre commande a été envoyée avec succès !");
        window.location.href = '/marketplace/orders'; 
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [orderStatus]);

  // Group items by vendor
  const groupedItems = cart.reduce((acc: any, item: any) => {
    const vendorId = item.vendor?.id || 'unknown';
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: item.vendor,
        items: []
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {});

  const vendors = Object.values(groupedItems);

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, animation: 'fadeIn 0.3s ease' }} 
        onClick={onClose} 
      />
      <div style={{ 
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '480px', 
        background: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', 
        boxShadow: '-20px 0 60px rgba(0,0,0,0.1)', animation: 'slideIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' 
      }}>
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 950, color: '#111827', margin: 0 }}>Mon Panier</h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>{cart.length} article{cart.length > 1 ? 's' : ''} au total</p>
          </div>
          <button 
            onClick={onClose}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#F9FAFB', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '80px' }}>
              <div style={{ width: '80px', height: '80px', background: '#F9FAFB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <ShoppingCart size={32} color="#D1D5DB" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Votre panier est vide</h3>
              <p style={{ color: '#6B7280', marginTop: '8px', fontSize: '14px' }}>Commencez vos achats pour remplir votre panier.</p>
              <button 
                onClick={onClose}
                style={{ marginTop: '24px', background: '#E31E24', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer' }}
              >
                Explorer la Marketplace
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {vendors.map((group: any, idx: number) => (
                <VendorGroup 
                  key={group.vendor?.id || idx} 
                  group={group} 
                  updateQty={updateQty} 
                  removeItem={removeItem} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '32px', background: '#F9FAFB', borderTop: '1px solid #F1F5F9' }}>
            {orderError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#991B1B' }}>Erreur de transaction</div>
                  <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>{orderError}</div>
                </div>
                <button onClick={dismissError} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>
                <span>Sous-total</span>
                <span>{fmt(cartTotal / 1.19)} DT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>
                <span>TVA (19%)</span>
                <span>{fmt(cartTotal - (cartTotal / 1.19))} DT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111827', fontSize: '20px', fontWeight: 950, marginTop: '8px', paddingTop: '16px', borderTop: '1px dashed #D1D5DB' }}>
                <span>Total TTC</span>
                <span style={{ color: '#E31E24' }}>{fmt(cartTotal)} DT</span>
              </div>
            </div>

            <button 
              disabled={isOrdering || !!orderError}
              onClick={handleCheckout}
              style={{ 
                width: '100%', padding: '18px', borderRadius: '100px', border: 'none', 
                background: '#E31E24', color: '#fff', fontSize: '16px', fontWeight: 900, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                gap: '12px', boxShadow: '0 10px 20px rgba(227, 30, 36, 0.2)', transition: 'all 0.2s' 
              }}
            >
              {isOrdering ? (
                <>Traitement...</>
              ) : orderStatus === 'SUCCESS' ? (
                <>✓ Commande Envoyée !</>
              ) : (
                <><Send size={20} /> Valider la Commande</>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '16px', fontWeight: 600 }}>
              En validant, vous acceptez les conditions de vente d'ElKassa B2B.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}
