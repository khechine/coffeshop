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

const fmt = (n: any) => Number(n).toFixed(2);


export default function CategoryViewClient({ category, products = [], allCategories = [], allProducts = [], banners = [], isVendor = false }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader isVendor={isVendor} categories={allCategories} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280', marginBottom: '24px' }}>
          <Link href="/marketplace" style={{ color: '#6B7280', textDecoration: 'none' }}>Accueil</Link>
          <ChevronRight size={12} />
          <Link href="/marketplace/categories" style={{ color: '#6B7280', textDecoration: 'none' }}>Directory</Link>
          <ChevronRight size={12} />
          <span style={{ color: '#111827', fontWeight: 600 }}>{category.name}</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', marginBottom: '48px' }}>
          
          {/* Sidebar */}
          <aside style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB', height: 'fit-content' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #F3F4F6' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: category.color || '#111827', margin: 0 }}>{category.name}</h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              {subcategories.map((sub: any) => (
                <Link key={sub.id} href={`/marketplace/category/${sub.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', textDecoration: 'none', color: '#374151' }} className="hover-bg-slate-50">
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{sub.name}</span>
                  <ChevronRight size={14} color="#9CA3AF" />
                </Link>
              ))}
            </div>
          </aside>

          {/* Subcategory Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
            {subcategories.map((sub: any) => (
              <Link key={sub.id} href={`/marketplace/category/${sub.id}`} style={{ background: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', textDecoration: 'none' }} className="hover-shadow-inner">
                <div style={{ minHeight: '64px' }}><span style={{ fontSize: '15px', fontWeight: 600, color: '#374151' }}>{sub.name}</span></div>
                <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={sanitizeUrl(sub.image) || ''} alt={sub.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              </Link>
            ))}
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
           <div ref={scrollRef} style={{ display: 'flex', gap: '20px', overflowX: 'hidden', scrollBehavior: 'smooth', padding: '4px' }}>
              {products.map((p: any) => (
                <div key={p.id} style={{ flex: '0 0 calc(25% - 15px)' }}>
                  <MarketplaceProductCard product={p} isVendor={isVendor} />
                </div>
              ))}
           </div>
        </section>

        {/* ── Related Categories ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {relatedMainCategories.map((rel: any) => (
            <div key={rel.id} style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', border: '1px solid #E5E7EB', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '32px 24px', borderRight: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: rel.color || '#111827', marginBottom: '24px' }}>Plus de {rel.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(rel.children || []).slice(0, 8).map((child: any) => (
                    <Link key={child.id} href={`/marketplace/category/${child.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', textDecoration: 'none', fontWeight: 600 }} className="hover-accent" data-color={rel.color}>{child.name}<ChevronRight size={12} /></Link>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#F3F4F6' }}>
                {(rel.children || []).slice(0, 8).map((child: any) => (
                  <Link key={child.id} href={`/marketplace/category/${child.id}`} style={{ background: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', textDecoration: 'none' }} className="hover-shadow-inner">
                    <div style={{ minHeight: '48px' }}><span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>{child.name}</span></div>
                    <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={sanitizeUrl(child.image) || ''} alt={child.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
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
      `}</style>
    </div>
  );
}
