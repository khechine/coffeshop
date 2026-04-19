'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, ChevronRight, Package, Store, MapPin, CheckCircle, Clock, Send, Plus, Search, Filter, ArrowRight, X, Phone, Mail, Info, Globe, Building2, LayoutGrid, Users } from 'lucide-react';
import { placeMarketplaceOrder } from '../actions';
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
  minOrderQuantity: any;
  categoryId: string;
}

export default function MarketplaceClient({ initialData }: { initialData: any }) {
  const [viewMode, setViewMode] = useState<'products' | 'vendors'>('products');
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

  const products = initialData.products || [];
  const categories = initialData.categories || [];
  
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
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      
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

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Sidebar Filters */}
        <aside className="sidebar-filter">
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

          <div style={{ marginTop: '40px', padding: '20px', background: '#EEF2FF', borderRadius: '16px', border: '1px solid #E0E7FF' }}>
            <div style={{ color: '#4338CA', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>Besoin d'aide ?</div>
            <div style={{ color: '#6366F1', fontSize: '12px', lineHeight: 1.5 }}>Contactez notre support B2B pour une recherche personnalisée.</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '32px' }}>
          
          {viewMode === 'products' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {filteredProducts.map((p: any) => (
                  <div key={p.id} className="premium-card">
                    <div className="product-image-container">
                      <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} className="product-image" alt={p.name} />
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
                      <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#1E293B', height: '44px', overflow: 'hidden' }}>{p.name}</h4>
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
          ) : (
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
          )}

        </main>
      </div>

      {/* --- VENDOR DETAILS DRAWER --- */}
      {selectedVendor && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedVendor(null)} />
          <div className="drawer-content" style={{ transform: selectedVendor ? 'translateX(0)' : 'translateX(100%)' }}>
            <div style={{ padding: '32px', borderBottom: '1px solid #F1F5F9', background: '#1E1B4B', color: '#fff', position: 'relative' }}>
              <button 
                onClick={() => setSelectedVendor(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '20px' }}>
                🏢
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>{selectedVendor.companyName}</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: 0.8 }}>
                  <MapPin size={14} /> {selectedVendor.city || 'Ville non spécifiée'}
                </div>
                {selectedVendor.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: 0.8 }}>
                    <Phone size={14} /> {selectedVendor.phone}
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <section style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="#4F46E5" /> À Propos
                </h3>
                <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.6 }}>
                  {selectedVendor.description || "Ce fournisseur n'a pas encore ajouté de description détaillée."}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>ADRESSE</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{selectedVendor.address || 'Non spécifiée'}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>CONTACT DIRECT</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{selectedVendor.phone || 'Non spécifié'}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} color="#4F46E5" /> Catalogue Produits
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {products.filter((p: any) => p.vendorId === selectedVendor.id).map((p: any) => (
                    <div key={p.id} style={{ padding: '12px', border: '1px solid #F1F5F9', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=60&auto=format&fit=crop'} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} alt={p.name} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>{p.name}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E1B4B' }}>{Number(p.price).toFixed(3)} DT</div>
                      </div>
                      <button 
                        onClick={() => addToCart(p)}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EEF2FF', border: 'none', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            
            <div style={{ padding: '24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#F1F5F9', color: '#1E293B', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Mail size={16} /> Contacter</span>
              </button>
              <button style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#1E1B4B', color: '#fff', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Plus size={16} /> Suivre</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* --- CART DRAWER --- */}
      {isCartOpen && <CartDrawer cart={cart} removeFromCart={removeFromCart} cartTotal={cartTotal} isOrdering={isOrdering} handleCheckout={handleCheckout} orderStatus={orderStatus} onClose={() => setIsCartOpen(false)} />}
      
      {/* --- MOBILE FILTERS DRAWER --- */}
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

function CartDrawer({ cart, removeFromCart, cartTotal, isOrdering, handleCheckout, orderStatus, onClose }: any) {
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
                <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  <img src={item.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100&auto=format&fit=crop'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt={item.name} />
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
            {isOrdering ? 'Traitement...' : orderStatus === 'SUCCESS' ? <><CheckCircle size={20} /> Réussi !</> : <><Send size={18} /> Commander</>}
          </button>
        </div>
      </div>
    </>
  );
}
