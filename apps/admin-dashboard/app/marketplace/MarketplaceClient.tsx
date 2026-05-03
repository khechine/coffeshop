'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart, ShoppingBag, Search, X, Plus, Heart, 
  ChevronRight, ArrowRight, LayoutGrid, MapPin, Store, 
  Tag, Award, Navigation, Percent, Sparkles
} from 'lucide-react';
import { useCart } from './CartContext';
import MarketplaceHeader from './components/MarketplaceHeader';
import MarketplaceFooter from './components/MarketplaceFooter';
import './marketplace.css';
import { sanitizeUrl } from '../lib/imageUtils';

/* ─── Helpers ─── */
const fmt = (n: any) => Number(n).toFixed(3);

const getMockDistance = (vendorId: string) => {
  if (!vendorId) return 5;
  const s = String(vendorId);
  const sum = s.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (sum % 12) + 5; 
};

const tunisianCities = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Béja", "Jendouba", "Le Kef", "Siliana", "Kairouan", "Kasserine", "Sidi Bouzid",
  "Sousse", "Monastir", "Mahdia", "Sfax", "Gafsa", "Tozeur", "Kebili", "Gabès",
  "Medenine", "Tataouine"
];

/* ─── Components ─── */
function Stars({ avg = 0, total = 0, size = 12 }: any) {
  if (!total) return <span style={{ fontSize: size, color: '#94A3B8', fontWeight: 600 }}>Nouveau vendeur</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#10B981', fontSize: size }}>★</span>
      <span style={{ fontSize: size, fontWeight: 700, color: '#1E293B' }}>{Number(avg).toFixed(1)}</span>
      <span style={{ fontSize: size - 1, color: '#64748B' }}>({total})</span>
    </div>
  );
}

