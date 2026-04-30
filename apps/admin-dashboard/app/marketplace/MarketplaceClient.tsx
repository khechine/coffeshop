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

  const avg = Number(ratings.overallAvg || 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', color: '#F59E0B' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            size={10} 
            fill={s <= Math.round(avg) ? "#F59E0B" : "none"} 
            stroke={s <= Math.round(avg) ? "#F59E0B" : "#CBD5E1"} 
          />
        ))}
        <span style={{ fontSize: 11, fontWeight: 900, marginLeft: 4, color: '#1E293B' }}>{avg.toFixed(1)}</span>
      </div>
      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>({ratings.totalReviews})</span>
    </div>
  );
};

const BannerCarousel = () => {
  const [active, setActive] = useState(0);
  const banners = [
    {
      image: 'file:///Users/mehdikhechine/.gemini/antigravity/brain/01ed67a0-490d-4d32-8a60-b560324aa5c0/marketplace_banner_1_1777589662016.png',
      title: 'Équipez Votre Café comme un Pro',
      subtitle: 'Découvrez notre sélection de machines à espresso et accessoires haut de gamme.',
      color: '#1E1B4B'
    },
    {
      image: 'file:///Users/mehdikhechine/.gemini/antigravity/brain/01ed67a0-490d-4d32-8a60-b560324aa5c0/marketplace_banner_2_1777589680045.png',
      title: 'Le Meilleur du Grossiste Alimentaire',
      subtitle: 'Ingrédients frais, pâtisseries artisanales et café gourmet pour votre établissement.',
      color: '#064E3B'
    },
    {
      image: 'file:///Users/mehdikhechine/.gemini/antigravity/brain/01ed67a0-490d-4d32-8a60-b560324aa5c0/marketplace_banner_3_1777589721871.png',
      title: 'Art de la Table & Cuisine',
      subtitle: 'Tout ce dont vous avez besoin pour une expérience culinaire exceptionnelle.',
      color: '#78350F'
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => setActive(prev => (prev + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mkt-banner-carousel">
      {banners.map((b, idx) => (
        <div 
          key={idx} 
          className={`banner-slide ${idx === active ? 'active' : ''}`}
          style={{ background: `linear-gradient(to right, ${b.color}CC, transparent), url(${b.image}) center/cover` }}
        >
          <div className="banner-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
               <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 900, backdropFilter: 'blur(5px)' }}>OFFRE EXCLUSIVE</span>
            </div>
            <h2>{b.title}</h2>
            <p>{b.subtitle}</p>
            <button className="btn-premium btn-premium-primary" style={{ padding: '16px 40px', fontSize: 16 }}>
              Découvrir <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </button>
          </div>
        </div>
      ))}
      <div className="banner-nav">
        {banners.map((_, idx) => (
          <button 
            key={idx} 
            className={`banner-dot ${idx === active ? 'active' : ''}`}
            onClick={() => setActive(idx)}
          />
        ))}
      </div>
    </div>
  );
};

const TopCategoriesGrid = ({ categories, setActiveCategory }: any) => {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
         <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1E1B4B' }}>Catégories Populaires</h3>
         <button className="text-indigo-600 font-black text-sm flex items-center gap-2 hover:gap-3 transition-all">Voir tout <ChevronRight size={16} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20 }}>
        {categories.slice(0, 6).map((c: any) => (
          <div key={c.id} className="mkt-category-item" onClick={() => setActiveCategory(c.id)}>
            <div className="icon-circle">
              {c.icon || '📦'}
            </div>
            <h4>{c.name}</h4>
          </div>
        ))}
      </div>
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
          
          {selectedVendor ? (
            <VendorStoreView 
              vendor={selectedVendor} 
              products={products} 
              onClose={() => setSelectedVendor(null)} 
              addToCart={addToCart} 
            />
          ) : viewMode === 'products' ? (
            <>
              <BannerCarousel />
              <TopCategoriesGrid categories={categories} setActiveCategory={setActiveCategory} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <h2 style={{ fontSize: 24, fontWeight: 950, color: '#1E1B4B' }}>Nouveautés & Meilleurs Prix</h2>
                 <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ fontSize: 13, color: '#64748B', fontWeight: 700 }}>{filteredProducts.length} produits trouvés</div>
                 </div>
              </div>

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
                        <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} style={{ width: '100%', background: '#1E1B4B', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
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

function VendorStoreView({ vendor, products, onClose, addToCart }: any) {
  const vendorProducts = products.filter((p: any) => p.vendorId === vendor.id);
  const customization = vendor.customization || {};
  const [activeTab, setActiveTab] = useState('products');
  const [vendorSearch, setVendorSearch] = useState('');

  const filteredVendorProducts = vendorProducts.filter((p: any) => 
    p.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const bannerUrl = customization.bannerUrl 
    ? (customization.bannerUrl.startsWith('/') ? 'https://www.elkassa.com' + customization.bannerUrl : customization.bannerUrl)
    : 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1200';

  const logoUrl = customization.logoUrl 
    ? (customization.logoUrl.startsWith('/') ? 'https://www.elkassa.com' + customization.logoUrl : customization.logoUrl)
    : null;

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="vendor-store-header relative">
        <img src={bannerUrl} className="w-full h-[300px] object-cover" alt="Banner" />
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-3 hover:bg-white transition-all z-10"
        >
          <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Retour au Marketplace
        </button>

        <div className="px-8 -mt-20 relative z-20">
          <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 flex items-end justify-between gap-6">
            <div className="flex gap-6 items-end">
                <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <Building2 size={48} color={customization.primaryColor || '#4f46e5'} />
                )}
                </div>
                <div className="mb-2">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-black text-slate-900">{vendor.companyName}</h1>
                        {vendor.isPremium && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">Premium</span>}
                    </div>
                    <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                        <div className="flex items-center gap-1"><MapPin size={14} /> {vendor.city}</div>
                        <div><strong>{vendorProducts.length}</strong> Produits</div>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 mb-2">
               <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all">Suivre</button>
               <button className="bg-slate-100 text-slate-900 p-4 rounded-2xl"><Mail size={20} /></button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px' }}>
        <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
                {['products', 'about', 'reviews'].map(tab => (
                    <button key={tab} className={`px-6 py-3 rounded-2xl font-black text-sm capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setActiveTab(tab)}>{tab}</button>
                ))}
            </div>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-slate-50 border-none rounded-2xl py-3 px-6 text-sm font-bold w-64 outline-none" 
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)} 
            />
        </div>

        {activeTab === 'products' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredVendorProducts.map((p: any) => (
              <div key={p.id} className="bg-white rounded-3xl p-4 border border-slate-100 hover:shadow-xl transition-all">
                <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} className="w-full h-40 object-cover rounded-2xl mb-4" alt={p.name} />
                <h4 className="font-bold text-slate-900 mb-1">{p.name}</h4>
                <div className="flex justify-between items-center">
                    <span className="font-black text-indigo-600">{Number(p.price).toFixed(3)} DT</span>
                    <button onClick={() => addToCart(p)} className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black">+</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-12 border border-slate-100">
             <h2 className="text-2xl font-black text-slate-900 mb-6">À propos de {vendor.companyName}</h2>
             <p className="text-slate-500 leading-relaxed font-medium mb-8">{vendor.description || "Ce vendeur n'a pas encore ajouté de description."}</p>
          </div>
        )}
      </div>
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

function CartDrawer({ cart, removeFromCart, updateQuantity, cartTotal, isOrdering, handleCheckout, orderStatus, onClose }: any) {
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
        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
             <span style={{ fontSize: 18, fontWeight: 900, color: '#1E1B4B' }}>Total TTC</span>
             <span style={{ fontSize: 28, fontWeight: 950, color: '#1E1B4B' }}>{cartTotal.toFixed(3)} DT</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={isOrdering || cart.length === 0}
            className={`w-full py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all ${orderStatus === 'SUCCESS' ? 'bg-emerald-500' : 'bg-slate-900'} text-white hover:scale-[1.02] active:scale-[0.98]`}
          >
            {isOrdering ? 'Traitement...' : orderStatus === 'SUCCESS' ? 'Commandé !' : <><Send size={18} /> Valider la Commande</>}
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
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Points de vente & Stocks</div>
            </div>
            
            <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-sm font-black text-slate-900">{s.vendorPos?.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{s.vendorPos?.city}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-black ${qty === 0 ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {qty === 0 ? 'Rupture' : `${qty} en stock`}
                      </div>
                    </div>
                  </button>
                );
              })}
              {(!product.posStocks || product.posStocks.length === 0) && (
                <div className="text-xs text-slate-400 font-bold italic py-2">
                   Vente directe uniquement.
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => { addToCart(product); onClose(); }}
            className="btn-premium btn-premium-primary"
            style={{ width: '100%', padding: '20px', borderRadius: 20, fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
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
