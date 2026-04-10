'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, ChevronRight, Package, Store, MapPin, CheckCircle, Clock, Send, Plus, Search, Filter, ArrowRight, X, Minus } from 'lucide-react';
import { placeMarketplaceOrder } from '../actions';

interface MarketplaceProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  isFeatured: boolean;
  isFlashSale: boolean;
  discount?: number;
  flashEnd?: string | Date;
  image?: string;
  vendor: {
    id: string;
    companyName: string;
    city: string;
  };
  minOrderQty: number;
}

function CountdownTimer({ endDate }: { endDate: string | Date }) {
  const [timeLeft, setTimeLeft] = React.useState<{ h: string, m: string, s: string } | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const distance = new Date(endDate).getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }
      const h = Math.floor(distance / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setTimeLeft({ h, m, s });
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#fff', fontWeight: 800, fontFamily: 'monospace' }}>
      <Clock size={10} /> {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
    </div>
  );
}

export default function MarketplaceClient({ initialData }: { initialData: any }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedCity, setSelectedCity] = useState('all');

  const vendorCities = useMemo(() => {
    const cities = new Set<string>();
    initialData.products.forEach((p: any) => {
      if (p.vendor?.city) cities.add(p.vendor.city);
    });
    return Array.from(cities).sort();
  }, [initialData.products]);

  const filteredProducts = useMemo(() => {
    return initialData.products.filter((p: any) => {
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesSubcategory = activeSubcategory === 'all' || p.subcategoryId === activeSubcategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.vendor?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = Number(p.price) >= priceRange.min && Number(p.price) <= priceRange.max;
      const matchesCity = selectedCity === 'all' || p.vendor?.city === selectedCity;
      
      return matchesCategory && matchesSubcategory && matchesSearch && matchesPrice && matchesCity;
    });
  }, [activeCategory, activeSubcategory, searchQuery, priceRange, selectedCity, initialData.products]);

  const activeCategoryData = useMemo(() => {
    return initialData.categories.find((c: any) => c.id === activeCategory);
  }, [activeCategory, initialData.categories]);

  const addToCart = (p: MarketplaceProduct) => {
    const minQty = Number(p.minOrderQty || 1);
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        return prev.map(i => i.id === p.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { ...p, quantity: minQty }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id !== id) return item;
        const minQty = Number(item.minOrderQty || 1);
        const newQty = item.quantity + delta;
        if (newQty < minQty) return item;
        return { ...item, quantity: newQty };
      }).filter(item => item.quantity >= Number(item.minOrderQty || 1));
    });
  };

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

  // Home Sections
  const featuredProductsList = useMemo(() => initialData.products.filter((p: MarketplaceProduct) => p.isFeatured).slice(0, 10), [initialData.products]);
  const flashProductsList = useMemo(() => initialData.products.filter((p: MarketplaceProduct) => p.isFlashSale).slice(0, 10), [initialData.products]);
  const newProductsList = useMemo(() => initialData.products.slice(0, 10), [initialData.products]);

  const ProductCardHorizontal = ({ p }: { p: any }) => (
    <div key={p.id} className={`premium-card ${p.isFeatured ? 'featured' : ''}`} style={{ minWidth: '240px', maxWidth: '240px', scrollSnapAlign: 'start' }}>
      <div className="product-image-container">
        <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} className="product-image" />
        {p.isFlashSale && (
          <div className="badge-base badge-flash" style={{ left: '12px' }}>
            <Zap size={10} fill="currentColor" /> Flash
          </div>
        )}
        <div className="add-to-cart-overlay">
          <button 
            onClick={() => addToCart(p)}
            style={{ width: '100%', background: '#1E1B4B', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>
      <div style={{ padding: '15px' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800, color: '#1E293B', height: '20px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</h4>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '18px', fontWeight: 950, color: '#1E1B4B' }}>{Number(p.price).toFixed(3)}</span>
          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>DT</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#fff', minHeight: '100vh', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mesh {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .motta-grid { animation: slideIn 0.5s ease-out; }
        .premium-card { 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
          border: 1px solid rgba(226, 232, 240, 0.6); 
          border-radius: 24px; 
          overflow: hidden; 
          position: relative; 
          background: #fff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
        }
        .premium-card:hover { 
          transform: translateY(-10px) scale(1.01);
          border-color: #4F46E5; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); 
        }
        .premium-card.featured { border: 2px solid #FCD34D; }
        .product-image-container { position: relative; overflow: hidden; aspect-ratio: 1/1; background: #f8fafc; }
        .product-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1); }
        .premium-card:hover .product-image { transform: scale(1.15); }
        .add-to-cart-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 15px; transform: translateY(105%); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); background: linear-gradient(to top, rgba(255,255,255,0.98), transparent); display: flex; justify-content: center; z-index: 10; }
        .premium-card:hover .add-to-cart-overlay { transform: translateY(0); }
        .badge-flash { background: linear-gradient(135deg, #EF4444, #F97316); color: #fff; }
        .badge-featured { background: linear-gradient(135deg, #F59E0B, #FCD34D); color: #78350F; }
        .badge-base { position: absolute; top: 12px; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 4px; z-index: 5; text-transform: uppercase; }
        .mesh-gradient {
          background: linear-gradient(-45deg, #1E1B4B, #4F46E5, #312E81, #4338CA);
          background-size: 400% 400%;
          animation: mesh 15s ease infinite;
        }
        .glass-nav { 
          background: rgba(255, 255, 255, 0.8); 
          backdrop-filter: blur(12px); 
          border-bottom: 1px solid rgba(226, 232, 240, 0.5); 
        }
        .category-pill { white-space: nowrap; padding: 10px 24px; border-radius: 14px; border: 1px solid #E2E8F0; background: #fff; color: #64748B; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .category-pill:hover { border-color: #4F46E5; color: #4F46E5; transform: translateY(-2px); }
        .category-pill.active { background: #1E1B4B; color: #fff; border-color: #1E1B4B; box-shadow: 0 10px 15px -3px rgba(30, 27, 75, 0.2); }
        .subcategory-pill { white-space: nowrap; padding: 8px 16px; border-radius: 12px; border: 1px solid #F1F5F9; background: #F8FAFC; color: #94A3B8; font-weight: 800; font-size: 11px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s; }
        .subcategory-pill.active { background: #6366F1; color: #fff; border-color: #6366F1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .filter-section { margin-bottom: 24px; }
        .filter-label { font-size: 12px; font-weight: 800; color: #1E293B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; display: block; }
      `}} />

      {/* --- HEADER --- */}
      <div className="glass-nav" style={{ padding: '16px 32px', position: 'sticky', top: '0', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
            <input 
              type="text" 
              placeholder="Rechercher un produit, une marque ou un fournisseur..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: '12px', border: '1.5px solid #F1F5F9', fontSize: '14px', outline: 'none', background: '#F8FAFC', fontWeight: 500 }}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #F1F5F9', background: showFilters ? '#1E1B4B' : '#fff', color: showFilters ? '#fff' : '#64748B', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Filter size={16} /> Filtrer
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <Link href="/marketplace/map" style={{ padding: '10px', borderRadius: '12px', background: '#F1F5F9', color: '#1E1B4B', transition: 'all 0.2s' }}>
              <MapPin size={18} />
            </Link>
            <div style={{ position: 'relative', cursor: 'pointer', background: '#1E1B4B', color: '#fff', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(30, 27, 75, 0.2)' }} onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={18} />
              <span style={{ fontWeight: 800, fontSize: '14px' }}>{cart.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- CATEGORIES BAR --- */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '12px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', marginBottom: activeCategory !== 'all' ? '12px' : '0' }} className="no-scrollbar">
            <button className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveSubcategory('all'); }}>Tout</button>
            {initialData.categories.map((c: any) => (
              <button key={c.id} className={`category-pill ${activeCategory === c.id ? 'active' : ''}`} onClick={() => { setActiveCategory(c.id); setActiveSubcategory('all'); }}>{c.name}</button>
            ))}
          </div>
          {activeCategory !== 'all' && activeCategoryData?.subcategories?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
              <button className={`subcategory-pill ${activeSubcategory === 'all' ? 'active' : ''}`} onClick={() => setActiveSubcategory('all')}>Tous {activeCategoryData.name}</button>
              {activeCategoryData.subcategories.map((s: any) => (
                <button key={s.id} className={`subcategory-pill ${activeSubcategory === s.id ? 'active' : ''}`} onClick={() => setActiveSubcategory(s.id)}>{s.name}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        
        {/* --- FILTERS SIDEBAR --- */}
        {showFilters && (
          <aside style={{ width: '280px', marginRight: '40px', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ position: 'sticky', top: '150px' }}>
              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
                <div className="filter-section">
                  <label className="filter-label">Prix Max ({priceRange.max} DT)</label>
                  <input 
                    type="range" min="0" max="1000" step="5"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: '#4F46E5', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                    <span>0 DT</span>
                    <span>1000 DT</span>
                  </div>
                </div>

                <div className="filter-section">
                  <label className="filter-label">Ville Fournisseur</label>
                  <select 
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #F1F5F9', outline: 'none', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}
                  >
                    <option value="all">Toutes les villes</option>
                    {vendorCities.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>

                <button 
                  onClick={() => { setPriceRange({ min: 0, max: 1000 }); setSelectedCity('all'); setActiveCategory('all'); setActiveSubcategory('all'); setSearchQuery(''); }}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '10px' }}
                >Réinitialiser les filtres</button>
              </div>
            </div>
          </aside>
        )}

        <main style={{ flex: 1 }} className="motta-grid">
          {/* --- HOME PAGE SECTIONS --- */}
          {activeCategory === 'all' && activeSubcategory === 'all' && !searchQuery && !showFilters && (
            <>
              {/* Flash Sales Section */}
              {flashProductsList.length > 0 && (
                <section style={{ marginBottom: '56px', position: 'relative', padding: '40px', borderRadius: '32px', overflow: 'hidden' }} className="mesh-gradient">
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FCD34D' }}>
                          <Zap size={28} fill="currentColor" />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '32px', fontWeight: 950, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Ventes Flash</h2>
                          <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Offres exclusives à durée limitée</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', scrollSnapType: 'x mandatory' }} className="no-scrollbar">
                    {flashProductsList.map(p => <ProductCardHorizontal p={p} key={p.id} />)}
                  </div>
                </section>
              )}

              {/* Premium Selection Horiz Section */}
              {featuredProductsList.length > 0 && (
                <section style={{ marginBottom: '56px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#FEF3C7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)' }}>
                        <Star size={22} fill="currentColor" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em', margin: 0 }}>Sélection Premium</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Le meilleur pour votre établissement</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', scrollSnapType: 'x mandatory' }} className="no-scrollbar">
                    {featuredProductsList.map(p => <ProductCardHorizontal p={p} key={p.id} />)}
                  </div>
                </section>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', marginTop: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E1B4B' }}>
                  <Package size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em', margin: 0 }}>Tous les produits</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Explorez notre catalogue complet</p>
                </div>
              </div>
            </>
          )}

          {/* --- FILTERED GRID --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '32px' }}>
            {filteredProducts.map((p: MarketplaceProduct) => (
              <div key={p.id} className={`product-card ${p.isFeatured ? 'featured' : ''}`}>
                <div className="product-image-container">
                  <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} className="product-image" />
                  {p.isFlashSale && (
                    <div className="badge-base badge-flash" style={{ left: '12px' }}>
                      <Zap size={10} fill="currentColor" /> Vente Flash
                    </div>
                  )}
                  <div className="add-to-cart-overlay">
                    <button 
                      onClick={() => addToCart(p)}
                      style={{ width: '100%', background: '#1E1B4B', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: 'pointer', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(30, 27, 75, 0.2)' }}
                    >
                      <Plus size={18} /> Ajouter au panier
                    </button>
                  </div>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#6366F1', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Store size={12} /> {p.vendor.companyName}
                  </div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800, color: '#1E293B', lineHeight: 1.4, height: '44px', overflow: 'hidden' }}>{p.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 950, color: '#1E1B4B' }}>{Number(p.price).toFixed(3)}</span>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>DT / {p.unit}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                    <MapPin size={10} /> {p.vendor.city || 'Tunisie'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '120px 0', background: '#F8FAFC', borderRadius: '32px', border: '2px dashed #E2E8F0' }}>
              <div style={{ width: '80px', height: '80px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                <Search size={32} color="#CBD5E1" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>Aucun résultat trouvé</h3>
              <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>Nous n'avons trouvé aucun produit correspondant à vos filtres. Essayez de réinitialiser vos critères.</p>
              <button 
                onClick={() => { setPriceRange({ min: 0, max: 1000 }); setSelectedCity('all'); setActiveCategory('all'); setActiveSubcategory('all'); setSearchQuery(''); }}
                style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '12px', background: '#1E1B4B', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
              >Réinitialiser tout</button>
            </div>
          )}
        </main>
      </div>

      {/* --- CART DRAWER --- */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px', background: '#fff', boxShadow: '-20px 0 60px rgba(0,0,0,0.1)', zIndex: 1000, transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E1B4B' }}>
                <ShoppingCart size={22} />
              </div>
              <span style={{ fontWeight: 900, color: '#1E1B4B', fontSize: '18px' }}>Votre Panier</span>
            </div>
            <button onClick={() => setIsCartOpen(false)} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94A3B8', paddingTop: '120px' }}>
                <div style={{ width: '100px', height: '100px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <ShoppingCart size={40} style={{ opacity: 0.2 }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '16px' }}>Votre panier est vide</p>
                <button onClick={() => setIsCartOpen(false)} style={{ marginTop: '16px', color: '#4F46E5', fontWeight: 800, fontSize: '14px', border: 'none', background: 'none', cursor: 'pointer' }}>Commencer mes achats</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '24px', position: 'relative' }}>
                    <img src={item.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100&auto=format&fit=crop'} style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B', marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '12px' }}>{item.vendor.companyName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #F1F5F9', borderRadius: '8px', width: 'fit-content', padding: '2px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#fff', cursor: 'pointer' }}><Minus size={14} /></button>
                        <span style={{ fontWeight: 800, fontSize: '14px', minWidth: '40px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#fff', cursor: 'pointer' }}><Plus size={14} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                      <div style={{ fontWeight: 900, color: '#4F46E5', fontSize: '15px' }}>{(item.price * item.quantity).toFixed(3)} DT</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: '32px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, color: '#64748B', fontSize: '15px' }}>Sous-total</span>
              <span style={{ fontWeight: 800, color: '#1E1B4B', fontSize: '18px' }}>{cartTotal.toFixed(3)} DT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
              <span style={{ fontWeight: 900, color: '#1E1B4B', fontSize: '20px' }}>Total TTC</span>
              <span style={{ fontSize: '26px', fontWeight: 950, color: '#1E1B4B' }}>{cartTotal.toFixed(3)} DT</span>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={isOrdering || cart.length === 0} 
              style={{ width: '100%', padding: '20px', borderRadius: '16px', background: orderStatus === 'SUCCESS' ? '#10B981' : '#1E1B4B', color: '#fff', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '16px', boxShadow: '0 10px 20px rgba(30, 27, 75, 0.2)', transition: 'all 0.3s' }}
            >
              {isOrdering ? 'Traitement en cours...' : orderStatus === 'SUCCESS' ? 'Commande Confirmée !' : 'Valider ma commande'}
            </button>
          </div>
      </div>
      {isCartOpen && <div onClick={() => setIsCartOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(4px)' }}></div>}
    </div>
  );
}
