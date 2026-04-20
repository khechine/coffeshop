'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, ChevronRight, Package, Store, MapPin, CheckCircle, Clock, Send, Plus, Search, Filter, ArrowRight, X, Phone, Mail, Info, Globe, Building2, LayoutGrid, Users } from 'lucide-react';
import { placeMarketplaceOrder, getMarketplaceBundles } from '../actions';
import './marketplace.css';

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
    phone?: string;
    description?: string;
    address?: string;
  };
  minOrderQty: any;
  categoryId: string;
}

export default function MarketplaceClient({ initialData }: { initialData: any }) {
  const [viewMode, setViewMode] = useState<'products' | 'vendors' | 'bundles'>('products');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  
  // Advanced filters
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [bundles, setBundles] = useState<any[]>(initialData.bundles || []);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);

  const products = initialData.products || [];
  const categories = initialData.categories || [];

  const filteredBundles = useMemo(() => {
    return bundles.filter((b: any) => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVendor = selectedCity === 'all' || b.vendor.city === selectedCity;
      return matchesSearch && matchesVendor;
    });
  }, [bundles, searchQuery, selectedCity]);
  
  const vendors = useMemo(() => {
    const vMap: Record<string, any> = {};
    products.forEach((p: any) => {
      if (p.vendor && !vMap[p.vendor.id]) {
        vMap[p.vendor.id] = {
          ...p.vendor,
          productCount: products.filter((pro: any) => pro.vendorId === p.vendorId).length
        };
      }
    });
    return Object.values(vMap);
  }, [products]);

  const cities = useMemo(() => {
    const cSet = new Set<string>();
    vendors.forEach(v => { if (v.city) cSet.add(v.city); });
    return Array.from(cSet);
  }, [vendors]);

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                           (p.vendor?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPrice = Number(p.price) <= maxPrice;
      const matchesCity = selectedCity === 'all' || p.vendor?.city === selectedCity;
      return matchesCategory && matchesSearch && matchesPrice && matchesCity;
    });
  }, [activeCategory, searchQuery, products, maxPrice, selectedCity]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v: any) => {
      const matchesSearch = v.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (v.city && v.city.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCity = selectedCity === 'all' || v.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [vendors, searchQuery, selectedCity]);

  const addToCart = (p: any, isBundle = false) => {
    const minQty = isBundle ? 1 : Number(p.minOrderQty || 1);
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: minQty, isBundle }];
    });
    if (window.innerWidth < 1280) {
      setIsCartOpen(true);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
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
          items: items.map(i => ({ 
            productId: i.isBundle ? undefined : i.id, 
            bundleId: i.isBundle ? i.id : undefined,
            quantity: i.quantity, 
            price: Number(i.price), 
            name: i.name 
          }))
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
    <div className="marketplace-premium-wrapper">
      
      {/* Top Navbar */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 32px' }}>
          <div className="nav-container">
            <div className="search-container">
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder={viewMode === 'products' ? "Rechercher un produit..." : "Rechercher un fournisseur..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="view-tabs">
              <button className={`view-tab ${viewMode === 'products' ? 'active' : ''}`} onClick={() => setViewMode('products')}>
                <LayoutGrid size={16} /> <span className="hide-mobile">Produits</span>
              </button>
              <button className={`view-tab ${viewMode === 'vendors' ? 'active' : ''}`} onClick={() => setViewMode('vendors')}>
                <Users size={16} /> <span className="hide-mobile">Fournisseurs</span>
              </button>
              <button className={`view-tab ${viewMode === 'bundles' ? 'active' : ''}`} onClick={() => setViewMode('bundles')}>
                <Zap size={16} /> <span className="hide-mobile">Packs</span>
              </button>
            </div>

            <div className="nav-actions">
              <button 
                className="mobile-filter-btn" 
                onClick={() => setIsFiltersOpen(true)}
              >
                <Filter size={18} />
              </button>
              
              <Link href="/marketplace/map" className="nav-btn">
                <MapPin size={16} /> <span className="hide-tablet">Carte</span>
              </Link>
              
              <div className="cart-trigger" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart size={18} />
                <span className="cart-count">{cart.length}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="marketplace-main-layout">
        
        {/* Sidebar Categories (Left) */}
        <aside className="marketplace-sidebar-left">
          <button 
            className={`mkt-category-vertical ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <div className="mkt-category-icon"><LayoutGrid size={24} /></div>
            <span>Tout</span>
          </button>
          {categories.map((c: any) => (
            <button 
              key={c.id} 
              className={`mkt-category-vertical ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              <div className="mkt-category-icon">
                {c.icon ? <span>{c.icon}</span> : <Package size={24} />}
              </div>
              <span style={{ fontSize: '10px' }}>{c.name}</span>
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="filter-section" style={{ padding: '0 8px' }}>
              <span className="filter-label" style={{ fontSize: '9px' }}>Mkt. City</span>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '11px', fontWeight: 700 }}
              >
                <option value="all">Tout Tunis</option>
                {cities.map((city: any) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            
            <div className="filter-section" style={{ padding: '0 8px' }}>
              <span className="filter-label" style={{ fontSize: '9px' }}>Prix Max</span>
              <input 
                type="range" min="0" max="1000" step="50" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#1E1B4B' }}
              />
              <div style={{ fontSize: '10px', fontWeight: 800, textAlign: 'center', marginTop: '4px' }}>{maxPrice} DT</div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="mkt-content-area">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {viewMode === 'products' ? (
            <>
              <div className="product-grid-mkt">
                {filteredProducts.map((p: any) => (
                  <div key={p.id} className="premium-card">
                    <div className="product-image-container" onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>
                      <img 
                        src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} 
                        className="product-image" 
                        alt={p.name} 
                        onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400'; }}
                      />
                      {p.isFlashSale && <span className="badge-base badge-flash">FLASH</span>}
                      {p.isFeatured && <span className="badge-base badge-featured" style={{ top: 40 }}>BEST</span>}
                      <div className="add-to-cart-overlay">
                        <button onClick={() => addToCart(p)} style={{ width: '100%', background: '#1E1B4B', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                          <Plus size={16} /> Ajouter au panier
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <button 
                        onClick={() => setSelectedVendor(p.vendor)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                      >
                        <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building2 size={12} /> {p.vendor?.companyName}
                        </div>
                      </button>
                      <button 
                        onClick={() => setSelectedProduct(p)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                      >
                        <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#1E293B', height: '44px', overflow: 'hidden' }}>{p.name}</h4>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '20px', fontWeight: 950, color: '#1E1B4B' }}>{Number(p.price).toFixed(3)}</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, marginLeft: '4px' }}>DT / {p.unit}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Package size={10} /> min. {p.minOrderQty}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredProducts.length === 0 && <EmptyState />}
            </>
          ) : viewMode === 'vendors' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {filteredVendors.map((v: any) => (
                  <div key={v.id} className="premium-card vendor-card" onClick={() => setSelectedVendor(v)}>
                    <div className="vendor-avatar">🏪</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 4px' }}>{v.companyName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                      <MapPin size={14} color="#94A3B8" /> {v.city}
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: '#1E1B4B' }}>
                      {v.productCount} PRODUITS EN LIGNE
                    </div>
                    <div style={{ marginTop: '20px', width: '100%', borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                      {v.phone && <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={v.phone}><Phone size={14} color="#4F46E5" /></div>}
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={14} color="#10B981" /></div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Info size={14} color="#94A3B8" /></div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredVendors.length === 0 && <EmptyState />}
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                {filteredBundles.map((b: any) => (
                  <div key={b.id} className="premium-card bundle-card" onClick={() => setSelectedBundle(b)}>
                    <div className="bundle-image-container">
                       <img 
                         src={b.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600'} 
                         className="bundle-image" 
                         alt={b.name} 
                         onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600'; }}
                       />
                       <div className="bundle-glass-overlay">
                          <div style={{ display: 'flex', gap: -10 }}>
                             {b.items.slice(0, 3).map((item: any, idx: number) => (
                               <div key={idx} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', marginLeft: idx > 0 ? -12 : 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                  <img src={item.vendorProduct.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               </div>
                             ))}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{b.items.length} Produits</span>
                       </div>
                    </div>
                    <div style={{ padding: 24 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ color: '#6366F1', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>{b.vendor.companyName}</span>
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>ÉCO. {b.discountPercent}%</span>
                       </div>
                       <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1E1B4B', margin: '0 0 16px', lineHeight: 1.3 }}>{b.name}</h3>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                             <div style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'line-through' }}>
                                {(b.price / (1 - b.discountPercent / 100)).toFixed(3)} DT
                             </div>
                             <div style={{ fontSize: 24, fontWeight: 950, color: '#1E1B4B' }}>{b.price.toFixed(3)} DT</div>
                          </div>
                          <button className="btn-premium btn-premium-primary" style={{ padding: '10px 20px' }}>Voir Pack</button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredBundles.length === 0 && <EmptyState />}
            </>
          )}

          </div>
        </main>

        {/* Sidebar Cart (Right) */}
        <aside className="marketplace-sidebar-right">
          <div className="mkt-cart-sidebar-header">
            <h2>Votre Panier</h2>
            <div className="cart-count" style={{ background: '#1E1B4B', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '12px' }}>{cart.length}</div>
          </div>
          
          <div className="mkt-cart-items-container">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94A3B8', paddingTop: '100px' }}>
                <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Le panier est vide</p>
              </div>
            ) : (
              cart.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={item.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100&auto=format&fit=crop'} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} alt={item.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E1B4B' }}>{item.name}</div>
                      {item.isBundle && <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '8px', fontWeight: 900, padding: '2px 4px', borderRadius: '4px' }}>PACK</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{item.vendor?.companyName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '20px', height: '20px', borderRadius: '4px', border: 'none', background: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <span style={{ fontSize: '12px', fontWeight: 800, minWidth: '15px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '20px', height: '20px', borderRadius: '4px', border: 'none', background: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#6366F1' }}>{(Number(item.price) * item.quantity).toFixed(3)} DT</div>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '28px', height: '28px', color: '#EF4444', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              ))
            )}
          </div>

          <div className="mkt-cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontWeight: 900, color: '#1E1B4B', fontSize: '18px' }}>Total TTC</span>
              <span style={{ fontSize: '24px', fontWeight: 950, color: '#1E1B4B' }}>{cartTotal.toFixed(3)} DT</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isOrdering || cart.length === 0}
              style={{ width: '100%', padding: '18px', borderRadius: '16px', background: orderStatus === 'SUCCESS' ? '#10B981' : '#1E1B4B', color: '#fff', border: 'none', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isOrdering ? 'Traitement...' : orderStatus === 'SUCCESS' ? <><CheckCircle size={20} /> Réussi !</> : <><Send size={18} /> Commander</>}
            </button>
          </div>
        </aside>
      </div>

        {/* Modals & Drawers */}
        {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} addToCart={addToCart} categories={categories} />}
        {selectedBundle && <BundleDetailsModal bundle={selectedBundle} onClose={() => setSelectedBundle(null)} addToCart={addToCart} />}
        {selectedVendor && <VendorDetailsDrawer vendor={selectedVendor} products={products} onClose={() => setSelectedVendor(null)} addToCart={addToCart} />}
        {isCartOpen && <CartDrawer cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} cartTotal={cartTotal} isOrdering={isOrdering} handleCheckout={handleCheckout} orderStatus={orderStatus} onClose={() => setIsCartOpen(false)} />}
        {isFiltersOpen && (
          <>
            <div className="drawer-overlay" onClick={() => setIsFiltersOpen(false)} />
            <div className="drawer-content mobile-filters-drawer">
              <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800, color: '#1E1B4B' }}>Filtres Avancés</h3>
                <button onClick={() => setIsFiltersOpen(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32 }}><X size={18} /></button>
              </div>
              <div style={{ padding: '24px' }}>
                <SidebarFiltersContent 
                  activeCategory={activeCategory} 
                  setActiveCategory={setActiveCategory}
                  categories={categories}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  cities={cities}
                />
              </div>
            </div>
          </>
        )}
    </div>
  );
}

function BundleDetailsModal({ bundle, onClose, addToCart }: any) {
  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal-content" onClick={e => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="modal-gallery">
          <div className="carousel-slide">
            <img 
              src={bundle.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600'} 
              alt={bundle.name} 
              onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600'; }}
            />
          </div>
          <div style={{ position: 'absolute', bottom: 20, right: 20, background: '#1E1B4B', color: '#fff', padding: '12px 24px', borderRadius: 16, fontWeight: 900, fontSize: 18, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
            {bundle.price.toFixed(3)} DT
          </div>
        </div>

        <div className="modal-details">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
             <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>PACK PRO</span>
             <span style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>ÉCO. {bundle.discountPercent}%</span>
          </div>
          
          <h2 style={{ fontSize: 32, fontWeight: 950, color: '#1E1B4B', margin: '0 0 16px', lineHeight: 1.1 }}>{bundle.name}</h2>
          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 32 }}>{bundle.description}</p>
          
          <div style={{ background: '#F8FAFC', borderRadius: 24, padding: 24, marginBottom: 32 }}>
             <h4 style={{ fontSize: 13, fontWeight: 900, color: '#1E1B4B', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>Produits inclus :</h4>
             <div style={{ dispay: 'flex', flexDirection: 'column', gap: 12 }}>
                {bundle.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: idx === bundle.items.length - 1 ? 'none' : '1px solid #E2E8F0', marginBottom: 12 }}>
                     <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={item.vendorProduct.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                     <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1B4B' }}>{item.vendorProduct.productStandard?.name || 'Produit'}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>Quantité: {item.quantity} {item.vendorProduct.unit || 'unité'}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="mkt-vendor-badge">
             <div className="vendor-avatar" style={{ width: 42, height: 42, fontSize: 20, marginBottom: 0 }}>🏪</div>
             <div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Vendeur</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1E1B4B' }}>{bundle.vendor.companyName}</div>
             </div>
          </div>

          <button 
            className="btn-premium btn-premium-primary" 
            style={{ width: '100%', padding: 20, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 16 }}
            onClick={() => {
              addToCart(bundle, true);
              onClose();
            }}
          >
            <Zap size={20} /> Ajouter le Pack au Panier
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarFiltersContent({ 
  activeCategory, setActiveCategory, categories, 
  maxPrice, setMaxPrice, 
  selectedCity, setSelectedCity, cities 
}: any) {
  return (
    <>
      <div className="filter-section">
        <span className="filter-label">Catégories</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className={`subcategory-pill ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Tout</button>
          {categories.map((c: any) => (
            <button key={c.id} className={`subcategory-pill ${activeCategory === c.id ? 'active' : ''}`} onClick={() => setActiveCategory(c.id)}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="filter-section" style={{ marginTop: '32px' }}>
        <span className="filter-label">Prix Max ({maxPrice} DT)</span>
        <input 
          type="range" min="0" max="1000" step="10" 
          value={maxPrice} 
          onChange={(e) => setMaxPrice(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#4F46E5' }}
        />
      </div>

      <div className="filter-section" style={{ marginTop: '32px' }}>
        <span className="filter-label">Ville du fournisseur</span>
        <select 
          value={selectedCity} 
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 600 }}
        >
          <option value="all">Toutes les villes</option>
          {cities.map((city: any) => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ width: '70px', height: '70px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Search size={28} color="#CBD5E1" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#475569' }}>Aucun résultat</h3>
      <p style={{ color: '#94A3B8', fontSize: '14px' }}>Désolé, nous n'avons rien trouvé pour votre recherche.</p>
    </div>
  );
}

function CartDrawer({ cart, removeFromCart, updateQuantity, cartTotal, isOrdering, handleCheckout, orderStatus, onClose }: any) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content" style={{ maxWidth: '380px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingCart size={20} />
            <span style={{ fontWeight: 800, color: '#1E1B4B', fontSize: '16px' }}>Votre Panier</span>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', color: '#1E293B', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', paddingTop: '100px' }}>
              <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Le panier est vide</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cart.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative', alignItems: 'center' }}>
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100'} 
                    style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} 
                    alt={item.name} 
                    onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=100'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B', marginBottom: '2px' }}>{item.name}</div>
                      {item.isBundle && <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>PACK</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '8px' }}>{item.vendor.companyName}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F1F5F9', padding: '6px', borderRadius: '10px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>-</button>
                        <span style={{ fontSize: '14px', fontWeight: 900, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>+</button>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 950, color: '#4F46E5' }}>{(Number(item.price) * item.quantity).toFixed(3)} DT</div>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}>Supprimer</button>
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
            {isOrdering ? 'Traitement...' : orderStatus === 'SUCCESS' ? <><CheckCircle size={20} /> Réussi !</> : <><Send size={18} /> Commander</>}
          </button>
        </div>
      </div>
    </>
  );
}
function ProductDetailsModal({ product, onClose, addToCart, categories }: any) {
  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal-content" onClick={e => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="modal-gallery">
          <div className="img-carousel">
            <div className="carousel-slide">
              <img 
                src={product.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800'} 
                alt={product.name} 
                onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800'; }}
              />
            </div>
            <div className="carousel-slide">
              <img 
                src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800' 
                alt="Detail View" 
              />
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E1B4B' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1' }} />
          </div>
        </div>

        <div className="modal-details">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {categories.find((c: any) => c.id === product.categoryId)?.name || 'Produit'}
            </span>
            <span className="badge-base badge-featured" style={{ position: 'static' }}>Selection Elite</span>
          </div>
          
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1E1B4B', margin: '0 0 16px', lineHeight: 1.2 }}>{product.name}</h2>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 32, fontWeight: 950, color: '#1E1B4B' }}>{Number(product.price).toFixed(3)} DT</span>
            <span style={{ fontSize: 16, color: '#94A3B8', fontWeight: 700 }}>/ {product.unit}</span>
          </div>

          <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 20, border: '1px solid #F1F5F9', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Package size={20} color="#6366F1" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Commande Minimum</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{product.minOrderQty} {product.unit}</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Ce produit professionnel est disponible pour livraison immédiate. Qualité certifiée.
            </p>
          </div>

          <button 
            onClick={() => { addToCart(product); onClose(); }}
            style={{ width: '100%', padding: '20px', borderRadius: 20, background: '#1E1B4B', color: '#fff', border: 'none', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 10px 20px rgba(30, 27, 75, 0.2)' }}
          >
            <Plus size={20} /> Ajouter au Panier
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorDetailsDrawer({ vendor, products, onClose, addToCart }: any) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content" style={{ maxWidth: 500 }}>
        <div style={{ padding: '32px', borderBottom: '1px solid #F1F5F9', background: '#1E1B4B', color: '#fff', position: 'relative' }}>
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          <div style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px' }}>🏢</div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px' }}>{vendor.companyName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.8 }}>
            <MapPin size={14} /> {vendor.city}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
             <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B', textTransform: 'uppercase', marginBottom: '16px' }}>Catalogue du vendeur</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {products.filter((p: any) => p.vendorId === vendor.id).map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 12, background: '#F8FAFC', borderRadius: 16 }}>
                    <img 
                      src={p.image} 
                      style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} 
                      onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=100'; }}
                    />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                       <div style={{ fontSize: 14, fontWeight: 900, color: '#4F46E5' }}>{Number(p.price).toFixed(3)} DT</div>
                    </div>
                    <button 
                      onClick={() => addToCart(p)}
                      style={{ background: '#1E1B4B', color: '#fff', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
             </div>
        </div>
      </div>
    </>
  );
}