function ProductCard({ product, onAdd, isVendor }: any) {
  const avg = product.vendor?.ratings?.overallAvg || 0;
  const total = product.vendor?.ratings?.totalReviews || 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  
  const distance = getMockDistance(product.vendorId);

  return (
    <div className="mkt-cocote-card group">
      <Link href={`/marketplace/product/${product.id}`} className="mkt-cocote-card-img-wrap">
        <img
          src={sanitizeUrl(product.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'}
          alt={product.name}
          className="mkt-cocote-card-img"
        />
        {hasDiscount && <span className="mkt-cocote-badge-discount">-{Math.round((1 - product.discountPrice/product.price)*100)}%</span>}
        <button className="mkt-cocote-wish"><Heart size={16} /></button>
      </Link>
      <div className="mkt-cocote-card-body">
        <div className="mkt-cocote-card-meta">
          <Link href={`/marketplace/vendor/${product.vendor?.id}`} className="mkt-cocote-vendor-link" style={{ textTransform: 'uppercase' }}>
            <Store size={12} /> {product.vendor?.companyName}
          </Link>
          <span className="mkt-cocote-distance">
            <Navigation size={10} /> 
            {product.vendor?.lat && product.vendor?.lng ? `${distance} km` : `${product.vendor?.governorate || ''} ${product.vendor?.city || ''}`.trim() || 'Tunis'}
          </span>
        </div>

        {/* Category Label */}
        {(product.mktCategory || product.categoryName) && (
          <div className="text-[9px] font-black uppercase tracking-tighter mb-1" style={{ color: product.mktCategory?.color || '#6366F1', opacity: 0.8 }}>
            {product.mktCategory?.name || product.categoryName} {product.mktSubcategory ? `› ${product.mktSubcategory.name}` : ''}
          </div>
        )}

        <Link href={`/marketplace/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className="mkt-cocote-card-title" style={{ textTransform: 'uppercase' }}>{product.name}</h3>
        </Link>

        {product.tags && product.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {product.tags.slice(0, 2).map((t: string) => (
              <span key={t} style={{ 
                fontSize: 8, 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                background: t.toLowerCase().includes('bio') ? '#F0FDF4' : '#F8FAFC',
                color: t.toLowerCase().includes('bio') ? '#166534' : '#64748B',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid #E2E8F0'
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <Stars avg={avg} total={total} size={11} />
        
        <div className="mkt-cocote-card-footer">
          <div className="mkt-cocote-price-wrap" style={isVendor ? { filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' } : {}}>
             {hasDiscount && <span className="mkt-cocote-old-price">{fmt(product.price)}</span>}
             <span className="mkt-cocote-price">{fmt(hasDiscount ? product.discountPrice : product.price)}</span>
             <span className="mkt-cocote-unit">DT</span>
          </div>
          {!isVendor && (
            <button className="mkt-cocote-add-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(product); }}>
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function VendorCard({ vendor, distance }: any) {
  const avg = vendor.ratings?.overallAvg || 0;
  const total = vendor.ratings?.totalReviews || 0;
  const logo = vendor.customization?.logoUrl ? sanitizeUrl(vendor.customization.logoUrl) : null;

  return (
    <Link href={`/marketplace/vendor/${vendor.id}`} className="mkt-cocote-vendor-card">
      <div className="mkt-cocote-vendor-logo">
        {logo ? <img src={logo} alt={vendor.companyName} /> : <Store size={24} color="#94A3B8" />}
      </div>
      <div className="mkt-cocote-vendor-info">
        <h4 className="mkt-cocote-vendor-name" style={{ textTransform: 'uppercase' }}>{vendor.companyName}</h4>
        <div className="mkt-cocote-vendor-meta">
           <Stars avg={avg} total={total} size={11} />
           <span className="mkt-cocote-vendor-dist">
             <MapPin size={10} /> 
             {vendor.lat && vendor.lng ? `${distance} km · ` : ''}{vendor.city || vendor.governorate || 'Tunis'}
           </span>
        </div>
      </div>
      <ChevronRight size={16} color="#CBD5E1" />
    </Link>
  );
}

/* ─── MAIN CLIENT ─── */
export default function MarketplaceClient({ initialData, isVendor = false }: { initialData: any; isVendor?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRadius = parseInt(searchParams.get('radius') || '15');
  const currentLocation = searchParams.get('loc') || 'Tunis';
  const search = searchParams.get('search') || '';
  
  const { products = [], categories = [], flashSales = [] } = initialData || {};

  const { addToCart, cartCount } = useCart();

  // Derived Data
  const vendorsMap = new Map();
  products.forEach((p: any) => { if (p.vendor) vendorsMap.set(p.vendor.id, p.vendor); });
  const vendors = Array.from(vendorsMap.values());
  
  const brands = useMemo(() => {
    const bSet = new Set<string>();
    products.forEach((p: any) => { if (p.brand) bSet.add(p.brand); });
    return Array.from(bSet).slice(0, 12);
  }, [products]);

  const promosLocales = flashSales.length > 0 ? flashSales : products.filter((p: any) => p.discountPrice).slice(0, 5);
  // Fallback if no discounts:
  const displayPromos = promosLocales.length > 0 ? promosLocales : products.slice(0, 5);

  const searchResults = search 
    ? products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || p.vendor?.companyName?.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="mkt-page cocote-theme">
      
      <MarketplaceHeader isVendor={isVendor} categories={categories} />

      {/* ── Main Content ── */}
      <div className="mkt-container mkt-cocote-main">

        {/* Search Results Overlay */}
        {search && (
          <div className="mkt-cocote-search-results">
            <h2 className="mkt-cocote-section-title">Résultats pour "{search}"</h2>
            {searchResults.length > 0 ? (
               <div className="mkt-cocote-grid">
                 {searchResults.map((p: any) => <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />)}
               </div>
            ) : (
               <div className="mkt-cocote-empty">Aucun produit ne correspond à votre recherche localisée.</div>
            )}
            <hr className="mkt-cocote-divider" />
          </div>
        )}

        {/* Hero / Concept Banner */}
        {!search && (
          <div className="mkt-cocote-hero-premium">
            <div className="mkt-cocote-hero-premium-content">
              <div className="mkt-premium-badge">
                <Sparkles size={14} /> EXCLUSIVITÉ PREMIUM
              </div>
              <h1>Soutenez les commerces de <span>votre région</span></h1>
              <p>Découvrez les meilleurs produits B2B, cafés et équipements à proximité de <strong>{currentLocation}</strong>.</p>
              <div className="mkt-cocote-hero-badges">
                <span><MapPin size={14}/> Proximité garantie</span>
                <span><Tag size={14}/> Circuit court</span>
                <span><Award size={14}/> Vendeurs certifiés</span>
              </div>
            </div>
            <div className="mkt-hero-visual">
               <div className="mkt-floating-card c1">
                 <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=200" alt="" />
                 <div><span>-20%</span> Café Bio</div>
               </div>
               <div className="mkt-floating-card c2">
                 <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=200" alt="" />
                 <div>Premium Roast</div>
               </div>
            </div>
          </div>
        )}
        {/* Sélections Stratégiques (Axes Intelligents) */}
        {!search && (
          <section className="mkt-cocote-section" style={{ marginTop: '40px', padding: '32px', background: 'linear-gradient(135deg, #F8FAFC, #EEF2FF)', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
            <div className="mkt-cocote-section-header" style={{ marginBottom: '24px' }}>
              <h2 className="mkt-cocote-section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>
                <Sparkles className="text-indigo-600" size={24} /> Sélections Stratégiques & Astuces
              </h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              {/* Card 1 */}
              <Link href="/marketplace?q=starter" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', height: '100%', border: '2px solid transparent', transition: 'all 0.3s' }} className="hover:border-indigo-500 hover:-translate-y-1">
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <ShoppingCart size={24} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Starter Pack Coffeeshop</h3>
                  <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>L'équipement et les ingrédients essentiels pour lancer votre établissement.</p>
                </div>
              </Link>

              {/* Card 2 */}
              <Link href="/marketplace?q=premium" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', height: '100%', border: '2px solid transparent', transition: 'all 0.3s' }} className="hover:border-rose-500 hover:-translate-y-1">
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FFF1F2', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Award size={24} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Top Pâtisserie Premium</h3>
                  <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>Ingrédients haut de gamme et chocolats de couverture pour vos desserts.</p>
                </div>
              </Link>

              {/* Card 3 */}
              <Link href="/marketplace?category=bundles" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', height: '100%', border: '2px solid transparent', transition: 'all 0.3s' }} className="hover:border-emerald-500 hover:-translate-y-1">
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <ShoppingBag size={24} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Bundles & Packs Barista</h3>
                  <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>Achetez en lot et profitez de réductions sur les consommables essentiels.</p>
                </div>
              </Link>
              
            </div>
          </section>
        )}

        {/* Promos Locales */}
        {!search && (
          <section className="mkt-cocote-section">
            <div className="mkt-cocote-section-header">
              <h2 className="mkt-cocote-section-title"><Percent size={20} className="text-rose-500" /> Promos Locales</h2>
              {displayPromos.length > 0 && <Link href="/marketplace" className="mkt-cocote-see-all">Voir tout <ChevronRight size={14} /></Link>}
            </div>
            {displayPromos.length > 0 ? (
              <div className="mkt-cocote-grid">
                {displayPromos.map((p: any) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />
                ))}
              </div>
            ) : (
              <div className="mkt-cocote-empty-promo-banner">
                <div className="mkt-cocote-banner-content">
                  <div className="mkt-cocote-banner-icon"><Sparkles size={32} /></div>
                  <div className="mkt-cocote-banner-text">
                    <h3>Prochainement : Nouvelles offres locales</h3>
                    <p>Découvrez bientôt des promotions exclusives de vos commerçants de proximité.</p>
                  </div>
                </div>
                <button className="mkt-cocote-banner-btn">Être notifié</button>
              </div>
            )}
          </section>
        )}

        {/* Commerces de Proximité */}
        {!search && (
          <section className="mkt-cocote-section">
            <div className="mkt-cocote-section-header">
              <h2 className="mkt-cocote-section-title"><Store size={20} className="text-emerald-500" /> Commerces de proximité</h2>
              <Link href="/marketplace/vendors" className="mkt-cocote-see-all">Explorer la carte <ChevronRight size={14} /></Link>
            </div>
            <div className="mkt-cocote-vendor-grid">
              {vendors.slice(0, 6).map((v: any, i: number) => (
                <VendorCard key={v.id} vendor={v} distance={getMockDistance(v.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Catégories Populaires / Universes */}
        {!search && (
          <section className="mkt-cocote-section">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Explorez nos univers</h2>
              <div style={{ width: 60, height: 4, background: '#6366F1', margin: '16px auto' }}></div>
            </div>
            <div className="mkt-cocote-category-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
              {categories.slice(0, 8).map((cat: any, i: number) => {
                const href = `/marketplace/category/${cat.id}`;
                
                return (
                  <Link 
                    key={cat.id} 
                    href={href}
                    className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col items-center gap-6 hover:shadow-2xl hover:translate-y-[-8px] transition-all cursor-pointer group text-decoration-none relative overflow-hidden"
                  >
                    {cat.image && (
                      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <img src={cat.image} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    <div className="relative z-10" style={{ width: 80, height: 80, background: `${cat.color || '#6366F1'}15`, color: cat.color || '#6366F1', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      {cat.icon || '📦'}
                    </div>
                    <span className="relative z-10 text-xs font-black text-slate-900 uppercase tracking-widest text-center group-hover:text-indigo-600">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Meilleures Ventes Locales */}
        {!search && (
          <section className="mkt-cocote-section">
            <div className="mkt-cocote-section-header">
              <h2 className="mkt-cocote-section-title"><Award size={20} className="text-amber-500" /> Meilleures ventes autour de vous</h2>
            </div>
            <div className="mkt-cocote-grid">
              {products.slice(0, 5).map((p: any) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />
              ))}
            </div>
          </section>
        )}

        {/* Marques */}
        {!search && brands.length > 0 && (
          <section className="mkt-cocote-section">
            <h2 className="mkt-cocote-section-title">Les marques les plus recherchées</h2>
            <div className="mkt-cocote-brands-flex">
              {brands.map((b: string) => (
                <Link key={b} href={`/marketplace?brand=${encodeURIComponent(b)}`} className="mkt-cocote-brand-tag">
                  {b}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Villes de Tunisie Index */}
        {!search && (
          <section className="mkt-cocote-section mkt-cocote-cities">
            <h2 className="mkt-cocote-section-title"><MapPin size={20} className="text-indigo-500" /> Découvrez les commerces par région</h2>
            <div className="mkt-cocote-cities-grid">
              {tunisianCities.map(city => (
                <Link key={city} href={`/marketplace?loc=${encodeURIComponent(city)}`} className="mkt-cocote-city-link">
                  {city}
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>

      <MarketplaceFooter />
    </div>
  );
}
