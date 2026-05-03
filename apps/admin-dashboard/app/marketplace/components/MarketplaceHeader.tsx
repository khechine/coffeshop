'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Search, LayoutGrid, ShoppingCart, 
  MapPin, ChevronRight, X
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
  const currentSearch = searchParams.get('search') || '';

  const [locModalOpen, setLocModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(currentSearch);

  const { cartCount } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput) params.set('search', searchInput);
    else params.delete('search');
    router.push(`/marketplace?${params.toString()}`);
  };

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
      <div className="mkt-cocote-topbar">
        <div className="mkt-container mkt-cocote-topbar-inner">
          <div className="mkt-cocote-loc-trigger" onClick={() => setLocModalOpen(true)}>
             <MapPin size={14} />
             <span>Votre position : <strong>{currentLocation}</strong> (Rayon {currentRadius}km)</span>
             <ChevronRight size={12} />
          </div>
          <div className="mkt-cocote-topbar-links">
             <Link href="/marketplace/vendors">Devenir Vendeur</Link>
             <Link href="/marketplace/about">Le concept Proximité</Link>
             {searchParams.get('dev') === '1' && (
               <button 
                 onClick={async () => {
                   const { seedMarketplaceDataAction } = await import('../../actions');
                   const res = await seedMarketplaceDataAction();
                   if (res.success) alert('Vendeur et Catégories mis à jour avec succès !');
                 }}
                 style={{ marginLeft: 16, background: '#10B981', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900, cursor: 'pointer' }}
               >
                 SEED DATA
               </button>
             )}
          </div>
        </div>
      </div>

      <header className="mkt-cocote-header">
        <div className="mkt-container mkt-cocote-header-inner">
          <Link href="/marketplace" className="mkt-cocote-logo">
            <div className="mkt-cocote-logo-icon"><ShoppingBag size={20} /></div>
            Coffee<span>Market</span>
          </Link>

          <form onSubmit={handleSearch} className="mkt-cocote-search-wrap">
            <input
              type="text"
              className="mkt-cocote-search-input"
              placeholder="Rechercher un produit, une marque, un commerce..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="mkt-cocote-search-btn"><Search size={18} /></button>
          </form>

          <div className="mkt-cocote-header-actions">
            <Link href="/" className="mkt-cocote-action-btn">
              <LayoutGrid size={18} /> <span className="hidden md:inline">Dashboard</span>
            </Link>
            {!isVendor && (
              <button className="mkt-cocote-cart-btn" onClick={() => setCartOpen(true)}>
                <ShoppingCart size={20} />
                <span className="mkt-cocote-cart-text">Panier</span>
                {cartCount > 0 && <span className="mkt-cocote-cart-badge">{cartCount}</span>}
              </button>
            )}
          </div>
        </div>
      </header>
      
      <div className="mkt-catmenu">
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
               
               {(cat.children?.length > 0) && (
                 <>
                   <div className="mkt-megamenu-overlay" />
                   <div className="mkt-megamenu-panel shadow-2xl">
                     <div className="mkt-container">
                       <div className="mkt-mega-grid">
                          <div className="mkt-mega-col-main">
                            <div className="mkt-mega-featured-card" style={{ backgroundImage: cat.image ? `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url(${cat.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', color: cat.image ? '#fff' : 'inherit' }}>
                               <span className="mkt-mega-label" style={{ backgroundColor: cat.color || '#6366F1', color: '#fff' }}>Univers {cat.name}</span>
                               <h3 className={cat.image ? 'text-white' : ''}>Découvrez notre sélection de {cat.name}</h3>
                               <Link href={`/marketplace/category/${cat.id}`} className="mkt-mega-btn" style={{ backgroundColor: cat.color || '#6366F1', color: '#fff', border: 'none' }}>
                                 Tout explorer <ChevronRight size={14} />
                               </Link>
                            </div>
                          </div>
                          
                          <div className="mkt-mega-col-links">
                            <div className="mkt-mega-subgrid" style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, Math.ceil((cat.children?.length || 0) / 4)))}, 1fr)`, gap: '40px' }}>
                              {cat.children.map((sub: any) => (
                                <div key={sub.id} className="mkt-mega-subgroup">
                                  <Link href={`/marketplace/category/${sub.id}`} className="mkt-mega-sublink-header">
                                    {sub.name}
                                  </Link>
                                  {sub.children && sub.children.length > 0 && (
                                    <div className="mkt-mega-sublinks-stack">
                                      {sub.children.map((gchild: any) => (
                                        <Link key={gchild.id} href={`/marketplace/category/${gchild.id}`} className="mkt-mega-sublink">
                                          {gchild.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                       </div>
                     </div>
                   </div>
                 </>
               )}
             </div>
           ))}
        </div>
      </div>

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
