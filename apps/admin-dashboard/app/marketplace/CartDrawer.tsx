'use client';

import React from 'react';
import { ShoppingCart, X, Send } from 'lucide-react';
import { useCart } from './CartContext';
import { sanitizeUrl } from '../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(3);
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
        window.location.href = '/vendor/dashboard'; // redirect to orders (buyer dashboard) or just reload
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [orderStatus]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com';

  return (
    <>
      <div className="mkt-overlay" onClick={onClose} />
      <div className="mkt-drawer">
        <div className="mkt-drawer-head">
          <div className="mkt-drawer-title">Mon Panier ({cart.length})</div>
          <button className="mkt-drawer-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mkt-drawer-items">
          {cart.length === 0 ? (
            <div className="mkt-drawer-empty">
              <ShoppingCart size={48} style={{ opacity:0.15, display:'block', margin:'0 auto 16px' }} />
              <div style={{ fontWeight:700, fontSize:14 }}>Votre panier est vide</div>
            </div>
          ) : cart.map((item: any) => (
            <div key={item.id} className="mkt-cart-item">
              <img className="mkt-cart-item-img"
                src={sanitizeUrl(item.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100'}
                alt={item.name}
                onError={(e:any)=>{e.target.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=100';}}
              />
              <div className="mkt-cart-item-info">
                <div className="mkt-cart-item-name">{item.name}</div>
                <div className="mkt-cart-item-vendor">{item.vendor?.companyName}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div className="mkt-qty-ctrl">
                    <button className="mkt-qty-btn" onClick={()=>updateQty(item.id,-1)}>−</button>
                    <span className="mkt-qty-val">{item.quantity}</span>
                    <button className="mkt-qty-btn" onClick={()=>updateQty(item.id,1)}>+</button>
                  </div>
                  <span className="mkt-cart-item-price">{fmt(Number(item.price)*item.quantity)} DT</span>
                </div>
              </div>
              <button 
                className="mkt-cart-remove" 
                onClick={() => removeItem(item.id)}
                title="Supprimer du panier"
                style={{ 
                  padding: '8px', 
                  borderRadius: '10px', 
                  background: '#FEF2F2', 
                  color: '#EF4444',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="mkt-drawer-foot">
          {orderError && (
            <div style={{ background: '#FFF7ED', color: '#EA580C', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, border: '1px solid #FFEDD5' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <div>
                  <div style={{ marginBottom: '4px' }}>Transaction en attente</div>
                  <div style={{ fontWeight: 500, fontSize: '12px', opacity: 0.9 }}>{orderError}</div>
                  <div style={{ marginTop: '8px', fontSize: '11px', fontStyle: 'italic', opacity: 0.7 }}>Redirection automatique...</div>
                </div>
              </div>
            </div>
          )}
          <div className="mkt-drawer-total">
            <span className="mkt-drawer-total-label">Total TTC</span>
            <span className="mkt-drawer-total-val">{fmt(cartTotal)} DT</span>
          </div>
          <button className="mkt-checkout-btn" disabled={isOrdering || cart.length === 0 || !!orderError} onClick={handleCheckout}>
            {isOrdering ? 'Traitement...' : orderStatus === 'SUCCESS' ? '✓ Commandé !' : <><Send size={16} /> Passer la Commande</>}
          </button>
        </div>
      </div>
    </>
  );
}
