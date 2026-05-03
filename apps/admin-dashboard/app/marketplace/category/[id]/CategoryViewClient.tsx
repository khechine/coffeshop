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

      {/* Top Location Bar (Breadcrumbs & Filter preview) */}
      <div className="mkt-cocote-topbar" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div className="mkt-container mkt-cocote-topbar-inner">
          <div className="mkt-cocote-breadcrumbs" style={{ color: '#64748B' }}>
             <Link href="/marketplace">Accueil</Link> 
             <ChevronRight size={12} /> 
             {parentCategory ? (
               <>
                 <Link href={`/marketplace/category/${parentCategory.id}`}>{parentCategory.name}</Link>
                 <ChevronRight size={12} />
               </>
             ) : null}
             <span style={{ color: catColor, fontWeight: 800 }}>{displayCategory.name}</span>
          </div>
        </div>
      </div>

      <div className="mkt-container" style={{ marginTop: 32, display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        
        {/* ── SIDEBAR FILTERS ── */}
        <aside className="mkt-cocote-sidebar">
          <div className="mkt-cocote-filter-block">
            <h3 className="mkt-cocote-filter-title">Catégories</h3>
            <ul className="mkt-cocote-filter-list">
              <li><Link href="/marketplace" className="text-slate-500 hover:text-indigo-600">Toutes les catégories</Link></li>
              {parentCategory ? (
                <>
                   <li><Link href={`/marketplace/category/${parentCategory.id}`} className="text-slate-500 hover:text-indigo-600 font-bold">{parentCategory.name}</Link></li>
                   {(parentCategory.children || []).map((sub: any) => (
                     <li key={sub.id} style={{ paddingLeft: 16 }}>
                        {sub.id === category.id ? (
                          <span className="font-bold" style={{ color: catColor }}>→ {sub.name}</span>
                        ) : (
                          <Link href={`/marketplace/category/${sub.id}`} className="text-slate-500 hover:text-indigo-600 text-sm">→ {sub.name}</Link>
                        )}
                     </li>
                   ))}
                </>
              ) : (
                <>
                   <li><span className="font-bold" style={{ color: catColor }}>{category.name}</span></li>
                   {(category.children || []).map((sub: any) => (
                     <li key={sub.id} style={{ paddingLeft: 16 }}>
                        <Link href={`/marketplace/category/${sub.id}`} className="text-slate-500 hover:text-indigo-600 text-sm">→ {sub.name}</Link>
                     </li>
                   ))}
                </>
              )}
            </ul>
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
                  <span>5</span><span>50</span><span>100</span>
               </div>
            </div>
          </div>

          {brands.length > 0 && (
            <div className="mkt-cocote-filter-block">
              <h3 className="mkt-cocote-filter-title">Marques</h3>
              <div className="mkt-cocote-filter-checkboxes">
                {brands.map((b: string) => (
                  <label key={b} className="mkt-cocote-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={selectedBrands.includes(b)} 
                      onChange={() => toggleBrand(b)}
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mkt-cocote-filter-block">
             <h3 className="mkt-cocote-filter-title">Labels & Mentions</h3>
             <div className="mkt-cocote-filter-checkboxes">
                <label className="mkt-cocote-checkbox-label"><input type="checkbox" /> <span className="flex items-center gap-2"><Tag size={12} color="#10B981" /> Éco-responsable</span></label>
                <label className="mkt-cocote-checkbox-label"><input type="checkbox" /> <span className="flex items-center gap-2"><Tag size={12} color="#F59E0B" /> Produit Tunisien (619)</span></label>
                <label className="mkt-cocote-checkbox-label"><input type="checkbox" /> <span className="flex items-center gap-2"><Tag size={12} color="#6366F1" /> Artisanat Local</span></label>
             </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="mkt-cocote-content" style={{ flex: 1 }}>
          
          {/* ── NEW PREMIUM HERO (SOBER & PROFESSIONAL) ── */}
          <div className="mkt-category-hero-premium" style={{ 
            backgroundImage: `url(${getCategoryImage(category)})`,
          }}>
            <div className="mkt-category-hero-overlay" />
            <div className="mkt-category-hero-content">
              <h1 className="text-white">{category.name}</h1>
              <p className="text-white">Achetez en gros auprès des meilleurs fournisseurs locaux et nationaux.</p>
              <div className="flex justify-center gap-4 mt-8">
                 <button className="mkt-cocote-btn-primary" style={{ background: '#fff', color: '#111827' }}>Acheter {category.name}</button>
                 <button className="px-6 py-3 border border-white text-white font-bold rounded-[4px] hover:bg-white hover:text-black transition-all">En savoir plus</button>
              </div>
            </div>
          </div>

          {/* ── ZONE 1: SÉLECTIONS CURÉES (Algorithme de mise en avant) ── */}
          {products.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 64, marginBottom: 64 }}>
              
              {/* Vendeurs & Produits Vedettes */}
              {featuredProducts.length > 0 && (
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Sélection Premium</h2>
                    <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">Top Vendeurs</span>
                  </div>
                  <div className="mkt-cocote-grid">
                    {featuredProducts.map((p: any) => <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />)}
                  </div>
                </section>
              )}

              {/* Meilleurs Prix B2B */}
              {bestPrices.length > 0 && (
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Meilleurs Prix B2B</h2>
                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">Économies directes</span>
                  </div>
                  <div className="mkt-cocote-grid">
                    {bestPrices.map((p: any) => <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />)}
                  </div>
                </section>
              )}

              {/* Ventes Flash / Déstockage */}
              {flashSales.length > 0 && (
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Offres à Saisir</h2>
                    <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-3 py-1 rounded-full">Flash Sale</span>
                  </div>
                  <div className="mkt-cocote-grid">
                    {flashSales.map((p: any) => <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />)}
                  </div>
                </section>
              )}
            </div>
          )}


          <div className="mkt-cocote-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '24px', background: '#fff', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
             <div className="text-sm font-black text-slate-900 uppercase tracking-widest">{filteredProducts.length} offres disponibles</div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trier par :</span>
                  <select className="mkt-cocote-select" style={{ border: 'none', background: '#F8FAFC', fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="relevant">Pertinence</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
                </div>
             </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mkt-cocote-grid">
              {filteredProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />
              ))}
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 24, border: '1px solid #F1F5F9', marginBottom: 64 }}>
                 <Search size={48} style={{ color: '#CBD5E1', margin: '0 auto 16px' }} />
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun produit trouvé dans cette catégorie</h3>
                 <p className="text-slate-500">Mais ne repartez pas les mains vides ! Voici quelques suggestions pour vous :</p>
                 <button onClick={() => { setSelectedBrands([]); router.push(`/marketplace/category/${category.id}`); }} className="mt-6 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors">Réinitialiser les filtres</button>
              </div>

              {/* Suggestions Algorithmiques */}
              <section style={{ marginBottom: 64 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Recommandations Premium</h2>
                  <p className="text-slate-400 mt-2">Les produits les plus demandés en ce moment</p>
                </div>
                <div className="mkt-cocote-grid">
                  {suggestions.map((p: any) => <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />)}
                </div>
              </section>
            </div>
          )}

          {/* ── ZONE FINALE: EXPLOREZ LES UNIVERS (PRO STYLE) ── */}
          <section style={{ marginTop: 80, padding: '80px 0', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Découvrez d'autres catégories</h2>
              <p className="text-slate-500 mt-4 text-lg">Parcourez nos univers Food & Drink pour votre commerce.</p>
            </div>
            <div className="mkt-category-rayons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
              {allCategories.filter((c: any) => c.id !== category.id).slice(0, 8).map((univ: any) => (
                <Link 
                  key={univ.id} 
                  href={`/marketplace/category/${univ.id}`}
                  className="group flex flex-col gap-4 text-decoration-none"
                >
                  <div style={{ aspectRatio: '1.5', overflow: 'hidden', background: '#F3F4F6', borderRadius: 4 }}>
                    <img 
                      src={getCategoryImage(univ)} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 group-hover:underline">{univ.name}</span>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
      
      <MarketplaceFooter />
    </div>
  );
}
