'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Menu, Search, Camera, User, Grid, MessageSquare,
  ShieldCheck, Video, ChevronRight, X,
  ShoppingBag, Star, FileText, HelpCircle, LayoutGrid,
} from 'lucide-react';
import { sanitizeUrl } from '../../lib/imageUtils';
import { useVault } from '../VaultContext';
import '../marketplace-mobile-mic.css';

const QUICK_NAV = [
  { icon: LayoutGrid, label: 'Catégories', href: '/marketplace/categories', bg: '#FEF2F2', color: '#E31E24' },
  { icon: FileText, label: 'Demande RFQ', action: 'rfq', bg: '#FFF7ED', color: '#EA580C' },
  { icon: ShieldCheck, label: 'Vérifiés', href: '/marketplace/vendors', bg: '#ECFDF5', color: '#059669' },
  { icon: Video, label: 'Concept', href: '/marketplace/concept', bg: '#EFF6FF', color: '#2563EB' },
  { icon: HelpCircle, label: 'Guide', href: '/marketplace/help', bg: '#F5F3FF', color: '#7C3AED' },
];

const TRUST_BADGES = [
  { label: 'SMART EXPO', sub: 'Fournisseurs aux salons', href: '/marketplace/about' },
  { label: 'Trade sécurisé', sub: 'Transactions protégées', href: '/marketplace/terms' },
  { label: 'Usine certifiée', sub: 'Audit ElKassa', href: '/marketplace/vendors' },
  { label: 'Fournisseur Gold', sub: 'Sélection premium', href: '/marketplace/premium-request' },
];

function countLabel(n: number) {
  if (n >= 1000) return `${Math.floor(n / 1000)}k+ produits`;
  return `${n} produit${n > 1 ? 's' : ''}`;
}

