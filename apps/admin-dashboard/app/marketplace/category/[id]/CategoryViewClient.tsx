'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShoppingCart, Search, Filter, 
  ChevronRight, Star, ShoppingBag, LayoutGrid 
} from 'lucide-react';
import '../../../../marketplace/marketplace.css';

const fmt = (n: any) => Number(n).toFixed(3);

export default function CategoryViewClient({ category, products, allCategories }: any) {
  const [search, setSearch] = useState('');
  
  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor?.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mkt-page">
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
              placeholder={`Rechercher dans ${category.name}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="mkt-header-actions">
            <Link href="/" className="mkt-header-btn" style={{ textDecoration: 'none' }}>
              <LayoutGrid size={16} /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mkt-container">
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
          <Link href="/marketplace" style={{ color: '#94A3B8', textDecoration: 'none' }}>Marketplace</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#1E1B4B' }}>{category.name}</span>
        </div>

        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', 
          borderRadius: 32, 
          padding: '64px 48px', 
          marginBottom: 48,
          position: 'relative',
          overflow: 'hidden',
          color: '#fff'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{category.icon || '📦'}</div>
            <h1 style={{ fontSize: 44, fontWeight: 950, margin: 0, marginBottom: 12 }}>{category.name}</h1>
            <p style={{ fontSize: 18, opacity: 0.8, maxWidth: 600, margin: 0 }}>
              {category.description || `Découvrez notre sélection de produits de qualité pour la catégorie ${category.name}.`}
            </p>
          </div>
          <div style={{ 
            position: 'absolute', 
            right: -50, 
            bottom: -50, 
            fontSize: 240, 
            opacity: 0.05, 
            pointerEvents: 'none' 
          }}>
            {category.icon || '📦'}
          </div>
        </div>

        {/* Filters & Results */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, borderBottom: '2px solid #F1F5F9', paddingBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1E1B4B', margin: 0 }}>{filteredProducts.length} Produits trouvés</h2>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="mkt-header-btn"><Filter size={16} /> Trier par</button>
          </div>
        </div>

        <div className="mkt-grid">
          {filteredProducts.map((p: any) => (
            <div key={p.id} className="mkt-card">
              <Link href={`/marketplace/product/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="mkt-card-img">
                  <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} alt={p.name} />
                </div>
              </Link>
              <div className="mkt-card-body">
                <Link href={`/marketplace/vendor/${p.vendor?.id}`} style={{ textDecoration: 'none' }} className="mkt-card-vendor">
                  {p.vendor?.companyName}
                </Link>
                <div className="mkt-card-name">{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                   <div className="mkt-card-price">{fmt(p.price)} <span className="mkt-card-unit">DT/{p.unit}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
