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

/* ── Helpers ── */
const CATEGORY_IMAGES: Record<string, string> = {
  'matieres-premieres': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600',
  'produits-semi-finis': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=600',
  'produits-finis-b2b-revente': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600',
  'equipements-materiel': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600',
  'emballages': 'https://images.unsplash.com/photo-1589939705384-5185138a04b9?q=80&w=600',
  'hygiene-nettoyage': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600',
  'services': 'https://images.unsplash.com/photo-1521791136366-39851946a095?q=80&w=600',
};

const getCategoryImage = (cat: any) => {
  if (cat.image) return cat.image;
  return CATEGORY_IMAGES[cat.slug] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600';
};

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

        {/* Hero / Concept Banner (SOBER & PRO) */}
        {!search && (
          <div className="mkt-category-hero-premium" style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1400')`,
            minHeight: '500px'
          }}>
            <div className="mkt-category-hero-overlay" />
            <div className="mkt-category-hero-content">
              <h1 className="text-white">Le Premier Marché B2B de Proximité</h1>
              <p className="text-white text-lg max-w-2xl mx-auto">
                Connectez-vous directement aux fournisseurs et artisans de votre région. 
                Optimisez vos coûts et soutenez l'économie locale.
              </p>
              <div className="flex justify-center gap-6 mt-12">
                 <button className="mkt-cocote-btn-primary px-10 py-4 text-lg">Explorer le catalogue</button>
                 <button className="px-10 py-4 border-2 border-white text-white font-bold rounded-[4px] hover:bg-white hover:text-black transition-all">Devenir Vendeur</button>
              </div>
            </div>
          </div>
        )}
        {/* Sélections Stratégiques (Axes Intelligents) */}
        {/* Sélections Stratégiques (Sober Section) */}
        {!search && (
          <section className="mkt-cocote-section" style={{ marginTop: '40px', padding: '48px 0', borderTop: '1px solid #E5E7EB' }}>
            <div className="mkt-cocote-section-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
                Expertise & Solutions Professionnelles
              </h2>
              <p className="text-slate-500 mt-2 font-medium">Des sélections métiers conçues pour votre rentabilité.</p>
            </div>
            
            <div className="mkt-cocote-grid">
              
              {/* Card 1 */}
              <Link href="/marketplace?q=starter" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', padding: '32px', borderRadius: '4px', border: '1px solid #E5E7EB', height: '100%', transition: 'all 0.2s' }} className="hover:border-slate-900">
                  <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#F3F4F6', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <ShoppingCart size={24} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>Pack Ouverture</h3>
                  <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>L'essentiel pour équiper et approvisionner votre nouvel établissement.</p>
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

        {/* Catégories Populaires / Universes (Faire Style) */}
        {!search && (
          <section className="mkt-cocote-section" style={{ marginTop: 80 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">Explorez nos univers</h2>
              <p className="text-slate-500 mt-2 text-lg">Découvrez les meilleures sélections par métier.</p>
            </div>
            <div className="mkt-cocote-category-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {categories.slice(0, 8).map((cat: any) => {
                const href = `/marketplace/category/${cat.id}`;
                const img = getCategoryImage(cat);
                
                return (
                  <Link 
                    key={cat.id} 
                    href={href}
                    className="relative block aspect-[4/5] overflow-hidden group rounded-[4px] border border-slate-200"
                  >
                    <img 
                      src={img} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={cat.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{cat.icon || '📦'}</span>
                        <h3 className="text-white text-xl font-bold leading-tight m-0">{cat.name}</h3>
                      </div>
                      <p className="text-white/70 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">Voir les produits</p>
                    </div>
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
