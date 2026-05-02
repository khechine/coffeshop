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
  const distance = Math.floor(Math.random() * 15) + 1; // Mock distance

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

export default function CategoryViewClient({ category, products, allCategories, isVendor = false }: any) {
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

  const catColor = getCategoryColor(category.name);

  const parentCategory = allCategories.find((c: any) => c.subcategories?.some((s: any) => s.id === category.id));
  const displayCategory = category;

  return (
    <div className="mkt-page cocote-theme">
      <MarketplaceHeader isVendor={isVendor} />

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
                  {(parentCategory.subcategories || []).map((sub: any) => (
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
                  {(category.subcategories || []).map((sub: any) => (
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
          
          <div className="mkt-cocote-category-header" style={{ borderLeftColor: catColor }}>
             <div className="mkt-cocote-category-title-wrap">
               <div className="mkt-cocote-category-icon-large" style={{ color: catColor, background: `${catColor}15` }}>{category.icon || '📦'}</div>
               <div>
                 <h1 className="text-3xl font-black text-slate-900 m-0">{category.name}</h1>
                 <p className="text-slate-500 mt-2">{filteredProducts.length} produits trouvés à proximité de {currentLocation}</p>
               </div>
             </div>
          </div>

          <div className="mkt-cocote-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
             <div className="text-sm font-bold text-slate-700">{filteredProducts.length} offres locales</div>
             <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">Trier par :</span>
                <select className="mkt-cocote-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                   <option value="relevant">Pertinence & Proximité</option>
                   <option value="price_asc">Prix croissant</option>
                   <option value="price_desc">Prix décroissant</option>
                </select>
             </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mkt-cocote-grid">
              {filteredProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} isVendor={isVendor} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 24, border: '1px solid #F1F5F9' }}>
               <Search size={48} style={{ color: '#CBD5E1', margin: '0 auto 16px' }} />
               <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun produit trouvé</h3>
               <p className="text-slate-500">Élargissez votre rayon de recherche ou modifiez vos filtres.</p>
               <button onClick={() => { setSelectedBrands([]); router.push(`/marketplace/category/${category.id}`); }} className="mt-6 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors">Réinitialiser les filtres</button>
            </div>
          )}

        </div>
      </div>
      
      <MarketplaceFooter />
    </div>
  );
}
