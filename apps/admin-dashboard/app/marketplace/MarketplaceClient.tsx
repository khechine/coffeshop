'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, ShoppingBag, Star, Zap, ChevronRight, Package, Store, MapPin, CheckCircle, Clock, Send, Plus, Search, Filter, ArrowRight, X, Phone, Mail, Info, Building2, LayoutGrid, Users, Heart, ArrowUpRight } from 'lucide-react';
import { placeMarketplaceOrder, rateVendorAction } from '../actions';
import './marketplace.css';

// --- Types ---
interface MarketplaceProduct {
  id: string;
  name: string;
  price: any;
  unit: string;
  isFeatured: boolean;
  isFlashSale: boolean;
  discount?: any;
  image?: string;
  vendor: {
    id: string;
    companyName: string;
    city: string;
    lat?: number;
    lng?: number;
    ratings?: any;
  };
  minOrderQty: any;
  categoryId: string;
}

// --- Helpers ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// --- Components ---

const RatingStars = ({ ratings, size = 10 }: { ratings: any, size?: number }) => {
  if (!ratings || ratings.totalReviews === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: size, fontWeight: 700 }}>
       <Star size={size} /> Nouveau
    </div>
  );
  const avg = Number(ratings.overallAvg || 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', color: '#F59E0B' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={size} fill={s <= Math.round(avg) ? "#F59E0B" : "none"} stroke={s <= Math.round(avg) ? "#F59E0B" : "#CBD5E1"} />
        ))}
      </div>
      <span style={{ fontSize: size + 1, fontWeight: 900, color: '#1E293B' }}>{avg.toFixed(1)}</span>
    </div>
  );
};

