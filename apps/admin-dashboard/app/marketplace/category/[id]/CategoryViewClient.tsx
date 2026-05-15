'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ShoppingCart, Search, Filter, 
  ChevronRight, Star, ArrowRight, LayoutGrid, Plus,
  MapPin, Heart, Store, Navigation, Tag, Sparkles, Check
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
  const [showBranches, setShowBranches] = React.useState(false);
  const avg = product.vendor?.ratings?.overallAvg || 0;
  const total = product.vendor?.ratings?.totalReviews || 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const branches = product.vendor?.branches || [];
    const isMultiFranchise = branches.length > 1;
    
    // Calculate nearest distance if branches exist
    let minDistance = product.distance || 0;
    if (minDistance === 0) {
      const distances = branches.length > 0 
        ? branches.map((b: any) => getMockDistance(b.id || product.vendorId))
        : [getMockDistance(product.vendorId)];
      minDistance = Math.min(...distances);
    }
    
    // Explicit format for distance
    const formattedDistance = typeof minDistance === 'number' ? minDistance.toFixed(1) : minDistance;
    
    const isPremium = product.vendor?.email === 'vendor3@cafe.tn' || product.isFeatured;
    const vendorLogo = product.vendor?.customization?.logoUrl ?? undefined;
    
    const locationNames = branches.length > 0 
      ? branches.map((b: any) => b.city || b.name) 
      : [product.vendor?.city || 'Tunis'];

    return (
      <div className={`mkt-cocote-card group ${isPremium ? 'is-premium' : ''}`} style={isPremium ? { '--premium-color': product.vendor?.customization?.color || '#6366F1' } as any : {}}>
        <Link href={`/marketplace/product/${product.id}`} className="mkt-cocote-card-img-wrap">
          <img
            src={sanitizeUrl(product.image) ?? '/images/elkassa-placeholder.png'}
            alt={product.name}
            className="mkt-cocote-card-img"
          />
          {isPremium && (
            <div className="mkt-cocote-premium-badge">
              <Sparkles size={10} /> {isMultiFranchise ? 'Multi-Franchise' : 'Premium'}
            </div>
          )}
          {isPremium && vendorLogo && (
            <div className="mkt-cocote-vendor-logo-overlay">
              <img src={sanitizeUrl(vendorLogo as string) ?? undefined} alt={product.vendor?.companyName} />
            </div>
          )}
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
            {formattedDistance} km
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
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tags.slice(0, 3).map((t: string) => {
              let bg = '#F8FAFC', color = '#64748B', border = '#E2E8F0';
              if (t.includes('Éco-responsable') || t.toLowerCase().includes('bio')) {
                bg = '#F0FDF4'; color = '#166534'; border = '#DCFCE7';
              } else if (t.includes('Tunisien')) {
                bg = '#FEF2F2'; color = '#991B1B'; border = '#FEE2E2';
              }
              return (
                <span key={t} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', background: bg, color: color, padding: '2px 6px', borderRadius: 4, border: `1px solid ${border}` }}>
                  {t}
                </span>
              );
            })}
          </div>
        )}

        <Stars avg={avg} total={total} size={11} />
        
        {isPremium && (
          <div className="relative">
            <div 
              className="mkt-cocote-availability-badge cursor-pointer hover:bg-slate-200 transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowBranches(!showBranches); }}
            >
              <MapPin size={8} /> {isMultiFranchise ? `${branches.length} points de vente` : 'Disponible à'} <span className="mkt-cocote-availability-tag">{locationNames.slice(0, 2).join(', ')}{locationNames.length > 2 ? '...' : ''}</span>
            </div>

            {showBranches && branches.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-bottom pb-2">Nos établissements</div>
                <div className="flex flex-col gap-3">
                  {branches.map((b: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <MapPin size={10} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-slate-900">{b.name}</div>
                        <div className="text-[10px] text-slate-500">{b.city}, {b.governorate}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r border-b border-slate-100 rotate-45"></div>
              </div>
            )}
          </div>
        )}
        
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
  'matieres-premieres': '/images/elkassa-placeholder.png',
  'produits-semi-finis': '/images/elkassa-placeholder.png',
  'produits-finis-b2b-revente': '/images/elkassa-placeholder.png',
  'equipements-materiel': '/images/elkassa-placeholder.png',
  'emballages': '/images/elkassa-placeholder.png',
  'hygiene-nettoyage': '/images/elkassa-placeholder.png',
  'services': '/images/elkassa-placeholder.png',
};

const getCategoryImage = (cat: any) => {
  if (cat.image) return cat.image;
  return CATEGORY_IMAGES[cat.slug] || '/images/elkassa-placeholder.png';
};

export default function CategoryViewClient({ category, products = [], allCategories = [], allProducts = [], banners = [], isVendor = false }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const { addToCart } = useCart();
  
  // Filters State
  const currentRadius = parseInt(searchParams.get('radius') || '500');
  const currentLocation = searchParams.get('loc') || 'Tunis';
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('relevant');
  const [filterEco, setFilterEco] = useState(false);
  const [filterTunisian, setFilterTunisian] = useState(false);

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
    if (filterEco) {
      list = list.filter((p: any) => p.tags && p.tags.includes('🌱 Éco-responsable'));
    }
    if (filterTunisian) {
      list = list.filter((p: any) => p.tags && p.tags.includes('🇹🇳 Produit Tunisien'));
    }
    if (sortOrder === 'price_asc') list.sort((a: any, b: any) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    if (sortOrder === 'price_desc') list.sort((a: any, b: any) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    return list;
  }, [products, search, selectedBrands, sortOrder, filterEco, filterTunisian]);

  const featuredProducts = useMemo(() => products.filter((p: any) => p.isFeatured).slice(0, 4), [products]);
  const flashSales = useMemo(() => products.filter((p: any) => p.isFlashSale).slice(0, 4), [products]);
  const bestPrices = useMemo(() => [...products].sort((a,b) => (a.discountPrice || a.price) - (b.discountPrice || b.price)).slice(0, 4), [products]);
  const suggestions = useMemo(() => allProducts.filter((p: any) => p.isFeatured).slice(0, 8), [allProducts]);
  
  const sidebarAds = useMemo(() => {
    const specific = banners.filter((b: any) => b.position === 'SIDEBAR_1' || b.position === 'SIDEBAR_2').slice(0, 2);
    if (specific.length > 0) return specific;
    return banners.filter((b: any) => b.position?.startsWith('ADS_')).slice(0, 1);
  }, [banners]);

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
            
            <div className="mkt-cocote-filter-block" style={{ marginBottom: 48 }}>
              <h3 className="mkt-cocote-filter-title" style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Catégories</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }} className="mkt-custom-scrollbar">
                 <Link href="/marketplace" style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', fontWeight: 600, padding: '8px 0' }} className="hover:text-indigo-600">← Toutes les catégories</Link>
                 {parentCategory ? (
                   <>
                      <Link href={`/marketplace/category/${parentCategory.slug || parentCategory.id}`} style={{ fontSize: 15, color: '#111827', textDecoration: 'none', fontWeight: 800, marginTop: 12, marginBottom: 8 }}>{parentCategory.name}</Link>
                      {(parentCategory.children || []).map((sub: any) => (
                        <Link 
                          key={sub.id} 
                          href={`/marketplace/category/${sub.slug || sub.id}`}
                          style={{ 
                            fontSize: 14, 
                            color: sub.id === category.id ? '#111827' : '#64748B', 
                            textDecoration: 'none', 
                            fontWeight: sub.id === category.id ? 800 : 500,
                            padding: '6px 12px',
                            borderRadius: 4,
                            background: sub.id === category.id ? '#F8FAFC' : 'transparent',
                            borderLeft: sub.id === category.id ? `3px solid #111827` : '3px solid transparent'
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                   </>
                 ) : (
                   <>
                      <span style={{ fontSize: 15, color: '#111827', textDecoration: 'none', fontWeight: 800, marginTop: 12, marginBottom: 8 }}>{category.name}</span>
                      {(category.children || []).map((sub: any) => (
                        <Link 
                          key={sub.id} 
                          href={`/marketplace/category/${sub.slug || sub.id}`}
                          style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', fontWeight: 500, padding: '6px 12px', borderRadius: 4 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                   </>
                 )}
              </div>
            </div>

            <div className="mkt-cocote-filter-block" style={{ marginBottom: 48, padding: '32px 0', borderTop: '1px solid #F1F5F9' }}>
              <h3 className="mkt-cocote-filter-title" style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Distance (km)</h3>
              <div className="mkt-cocote-radius-slider">
                 <input type="range" min="5" max="500" step="5" defaultValue={currentRadius} onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('radius', e.target.value);
                    router.push(`/marketplace/category/${category.id}?${params.toString()}`);
                 }} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                 <div className="flex justify-between mt-4">
                    <span className="text-[10px] font-black text-slate-400">5KM</span>
                    <span className="text-[11px] font-black text-indigo-600">{currentRadius}KM</span>
                    <span className="text-[10px] font-black text-slate-400">500KM</span>
                 </div>
              </div>
            </div>

            <div className="mkt-cocote-filter-block" style={{ marginBottom: 48, padding: '32px 0', borderTop: '1px solid #F1F5F9' }}>
               <h3 className="mkt-cocote-filter-title" style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Labels</h3>
               <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filterEco ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200 group-hover:border-emerald-400'}`}>
                      <input type="checkbox" className="hidden" checked={filterEco} onChange={e => setFilterEco(e.target.checked)} />
                      {filterEco && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-bold text-slate-600">🌱 Éco-responsable</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${filterTunisian ? 'border-red-500 bg-red-500' : 'border-slate-200 group-hover:border-red-400'}`}>
                      <input type="checkbox" className="hidden" checked={filterTunisian} onChange={e => setFilterTunisian(e.target.checked)} />
                      {filterTunisian && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-bold text-slate-600">🇹🇳 Produit Tunisien</span>
                  </label>
               </div>
            </div>

            {sidebarAds.length > 0 && (
              <div className="mkt-cocote-sidebar-ads" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: 48 }}>
                {sidebarAds.map((ad: any) => (
                  <a key={ad.id} href={ad.buttonLink || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', position: 'relative', aspectRatio: '4/5' }} className="group shadow-sm hover:shadow-md transition-shadow">
                    <img src={ad.imageUrl ? (sanitizeUrl(ad.imageUrl) || '') : ''} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="group-hover:scale-105" />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 100%)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      {ad.badgeText && <span style={{ background: ad.bgColor || '#6366F1', color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', width: 'fit-content', marginBottom: '8px' }}>{ad.badgeText}</span>}
                      <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>{ad.title}</h3>
                      {ad.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginBottom: '12px' }}>{ad.subtitle}</p>}
                      {ad.buttonText && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'underline' }}>{ad.buttonText}</span>}
                    </div>
                  </a>
                ))}
              </div>
            )}
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

          </div>
        </div>
      </div>

      {/* ── RECOMMANDATIONS (FULL PAGE) ── */}
      <section style={{ backgroundColor: '#F8FAFC', padding: '80px 0', borderTop: '1px solid #E2E8F0', marginTop: 80 }}>
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">D'autres univers pour vous</h2>
            <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">Découvrez les meilleures sélections Food & Drink par métier.</p>
          </div>
          <div className="mkt-cocote-category-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {allCategories.filter((c: any) => c.id !== category.id).slice(0, 8).map((univ: any) => (
              <Link 
                key={univ.id} 
                href={`/marketplace/category/${univ.slug || univ.id}`}
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
        </div>
      </section>

      <MarketplaceFooter />
    </div>
  );
}
