'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ShoppingCart, Search, Filter, 
  ChevronRight, Star, ShoppingBag, LayoutGrid, Plus,
  MapPin, Heart, Store, Navigation, Tag
} from 'lucide-react';
import { useCart } from '../../CartContext';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import MarketplaceFooter from '../../components/MarketplaceFooter';
import '../../marketplace.css';
import { sanitizeUrl } from '../../../lib/imageUtils';

const getCategoryColor = (name: string) => {
  const n = name?.toLowerCase() || '';
  if (n.includes('caf')) return '#8B5A2B';
  if (n.includes('thé') || n.includes('infus')) return '#10B981';
  if (n.includes('lait') || n.includes('chocol')) return '#3B82F6';
  if (n.includes('jus') || n.includes('boisson')) return '#F59E0B';
  if (n.includes('pâtis') || n.includes('viennois') || n.includes('sucr')) return '#EC4899';
  if (n.includes('salé') || n.includes('snack')) return '#EF4444';
  if (n.includes('machine') || n.includes('equip')) return '#64748B';
  if (n.includes('emball') || n.includes('jetable')) return '#14B8A6';
  return '#6366F1';
};

const fmt = (n: any) => Number(n).toFixed(3);

const getMockDistance = (vendorId: string) => {
  if (!vendorId) return 5;
  const s = String(vendorId);
  const sum = s.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (sum % 12) + 5; 
};

