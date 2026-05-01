'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, ShoppingBag, Search, X, Plus, Minus, Send,
  Star, Zap, Heart, ChevronRight, ArrowRight, LayoutGrid
} from 'lucide-react';
import { placeMarketplaceOrder, rateVendorAction } from '../actions';
import { useCart } from './CartContext';
import CartDrawer from './CartDrawer';
import './marketplace.css';
import { sanitizeUrl } from '../lib/imageUtils';

/* ─── Helpers ─── */
const fmt = (n: any) => Number(n).toFixed(3);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com';

function Stars({ avg = 0, total = 0, size = 10 }: any) {
  if (!total) return <span style={{ fontSize: size, color: '#94A3B8', fontWeight: 700 }}>Nouveau</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} fill={s <= Math.round(avg) ? '#F59E0B' : 'none'} stroke={s <= Math.round(avg) ? '#F59E0B' : '#E2E8F0'} />
      ))}
      <span style={{ fontSize: size + 1, fontWeight: 900, color: '#1E293B' }}>{Number(avg).toFixed(1)}</span>
    </div>
  );
}

/* ─── Countdown ─── */
function Countdown({ targetMs }: { targetMs: number }) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      setT({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="mkt-countdown">
      <div className="mkt-count-block">{pad(t.h)}</div>
      <div className="mkt-count-sep">:</div>
      <div className="mkt-count-block">{pad(t.m)}</div>
      <div className="mkt-count-sep">:</div>
      <div className="mkt-count-block">{pad(t.s)}</div>
    </div>
  );
}

/* ─── Banner (from DB or fallback) ─── */
function HeroBanner({ banner }: { banner: any }) {
  if (!banner) return (
    <div className="mkt-hero-main" style={{ background: '#1E1B4B' }}>
      <div className="mkt-hero-overlay">
        <span className="mkt-hero-badge">MARKETPLACE B2B</span>
        <h2 className="mkt-hero-title">Le Meilleur du B2B<br />en Un Clic.</h2>
        <p className="mkt-hero-sub">Approvisionnez votre café directement chez les meilleurs fournisseurs de Tunisie.</p>
        <button className="mkt-hero-cta">Découvrir <ArrowRight size={16} /></button>
      </div>
    </div>
  );
  return (
    <div className="mkt-hero-main" style={{ background: banner.bgColor || '#1E1B4B' }}>
      <img className="mkt-hero-img" src={sanitizeUrl(banner.imageUrl) || ''} alt={banner.title} onError={(e: any) => { e.target.style.display='none'; }} />
      <div className="mkt-hero-overlay">
        {banner.badgeText && <span className="mkt-hero-badge">{banner.badgeText}</span>}
        <h2 className="mkt-hero-title">{banner.title}</h2>
        {banner.subtitle && <p className="mkt-hero-sub">{banner.subtitle}</p>}
        {banner.buttonText && <button className="mkt-hero-cta">{banner.buttonText} <ArrowRight size={16} /></button>}
      </div>
    </div>
  );
}

