'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Filter, ChevronRight, Star, ArrowRight, LayoutGrid, Plus,
  MapPin, Heart, Store, Navigation, Tag, Sparkles, Check, ChevronDown,
  Building2, Box, ShoppingBag, ChevronLeft, Play, Maximize2, MessageCircle
} from 'lucide-react';
import { useCart } from '../../CartContext';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import MarketplaceFooter from '../../components/MarketplaceFooter';
import MarketplaceProductCard from '../../components/MarketplaceProductCard';
import { sanitizeUrl } from '../../../lib/imageUtils';

import CategoryMobile from './CategoryMobile';
import '../../marketplace-responsive.css';

const fmt = (n: any) => Number(n).toFixed(2);


export default function CategoryViewClient({ category, products = [], allCategories = [], allProducts = [], banners = [], isVendor = false, store }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const subcategories = category.children || [];
  const hasChildren = subcategories.length > 0;

  const spotlightProducts = products.slice(0, 10);
  const relatedMainCategories = allCategories
    .filter((c: any) => c.id !== category.id && c.parentId === null)
    .slice(0, 2);

  const scrollSpotlight = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (isMobile) {
    return (
      <CategoryMobile 
        category={category} 
        products={products} 
        subcategories={subcategories} 
        isVendor={isVendor} 
      />
    );
  }

  return (
    <div className="mkt-page" style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader isVendor={isVendor} store={store} allCategories={allCategories} />

      <main className="mkt-main">
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280', marginBottom: '24px' }}>
          <Link href="/marketplace" style={{ color: '#6B7280', textDecoration: 'none' }}>Accueil</Link>
          <ChevronRight size={12} />
          <Link href="/marketplace/categories" style={{ color: '#6B7280', textDecoration: 'none' }}>Directory</Link>
          <ChevronRight size={12} />
          <span style={{ color: '#111827', fontWeight: 600 }}>{category.name}</span>
        </nav>

        {/* Category Hero Banner */}
        <div className="mkt-category-hero" style={{ background: category.color || '#111827' }}>
          {category.image && (
            <img 
              src={sanitizeUrl(category.image)} 
              alt={category.name} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} 
            />
          )}
          <div style={{ position: 'relative', zIndex: 10, color: '#fff', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {category.icon && <span style={{ fontSize: '32px', background: 'rgba(255,255,255,0.2)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>{category.icon}</span>}
              <h1 style={{ fontSize: '42px', fontWeight: 900, margin: 0, lineHeight: 1.1 }}>{category.name}</h1>
            </div>
            {category.description && <p style={{ fontSize: '16px', fontWeight: 500, opacity: 0.9 }}>{category.description}</p>}
          </div>
        </div>

        <div className="mkt-category-layout">
          
          {/* Sidebar with grouping */}
          <aside className="mkt-category-sidebar">
            <div style={{ padding: '24px', borderBottom: '1px solid #F3F4F6', background: category.color || '#111827', color: '#fff' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>{category.name}</h2>
            </div>
            <div style={{ padding: '12px 0' }}>
              {(() => {
                const grouped: Record<string, any[]> = {};
                subcategories.forEach((child: any) => {
                  const group = child.groupTitle || 'Autres';
                  if (!grouped[group]) grouped[group] = [];
                  grouped[group].push(child);
                });

                return Object.entries(grouped).map(([groupName, items]) => (
                  <div key={groupName} style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {groupName}
                    </div>
                    {items.map((sub: any) => (
                      <Link key={sub.id} href={`/marketplace/category/${sub.slug || sub.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', textDecoration: 'none', color: '#374151', transition: 'all 0.2s' }} className="hover-bg-slate-50">
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{sub.name}</span>
                        <ChevronRight size={14} color="#9CA3AF" />
                      </Link>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </aside>

          {/* Subcategory Grid with grouping */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {(() => {
              const grouped: Record<string, any[]> = {};
              subcategories.forEach((child: any) => {
                const group = child.groupTitle || 'Général';
                if (!grouped[group]) grouped[group] = [];
                grouped[group].push(child);
              });

              return Object.entries(grouped).map(([groupName, items]) => (
                <div key={groupName}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      {groupName}
                    </h3>
                    <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                  </div>

                  <div className="mkt-subcat-grid">
                    {items.map((sub: any) => (
                      <Link 
                        key={sub.id} 
                        href={`/marketplace/category/${sub.slug || sub.id}`} 
                        style={{ 
                          background: '#fff', 
                          borderRadius: '20px', 
                          overflow: 'hidden', 
                          border: '1px solid #E5E7EB', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          textDecoration: 'none', 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }} 
                        className="category-card-premium"
                      >
                        <div style={{ width: '100%', aspectRatio: '16/10', overflow: 'hidden', background: '#F1F5F9' }}>
                          <img 
                            src={sanitizeUrl(sub.image) || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400'} 
                            alt={sub.name} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              transition: 'transform 0.5s ease' 
                            }} 
                            className="category-img"
                          />
                        </div>
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{sub.name}</span>
                          <div style={{ width: '32px', height: '32px', borderRadius: '12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight size={18} color="#94A3B8" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ── Product Spotlight (Leaf or Main) ── */}
        <section style={{ marginBottom: '48px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: 0 }}>Spotlight de Produits</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => scrollSpotlight('left')} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
                <button onClick={() => scrollSpotlight('right')} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={20} /></button>
              </div>
           </div>
           <div ref={scrollRef} className="mkt-spotlight-track">
              {products.map((p: any) => (
                <div key={p.id} className="mkt-spotlight-item">
                  <MarketplaceProductCard 
                    product={p} 
                    isVendor={isVendor} 
                    hidePrice={isVendor}
                  />
                </div>
              ))}
           </div>
        </section>

        {/* ── Related Categories ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {relatedMainCategories.map((rel: any) => (
            <div key={rel.id} className="mkt-related-row">
              <div className="mkt-related-sidebar">
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: rel.color || '#111827', marginBottom: '24px' }}>Plus de {rel.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(rel.children || []).slice(0, 8).map((child: any) => (
                    <Link key={child.id} href={`/marketplace/category/${child.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', textDecoration: 'none', fontWeight: 600 }} className="hover-accent" data-color={rel.color}>{child.name}<ChevronRight size={12} /></Link>
                  ))}
                </div>
              </div>
              <div className="mkt-related-grid">
                {(rel.children || []).slice(0, 8).map((child: any) => (
                  <Link key={child.id} href={`/marketplace/category/${child.id}`} style={{ background: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', textDecoration: 'none' }} className="hover-shadow-inner category-card-premium">
                    <div style={{ minHeight: '48px', position: 'relative', zIndex: 10 }}><span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>{child.name}</span></div>
                    <div style={{ width: '100%', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px' }}>
                      <img src={sanitizeUrl(child.image) || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400'} alt={child.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="category-img" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </main>

      <MarketplaceFooter />
      
      <style jsx global>{`
        .hover-bg-slate-50:hover { background-color: #F8FAFC; }
        .hover-shadow-inner:hover { box-shadow: inset 0 0 0 1px #111827; z-index: 10; }
        .hover-shadow-premium:hover { box-shadow: 0 12px 24px rgba(0,0,0,0.1); transform: translateY(-4px); border-color: #D1D5DB; }
        .hover-accent:hover { color: var(--hover-color, #E31E24) !important; }
        
        .category-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #111827;
        }
        
        .category-card-premium:hover .category-img {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
