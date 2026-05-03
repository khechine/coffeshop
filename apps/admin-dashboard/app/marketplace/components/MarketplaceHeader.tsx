'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Search, LayoutGrid, ShoppingCart, 
  MapPin, ChevronRight, X, Menu, User
} from 'lucide-react';
import { useCart } from '../CartContext';
import CartDrawer from '../CartDrawer';

const tunisianCities = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Béja", "Jendouba", "Le Kef", "Siliana", "Kairouan", "Kasserine", "Sidi Bouzid",
  "Sousse", "Monastir", "Mahdia", "Sfax", "Gafsa", "Tozeur", "Kebili", "Gabès",
  "Medenine", "Tataouine"
];

export default function MarketplaceHeader({ isVendor = false, categories = [] }: { isVendor?: boolean; categories?: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRadius = parseInt(searchParams.get('radius') || '15');
  const currentLocation = searchParams.get('loc') || 'Tunis';

  const [locModalOpen, setLocModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { cartCount } = useCart();

  const handleLocSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loc = formData.get('loc') as string;
    const radius = formData.get('radius') as string;
    const params = new URLSearchParams(searchParams.toString());
    params.set('loc', loc);
    params.set('radius', radius);
    router.push(`/marketplace?${params.toString()}`);
    setLocModalOpen(false);
  };

  return (
    <>
      <div className="mkt-cocote-topbar desktop-only">
        <div className="mkt-container mkt-cocote-topbar-inner">
          <div className="mkt-cocote-loc-trigger" onClick={() => setLocModalOpen(true)}>
             <MapPin size={14} />
             <span>Votre position : <strong>{currentLocation}</strong> (Rayon {currentRadius}km)</span>
             <ChevronRight size={12} />
          </div>
          <div className="mkt-cocote-topbar-links">
             <Link href="/marketplace/vendors">Devenir Vendeur</Link>
             <Link href="/marketplace/about">Le concept Proximité</Link>
          </div>
        </div>
      </div>

      <header className="mkt-cocote-header">
        <div className="mkt-container mkt-cocote-header-inner">
          {/* Mobile Menu Toggle */}
          <button className="mkt-mobile-toggle mobile-only" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/marketplace" className="mkt-cocote-logo">
            <div className="mkt-cocote-logo-icon"><ShoppingBag size={20} /></div>
            Coffee<span>Market</span>
          </Link>

          {/* Search - Desktop */}
          <div className="mkt-cocote-search-wrap desktop-only">
            <Search size={18} className="mkt-search-icon-abs" />
            <input
              type="text"
              className="mkt-cocote-search-input"
              placeholder="Rechercher un produit, une marque..."
              defaultValue={searchParams.get('search') || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  const params = new URLSearchParams(searchParams.toString());
                  if (val) params.set('search', val);
                  else params.delete('search');
                  window.location.href = `/marketplace?${params.toString()}`;
                }
              }}
            />
          </div>

          <div className="mkt-cocote-header-actions">
            {/* Mobile Search Toggle */}
            <button className="mkt-cocote-action-btn mobile-only" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <Search size={20} />
            </button>

            <Link href="/" className="mkt-cocote-action-btn desktop-only">
              <LayoutGrid size={18} /> <span>Dashboard</span>
            </Link>

            {!isVendor && (
              <button className="mkt-cocote-cart-btn" onClick={() => setCartOpen(true)}>
                <ShoppingCart size={20} />
                <span className="mkt-cocote-cart-text desktop-only">Panier</span>
                {cartCount > 0 && <span className="mkt-cocote-cart-badge">{cartCount}</span>}
              </button>
            )}

            <button className="mkt-cocote-action-btn">
              <User size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        {isSearchOpen && (
          <div className="mkt-mobile-search-expansion mobile-only">
            <div className="mkt-container">
               <div className="mkt-cocote-search-wrap visible">
                  <Search size={18} className="mkt-search-icon-abs" />
                  <input
                    type="text"
                    autoFocus
                    className="mkt-cocote-search-input"
                    placeholder="Rechercher..."
                    defaultValue={searchParams.get('search') || ''}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        const params = new URLSearchParams(searchParams.toString());
                        if (val) params.set('search', val);
                        else params.delete('search');
                        window.location.href = `/marketplace?${params.toString()}`;
                      }
                    }}
                  />
               </div>
            </div>
          </div>
        )}
      </header>
      
      <div className="mkt-catmenu desktop-only">
        <div className="mkt-container mkt-catmenu-inner">
           <Link 
             href="/marketplace" 
             className={`mkt-catmenu-item ${!searchParams.get('category') && !searchParams.get('id') ? 'active' : ''}`}
           >
             Tout voir
           </Link>
           
           {categories.map((cat: any) => (
             <div key={cat.id} className="mkt-megamenu-trigger group">
                <Link 
                  href={`/marketplace/category/${cat.id}`} 
                  className={`mkt-catmenu-item ${searchParams.get('id') === cat.id ? 'active' : ''}`}
                  style={{ '--cat-color': cat.color || '#6366F1' } as any}
                >
                  {cat.name}
                </Link>
                {cat.children?.length > 0 && <MegaMenuPanel rootCategory={cat} />}
             </div>
           ))}
         </div>
       </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {isMobileMenuOpen && (
        <>
          <div className="mkt-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="mkt-mobile-drawer">
             <div className="mkt-drawer-header">
                <span className="mkt-drawer-title">Menu Marketplace</span>
                <button className="mkt-drawer-close" onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
             </div>
             
             <div className="mkt-drawer-content">
                <div className="mkt-drawer-section">
                   <h4 className="mkt-drawer-section-title">Catégories</h4>
                   <div className="mkt-drawer-categories">
                      {categories.map((cat: any) => (
                        <div key={cat.id} className="mkt-drawer-cat-item">
                           <Link 
                             href={`/marketplace/category/${cat.id}`} 
                             className="mkt-drawer-cat-link"
                             onClick={() => setIsMobileMenuOpen(false)}
                           >
                             <span className="mkt-drawer-cat-icon">{cat.icon || '📦'}</span>
                             {cat.name}
                           </Link>
                           {cat.children?.length > 0 && (
                             <div className="mkt-drawer-sublist">
                                {cat.children.map((sub: any) => (
                                  <Link 
                                    key={sub.id} 
                                    href={`/marketplace/category/${sub.id}`}
                                    className="mkt-drawer-sublink"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mkt-drawer-section">
                   <h4 className="mkt-drawer-section-title">Compte & Infos</h4>
                   <Link href="/vendor/register" className="mkt-drawer-link">Devenir Vendeur</Link>
                   <Link href="/marketplace/cart" className="mkt-drawer-link">Mon Panier</Link>
                   <Link href="/login" className="mkt-drawer-link">Se Connecter</Link>
                </div>
             </div>
          </div>
        </>
      )}

      {/* ── Location Modal ── */}
      {locModalOpen && (
        <div className="mkt-modal-backdrop" onClick={() => setLocModalOpen(false)}>
          <div className="mkt-modal mkt-cocote-loc-modal" onClick={e=>e.stopPropagation()}>
            <button className="mkt-modal-close" onClick={() => setLocModalOpen(false)}><X size={18} /></button>
            <h3 className="mkt-cocote-modal-title">Où souhaitez-vous chercher ?</h3>
            <p className="mkt-cocote-modal-desc">Modifiez votre position pour découvrir les offres locales pertinentes.</p>
            
            <form className="mkt-cocote-loc-form" onSubmit={handleLocSubmit}>
               <label>Ville ou Code Postal</label>
               <select name="loc" className="mkt-cocote-input" defaultValue={currentLocation}>
                 {tunisianCities.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               
               <label style={{ marginTop: 16 }}>Rayon de recherche (km)</label>
               <div className="mkt-cocote-radius-slider">
                 <input name="radius" type="range" min="5" max="100" step="5" defaultValue={currentRadius} />
                 <div className="mkt-cocote-radius-labels">
                    <span>5km</span><span>50km</span><span>100km</span>
                 </div>
               </div>
               
               <button type="submit" className="mkt-cocote-btn-primary">Valider ma position</button>
            </form>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {!isVendor && cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
}

function MegaMenuPanel({ rootCategory }: { rootCategory: any }) {
  const [activeSubId, setActiveSubId] = useState<string | null>(rootCategory.children?.[0]?.id || null);
  
  const activeSub = rootCategory.children.find((s: any) => s.id === activeSubId) || rootCategory.children[0];

  return (
    <div className="mkt-megamenu-panel">
      <div className="mkt-mega-v2-inner">
        {/* Zone 1: Navigation (Subcategories) */}
        <div className="mkt-mega-v2-nav mkt-custom-scrollbar">
          {rootCategory.children.map((sub: any) => (
            <div 
              key={sub.id} 
              className={`mkt-mega-v2-nav-item ${activeSubId === sub.id ? 'active' : ''}`}
              onMouseEnter={() => setActiveSubId(sub.id)}
            >
              {sub.name}
              <ChevronRight size={14} className={activeSubId === sub.id ? 'opacity-100' : 'opacity-0'} />
            </div>
          ))}
        </div>

        {/* Zone 2: Content Grid (Grandchildren) */}
        <div className="mkt-mega-v2-content">
          <div className="mkt-mega-v2-grid">
            {activeSub?.children?.map((gchild: any) => (
              <Link key={gchild.id} href={`/marketplace/category/${gchild.id}`} className="mkt-mega-v2-link">
                {gchild.name}
              </Link>
            ))}
            {(!activeSub?.children || activeSub.children.length === 0) && (
              <div className="text-slate-400 italic text-sm py-4">
                Aucune sous-catégorie spécifique trouvée.
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Featured Image / Brand */}
        <div className="mkt-mega-v2-featured">
          <div className="mkt-mega-v2-featured-img">
            <img 
              src={activeSub?.image || rootCategory.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800'} 
              alt={activeSub?.name} 
            />
          </div>
          <h4 className="mkt-mega-v2-featured-title">{activeSub?.name || rootCategory.name}</h4>
          <p className="mkt-mega-v2-featured-desc">
            Explorez notre sélection professionnelle pour {activeSub?.name || rootCategory.name.toLowerCase()}.
          </p>
          <Link href={`/marketplace/category/${activeSub?.id || rootCategory.id}`} className="mkt-mega-v2-featured-btn">
            Découvrir la collection <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