function SideBanner({ banner, gradient }: { banner: any; gradient: string }) {
  if (!banner) return (
    <div className="mkt-side-banner" style={{ background: gradient }}>
      <div className="mkt-side-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
        <span className="mkt-side-label">OFFRE SPÉCIALE</span>
        <div className="mkt-side-title">Packs Pro</div>
        <span className="mkt-side-badge">-40%</span>
      </div>
    </div>
  );
  return (
    <div className="mkt-side-banner" style={{ background: banner.bgColor || gradient }}>
      <img src={sanitizeUrl(banner.imageUrl) || ''} alt={banner.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.5 }} onError={(e:any)=>{e.target.style.display='none';}} />
      <div className="mkt-side-overlay" style={{ background:'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
        {banner.badgeText && <span className="mkt-side-label">{banner.badgeText}</span>}
        <div className="mkt-side-title">{banner.title}</div>
        {banner.subtitle && <span style={{ fontSize:12, color:'rgba(255,255,255,0.8)', fontWeight:700 }}>{banner.subtitle}</span>}
      </div>
    </div>
  );
}

function AdsBanner({ banner, fallback }: { banner?: any; fallback: { title: string; subtitle: string; img: string; color: string } }) {
  const b = banner || fallback;
  return (
    <div className="mkt-ads" style={{ background: b.color || banner?.bgColor || '#1E1B4B' }}>
      <img src={sanitizeUrl(b.imageUrl || b.img) || ''} alt={b.title} onError={(e:any)=>{e.target.style.display='none';}} />
      <div className="mkt-ads-content">
        <h3>{b.title}</h3>
        {b.subtitle && <p>{b.subtitle}</p>}
        <Link href="/marketplace/premium-request" className="mkt-ads-btn" style={{ color: b.color || '#1E1B4B', textDecoration: 'none' }}>{b.buttonText || 'Profiter'} →</Link>
      </div>
    </div>
  );
}

/* ─── Product Card ─── */
function ProductCard({ product, onAdd, onDetail }: any) {
  const avg = product.vendor?.ratings?.overallAvg || 0;
  const total = product.vendor?.ratings?.totalReviews || 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="mkt-card">
      <Link href={`/marketplace/product/${product.id}`} className="mkt-card-img" style={{ display: 'block', textDecoration: 'none' }}>
        <img
          src={sanitizeUrl(product.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'}
          alt={product.name}
          onError={(e:any)=>{e.target.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400';}}
        />
        <div className="mkt-card-add">
          <button className="mkt-card-add-btn" onClick={(e)=>{e.preventDefault();e.stopPropagation();onAdd(product);}}>
            <Plus size={14} /> AJOUTER AU PANIER
          </button>
        </div>
        {product.isFlashSale && <span className="mkt-card-badge flash">⚡ Flash</span>}
        {!product.isFlashSale && product.isFeatured && <span className="mkt-card-badge featured">★ Top</span>}
        <button className="mkt-card-wish"><Heart size={14} /></button>
      </Link>
      <div className="mkt-card-body">
        <Link href={`/marketplace/vendor/${product.vendor?.id}`} className="mkt-card-vendor" style={{ textDecoration: 'none' }}>{product.vendor?.companyName}</Link>
        <Link href={`/marketplace/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <div className="mkt-card-name">{product.name}</div>
        </Link>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            {hasDiscount && <span className="mkt-card-old-price">{fmt(product.price)}</span>}
            <span className="mkt-card-price">{fmt(hasDiscount ? product.discountPrice : product.price)}</span>
            <span className="mkt-card-unit">DT/{product.unit}</span>
          </div>
        </div>
        <Stars avg={avg} total={total} size={10} />
      </div>
    </div>
  );
}

/* ─── Product Modal ─── */
function ProductModal({ product, categories, onClose, onAdd }: any) {
  const catName = categories.find((c:any) => c.id === product.categoryId)?.name || 'Produit';
  return (
    <div className="mkt-modal-backdrop" onClick={onClose}>
      <div className="mkt-modal" onClick={e=>e.stopPropagation()}>
        <button className="mkt-modal-close" onClick={onClose}><X size={18} /></button>
        <div className="mkt-modal-gallery">
          <img
            src={product.image?.replace('http://localhost:3001', '').replace('https://api.coffeeshop.elkassa.com', '') || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800'}
            alt={product.name}
            onError={(e:any)=>{e.target.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800';}}
          />
        </div>
        <div className="mkt-modal-detail">
          <div style={{ fontSize:12, fontWeight:800, color:'#6366F1', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            {catName}
          </div>
          <h2 style={{ fontSize:28, fontWeight:950, color:'#1E1B4B', margin:'0 0 20px', lineHeight:1.2 }}>{product.name}</h2>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:28 }}>
            <span style={{ fontSize:36, fontWeight:950, color:'#1E1B4B' }}>{fmt(product.price)}</span>
            <span style={{ fontSize:16, color:'#94A3B8', fontWeight:700 }}>DT / {product.unit}</span>
          </div>
          {product.description && (
            <p style={{ fontSize:14, color:'#64748B', lineHeight:1.7, marginBottom:28 }}>{product.description}</p>
          )}
          <div style={{ background:'#F8FAFC', padding:20, borderRadius:20, marginBottom:28, border:'1px solid #F1F5F9' }}>
            <div style={{ fontSize:11, fontWeight:900, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Vendeur Certifié</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏪</div>
              <div>
                <div style={{ fontSize:15, fontWeight:900, color:'#1E293B' }}>{product.vendor?.companyName}</div>
                <div style={{ fontSize:12, color:'#64748B', fontWeight:600 }}>{product.vendor?.city}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => { onAdd(product); onClose(); }}
            style={{ width:'100%', padding:20, background:'#1E1B4B', color:'#fff', border:'none', borderRadius:18, fontWeight:900, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:12, boxShadow:'0 10px 24px rgba(30,27,75,0.25)', transition:'all 0.2s', marginTop:'auto' }}
          >
            <Plus size={20} /> Ajouter au Panier
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN CLIENT ─── */
export default function MarketplaceClient({ initialData }: { initialData: any }) {
  const { products = [], categories = [], bundles = [], flashSales = [], featured = [], banners = [] } = initialData;

  const [activeCat, setActiveCat] = useState('all');
  const [activeTab, setActiveTab] = useState<'latest' | 'bestselling' | 'featured'>('latest');
  const [cartOpen, setCartOpen] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const [announce, setAnnounce] = useState(true);
  const [search, setSearch] = useState('');

  const { addToCart, cartCount } = useCart();

  // Map banners by position
  const getBanner = (pos: string) => banners.find((b: any) => b.position === pos && b.isActive);

  // Countdown: end of day
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

  // Filtered products for tabbed section
  const tabProducts = (() => {
    let list = activeCat === 'all' ? products : products.filter((p: any) => p.categoryId === activeCat);
    if (search) list = list.filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.vendor?.companyName?.toLowerCase().includes(search.toLowerCase()));
    if (activeTab === 'featured') return list.filter((p: any) => p.isFeatured);
    if (activeTab === 'bestselling') return [...list].sort((a, b) => Number(b.price) - Number(a.price));
    return list;
  })();

  // Deal section products
  const dealProducts = flashSales.length > 0 ? flashSales : products.slice(0, 5);

  // Brands from vendors
  const vendors = Array.from(new Map(products.map((p: any) => [p.vendor?.id, p.vendor])).values()).filter(Boolean);

  return (
    <div className="mkt-page">
      {/* Announcement Bar */}
      {announce && (
        <div className="mkt-announce">
          🚀 Livraison Express sur Tunis | Commandez avant 10h → Livraison avant 18h | Code promo: <strong>COFFEE10</strong>
          <button className="mkt-announce-close" onClick={() => setAnnounce(false)}>×</button>
        </div>
      )}

      {/* Header */}
      <header className="mkt-header">
        <div className="mkt-header-inner">
          <Link href="/marketplace" className="mkt-logo" style={{ textDecoration: 'none' }}>
            <div className="mkt-logo-icon"><ShoppingBag size={22} /></div>
            Coffee<span>Market</span>
          </Link>

          <div className="mkt-search-wrap">
            <Search className="mkt-search-icon" size={18} />
            <input
              className="mkt-search"
              placeholder="Rechercher produits, fournisseurs, packs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="mkt-header-actions">
            <Link href="/" className="mkt-header-btn" style={{ textDecoration: 'none' }}>
              <LayoutGrid size={16} /> Dashboard
            </Link>
            <button className="mkt-cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="mkt-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Category Mega Menu */}
      <nav className="mkt-catmenu">
        <div className="mkt-catmenu-inner">
          <button className={`mkt-catmenu-item ${activeCat === 'all' ? 'active' : ''}`} onClick={() => setActiveCat('all')}>
            <span>🏪</span> Tout
          </button>
          <div className="mkt-catmenu-divider" />
          {categories.map((c: any) => (
            <Link
              key={c.id}
              href={`/marketplace/category/${c.id}`}
              className={`mkt-catmenu-item ${activeCat === c.id ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span>{c.icon || '📦'}</span> {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Container */}
      <div className="mkt-container">

        {/* ── Search Results Overlay ── */}
        {search.length > 0 && (
          <div style={{ marginBottom: 48, animation: 'fadeIn 0.3s ease' }}>
            <div className="mkt-section-head">
              <div className="mkt-section-label">
                <div className="mkt-section-label-bar" style={{ background: '#4F46E5' }} />
                <h2 className="mkt-section-title">Résultats pour "{search}"</h2>
              </div>
              <span className="mkt-section-count">{tabProducts.length} produits</span>
            </div>
            {tabProducts.length > 0 ? (
              <div className="mkt-grid">
                {tabProducts.map((p: any) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onDetail={() => setModal(p)} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 24, border: '1px solid #F1F5F9' }}>
                <Search size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
                <p style={{ fontWeight: 700, color: '#64748B' }}>Aucun produit trouvé pour votre recherche.</p>
              </div>
            )}
            <div style={{ height: 2, background: '#F1F5F9', margin: '48px 0' }} />
          </div>
        )}

        {/* ── Hero Banner Grid ── */}
        <div className="mkt-hero-grid">
          <HeroBanner banner={getBanner('HERO')} />
          <div className="mkt-hero-sides">
            <SideBanner banner={getBanner('SIDEBAR_1')} gradient="linear-gradient(135deg,#4F46E5,#7C3AED)" />
            <SideBanner banner={getBanner('SIDEBAR_2')} gradient="linear-gradient(135deg,#10B981,#059669)" />
          </div>
        </div>

        {/* ── Brands Ticker ── */}
        {vendors.length > 0 && (
          <div className="mkt-brands">
            <div className="mkt-brands-track">
              {[...vendors, ...vendors].map((v: any, i: number) => (
                <div key={i} className="mkt-brand-item">
                  <div className="mkt-brand-avatar">🏪</div>
                  {v?.companyName}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Deal of the Day ── */}
        <section className="mkt-section">
          <div className="mkt-section-head">
            <div className="mkt-section-head-left">
              <div className="mkt-section-label">
                <div className="mkt-section-label-bar" style={{ background: 'linear-gradient(to bottom,#EF4444,#F97316)' }} />
                <h2 className="mkt-section-title">⚡ Deal de la Journée !</h2>
              </div>
              <Countdown targetMs={endOfDay.getTime()} />
            </div>
            <button className="mkt-section-link">Voir tout <ChevronRight size={14} /></button>
          </div>
          <div className="mkt-grid">
            {dealProducts.slice(0, 5).map((p: any) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} onDetail={() => setModal(p)} />
            ))}
          </div>
        </section>

        {/* ── Ads Banner 1 ── */}
        <AdsBanner
          banner={getBanner('ADS_1')}
          fallback={{
            title: 'Livraison Express sur tout Tunis',
            subtitle: 'Commandez avant 10h → Livré avant 18h. Service garanti.',
            img: 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?q=80&w=1600',
            color: '#1E1B4B'
          }}
        />

        {/* ── Tabbed Products ── */}
        <section className="mkt-section">
          <div className="mkt-section-head">
            <div className="mkt-tabs">
              {(['latest','bestselling','featured'] as const).map(tab => (
                <button key={tab} className={`mkt-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab === 'latest' ? '🆕 Dernières Arrivées' : tab === 'bestselling' ? '🔥 Les Plus Vendus' : '⭐ Recommandations'}
                </button>
              ))}
            </div>
            <span className="mkt-section-count">{tabProducts.length} produits</span>
          </div>
          <div className="mkt-grid">
            {tabProducts.slice(0, 10).map((p: any) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} onDetail={() => setModal(p)} />
            ))}
          </div>
          {tabProducts.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="mkt-section-link" style={{ margin: '0 auto' }}>Charger plus de produits <ArrowRight size={14} /></button>
            </div>
          )}
        </section>

        {/* ── Ads Banner 2 ── */}
        <AdsBanner
          banner={getBanner('ADS_2')}
          fallback={{
            title: 'Devenez Fournisseur Premium',
            subtitle: 'Multipliez vos ventes × 3 sur le premier marketplace B2B du café.',
            img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600',
            color: '#4F46E5'
          }}
        />

        {/* ── Category Sections ── */}
        {categories.filter((c: any) => c.status !== 'ARCHIVED').slice(0, 4).map((cat: any) => {
          const catProds = products.filter((p: any) => p.categoryId === cat.id);
          if (catProds.length === 0) return null;
          return (
            <section key={cat.id} className="mkt-section">
              <div className="mkt-section-head">
                <div className="mkt-section-label">
                  <div className="mkt-section-label-bar" />
                  <h2 className="mkt-section-title">{cat.icon || '📦'} {cat.name}</h2>
                </div>
                <Link href={`/marketplace/category/${cat.id}`} className="mkt-section-link" style={{ textDecoration: 'none' }}>
                  Voir la catégorie <ChevronRight size={14} />
                </Link>
              </div>
              <div className="mkt-grid">
                {catProds.slice(0, 5).map((p: any) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onDetail={() => setModal(p)} />
                ))}
              </div>
            </section>
          );
        })}

      </div>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* ── Product Modal ── */}
      {modal && (
        <ProductModal
          product={modal}
          categories={categories}
          onClose={() => setModal(null)}
          onAdd={addToCart}
        />
      )}
    </div>
  );
}