export default function MarketplaceMobile({
  initialData,
  store,
  setRfqOpen,
  blogPosts = [],
  isVendor = false,
  hidePrices = false,
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search');
  const { categories = [], products = [], banners = [] } = initialData || {};

  const [scope, setScope] = useState<'PRODUCT' | 'VENDOR'>('PRODUCT');
  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hotTags = useMemo(() => {
    const names: string[] = [];
    const traverse = (cats: any[]) => {
      cats.forEach((cat) => {
        names.push(cat.name);
        if (cat.children?.length) traverse(cat.children);
      });
    };
    traverse(categories);
    const base = names.length > 0 ? Array.from(new Set(names)) : ['Café', 'Emballages', 'Machines', 'Équipements'];
    return [...base].sort(() => Math.random() - 0.5).slice(0, 10);
  }, [categories]);

  const heroSlides = useMemo(() => {
    const hero = banners.filter((b: any) => b.position === 'HERO');
    if (hero.length > 0) return hero.slice(0, 5);
    return [
      { title: 'Sourcing B2B Tunisie', subtitle: 'Fournisseurs locaux vérifiés', imageUrl: '/marketplace_hero_banner.png', buttonLink: '/register' },
      { title: 'Made in Tunisia', subtitle: 'Produits locaux & proximité', imageUrl: '/marketplace_hero_banner.png', buttonLink: '/marketplace/tunisia' },
    ];
  }, [banners]);

  const categoryHubs = useMemo(() => {
    return categories.slice(0, 4).map((cat: any) => {
      const catProducts = products.filter(
        (p: any) => p.categoryId === cat.id || p.category?.parentId === cat.id || p.category?.id === cat.id
      );
      const items = (catProducts.length > 0 ? catProducts : products).slice(0, 4);
      return { cat, items, total: catProducts.length || products.length };
    });
  }, [categories, products]);

  const youMayLike = useMemo(() => products.slice(0, 6), [products]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(
      `/marketplace?search=${encodeURIComponent(searchQuery.trim())}&scope=${scope}`
    );
  };

  const results = useMemo(() => {
    if (!urlSearch) return { type: 'PRODUCT' as const, data: products };
    const q = urlSearch.toLowerCase();
    const scopeParam = searchParams.get('scope') || 'PRODUCT';

    if (scopeParam === 'VENDOR') {
      const vendors = Array.from(new Set(products.map((p: any) => p.vendor?.id)))
        .map((id) => products.find((p: any) => p.vendor?.id === id)?.vendor)
        .filter(Boolean);
      return {
        type: 'VENDOR' as const,
        data: vendors.filter((v: any) => v.companyName?.toLowerCase().includes(q)),
      };
    }

    return {
      type: 'PRODUCT' as const,
      data: products.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      ),
    };
  }, [urlSearch, products, searchParams]);

  const ProductCard = ({ p }: { p: any }) => (
    <Link href={`/marketplace/product/${p.id}`} className="mic-product-card">
      <div className="mic-p-img">
        <img src={sanitizeUrl(p.image ?? undefined)} alt={p.name} />
        {p.vendor?.isEcoResponsible && (
          <span style={{ position: 'absolute', top: 6, left: 6, background: '#DCFCE7', color: '#166534', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 3 }}>
            ÉCO
          </span>
        )}
      </div>
      <div className="mic-p-body">
        <h4>{p.name}</h4>
        {!hidePrices ? (
          <div className="mic-p-price">{Number(p.price).toFixed(2)} DT</div>
        ) : (
          <div className="mic-p-price" style={{ fontSize: 11 }}>Prix sur demande</div>
        )}
        <div className="mic-p-moq">
          MOQ {p.minOrderQty || 1} {p.unit || 'unité'}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="mic-mkt">
      <header className="mic-mkt-header">
        <div className="mic-mkt-header-top">
          <button type="button" onClick={() => setDrawerOpen(true)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }} aria-label="Menu">
            <Menu size={22} color="#333" />
          </button>
          <Link href="/marketplace" className="mic-mkt-logo">
            ElKassa<span>Market</span>
          </Link>
          <div className="mic-scope-pills">
            <button
              type="button"
              className={`mic-scope-pill ${scope === 'PRODUCT' ? 'active' : ''}`}
              onClick={() => setScope('PRODUCT')}
            >
              Produits
            </button>
            <button
              type="button"
              className={`mic-scope-pill ${scope === 'VENDOR' ? 'active' : ''}`}
              onClick={() => setScope('VENDOR')}
            >
              Fournisseurs
            </button>
          </div>
          <Link href={isVendor ? '/vendor/portal' : '/admin'} style={{ padding: 4 }} aria-label="Compte">
            <User size={22} color="#333" />
          </Link>
        </div>

        <form className="mic-mkt-search" onSubmit={handleSearch}>
          <Search size={16} className="mic-search-icon" />
          <input
            type="search"
            placeholder={scope === 'PRODUCT' ? 'Quel produit cherchez-vous ?' : 'Rechercher un fournisseur…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="mic-search-actions">
            <Camera size={18} />
          </div>
        </form>
      </header>

      {urlSearch ? (
        <div className="mic-search-results">
          <div className="mic-section-title-row">
            <h2>&quot;{urlSearch}&quot; ({results.data.length})</h2>
            <Link href="/marketplace" className="mic-see-all">
              Effacer
            </Link>
          </div>
          <div className={results.type === 'PRODUCT' ? 'mic-product-grid' : ''} style={results.type === 'VENDOR' ? { display: 'flex', flexDirection: 'column', gap: 10 } : undefined}>
            {results.type === 'PRODUCT' ? (
              results.data.map((p: any) => <ProductCard key={p.id} p={p} />)
            ) : (
              results.data.map((v: any) => {
                const { maskName, identityVisible } = useVault(v.id, v.isPremium);
                return (
                  <Link
                    key={v.id}
                    href={`/marketplace/vendor/${v.id}`}
                    className="mic-you-like-card"
                  >
                    <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '1px solid #eee', filter: identityVisible ? 'none' : 'blur(4px)' }}>
                      <img src={v.logoUrl || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h4>{maskName(v.companyName)}</h4>
                      <span>{identityVisible ? v.city : 'Ville masquée'} · {v.sector}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Grille catégories — style MiC */}
          <nav className="mic-cat-grid" aria-label="Catégories">
            <Link href="/marketplace/categories" className="mic-cat-item">
              <div className="mic-cat-icon">☰</div>
              <span className="mic-cat-label">Tout</span>
            </Link>
            {categories.slice(0, 9).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/marketplace/category/${cat.slug || cat.id}`}
                className="mic-cat-item"
              >
                <div className="mic-cat-icon">{cat.icon || cat.name?.charAt(0) || '📦'}</div>
                <span className="mic-cat-label">{cat.name}</span>
              </Link>
            ))}
          </nav>

          {/* Carrousel bannières */}
          <div className="mic-banner-track mic-no-scrollbar">
            {heroSlides.map((banner: any, idx: number) => (
              <Link
                key={banner.id || idx}
                href={banner.buttonLink || '/marketplace'}
                className="mic-banner-slide"
              >
                <img src={banner.imageUrl || '/marketplace_hero_banner.png'} alt={banner.title} />
                <div className="mic-banner-caption">
                  <h3>{banner.title}</h3>
                  {banner.subtitle && <p>{banner.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>

          {/* Badges confiance */}
          <div className="mic-banner-track mic-no-scrollbar" style={{ background: '#fff', paddingTop: 8, paddingBottom: 12 }}>
            {TRUST_BADGES.map((b) => (
              <Link
                key={b.label}
                href={b.href}
                style={{
                  flex: '0 0 auto',
                  minWidth: 140,
                  padding: '10px 12px',
                  background: '#fafafa',
                  borderRadius: 6,
                  border: '1px solid #eee',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 900, color: '#e31e24', marginBottom: 2 }}>{b.label}</div>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{b.sub}</div>
              </Link>
            ))}
          </div>

          {/* Navigation rapide MiC */}
          <div className="mic-quick-nav">
            {QUICK_NAV.map((item, i) => {
              const Icon = item.icon;
              const inner = (
                <>
                  <div className="mic-quick-icon" style={{ background: item.bg, color: item.color }}>
                    <Icon size={20} />
                  </div>
                  <span className="mic-quick-label">{item.label}</span>
                </>
              );
              if (item.action === 'rfq') {
                return (
                  <button key={i} type="button" className="mic-quick-item" onClick={() => setRfqOpen(true)}>
                    {inner}
                  </button>
                );
              }
              return (
                <Link key={i} href={item.href!} className="mic-quick-item">
                  {inner}
                </Link>
              );
            })}
          </div>

          {/* Recherches populaires */}
          <section className="mic-section">
            <h2 className="mic-section-title">Recherches populaires</h2>
            <div className="mic-hot-tags mic-no-scrollbar">
              {hotTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/marketplace?search=${encodeURIComponent(tag)}&scope=PRODUCT`}
                  className="mic-hot-tag"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>

          {/* Vous aimerez peut-être */}
          {youMayLike.length > 0 && (
            <section className="mic-section">
              <h2 className="mic-section-title">Vous aimerez peut-être</h2>
              <div className="mic-you-like-grid">
                {youMayLike.map((p: any) => (
                  <Link key={p.id} href={`/marketplace/product/${p.id}`} className="mic-you-like-card">
                    <img src={sanitizeUrl(p.image ?? undefined)} alt="" />
                    <div>
                      <h4>{p.name}</h4>
                      <span>{countLabel(products.length)}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/marketplace?scope=PRODUCT" className="mic-hub-more" style={{ marginTop: 10 }}>
                Publier une demande si aucun produit ne convient →
              </Link>
            </section>
          )}

          {/* Tendances */}
          <section className="mic-section">
            <div className="mic-section-title-row">
              <h2>Produits tendance</h2>
              <Link href="/marketplace/categories" className="mic-see-all">
                Voir plus
              </Link>
            </div>
            <div className="mic-trend-scroll mic-no-scrollbar">
              {products.slice(0, 12).map((p: any) => (
                <Link key={p.id} href={`/marketplace/product/${p.id}`} className="mic-trend-chip">
                  <div className="mic-trend-img">
                    <img src={sanitizeUrl(p.image ?? undefined)} alt="" />
                  </div>
                  <span>{p.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Hubs par catégorie — "Source Now" MiC */}
          {categoryHubs.map(({ cat, items, total }) =>
            items.length > 0 ? (
              <div key={cat.id} className="mic-hub">
                <div className="mic-hub-header">
                  <h3>{cat.name}</h3>
                  <Link href={`/marketplace/category/${cat.slug || cat.id}`}>Sourcer →</Link>
                </div>
                <div className="mic-hub-products">
                  {items.map((p: any) => (
                    <Link key={p.id} href={`/marketplace/product/${p.id}`} className="mic-hub-product">
                      <img src={sanitizeUrl(p.image ?? undefined)} alt="" />
                      <span>{p.name}</span>
                    </Link>
                  ))}
                </div>
                <Link href={`/marketplace/category/${cat.slug || cat.id}`} className="mic-hub-more">
                  Voir plus ({countLabel(total)})
                </Link>
              </div>
            ) : null
          )}

          {/* Easy Sourcing / RFQ */}
          <div className="mic-easy-sourcing">
            <h3>Easy Sourcing</h3>
            <p>Une façon simple de publier votre demande et recevoir des devis de fournisseurs vérifiés.</p>
            <ul>
              <li>Une demande, plusieurs devis</li>
              <li>Fournisseurs correspondants</li>
              <li>Comparaison & échantillons</li>
            </ul>
            <button type="button" className="mic-easy-btn" onClick={() => setRfqOpen(true)}>
              Publier ma demande maintenant
            </button>
          </div>

          {/* Tunisie + Éco */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px 8px' }}>
            <Link href="/marketplace/tunisia" style={{ background: '#fff', borderRadius: 6, padding: 14, textDecoration: 'none', border: '1px solid #eee' }}>
              <span style={{ fontSize: 20 }}>🇹🇳</span>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#222', marginTop: 6 }}>Made in Tunisia</div>
            </Link>
            <Link href="/marketplace/eco" style={{ background: '#fff', borderRadius: 6, padding: 14, textDecoration: 'none', border: '1px solid #eee' }}>
              <span style={{ fontSize: 20 }}>🌱</span>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#222', marginTop: 6 }}>Bio & local</div>
            </Link>
          </div>

          {/* Flux principal */}
          <section className="mic-section" style={{ marginBottom: 0 }}>
            <h2 className="mic-section-title">Sélection pour vous</h2>
          </section>
          <div className="mic-product-grid">
            {products.map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </>
      )}

      {/* Drawer catégories */}
      {drawerOpen && (
        <>
          <div className="mic-drawer-overlay" onClick={() => setDrawerOpen(false)} role="presentation" />
          <aside className="mic-drawer">
            <div className="mic-drawer-head">
              <strong style={{ fontSize: 16 }}>Toutes les catégories</strong>
              <button type="button" onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>
            <div className="mic-drawer-body">
              <Link href="/marketplace/categories" className="mic-drawer-link" onClick={() => setDrawerOpen(false)}>
                Voir l&apos;annuaire complet <ChevronRight size={16} />
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/marketplace/category/${cat.slug || cat.id}`}
                  className="mic-drawer-link"
                  onClick={() => setDrawerOpen(false)}
                >
                  <span>{cat.icon || '📦'} {cat.name}</span>
                  <ChevronRight size={16} color="#ccc" />
                </Link>
              ))}
            </div>
          </aside>
        </>
      )}

      {/* Bottom nav — MiC style */}
      <nav className="mic-bottom-nav" aria-label="Navigation">
        <Link href="/marketplace" className="active">
          <ShoppingBag size={22} strokeWidth={2.5} />
          Accueil
        </Link>
        <Link href="/marketplace/categories">
          <Grid size={22} />
          Catégories
        </Link>
        <button
          type="button"
          onClick={() => setRfqOpen(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: '#888', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}
        >
          <MessageSquare size={22} />
          RFQ
        </button>
        <Link href="/marketplace/messages">
          <Star size={22} />
          Messages
        </Link>
        <Link href={isVendor ? '/vendor/portal' : '/admin'}>
          <User size={22} />
          Compte
        </Link>
      </nav>
    </div>
  );
}
