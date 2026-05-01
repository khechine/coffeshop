'use client';

import React from 'react';
import { ShoppingCart, X, Send } from 'lucide-react';
import { useCart } from './CartContext';

const fmt = (n: any) => Number(n).toFixed(3);

const sanitizeUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) {
    return url.replace('http://localhost:3001', '').replace('https://api.coffeeshop.elkassa.com', '');
  }
  if (url.startsWith('/')) return url;
  return '/' + url;
};

export default function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, updateQty, removeItem, cartTotal, handleCheckout, isOrdering, orderStatus } = useCart();
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
              <button className="mkt-cart-remove" onClick={()=>removeItem(item.id)}><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="mkt-drawer-foot">
          <div className="mkt-drawer-total">
            <span className="mkt-drawer-total-label">Total TTC</span>
            <span className="mkt-drawer-total-val">{fmt(cartTotal)} DT</span>
          </div>
          <button className="mkt-checkout-btn" disabled={isOrdering || cart.length === 0} onClick={handleCheckout}>
            {isOrdering ? 'Traitement...' : orderStatus === 'SUCCESS' ? '✓ Commandé !' : <><Send size={16} /> Passer la Commande</>}
          </button>
        </div>
      </div>
    </>
  );
}
