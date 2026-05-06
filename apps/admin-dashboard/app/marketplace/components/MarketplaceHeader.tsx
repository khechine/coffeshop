'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Search, LayoutGrid, ShoppingCart, 
  MapPin, ChevronRight, X, Menu, User, ArrowRight,
  ChevronDown, Globe, HelpCircle, Smartphone, Languages,
  MessageSquare, Target
} from 'lucide-react';
import { useCart } from '../CartContext';
import CartDrawer from '../CartDrawer';
import MarketplaceRFQModal from './MarketplaceRFQModal';

export default function MarketplaceHeader({ isVendor = false, store, minimal = false, allCategories = [] }: { isVendor?: boolean, store?: any, minimal?: boolean, allCategories?: any[] }) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  
  const groupedCategories = allCategories.reduce((acc: any, cat: any) => {
    const group = cat.groupTitle || 'Autres Catégories';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {});

  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchScope, setSearchScope] = useState(searchParams.get('scope') || 'PRODUCT');
  const [radius, setRadius] = useState(searchParams.get('radius') || 'all');

  // Load radius from cookie on mount if not in URL
  useEffect(() => {
    if (!searchParams.get('radius')) {
      const cookieVal = document.cookie
        .split('; ')
        .find(row => row.startsWith('mkt_radius='))
        ?.split('=')[1];
      if (cookieVal) setRadius(cookieVal);
    }
  }, [searchParams]);

  // Persist radius in cookie for server-side awareness across pages
  useEffect(() => {
    if (radius) {
      document.cookie = `mkt_radius=${radius}; path=/; max-age=31536000`;
    }
  }, [radius]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}&scope=${searchScope}&radius=${radius}`);
  };

  return (
    <>
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 1000 }}>
        {/* Top Slim Bar - Hidden on mobile */}
        <div className="top-bar" style={{ background: '#F9FAFB', borderBottom: '1px solid #F1F5F9', padding: '6px 24px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B7280' }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E31E24', fontWeight: 700 }}>
                <MapPin size={14} />
                <span>Rayon : {radius === 'all' ? 'Tunisie entière' : `${radius} km`}</span>
                <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: '8px' }} className="pos-detail">
                  | Position : {store ? `${store.name} (${store.city || 'Position GPS'})` : 'Position boutique non définie'}
                </span>
              </div>
              <div 
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
                style={{ position: 'relative' }}
              >
                <Link 
                  href="/marketplace/categories" 
                  style={{ color: '#6B7280', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }} 
                  className="top-link"
                >
                  <LayoutGrid size={14} /> Catégories
                </Link>

                {isMegaMenuOpen && !minimal && allCategories.length > 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    width: '900px', 
                    background: '#fff', 
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                    borderRadius: '0 0 16px 16px', 
                    border: '1px solid #E5E7EB',
                    zIndex: 2000,
                    padding: '32px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '40px'
                  }}>
                    {Object.entries(groupedCategories).map(([groupName, cats]: [string, any]) => (
                      <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', paddingBottom: '8px' }}>
                          {groupName}
                        </h3>
                        {cats.map((cat: any) => (
                          <div key={cat.id}>
                            <Link 
                              href={`/marketplace/category/${cat.slug || cat.id}`}
                              style={{ fontSize: '15px', fontWeight: 900, color: '#111827', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
                            >
                              <span style={{ color: cat.color || '#E31E24' }}>{cat.icon || '•'}</span>
                              {cat.name}
                            </Link>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(cat.children || []).slice(0, 6).map((sub: any) => (
                                <Link 
                                  key={sub.id} 
                                  href={`/marketplace/category/${sub.slug || sub.id}`}
                                  style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none', fontWeight: 600 }}
                                  className="hover-red-link"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                              {(cat.children || []).length > 6 && (
                                <Link href={`/marketplace/category/${cat.slug || cat.id}`} style={{ fontSize: '12px', color: '#E31E24', fontWeight: 700, textDecoration: 'none', marginTop: '4px' }}>
                                  Voir tout...
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="top-link">Français <ChevronDown size={12} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="top-link">DT (TND) <ChevronDown size={12} /></div>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', fontWeight: 600 }} className="top-links">
              <span style={{ cursor: 'pointer' }}>Aide</span>
              <span style={{ cursor: 'pointer' }}>Applications</span>
              <Link href={isVendor ? "/vendor/portal" : "/marketplace/vendors"} style={{ color: '#6B7280', textDecoration: 'none' }} className="top-link">
                {isVendor ? 'Centre Vendeur' : 'Vendre sur ElKassa'}
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header Area */}
        <div style={{ padding: '16px 24px' }} className="main-header">
           <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '40px' }} className="header-flex">
              {/* Logo */}
              <Link href={minimal ? "/" : "/marketplace"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} className="logo-container">
                <div style={{ width: 44, height: 44, background: '#E31E24', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }} className="logo-box">
                  <ShoppingBag size={28} strokeWidth={2.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }} className="logo-text">
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#111827', letterSpacing: '-1.2px', lineHeight: 1 }}>ElKassa Marketplace</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#E31E24', letterSpacing: '0.1em' }}>المنصة التونسية للمحترفين</span>
                </div>
              </Link>

              {/* Search Bar */}
              {!minimal && (
                <form 
                  onSubmit={handleSearch}
                  className="search-form"
                  style={{ flex: 1, display: 'flex', maxWidth: '800px', border: '3px solid #E31E24', borderRadius: '100px', overflow: 'hidden', height: '48px', background: '#fff' }}
                >
                  <select 
                    id="search-scope-select"
                    name="scope"
                    value={searchScope}
                    onChange={(e) => setSearchScope(e.target.value)}
                    style={{ padding: '0 15px', background: '#F9FAFB', borderRight: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: '13px', outline: 'none' }}
                  >
                    <option value="PRODUCT">Produits</option>
                    <option value="VENDOR">Fournisseurs</option>
                    <option value="CATEGORY">Catégories</option>
                  </select>
                  <select 
                    id="search-radius-select"
                    name="radius"
                    value={radius}
                    onChange={(e) => {
                      const newRadius = e.target.value;
                      setRadius(newRadius);
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('radius', newRadius);
                      router.push(`/marketplace?${params.toString()}`);
                    }}
                    style={{ padding: '0 15px', background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', color: '#6B7280' }}
                  >
                    <option value="all">Toute la Tunisie</option>
                    <option value="5">Rayon 5 km</option>
                    <option value="10">Rayon 10 km</option>
                    <option value="25">Rayon 25 km</option>
                    <option value="50">Rayon 50 km</option>
                    <option value="100">Rayon 100 km</option>
                    <option value="500">Rayon 500 km</option>
                  </select>
                  <input 
                    id="marketplace-search-input"
                    name="q"
                    type="text" 
                    placeholder="Quel produit cherchez-vous ?" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', padding: '0 20px', fontSize: '15px', fontWeight: 500 }}
                  />
                  <button 
                    type="submit"
                    style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '0 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }}
                  >
                    <Search size={22} />
                  </button>
                </form>
              )}
              {minimal && <div style={{ flex: 1 }} className="spacer" />}

               {/* Actions */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="actions-container">
                 {!minimal && (
                   <>
                     <Link 
                       href={isVendor ? "/vendor/portal/rfq" : "/marketplace/my-requests"}
                       className="action-item"
                       style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#374151' }}
                     >
                       <Target size={24} />
                       <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>{isVendor ? 'Demandes B2B' : 'Mes Demandes'}</span>
                     </Link>

                     <div 
                       onClick={() => setRfqOpen(true)}
                       className="action-item"
                       style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#E31E24' }}
                     >
                       <MessageSquare size={24} />
                       <span style={{ fontSize: '11px', fontWeight: 800, marginTop: '2px' }}>RFQ</span>
                     </div>
                     
                     {!isVendor && (
                       <div 
                         onClick={() => setCartOpen(true)}
                         className="action-item"
                         style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#374151', position: 'relative' }}
                       >
                         <ShoppingCart size={24} />
                         <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>Panier</span>
                         {cartCount > 0 && (
                           <span style={{ position: 'absolute', top: -5, right: -2, background: '#E31E24', color: '#fff', fontSize: '9px', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '2px solid #fff' }}>
                             {cartCount}
                           </span>
                         )}
                       </div>
                     )}
                   </>
                 )}

                 <Link 
                   href={isVendor ? "/vendor/portal" : (minimal ? "/login" : "/admin")} 
                   className="action-item" 
                   style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#374151' }}
                 >
                   <User size={24} />
                   <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>{minimal && !isVendor ? 'Connexion' : 'Compte'}</span>
                 </Link>
               </div>
           </div>
        </div>
      </header>

      <style jsx>{`
        @media (max-width: 768px) {
          .top-bar { display: none !important; }
          .main-header { padding: 12px 16px !important; }
          .header-flex { gap: 12px !important; justify-content: space-between; }
          .logo-text { display: none !important; }
          .search-form { display: none !important; }
          .actions-container { gap: 16px !important; }
          .pos-detail { display: none !important; }
          .spacer { display: none !important; }
        }
      `}</style>

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      {rfqOpen && <MarketplaceRFQModal onClose={() => setRfqOpen(false)} />}
    </>
  );
}
