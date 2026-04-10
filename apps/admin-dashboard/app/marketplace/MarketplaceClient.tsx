'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, ChevronRight, Package, Store, MapPin, CheckCircle, Clock, Send, Plus, Search, Filter, ArrowRight, X } from 'lucide-react';
import { placeMarketplaceOrder } from '../actions';

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
  };
  minOrderQuantity: any;
}

export default function MarketplaceClient({ initialData }: { initialData: any }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return initialData.products.filter((p: any) => {
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                           (p.vendor?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, initialData.products]);

  const addToCart = (p: MarketplaceProduct) => {
    const minQty = Number(p.minOrderQuantity || 1);
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: minQty }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    try {
      const vendorGroups: Record<string, any[]> = {};
      cart.forEach(item => {
        if (!vendorGroups[item.vendor.id]) vendorGroups[item.vendor.id] = [];
        vendorGroups[item.vendor.id].push(item);
      });
      for (const vendorId in vendorGroups) {
        const items = vendorGroups[vendorId];
        const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
        await placeMarketplaceOrder({
          vendorId,
          total,
          items: items.map(i => ({ productId: i.id, quantity: i.quantity, price: Number(i.price), name: i.name }))
        });
      }
      setCart([]);
      setOrderStatus('SUCCESS');
      setTimeout(() => setOrderStatus('IDLE'), 3000);
    } catch (err) {
      alert('Erreur lors de la commande');
    } finally {
      setIsOrdering(false);
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  return (
    <div style={{ background: '#fff', minHeight: '100vh', position: 'relative' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .motta-grid { animation: fadeIn 0.5s ease-out; }
        .product-card { transition: all 0.3s ease; border: 1px solid #F1F5F9; border-radius: 12px; overflow: hidden; position: relative; background: #fff; }
        .product-card:hover { border-color: #1E1B4B; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .product-image-container { position: relative; overflow: hidden; aspect-ratio: 1/1; background: #f9f9f9; }
        .product-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
        .product-card:hover .product-image { transform: scale(1.08); }
        .add-to-cart-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; transform: translateY(100%); transition: transform 0.3s ease; background: linear-gradient(to top, rgba(255,255,255,0.95), transparent); display: flex; justify-content: center; z-index: 10; }
        .product-card:hover .add-to-cart-overlay { transform: translateY(0); }
        .category-pill { white-space: nowrap; padding: 8px 18px; border-radius: 100px; border: 1px solid #E2E8F0; background: transparent; color: #64748B; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .category-pill.active { background: #1E1B4B; color: #fff; border-color: #1E1B4B; }
        .category-pill:hover:not(.active) { border-color: #1E1B4B; color: #1E1B4B; }
        .search-container { position: relative; flex: 1; min-width: 250px; }
        .search-input { width: 100%; padding: 10px 16px 10px 44px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; transition: border-color 0.2s; background: #F8FAFC; }
        .search-input:focus { border-color: #1E1B4B; background: #fff; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- PREMIUM MARKETPLACE HEADER --- */}
      <div style={{ borderBottom: '1px solid #F1F5F9', padding: '20px 32px', background: '#fff', position: 'sticky', top: '0', zIndex: 100 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="search-container">
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Rechercher sur le marketplace..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', flex: 2 }} className="no-scrollbar">
            <button 
              className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >Tout</button>
            {initialData.categories.map((c: any) => (
              <button 
                key={c.id}
                className={`category-pill ${activeCategory === c.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(c.id)}
              >{c.name}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
            <Link href="/marketplace/map" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#1E1B4B', fontWeight: 700, fontSize: '13px', background: '#F1F5F9', padding: '8px 12px', borderRadius: '10px' }}>
              <MapPin size={16} /> <span className="hide-mobile">Carte</span>
            </Link>
            <div style={{ position: 'relative', cursor: 'pointer', background: '#1E1B4B', color: '#fff', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsCartOpen(!isCartOpen)}>
              <ShoppingCart size={18} />
              <span style={{ fontWeight: 800, fontSize: '13px' }}>{cart.length}</span>
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }} className="motta-grid">
        {/* --- HERO BANNER (Motta Style) --- */}
        {activeCategory === 'all' && !searchQuery && (
          <div style={{ background: '#0F172A', borderRadius: '20px', padding: '50px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', overflow: 'hidden', position: 'relative', color: '#fff' }}>
             <div style={{ zIndex: 2, maxWidth: '450px', position: 'relative' }}>
              <span style={{ color: '#818CF8', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>OFFRE SPÉCIALE B2B</span>
              <h1 style={{ fontSize: '40px', fontWeight: 900, margin: '12px 0', lineHeight: 1.1 }}>Qualité &amp; Fraîcheur Directe</h1>
              <p style={{ fontSize: '16px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.5 }}>Commandez vos grains de café, laits et pâtisseries chez nos fournisseurs certifiés.</p>
              <button style={{ padding: '12px 24px', fontSize: '14px', background: '#fff', color: '#0F172A', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Explorer le catalogue <ArrowRight size={16} />
              </button>
            </div>
            <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px' }}>
               <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop" style={{ borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
            </div>
            <div style={{ position: 'absolute', right: '-100px', bottom: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', zIndex: 1 }}></div>
          </div>
        )}

        {/* --- PRODUCT GRID --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
          {filteredProducts.map((p: MarketplaceProduct) => (
            <div key={p.id} className="product-card">
              <div className="product-image-container">
                <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} className="product-image" />
                {p.isFlashSale && <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#EF4444', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '3px 7px', borderRadius: '4px' }}>SALE</span>}
                <div className="add-to-cart-overlay">
                   <button 
                    onClick={() => addToCart(p)}
                    style={{ width: '100%', background: '#1E1B4B', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                   >
                     <Plus size={16} /> Ajouter
                   </button>
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Store size={10} color="#4F46E5" /> {p.vendor.companyName}
                </div>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#1E293B', lineHeight: 1.4, height: '40px', overflow: 'hidden' }}>{p.name}</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 950, color: '#1E1B4B' }}>{Number(p.price).toFixed(3)}</span>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>DT / {p.unit}</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#6366F1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Package size={12} /> Min : {Number(p.minOrderQuantity || 1)} {p.unit}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ width: '70px', height: '70px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Search size={28} color="#CBD5E1" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#475569' }}>Aucun résultat</h3>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Désolé, nous n'avons rien trouvé pour votre recherche.</p>
          </div>
        )}
      </main>

      {/* --- SIDE CART DRAWER (Minimalist / Motta Style Overlay) --- */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        bottom: 0, 
        width: '100%', 
        maxWidth: '380px', 
        background: '#fff', 
        boxShadow: '-10px 0 40px rgba(0,0,0,0.1)', 
        zIndex: 1000, 
        transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)', 
        transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
         <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShoppingCart size={20} />
              <span style={{ fontWeight: 800, color: '#1E1B4B', fontSize: '16px' }}>Votre Panier</span>
            </div>
            <button onClick={() => setIsCartOpen(false)} style={{ background: '#F1F5F9', border: 'none', color: '#1E293B', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
         </div>
         
         <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94A3B8', paddingTop: '100px' }}>
                <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Le panier est vide</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                    <img src={item.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100&auto=format&fit=crop'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E1B4B', marginBottom: '2px' }}>{item.quantity}x {item.name}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{item.vendor.companyName}</div>
                      <div style={{ fontSize: '14px', fontWeight: 850, color: '#4F46E5', marginTop: '6px' }}>{(Number(item.price) * item.quantity).toFixed(3)} DT</div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>Supprimer</button>
                  </div>
                ))}
              </div>
            )}
         </div>

         <div style={{ padding: '32px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, color: '#64748B', fontSize: '14px' }}>Total HT</span>
              <span style={{ fontWeight: 800, color: '#1E1B4B', fontSize: '16px' }}>{cartTotal.toFixed(3)} DT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <span style={{ fontWeight: 900, color: '#1E1B4B', fontSize: '18px' }}>Total TTC</span>
              <span style={{ fontSize: '24px', fontWeight: 950, color: '#1E1B4B' }}>{cartTotal.toFixed(3)} DT</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isOrdering || cart.length === 0}
              style={{ width: '100%', padding: '18px', borderRadius: '12px', background: orderStatus === 'SUCCESS' ? '#10B981' : '#1E1B4B', color: '#fff', border: 'none', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}
            >
              {isOrdering ? 'Traitement...' : orderStatus === 'SUCCESS' ? <><CheckCircle size={20} /> Commande Réussie !</> : <><Send size={18} /> Commander</>}
            </button>
         </div>
      </div>

      {/* Cart Overlay Background */}
      {isCartOpen && <div onClick={() => setIsCartOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(2px)' }}></div>}
    </div>
  );
}
