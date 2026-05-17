'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { placeMarketplaceOrder, getMarketplaceUpsellRecommendationsAction, getPublicProductUpsellsAction } from '../actions';
import { ShoppingBag, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { sanitizeUrl } from '../lib/imageUtils';
import Link from 'next/link';

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  unit: string;
  vendor?: {
    id: string;
    companyName: string;
  };
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  vendorId?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  handleCheckout: () => Promise<void>;
  isOrdering: boolean;
  orderStatus: string;
  orderError: string;
  dismissError: () => void;
  lastAddedProduct: any | null;
  isUpsellOpen: boolean;
  setUpsellOpen: (open: boolean) => void;
  wishlist: WishlistItem[];
  toggleWishlist: (product: any) => void;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [orderError, setOrderError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<any | null>(null);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('elkassa_mkt_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    const savedWishlist = localStorage.getItem('elkassa_mkt_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse wishlist', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('elkassa_mkt_cart', JSON.stringify(cart));
      localStorage.setItem('elkassa_mkt_wishlist', JSON.stringify(wishlist));
    }
  }, [cart, wishlist, isLoaded]);

  const addToCart = (p: any, q: number = 1) => {
    const vendorInfo = p.vendor || p.vendorInfo;
    const productToTrack = { 
      id: p.id, 
      name: p.name, 
      price: p.discountPrice ? Number(p.discountPrice) : Number(p.price),
      originalPrice: p.discountPrice && Number(p.discountPrice) < Number(p.price) ? Number(p.price) : undefined,
      image: p.image, 
      unit: p.unit,
      quantity: q, 
      vendor: vendorInfo ? { id: vendorInfo.id, companyName: vendorInfo.companyName } : undefined
    };

    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + q } : i);
      return [...prev, productToTrack];
    });

    setLastAddedProduct(productToTrack);
    setIsUpsellOpen(true);
  };

  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const dismissError = () => setOrderError('');

  const toggleWishlist = (p: any) => {
    setWishlist(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.filter(i => i.id !== p.id);
      return [...prev, { id: p.id, name: p.name, price: p.price, image: p.image, vendorId: p.vendorId || p.vendor?.id }];
    });
  };

  const isInWishlist = (id: string) => wishlist.some(i => i.id === id);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    setOrderError('');
    try {
      // Group by vendor for multi-vendor ordering
      const grouped = cart.reduce((acc: Record<string, CartItem[]>, item) => {
        const vid = item.vendor?.id || 'unknown';
        if (!acc[vid]) acc[vid] = [];
        acc[vid].push(item);
        return acc;
      }, {});

      for (const [vendorId, items] of Object.entries(grouped)) {
        if (vendorId === 'unknown') continue;
        await placeMarketplaceOrder({
          vendorId,
          total: items.reduce((s, i) => s + Number(i.price) * i.quantity, 0),
          items: items.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            price: Number(i.price),
            name: i.name
          }))
        });
      }

      setOrderStatus('SUCCESS');
      setCart([]);
      setTimeout(() => setOrderStatus(''), 3000);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.startsWith('VENDOR_UNAVAILABLE:')) {
        setOrderError(msg.replace('VENDOR_UNAVAILABLE:', ''));
        setOrderStatus('');
      } else {
        setOrderStatus('ERROR');
        setTimeout(() => setOrderStatus(''), 3000);
      }
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, updateQty, removeItem, clearCart, 
      cartTotal, cartCount, handleCheckout, isOrdering, orderStatus,
      orderError, dismissError, lastAddedProduct, isUpsellOpen, setUpsellOpen: setIsUpsellOpen,
      wishlist, toggleWishlist, isInWishlist
    }}>
      {children}
      {isUpsellOpen && lastAddedProduct && (
        <UpsellModal 
          product={lastAddedProduct} 
          onClose={() => setIsUpsellOpen(false)} 
        />
      )}
    </CartContext.Provider>
  );
}

function UpsellModal({ product, onClose }: { product: any; onClose: () => void }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [directUpsells, setDirectUpsells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchRecsAndUpsells = async () => {
      setLoading(true);
      try {
        const [recsData, upsellsData] = await Promise.all([
          getMarketplaceUpsellRecommendationsAction([product.id]),
          getPublicProductUpsellsAction(product.id)
        ]);
        setRecommendations(recsData.slice(0, 4));
        setDirectUpsells(upsellsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecsAndUpsells();
  }, [product.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '720px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        
        {/* Success Banner */}
        <div style={{ background: '#F0FDF4', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #DCFCE7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#16A34A', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0 }}>Ajouté au panier !</h3>
              <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>Votre article a été ajouté avec succès.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#fff', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '32px' }}>
          {/* Main Added Product */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', background: '#F9FAFB', padding: '20px', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#fff' }}>
              <img src={sanitizeUrl(product.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{product.name}</h4>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#6B7280', margin: 0 }}>{product.quantity} x {Number(product.price).toFixed(2)} DT</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '100px', border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>Continuer</button>
              <Link href="/marketplace?openCart=true" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '100px', border: 'none', background: '#111827', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Panier <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Configured Upsells */}
          {directUpsells.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={18} color="#16A34A" />
                <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offre Spéciale</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {directUpsells.map(u => {
                  const tp = u.targetProduct;
                  const finalPrice = Number(tp.price) * (1 - Number(u.discountPercent) / 100);
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '16px', borderRadius: '16px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                        <img src={sanitizeUrl(tp.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{tp.name}</h5>
                        {u.text && <p style={{ fontSize: '12px', color: '#166534', margin: '0 0 4px', fontWeight: 600 }}>{u.text}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#E31E24' }}>{finalPrice.toFixed(2)} DT</span>
                          {Number(u.discountPercent) > 0 && (
                            <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#9CA3AF' }}>{Number(tp.price).toFixed(2)} DT</span>
                          )}
                          <span style={{ fontSize: '12px', background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>-{Number(u.discountPercent)}%</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          addToCart({ ...tp, discountPrice: finalPrice, vendor: { id: tp.vendorId } }, Number(u.quantity));
                          onClose();
                        }}
                        style={{ padding: '8px 16px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '100px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Ajouter ({Number(u.quantity)})
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Sparkles size={18} color="#E31E24" />
              <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nos clients ont aussi acheté</h4>
            </div>

            {loading ? (
              <div style={{ display: 'flex', gap: '16px' }}>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: '180px', background: '#F9FAFB', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {recommendations.map((p: any) => (
                  <Link 
                    key={p.id} 
                    href={`/marketplace/product/${p.id}`} 
                    onClick={onClose}
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F1F5F9', background: '#fff' }}>
                      <img src={sanitizeUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px', lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#E31E24', marginTop: '4px' }}>{Number(p.price).toFixed(2)} DT</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
