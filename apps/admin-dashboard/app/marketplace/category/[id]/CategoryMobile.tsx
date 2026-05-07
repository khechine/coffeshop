'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Filter, ChevronRight, 
  LayoutGrid, Star, Building2, MapPin
} from 'lucide-react';
import { sanitizeUrl } from '../../../lib/imageUtils';
import MarketplaceProductCard from '../../components/MarketplaceProductCard';

export default function CategoryMobile({ category, products = [], subcategories = [], isVendor = false }: any) {
  return (
    <div style={{ background: '#F4F4F4', minHeight: '100vh', paddingBottom: '80px', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ background: '#fff', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <Link href="/marketplace" style={{ color: '#333' }}><ArrowLeft size={24} /></Link>
          <div style={{ flex: 1, fontSize: '18px', fontWeight: 900, color: '#111827' }}>{category.name}</div>
          <Filter size={24} color="#666" />
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder={`Search in ${category.name}`} 
            style={{ width: '100%', padding: '10px 40px', borderRadius: '100px', border: '1px solid #ddd', background: '#F9FAFB', fontSize: '14px', outline: 'none' }} 
          />
        </div>
      </header>

      {/* Subcategory Chips */}
      <div style={{ background: '#fff', padding: '12px', borderBottom: '1px solid #eee', overflowX: 'auto', display: 'flex', gap: '8px' }} className="no-scrollbar">
        {subcategories.map((sub: any) => (
          <Link 
            key={sub.id} 
            href={`/marketplace/category/${sub.id}`}
            style={{ padding: '6px 16px', background: '#F3F4F6', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#4B5563', whiteSpace: 'nowrap', textDecoration: 'none' }}
          >
            {sub.name}
          </Link>
        ))}
      </div>

      {/* Product List */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#666' }}>{products.length} Products Found</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: '#111827' }}>
            Sort by: Relevance <ChevronRight size={14} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {products.map((p: any) => (
            <MarketplaceProductCard 
              key={p.id} 
              product={p} 
              isVendor={isVendor} 
              hidePrice={isVendor}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