const MarketplaceHeader = ({ cartCount, onCartOpen }: any) => {
  return (
    <header className="mkt-standalone-header">
      <Link href="/marketplace" className="mkt-logo">
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4F46E5, #6366F1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <ShoppingBag size={24} />
        </div>
        Coffee<span>Market</span>
      </Link>

      <div style={{ flex: 1, maxWidth: 600, margin: '0 40px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
        <input 
          type="text" 
          placeholder="Rechercher des produits, vendeurs ou packs..." 
          style={{ width: '100%', padding: '14px 20px 14px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', fontWeight: 600, outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" className="text-slate-500 font-black text-sm hover:text-indigo-600 transition-all flex items-center gap-2">
          TABLEAU DE BORD <ArrowUpRight size={16} />
        </Link>
        <div onClick={onCartOpen} style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#1E1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 10px 15px -3px rgba(30, 27, 75, 0.2)' }}>
            <ShoppingCart size={20} />
          </div>
          <span style={{ position: 'absolute', top: -5, right: -5, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 900, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            {cartCount}
          </span>
        </div>
      </div>
    </header>
  );
};

const AdsBanner = ({ title, subtitle, image, color }: any) => {
  return (
    <div className="mkt-ads-banner" style={{ background: color }}>
      <img src={image} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} alt="Ads" />
      <div className="ads-content">
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <button className="btn-premium btn-premium-primary" style={{ width: 'fit-content', marginTop: 16, padding: '12px 32px' }}>Profiter Maintenant</button>
      </div>
    </div>
  );
};

const Countdown = () => {
  return (
    <div className="mkt-countdown">
      <div className="countdown-box">02</div>
      <div className="countdown-sep">:</div>
      <div className="countdown-box">14</div>
      <div className="countdown-sep">:</div>
      <div className="countdown-box">55</div>
    </div>
  );
};

const ProductCard = ({ product, addToCart, onProductClick }: any) => {
  return (
    <div className="premium-card">
      <div className="product-image-container" onClick={onProductClick} style={{ cursor: 'pointer' }}>
        <img 
          src={product.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} 
          className="product-image" 
          alt={product.name} 
        />
        <div className="add-to-cart-overlay">
          <button 
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            style={{ width: '100%', background: '#1E1B4B', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Plus size={16} /> AJOUTER
          </button>
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: '10px', color: '#6366F1', fontWeight: 800 }}>{product.vendor?.companyName}</span>
          <RatingStars ratings={product.vendor?.ratings} size={9} />
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#1E293B', height: '40px', overflow: 'hidden' }}>{product.name}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 950, color: '#1E1B4B' }}>{Number(product.price).toFixed(3)}</span>
            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, marginLeft: 2 }}>DT</span>
          </div>
          <button style={{ color: '#CBD5E1', border: 'none', background: 'none' }}><Heart size={16} /></button>
        </div>
      </div>
    </div>
  );
};

// --- Main Client ---

export default function MarketplaceClient({ initialData, storeCoords }: { initialData: any, storeCoords?: { lat: number, lng: number } }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('latest');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const products = initialData.products || [];
  const categories = initialData.categories || [];
  const bundles = initialData.bundles || [];

  const addToCart = (p: any, isBundle = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: Number(p.minOrderQty || 1), isBundle }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  return (
    <div className="marketplace-premium-wrapper" style={{ overflowY: 'auto' }}>
      <MarketplaceHeader cartCount={cart.length} onCartOpen={() => setIsCartOpen(true)} />

      <div className="marketplace-main-layout" style={{ maxWidth: 1400, margin: '0 auto', padding: '40px' }}>
        
        {/* Categories Sidebar */}
        <aside className="marketplace-sidebar-left" style={{ background: 'transparent', border: 'none', width: 260 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1E1B4B', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <LayoutGrid size={20} color="#4F46E5" /> TOUTES CATÉGORIES
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button 
                className={`mkt-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setActiveCategory('all')}
              >
                <span>Toutes les offres</span>
                <ChevronRight size={14} />
              </button>
              {categories.map((c: any) => (
                <button 
                  key={c.id}
                  className={`mkt-tab-btn ${activeCategory === c.id ? 'active' : ''}`}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setActiveCategory(c.id)}
                >
                  <span>{c.name}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24, borderRadius: 24, overflow: 'hidden', height: 400, position: 'relative' }}>
             <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,27,75,0.9), transparent)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <span style={{ color: '#FCD34D', fontWeight: 900, fontSize: 10, letterSpacing: 2 }}>COLLECTION ÉTÉ</span>
                <h4 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '8px 0' }}>Grains Premium de Tunisie</h4>
                <button style={{ background: '#fff', color: '#1E1B4B', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>VOIR TOUT</button>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="mkt-content-area" style={{ padding: '0 40px', background: 'transparent' }}>
          
          {/* Hero Carousel Grid */}
          <div className="mkt-hero-grid">
            <div style={{ height: 400, borderRadius: 32, overflow: 'hidden', position: 'relative' }}>
               <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(30,27,75,0.8), transparent)', padding: '0 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 900, backdropFilter: 'blur(5px)', width: 'fit-content', marginBottom: 20 }}>NOUVELLE SAISON</span>
                  <h2 style={{ fontSize: 48, fontWeight: 950, marginBottom: 16 }}>Le Meilleur du B2B <br/><span>En Un Clic.</span></h2>
                  <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 32, maxWidth: 400 }}>Découvrez les prix de gros directs des meilleurs torréfacteurs et fournisseurs de café.</p>
                  <button className="btn-premium btn-premium-primary" style={{ padding: '16px 48px', fontSize: 16 }}>S'approvisionner <ArrowRight size={20} style={{ marginLeft: 8 }} /></button>
               </div>
            </div>
            <div className="mkt-side-banners">
               <div className="side-banner" style={{ background: '#4F46E5' }}>
                  <div style={{ padding: 24, color: '#fff' }}>
                     <h4 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Vente Flash <br/>Accessoires</h4>
                     <span style={{ fontSize: 24, fontWeight: 950 }}>-40%</span>
                  </div>
                  <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400" style={{ position: 'absolute', right: -40, bottom: -20, width: 150, height: 150, objectFit: 'contain', transform: 'rotate(-20deg)' }} />
               </div>
               <div className="side-banner" style={{ background: '#10B981' }}>
                  <div style={{ padding: 24, color: '#fff' }}>
                     <h4 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Nouveaux <br/>Packs Pro</h4>
                     <span style={{ fontSize: 14, fontWeight: 800 }}>Économie Max.</span>
                  </div>
                  <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400" style={{ position: 'absolute', right: -40, bottom: -20, width: 150, height: 150, objectFit: 'contain', transform: 'rotate(10deg)' }} />
               </div>
            </div>
          </div>

          {/* Deal of the Day */}
          <section className="mkt-section">
            <div className="mkt-section-header">
               <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <h2 className="mkt-section-title">Deal de la Journée !</h2>
                  <Countdown />
               </div>
               <button className="text-slate-500 font-black text-sm">VOIR TOUS LES DEALS</button>
            </div>
            <div className="product-grid-mkt high-density">
              {products.filter((p: any) => p.isFlashSale).slice(0, 5).map((p: any) => (
                <ProductCard key={p.id} product={p} addToCart={addToCart} onProductClick={() => setSelectedProduct(p)} />
              ))}
            </div>
          </section>

          <AdsBanner 
            title="Livraison Express sur tout Tunis" 
            subtitle="Commandez avant 10h, soyez livré avant 18h. Service garanti CoffeeMarket."
            image="https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?q=80&w=1600"
            color="#1E1B4B"
          />

          {/* Tabbed Products Section */}
          <section className="mkt-section">
            <div className="mkt-section-header">
               <div className="mkt-tab-nav">
                  <button className={`mkt-tab-btn ${activeTab === 'latest' ? 'active' : ''}`} onClick={() => setActiveTab('latest')}>Dernières Arrivées</button>
                  <button className={`mkt-tab-btn ${activeTab === 'bestselling' ? 'active' : ''}`} onClick={() => setActiveTab('bestselling')}>Les Plus Vendus</button>
                  <button className={`mkt-tab-btn ${activeTab === 'featured' ? 'active' : ''}`} onClick={() => setActiveTab('featured')}>Recommandations</button>
               </div>
            </div>
            <div className="product-grid-mkt high-density">
              {products.filter((p: any) => {
                if (activeTab === 'featured') return p.isFeatured;
                return true;
              }).slice(0, 10).map((p: any) => (
                <ProductCard key={p.id} product={p} addToCart={addToCart} onProductClick={() => setSelectedProduct(p)} />
              ))}
            </div>
          </section>

          <AdsBanner 
            title="Devenez Fournisseur Premium" 
            subtitle="Boostez votre visibilité et multipliez vos ventes par 3 sur le premier marketplace B2B."
            image="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600"
            color="#4F46E5"
          />

          {/* Categories Sections with Products */}
          {categories.slice(0, 3).map((cat: any) => (
            <section key={cat.id} className="mkt-section">
               <div className="mkt-section-header">
                  <h2 className="mkt-section-title">{cat.name}</h2>
                  <button className="text-slate-500 font-black text-sm">VOIR LA CATÉGORIE</button>
               </div>
               <div className="product-grid-mkt high-density">
                  {products.filter((p: any) => p.categoryId === cat.id).slice(0, 5).map((p: any) => (
                    <ProductCard key={p.id} product={p} addToCart={addToCart} onProductClick={() => setSelectedProduct(p)} />
                  ))}
               </div>
            </section>
          ))}

        </main>
      </div>

      {/* Modals & Cart Drawer */}
      {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} addToCart={addToCart} categories={categories} />}
      {isCartOpen && <CartDrawer cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} cartTotal={cartTotal} onClose={() => setIsCartOpen(false)} handleCheckout={() => {}} />}
      
    </div>
  );
}

// --- Modals (Simplified versions for new layout) ---

function ProductDetailsModal({ product, onClose, addToCart, categories }: any) {
  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal-content" onClick={e => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="modal-gallery">
          <img src={product.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="modal-details">
          <span style={{ fontSize: 13, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase' }}>{categories.find((c: any) => c.id === product.categoryId)?.name}</span>
          <h2 style={{ fontSize: 32, fontWeight: 950, color: '#1E1B4B', margin: '8px 0 24px' }}>{product.name}</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
            <span style={{ fontSize: 36, fontWeight: 950, color: '#1E1B4B' }}>{Number(product.price).toFixed(3)} DT</span>
            <span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 700 }}>/ {product.unit}</span>
          </div>
          <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 24, marginBottom: 32 }}>
             <h4 style={{ fontSize: 14, fontWeight: 900, color: '#1E1B4B', marginBottom: 12 }}>Vendeur Certifié</h4>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>🏪</div>
                <div>
                   <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{product.vendor?.companyName}</div>
                   <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{product.vendor?.city}</div>
                </div>
             </div>
          </div>
          <button 
            onClick={() => { addToCart(product); onClose(); }}
            className="btn-premium btn-premium-primary"
            style={{ width: '100%', padding: '20px', borderRadius: 20, fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
          >
            <Plus size={20} /> AJOUTER AU PANIER
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, removeFromCart, updateQuantity, cartTotal, onClose }: any) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content" style={{ maxWidth: '450px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 950, color: '#1E1B4B', margin: 0 }}>VOTRE PANIER</h2>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32 }}><X size={18} /></button>
        </div>
        <div className="mkt-cart-items-container" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', paddingTop: '100px' }}>
              <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Le panier est vide</p>
            </div>
          ) : (
            cart.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <img src={item.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100'} style={{ width: 60, height: 60, borderRadius: 16, objectFit: 'cover' }} alt={item.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1B4B' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{item.vendor?.companyName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F1F5F9', padding: '4px 8px', borderRadius: 10 }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ cursor: 'pointer', border: 'none', background: 'none', fontWeight: 900 }}>-</button>
                      <span style={{ fontSize: 13, fontWeight: 900 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ cursor: 'pointer', border: 'none', background: 'none', fontWeight: 900 }}>+</button>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#4F46E5' }}>{(Number(item.price) * item.quantity).toFixed(3)} DT</div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:scale-110 transition-all" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: 32, background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
             <span style={{ fontSize: 18, fontWeight: 900, color: '#1E1B4B' }}>Total TTC</span>
             <span style={{ fontSize: 28, fontWeight: 950, color: '#1E1B4B' }}>{cartTotal.toFixed(3)} DT</span>
          </div>
          <button className="w-full py-5 rounded-[24px] font-black text-sm bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <Send size={18} /> VALIDER LA COMMANDE
          </button>
        </div>
      </div>
    </>
  );
}
