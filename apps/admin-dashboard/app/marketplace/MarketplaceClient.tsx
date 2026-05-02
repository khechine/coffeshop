'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart, ShoppingBag, Search, X, Plus, Heart, 
  ChevronRight, ArrowRight, LayoutGrid, MapPin, Store, 
  Tag, Award, Navigation, Percent
} from 'lucide-react';
import { useCart } from './CartContext';
import MarketplaceHeader from './components/MarketplaceHeader';
import MarketplaceFooter from './components/MarketplaceFooter';
import './marketplace.css';
import { sanitizeUrl } from '../lib/imageUtils';

/* ─── Helpers ─── */
const fmt = (n: any) => Number(n).toFixed(3);
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
  
  // Mock distance for demo purposes based on vendor
  const distance = Math.floor(Math.random() * 15) + 1;

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
          <Link href={`/marketplace/vendor/${product.vendor?.id}`} className="mkt-cocote-vendor-link">
            <Store size={12} /> {product.vendor?.companyName}
          </Link>
          <span className="mkt-cocote-distance"><Navigation size={10} /> {distance} km</span>
        </div>
        <Link href={`/marketplace/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className="mkt-cocote-card-title">{product.name}</h3>
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
        <h4 className="mkt-cocote-vendor-name">{vendor.companyName}</h4>
        <div className="mkt-cocote-vendor-meta">
           <Stars avg={avg} total={total} size={11} />
           <span className="mkt-cocote-vendor-dist"><MapPin size={10} /> {distance} km · {vendor.city || 'Tunis'}</span>
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
  
  const { products = [], categories = [], flashSales = [] } = initialData;

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
      
      <MarketplaceHeader isVendor={isVendor} />

      {/* ── Categories Navigation ── */}
      <nav className="mkt-cocote-nav">
        <div className="mkt-container mkt-cocote-nav-inner">
          <Link href="/marketplace" className="mkt-cocote-nav-item active"><LayoutGrid size={14} /> Toutes les catégories</Link>
          {categories.slice(0, 8).map((c: any) => (
             <Link key={c.id} href={`/marketplace/category/${c.id}`} className="mkt-cocote-nav-item">
               {c.name}
             </Link>
          ))}
        </div>
      </nav>

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
          <div className="mkt-cocote-hero">
            <div className="mkt-cocote-hero-content">
              <h1>Soutenez les commerces de <span>votre région</span></h1>
              <p>Découvrez les meilleurs produits B2B, cafés et équipements à proximité de <strong>{currentLocation}</strong>.</p>
              <div className="mkt-cocote-hero-badges">
                <span><MapPin size={14}/> Proximité garantie</span>
                <span><Tag size={14}/> Circuit court</span>
                <span><Award size={14}/> Vendeurs certifiés</span>
              </div>
            </div>
            <div className="mkt-cocote-hero-graphic">
              {/* Abstract representation of map/local */}
              <div className="mkt-cocote-map-pin main"><MapPin size={32} /></div>
              <div className="mkt-cocote-map-pin small p1"><Store size={16} /></div>
              <div className="mkt-cocote-map-pin small p2"><Store size={16} /></div>
              <div className="mkt-cocote-map-pin small p3"><Store size={16} /></div>
            </div>
          </div>
        )}

        {/* Promos Locales */}
        {!search && (
          <section className="mkt-cocote-section">
            <div className="mkt-cocote-section-header">
              <h2 className="mkt-cocote-section-title"><Percent size={20} className="text-rose-500" /> Promos Locales</h2>
              <Link href="/marketplace" className="mkt-cocote-see-all">Voir tout <ChevronRight size={14} /></Link>
            </div>
            <div className="mkt-cocote-grid">
              {displayPromos.map((p: any) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />
              ))}
            </div>
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
                <VendorCard key={v.id} vendor={v} distance={Math.floor(Math.random() * 10) + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Catégories Populaires */}
        {!search && (
          <section className="mkt-cocote-section">
            <div className="mkt-cocote-section-header">
              <h2 className="mkt-cocote-section-title"><LayoutGrid size={20} className="text-blue-500" /> Parcourir par catégorie</h2>
            </div>
            <div className="mkt-cocote-category-grid">
              {categories.slice(0, 8).map((c: any) => (
                <Link key={c.id} href={`/marketplace/category/${c.id}`} className="mkt-cocote-category-card">
                  <div className="mkt-cocote-category-icon">{c.icon || '📦'}</div>
                  <span>{c.name}</span>
                </Link>
              ))}
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
