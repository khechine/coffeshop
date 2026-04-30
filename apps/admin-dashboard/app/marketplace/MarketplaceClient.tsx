'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, ShoppingBag, Star, Zap, ChevronRight, Package, Store, MapPin, CheckCircle, Clock, Send, Plus, Search, Filter, ArrowRight, X, Phone, Mail, Info, Globe, Building2, LayoutGrid, Users } from 'lucide-react';
import { placeMarketplaceOrder, getMarketplaceBundles, rateVendorAction } from '../actions';
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



const RatingStars = ({ ratings }: { ratings: any }) => {
  if (!ratings || ratings.totalReviews === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 10, fontWeight: 700 }}>
       <Star size={10} /> Nouveau
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', color: '#F59E0B' }}>
        <Star size={10} fill="#F59E0B" />
        <span style={{ fontSize: 11, fontWeight: 900, marginLeft: 2 }}>{ratings.overallAvg.toFixed(1)}</span>
      </div>
      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>({ratings.totalReviews})</span>
    </div>
  );
};

export default function MarketplaceClient({ initialData, storeCoords }: { initialData: any, storeCoords?: { lat: number, lng: number } }) {
  const [viewMode, setViewMode] = useState<'products' | 'vendors' | 'bundles' | 'orders'>('products');
  const [activeCategory, setActiveCategory] = useState('all');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [ratingOrder, setRatingOrder] = useState<any>(null);
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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [userCoords, setUserCoords] = useState(storeCoords);
  const [maxDistance, setMaxDistance] = useState<number>(100); // 100km default
  const [isLocating, setIsLocating] = useState(false);

  // Attempt to get more precise location from terminal
  React.useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      }, (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
      });
    }
  }, []);

  const products = initialData.products || [];
  const categories = initialData.categories || [];

  const filteredBundles = useMemo(() => {
    let list = [...(initialData.bundles || [])];
    
    // Re-calculate distances if userCoords changed
    if (userCoords) {
      list = list.map(b => ({
        ...b,
        distance: (b.vendor?.lat && b.vendor?.lng) 
          ? calculateDistance(userCoords.lat, userCoords.lng, Number(b.vendor.lat), Number(b.vendor.lng))
          : b.distance
      })).sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    }

    return list.filter((b: any) => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVendor = selectedCity === 'all' || b.vendor.city === selectedCity;
      const matchesDistance = !userCoords || !b.distance || b.distance <= maxDistance;
      return matchesSearch && matchesVendor && matchesDistance;
    });
  }, [initialData.bundles, searchQuery, selectedCity, userCoords, maxDistance]);
  
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
    let list = [...(initialData.products || [])];

    if (userCoords) {
      list = list.map(p => ({
        ...p,
        distance: (p.vendor?.lat && p.vendor?.lng) 
          ? calculateDistance(userCoords.lat, userCoords.lng, Number(p.vendor.lat), Number(p.vendor.lng))
          : p.distance
      })).sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    }

    return list.filter((p: any) => {
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                           (p.vendor?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPrice = Number(p.price) <= maxPrice;
      const matchesCity = selectedCity === 'all' || p.vendor?.city === selectedCity;
      const matchesDistance = !userCoords || !p.distance || p.distance <= maxDistance;
      return matchesCategory && matchesSearch && matchesPrice && matchesCity && matchesDistance;
    });
  }, [activeCategory, searchQuery, initialData.products, maxPrice, selectedCity, userCoords, maxDistance]);

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
          vendorPosId: selectedPosId || undefined,
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
        <div style={{ maxWidth: 'var(--container-max-w)', margin: '0 auto', padding: '16px var(--page-px)' }}>
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
              <button className={`view-tab ${viewMode === 'orders' ? 'active' : ''}`} onClick={() => {
                setViewMode('orders');
                import('../actions').then(m => m.getStoreMarketplaceOrders().then(setMyOrders));
              }}>
                <ShoppingBag size={16} /> <span className="hide-mobile">Mes Commandes</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className="filter-label" style={{ fontSize: '9px', margin: 0 }}>Proximité</span>
                {isLocating && <span style={{ fontSize: '8px', color: '#4F46E5', fontWeight: 900 }}>GPS...</span>}
              </div>
              <input 
                type="range" min="1" max="500" step="10" 
                value={maxDistance} 
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#4F46E5' }}
              />
              <div style={{ fontSize: '10px', fontWeight: 800, textAlign: 'center', marginTop: '4px' }}>Rayon: {maxDistance} km</div>
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
          <div style={{ maxWidth: 'var(--container-max-w)', margin: '0 auto' }}>
          
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={12} /> {p.vendor?.companyName}
                          </div>
                          <RatingStars ratings={p.vendor?.ratings} />
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
                          {p.distance !== null && (
                            <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 900, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={10} /> à {p.distance.toFixed(1)} km
                            </div>
                          )}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 4px' }}>
                       <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>{v.companyName}</h3>
                       <RatingStars ratings={v.ratings} />
                    </div>
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
          ) : viewMode === 'orders' ? (
            <div className="space-y-6">
               <h2 className="text-2xl font-black text-slate-900 mb-8">Historique des Commandes</h2>
               {myOrders.map((order: any) => (
                 <div key={order.id} className="bg-white rounded-[32px] p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                          <ShoppingBag size={20} />
                       </div>
                       <div>
                          <div className="font-black text-slate-900">#{order.id.slice(-6)}</div>
                          <div className="text-xs text-slate-500 font-bold">{order.vendor?.companyName} • {order.vendorPos?.name || 'Vente directe'}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</div>
                          <div className="font-black text-slate-900">{Number(order.total).toFixed(3)} DT</div>
                       </div>
                       {order.status === 'DELIVERED' && !order.rating ? (
                         <button 
                           onClick={() => setRatingOrder(order)}
                           className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                         >
                           Noter la livraison
                         </button>
                       ) : order.rating ? (
                         <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black">
                            <Star size={14} fill="currentColor" /> Noté
                         </div>
                       ) : (
                         <div className="text-xs font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl uppercase tracking-wider border border-slate-100">
                            {order.status}
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
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
        {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => { setSelectedProduct(null); setSelectedPosId(null); }} addToCart={addToCart} categories={categories} selectedPosId={selectedPosId} setSelectedPosId={setSelectedPosId} />}
        {selectedBundle && <BundleDetailsModal bundle={selectedBundle} onClose={() => setSelectedBundle(null)} addToCart={addToCart} />}
        {selectedVendor && <VendorDetailsDrawer vendor={selectedVendor} products={products} onClose={() => setSelectedVendor(null)} addToCart={addToCart} />}
        {isCartOpen && <CartDrawer cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} cartTotal={cartTotal} isOrdering={isOrdering} handleCheckout={handleCheckout} orderStatus={orderStatus} onClose={() => setIsCartOpen(false)} />}
        {ratingOrder && <RatingModal order={ratingOrder} onClose={() => setRatingOrder(null)} onSuccess={() => {
           import('../actions').then(m => m.getStoreMarketplaceOrders().then(setMyOrders));
           setRatingOrder(null);
        }} />}
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
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

function VendorDetailsDrawer({ vendor, products, onClose, addToCart }: any) {
  const vendorProducts = products.filter((p: any) => p.vendorId === vendor.id);
  const customization = vendor.customization || {};
  
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content">
        {/* Premium Banner */}
        <div style={{ 
          height: 200, 
          background: customization.bannerUrl ? `url(${customization.bannerUrl}) center/cover` : `linear-gradient(135deg, ${customization.primaryColor || '#6366F1'} 0%, ${customization.secondaryColor || '#1E293B'} 100%)`,
          position: 'relative'
        }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <X size={20} />
          </button>
          
          <div style={{ position: 'absolute', bottom: -40, left: 40, width: 100, height: 100, borderRadius: 24, background: 'white', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {customization.logoUrl ? (
              <img src={customization.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Building2 size={40} color={customization.primaryColor || '#6366F1'} />
            )}
          </div>
        </div>

        <div className="p-8 pt-16">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1E293B', margin: 0 }}>{vendor.companyName}</h2>
                {vendor.isPremium && <div style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: 'white', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Premium</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
                    <MapPin size={14} /> {vendor.city || 'Tunisie'}
                 </div>
              </div>
            </div>
          </div>

          {customization.welcomeMessage && (
            <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 20, borderLeft: `4px solid ${customization.primaryColor || '#6366F1'}`, marginBottom: 32 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#475569', fontStyle: 'italic' }}>
                "{customization.welcomeMessage}"
              </p>
            </div>
          )}

          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B', textTransform: 'uppercase', marginBottom: '16px' }}>Catalogue du vendeur</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {vendorProducts.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 12, background: '#F8FAFC', borderRadius: 16 }}>
                <img 
                  src={p.image} 
                  style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} 
                  onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=100'; }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: customization.primaryColor || '#4F46E5' }}>{Number(p.price).toFixed(3)} DT</div>
                </div>
                <button 
                  onClick={() => addToCart(p)}
                  style={{ background: customization.primaryColor || '#1E1B4B', color: '#fff', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}
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
function ProductDetailsModal({ product, onClose, addToCart, categories, selectedPosId, setSelectedPosId }: any) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Store size={20} color="#6366F1" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Points de vente & Stocks</div>
              </div>
            </div>
            
            <div className="space-y-2">
              {(product.posStocks || []).map((s: any) => {
                const qty = Number(s.quantity);
                const isLow = qty <= Number(product.stockThreshold || 5);
                return (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedPosId(s.vendorPosId)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl border-2 transition-all ${
                      selectedPosId === s.vendorPosId 
                        ? 'bg-violet-50 border-violet-600' 
                        : 'bg-white border-transparent hover:border-slate-100'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-sm font-black text-slate-900">{s.vendorPos?.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{s.vendorPos?.address}, {s.vendorPos?.city}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-black ${qty === 0 ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {qty === 0 ? 'Rupture' : `${qty} en stock`}
                      </div>
                      {selectedPosId === s.vendorPosId && <CheckCircle size={14} className="text-violet-600 mt-1 inline" />}
                    </div>
                  </button>
                );
              })}
              {(!product.posStocks || product.posStocks.length === 0) && (
                <div className="text-xs text-slate-400 font-bold italic py-2">
                   Stock géré par le dépôt central.
                </div>
              )}
            </div>
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


function RatingModal({ order, onClose, onSuccess }: { order: any, onClose: () => void, onSuccess: () => void }) {
  const [scores, setScores] = useState({ speed: 5, quality: 5, reliability: 5, delivery: 5 });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await rateVendorAction({
        orderId: order.id,
        speedScore: scores.speed,
        qualityScore: scores.quality,
        reliabilityScore: scores.reliability,
        deliveryScore: scores.delivery,
        comment
      });
      onSuccess();
    } catch (e) {
      alert('Erreur lors de la notation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { key: 'speed', label: 'Vitesse', icon: Clock },
    { key: 'quality', label: 'Qualité', icon: Star },
    { key: 'reliability', label: 'Fiabilité', icon: CheckCircle },
    { key: 'delivery', label: 'Livraison', icon: Package }
  ];

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="p-8">
           <h2 className="text-2xl font-black text-slate-900 mb-2">Noter votre commande</h2>
           <p className="text-sm text-slate-500 font-bold mb-8">Votre retour aide {order.vendor?.companyName} à s'améliorer.</p>

           <div className="space-y-6 mb-8">
              {categories.map(cat => (
                <div key={cat.key} className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <cat.icon size={18} className="text-slate-400" />
                      <span className="text-sm font-black text-slate-700">{cat.label}</span>
                   </div>
                   <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setScores({ ...scores, [cat.key]: star })}
                          className={`p-1 transition-all ${scores[cat.key as keyof typeof scores] >= star ? 'text-amber-500' : 'text-slate-200'}`}
                        >
                           <Star size={20} fill={scores[cat.key as keyof typeof scores] >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                   </div>
                </div>
              ))}
           </div>

           <textarea 
             placeholder="Un commentaire ? (Optionnel)"
             className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium mb-8 focus:ring-2 focus:ring-indigo-600 outline-none min-h-[100px]"
             value={comment}
             onChange={e => setComment(e.target.value)}
           />

           <button 
             onClick={handleSubmit}
             disabled={isSubmitting}
             className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
           >
             {isSubmitting ? 'Envoi...' : 'Confirmer la note'}
           </button>
        </div>
      </div>
    </div>
  );
}
