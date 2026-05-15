'use client';

import React from 'react';
import { ShoppingCart, X, Send, ShieldCheck, MapPin, CheckCircle2, Sparkles, Plus } from 'lucide-react';
import { useCart } from './CartContext';
import { useVault } from './VaultContext';
import { sanitizeUrl } from '../lib/imageUtils';
import { getMarketplaceUpsellRecommendationsAction } from '../actions';

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
              <img src={sanitizeUrl(item.image) || '/images/elkassa-logo.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#E31E24' }}>{fmt(item.price)} DT <span style={{ fontWeight: 600, color: '#6B7280', fontSize: '12px' }}>/ {item.unit || 'unité'}</span></div>
              {item.originalPrice && item.originalPrice > item.price && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>{fmt(item.originalPrice)} DT</span>
                  <span style={{ fontSize: '10px', color: '#E31E24', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                  </span>
                </div>
              )}
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

const RecommendationCard = ({ prod, addItem, fmt }: any) => {
  const { maskName, identityVisible } = useVault(prod.vendor?.id, prod.vendor?.isPremium);
  
  return (
    <div 
      style={{ 
        minWidth: '160px', background: '#fff', padding: '12px', borderRadius: '16px', 
        border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}
    >
      <div style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', background: '#F9FAFB' }}>
        <img src={sanitizeUrl(prod.image) || '/images/elkassa-logo.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3, height: '32px' }}>
          {prod.name}
        </div>
        <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {maskName(prod.vendor?.companyName || 'Fournisseur')}
          {prod.vendor?.isPremium && identityVisible && <ShieldCheck size={10} color="#E31E24" fill="#E31E24" />}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 950, color: '#0369A1' }}>{fmt(prod.price)} DT</span>
        <button 
          onClick={() => addItem(prod)}
          style={{ 
            width: '28px', height: '28px', borderRadius: '8px', border: 'none', 
            background: '#0284C7', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.1s active'
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, updateQty, removeItem, clearCart, cartTotal, handleCheckout, isOrdering, orderStatus, orderError, dismissError, addToCart } = useCart();
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = React.useState(false);

  // Fetch recommendations based on cart contents
  React.useEffect(() => {
    const fetchRecommendations = async () => {
      setIsRecommendationsLoading(true);
      try {
        const productIds = cart.map((i: any) => i.id);
        const data = await getMarketplaceUpsellRecommendationsAction(productIds);
        setRecommendations(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [cart.length]);

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
        window.location.href = '/marketplace/orders'; 
      }, 3000);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {cart.length > 0 && (
              <button 
                onClick={() => {
                  if (confirm("Voulez-vous vraiment vider votre panier ?")) {
                    clearCart();
                  }
                }}
                style={{ background: 'none', border: 'none', color: '#E31E24', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Vider le panier
              </button>
            )}
            <button 
              onClick={onClose}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#F9FAFB', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Success Overlay */}
        {orderStatus === 'SUCCESS' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', zIndex: 1002, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ width: '80px', height: '80px', background: '#DCFCE7', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <CheckCircle2 size={40} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', textAlign: 'center', marginBottom: '8px' }}>Commande réussie !</h3>
            <p style={{ color: '#6B7280', textAlign: 'center', fontSize: '15px', lineHeight: 1.5 }}>
              Votre commande a été envoyée avec succès.<br/>Vous allez être redirigé vers vos commandes...
            </p>
          </div>
        )}

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

              {/* Intelligent Upsell Section */}
              {recommendations.length > 0 && (
                <div style={{ marginTop: '20px', padding: '24px', background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', borderRadius: '24px', border: '1px solid #BAE6FD' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ padding: '6px', background: '#0284C7', color: '#fff', borderRadius: '8px' }}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#0369A1', margin: 0 }}>Optimisez votre commande</h4>
                      <p style={{ fontSize: '11px', color: '#0EA5E9', fontWeight: 700, margin: 0 }}>Suggestions intelligentes basées sur votre panier</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                    {recommendations.map((prod: any) => (
                      <RecommendationCard 
                        key={prod.id} 
                        prod={prod} 
                        addItem={addToCart} 
                        fmt={fmt} 
                      />
                    ))}
                  </div>
                </div>
              )}
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
        @keyframes scaleIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </>
  );
}
