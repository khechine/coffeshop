'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserNotificationsAction } from '../../actions';
import {
  ShoppingBag, Search, LayoutGrid, ShoppingCart, 
  MapPin, ChevronRight, X, Menu, User, ArrowRight,
  ChevronDown, Globe, HelpCircle, Smartphone, Languages,
  MessageSquare, Target, Bell
} from 'lucide-react';
import { useCart } from '../CartContext';
import CartDrawer from '../CartDrawer';
import MarketplaceRFQModal from './MarketplaceRFQModal';

export default function MarketplaceHeader({ isVendor = false, store, minimal = false, allCategories = [] }: { isVendor?: boolean, store?: any, minimal?: boolean, allCategories?: any[] }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [hoveredRootId, setHoveredRootId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await getUserNotificationsAction();
        setNotifications(notifs);
      } catch (e) {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Build grouped subcategories for the hovered root category
  const hoveredRoot = allCategories.find((c: any) => c.id === hoveredRootId);
  const hoveredChildren = hoveredRoot?.children || [];
  const groupedSubs: Record<string, any[]> = {};
  hoveredChildren.forEach((child: any) => {
    const group = child.groupTitle || 'Autres';
    if (!groupedSubs[group]) groupedSubs[group] = [];
    groupedSubs[group].push(child);
  });

  return (
    <>
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 1000 }}>
        {/* Top Slim Bar - Visible everywhere except main landing page for non-authenticated users */}
        {(!minimal || store) && (
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
                  onMouseEnter={() => { setIsMegaMenuOpen(true); if (allCategories.length > 0) setHoveredRootId(allCategories[0].id); }}
                  onMouseLeave={() => { setIsMegaMenuOpen(false); setHoveredRootId(null); }}
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
                      position: 'absolute', top: '100%', left: 0, 
                      display: 'flex',
                      width: '960px', 
                      background: '#fff', 
                      boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.15)', 
                      borderRadius: '0 0 16px 16px', 
                      border: '1px solid #E5E7EB',
                      zIndex: 2000,
                      overflow: 'hidden'
                    }}>
                      {/* Left Panel — Root Categories */}
                      <div style={{ width: '240px', background: '#F9FAFB', borderRight: '1px solid #F1F5F9', padding: '12px 0', flexShrink: 0 }}>
                        {allCategories.map((cat: any) => (
                          <Link
                            key={cat.id}
                            href={`/marketplace/category/${cat.slug || cat.id}`}
                            onMouseEnter={() => setHoveredRootId(cat.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 20px', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                              color: hoveredRootId === cat.id ? '#E31E24' : '#374151',
                              background: hoveredRootId === cat.id ? '#fff' : 'transparent',
                              borderRight: hoveredRootId === cat.id ? '3px solid #E31E24' : '3px solid transparent',
                              transition: 'all 0.15s'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{cat.icon || '•'}</span>
                              {cat.name}
                            </span>
                            <ChevronRight size={12} style={{ opacity: hoveredRootId === cat.id ? 1 : 0.3 }} />
                          </Link>
                        ))}
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', marginTop: '8px' }}>
                          <Link href="/marketplace/categories" style={{ fontSize: '12px', color: '#E31E24', fontWeight: 800, textDecoration: 'none' }}>
                            Toutes les catégories →
                          </Link>
                        </div>
                      </div>

                      {/* Right Panel — Grouped Subcategories */}
                      <div style={{ flex: 1, padding: '28px 32px', minHeight: '320px' }}>
                        {hoveredRoot && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #F3F4F6' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <span style={{ color: hoveredRoot.color || '#E31E24' }}>{hoveredRoot.icon || '•'}</span>
                                {hoveredRoot.name}
                              </h3>
                              <Link 
                                href={`/marketplace/category/${hoveredRoot.slug || hoveredRoot.id}`}
                                style={{ fontSize: '12px', color: '#E31E24', fontWeight: 700, textDecoration: 'none' }}
                              >
                                Tout voir →
                              </Link>
                            </div>

                            {hoveredChildren.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', alignItems: 'start' }}>
                                {Object.entries(groupedSubs).map(([groupName, items]: [string, any[]]) => (
                                  <div key={groupName}>
                                    <h4 style={{ 
                                      fontSize: '12px', fontWeight: 900, color: '#111827', marginBottom: '12px', 
                                      textTransform: 'uppercase', letterSpacing: '0.05em',
                                      paddingBottom: '6px', borderBottom: '2px solid #E31E24',
                                      display: 'inline-block'
                                    }}>
                                      {groupName}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {items.map((sub: any) => (
                                        <Link 
                                          key={sub.id} 
                                          href={`/marketplace/category/${sub.slug || sub.id}`}
                                          style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s' }}
                                          className="hover-red-link"
                                        >
                                          {sub.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#9CA3AF', fontSize: '14px', fontWeight: 600 }}>
                                Aucune sous-catégorie
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="top-link">Français <ChevronDown size={12} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className="top-link">DT (TND) <ChevronDown size={12} /></div>
              </div>
              
              <div style={{ display: 'flex', gap: '24px', fontWeight: 600 }} className="top-links">
                <Link href="/marketplace/messages" style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }} className="top-link">
                  <div style={{ position: 'relative', display: 'flex' }}>
                    <MessageSquare size={14} />
                    {notifications.length > 0 && (
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '6px', height: '6px', backgroundColor: '#DC2626', borderRadius: '50%', border: '1px solid white' }} />
                    )}
                  </div>
                  Mes Messages
                </Link>
                <Link href="/marketplace/my-requests" style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }} className="top-link">
                  <Target size={14} /> Mes Demandes
                </Link>
                <Link href="/marketplace/orders" style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }} className="top-link">
                  <ShoppingBag size={14} /> Mes Commandes
                </Link>
                <Link href="/marketplace/help" style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }} className="top-link">
                  Aide
                </Link>
                <span style={{ cursor: 'pointer' }}>Applications</span>
                <Link href={isVendor ? "/vendor/portal" : "/marketplace/vendors"} style={{ color: '#6B7280', textDecoration: 'none' }} className="top-link">
                  {isVendor ? 'Centre Vendeur' : 'Vendre sur ElKassa'}
                </Link>
              </div>
            </div>
          </div>
        )}

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