function Stars({ avg = 0, total = 0, size = 12 }: any) {
  if (!total) return <span style={{ fontSize: size, color: '#94A3B8', fontWeight: 600 }}>Nouveau</span>;
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

const CATEGORY_IMAGES: Record<string, string> = {
  'matieres-premieres': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200',
  'produits-semi-finis': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1200',
  'produits-finis-b2b-revente': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1200',
  'equipements-materiel': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200',
  'emballages': 'https://images.unsplash.com/photo-1589939705384-5185138a04b9?q=80&w=1200',
  'hygiene-nettoyage': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200',
  'services': 'https://images.unsplash.com/photo-1521791136366-39851946a095?q=80&w=1200',
};

const getCategoryImage = (cat: any) => {
  if (cat.image) return cat.image;
  return CATEGORY_IMAGES[cat.slug] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200';
};

export default function CategoryViewClient({ category, products = [], allCategories = [], allProducts = [], isVendor = false }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const { addToCart } = useCart();
  
  // Filters State
  const currentRadius = parseInt(searchParams.get('radius') || '15');
  const currentLocation = searchParams.get('loc') || 'Tunis';
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('relevant');

  const brands = useMemo(() => {
    const bSet = new Set<string>();
    products.forEach((p: any) => { if (p.brand) bSet.add(p.brand); });
    return Array.from(bSet);
  }, [products]);

  const toggleBrand = (b: string) => {
    setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p: any) => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor?.companyName?.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedBrands.length > 0) {
      list = list.filter((p: any) => p.brand && selectedBrands.includes(p.brand));
    }
    if (sortOrder === 'price_asc') list.sort((a: any, b: any) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    if (sortOrder === 'price_desc') list.sort((a: any, b: any) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    return list;
  }, [products, search, selectedBrands, sortOrder]);

  const featuredProducts = useMemo(() => products.filter((p: any) => p.isFeatured).slice(0, 4), [products]);
  const flashSales = useMemo(() => products.filter((p: any) => p.isFlashSale).slice(0, 4), [products]);
  const bestPrices = useMemo(() => [...products].sort((a,b) => (a.discountPrice || a.price) - (b.discountPrice || b.price)).slice(0, 4), [products]);
  const suggestions = useMemo(() => allProducts.filter((p: any) => p.isFeatured).slice(0, 8), [allProducts]);

  const catColor = category.color || getCategoryColor(category.name);

  const parentCategory = allCategories.find((c: any) => c.children?.some((s: any) => s.id === category.id));
  const displayCategory = category;

  return (
    <div className="mkt-page cocote-theme">
      <MarketplaceHeader isVendor={isVendor} categories={allCategories} />

      {/* ── FULL-WIDTH COMPACT HERO ── */}
      <div className="mkt-category-hero-premium" style={{ 
        backgroundImage: `url(${getCategoryImage(category)})`,
        minHeight: '280px',
        borderRadius: 0,
        marginBottom: 0
      }}>
        <div className="mkt-category-hero-overlay" />
        <div className="mkt-category-hero-content" style={{ padding: '40px 20px' }}>
          <h1 className="text-white" style={{ fontSize: '42px', fontWeight: 800 }}>{category.name}</h1>
          <p className="text-white/90 text-lg max-w-xl mx-auto font-medium">
            Le meilleur de l'offre B2B locale pour votre établissement.
          </p>
        </div>
      </div>

      <div className="mkt-container" style={{ paddingTop: 40 }}>
        
        {/* Breadcrumbs Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, borderBottom: '1px solid #F1F5F9', paddingBottom: 20 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
              <Link href="/marketplace">Accueil</Link> 
              <ChevronRight size={12} /> 
              {parentCategory && (
                <>
                  <Link href={`/marketplace/category/${parentCategory.id}`}>{parentCategory.name}</Link>
                  <ChevronRight size={12} />
                </>
              )}
              <span style={{ color: '#111827' }}>{category.name}</span>
           </div>
           <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {filteredProducts.length} résultats
           </div>
        </div>

        <div style={{ display: 'flex', gap: 64 }}>
          
          {/* ── SIDEBAR ── */}
          <aside style={{ width: 280, flexShrink: 0 }} className="desktop-only">
            
            <div className="mkt-cocote-filter-block">
              <h3 className="mkt-cocote-filter-title">Catégories</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
                 <Link href="/marketplace" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 600 }}>← Toutes les catégories</Link>
                 {parentCategory ? (
                   <>
                      <Link href={`/marketplace/category/${parentCategory.id}`} style={{ fontSize: 14, color: '#111827', textDecoration: 'none', fontWeight: 800, marginTop: 8 }}>{parentCategory.name}</Link>
                      {(parentCategory.children || []).map((sub: any) => (
                        <Link 
                          key={sub.id} 
                          href={`/marketplace/category/${sub.id}`}
                          style={{ 
                            fontSize: 13, 
                            color: sub.id === category.id ? '#111827' : '#94A3B8', 
                            textDecoration: 'none', 
                            fontWeight: sub.id === category.id ? 800 : 500,
                            paddingLeft: 12,
                            borderLeft: sub.id === category.id ? `2px solid #111827` : '1px solid #E5E7EB'
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                   </>
                 ) : (
                   <>
                      <span style={{ fontSize: 14, color: '#111827', textDecoration: 'none', fontWeight: 800, marginTop: 8 }}>{category.name}</span>
                      {(category.children || []).map((sub: any) => (
                        <Link 
                          key={sub.id} 
                          href={`/marketplace/category/${sub.id}`}
                          style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none', fontWeight: 500, paddingLeft: 12, borderLeft: '1px solid #E5E7EB' }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                   </>
                 )}
              </div>
            </div>

            <div className="mkt-cocote-filter-block">
              <h3 className="mkt-cocote-filter-title">Distance (km)</h3>
              <div className="mkt-cocote-radius-slider" style={{ marginTop: 16 }}>
                 <input type="range" min="5" max="100" step="5" defaultValue={currentRadius} onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('radius', e.target.value);
                    router.push(`/marketplace/category/${category.id}?${params.toString()}`);
                 }} />
                 <div className="mkt-cocote-radius-labels" style={{ fontSize: 11, marginTop: 8 }}>
                    <span>5km</span><span>100km</span>
                 </div>
              </div>
            </div>

            {brands.length > 0 && (
              <div className="mkt-cocote-filter-block">
                <h3 className="mkt-cocote-filter-title">Marques</h3>
                <div className="mkt-cocote-filter-checkboxes">
                  {brands.map((b: string) => (
                    <label key={b} className="mkt-cocote-checkbox-label">
                      <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mkt-cocote-filter-block">
               <h3 className="mkt-cocote-filter-title">Labels</h3>
               <div className="mkt-cocote-filter-checkboxes">
                  <label className="mkt-cocote-checkbox-label"><input type="checkbox" /> <span className="flex items-center gap-2">🌱 Éco-responsable</span></label>
                  <label className="mkt-cocote-checkbox-label"><input type="checkbox" /> <span className="flex items-center gap-2">🇹🇳 Produit Tunisien</span></label>
                  <label className="mkt-cocote-checkbox-label"><input type="checkbox" /> <span className="flex items-center gap-2">⚒️ Artisanal</span></label>
               </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="mkt-cocote-content" style={{ flex: 1 }}>
            
            {/* ── SELECTIONS STRATÉGIQUES ── */}
            {products.length > 0 && !search && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 64, marginBottom: 80 }}>
                {featuredProducts.length > 0 && (
                  <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Sélection Premium</h2>
                      <Link href="#" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Voir tout</Link>
                    </div>
                    <div className="mkt-cocote-grid">
                      {featuredProducts.map((p: any) => <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />)}
                    </div>
                  </section>
                )}

                {bestPrices.length > 0 && (
                  <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Meilleurs Prix B2B</h2>
                    </div>
                    <div className="mkt-cocote-grid">
                      {bestPrices.map((p: any) => <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />)}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ── TOOLBAR ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, padding: '20px 0', borderBottom: '1px solid #F1F5F9' }}>
               <div className="text-sm font-black text-slate-900 uppercase tracking-widest">{filteredProducts.length} produits disponibles</div>
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trier par :</span>
                  <select 
                    className="bg-transparent font-black text-slate-900 uppercase text-[11px] border-none outline-none cursor-pointer"
                    value={sortOrder} 
                    onChange={e => setSortOrder(e.target.value)}
                  >
                    <option value="relevant">Pertinence</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
               </div>
            </div>

            {/* ── PRODUCTS GRID ── */}
            {filteredProducts.length > 0 ? (
              <div className="mkt-cocote-grid">
                {filteredProducts.map((p: any) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', border: '1px solid #F1F5F9', borderRadius: 4 }}>
                 <Search size={48} className="text-slate-200 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun produit ne correspond</h3>
                 <p className="text-slate-400">Essayez de modifier vos filtres ou votre rayon de recherche.</p>
              </div>
            )}

            {/* ── RECOMMANDATIONS ── */}
            <section style={{ marginTop: 120, padding: '80px 0', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ textAlign: 'center', marginBottom: 64 }}>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">D'autres univers pour vous</h2>
                <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">Découvrez les meilleures sélections Food & Drink par métier.</p>
              </div>
              <div className="mkt-cocote-category-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                {allCategories.filter((c: any) => c.id !== category.id).slice(0, 8).map((univ: any) => (
                  <Link 
                    key={univ.id} 
                    href={`/marketplace/category/${univ.id}`}
                    className="relative block aspect-[4/5] overflow-hidden group rounded-[4px] border border-slate-200 shadow-sm"
                  >
                    <img 
                      src={getCategoryImage(univ)} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={univ.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{univ.icon || '📦'}</span>
                        <h3 className="text-white text-lg font-bold leading-tight m-0 uppercase tracking-tight">{univ.name}</h3>
                      </div>
                      <p className="text-white/70 text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">Voir la collection</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
