'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Search, LayoutGrid, Star, MapPin, 
  Phone, Mail, Calendar, ChevronRight, Package, Info
} from 'lucide-react';
import '../../../../marketplace/marketplace.css';

const fmt = (n: any) => Number(n).toFixed(3);

export default function VendorStorefrontClient({ vendor, ratings }: any) {
  const [search, setSearch] = useState('');
  
  const cust = vendor.customization || {};
  const isPremium = vendor.isPremium || !!cust.id;

  const products = vendor.vendorProducts.map((vp: any) => ({
    id: vp.id,
    name: vp.name || vp.productStandard?.name,
    price: vp.price,
    unit: vp.unit || vp.productStandard?.unit,
    image: vp.image || vp.productStandard?.image,
    categoryId: vp.categoryId || vp.productStandard?.categoryId
  })).filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  // Theme colors
  const primaryColor = isPremium ? (cust.primaryColor || '#1E1B4B') : '#1E1B4B';
  const bannerUrl = isPremium ? (cust.bannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600') : null;
  const logoUrl = isPremium ? (cust.logoUrl || null) : null;

  return (
    <div className="mkt-page">
      {/* Header */}
      <header className="mkt-header">
        <div className="mkt-header-inner">
          <Link href="/marketplace" className="mkt-logo" style={{ textDecoration: 'none' }}>
            <div className="mkt-logo-icon" style={{ background: primaryColor }}><ShoppingBag size={22} /></div>
            Coffee<span>Market</span>
          </Link>

          <div className="mkt-search-wrap">
            <Search className="mkt-search-icon" size={18} />
            <input
              className="mkt-search"
              placeholder={`Rechercher chez ${vendor.companyName}...`}
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

      {/* Hero Banner / Store Header */}
      <div style={{ position: 'relative', marginBottom: 48 }}>
        {bannerUrl ? (
          <div style={{ height: 320, width: '100%', overflow: 'hidden' }}>
             <img src={bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Banner" />
             <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
          </div>
        ) : (
          <div style={{ height: 200, background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)', borderBottom: '1px solid #E2E8F0' }} />
        )}

        <div className="mkt-container" style={{ marginTop: bannerUrl ? -80 : 32, position: 'relative', zIndex: 10 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: 32 }}>
            
            {/* Logo */}
            <div style={{ 
              width: 120, height: 120, borderRadius: 24, background: '#F8FAFC', 
              border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
              overflow: 'hidden', flexShrink: 0
            }}>
              {logoUrl ? <img src={logoUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '🏪'}
            </div>

            {/* Vendor Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: 32, fontWeight: 950, color: '#1E1B4B', margin: 0 }}>{vendor.companyName}</h1>
                {isPremium && <span style={{ background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', color: '#78350F', padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>PRO ⭐</span>}
              </div>
              
              <div style={{ display: 'flex', gap: 16, color: '#64748B', fontSize: 14, fontWeight: 600, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} /> {vendor.city || 'Tunis'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={16} /> {vendor.phone || 'Non renseigné'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={16} fill="#F59E0B" color="#F59E0B" /> {ratings.overallAvg.toFixed(1)} ({ratings.totalReviews} avis)</span>
              </div>

              {cust.welcomeMessage && (
                <p style={{ marginTop: 16, color: '#475569', lineHeight: 1.6, maxWidth: 600 }}>{cust.welcomeMessage}</p>
              )}
            </div>

            {/* Contact / Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <button style={{ padding: '14px 28px', background: primaryColor, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, cursor: 'pointer' }}>
                  Suivre le vendeur
               </button>
               <button className="mkt-header-btn" style={{ justifyContent: 'center' }}>
                  Contacter
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mkt-container">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 32, borderBottom: '2px solid #F1F5F9' }}>
           <button style={{ padding: '16px 8px', border: 'none', background: 'none', borderBottom: `3px solid ${primaryColor}`, color: '#1E1B4B', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>
              Tous les produits ({products.length})
           </button>
           <button style={{ padding: '16px 8px', border: 'none', background: 'none', borderBottom: '3px solid transparent', color: '#94A3B8', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Avis Clients
           </button>
           <button style={{ padding: '16px 8px', border: 'none', background: 'none', borderBottom: '3px solid transparent', color: '#94A3B8', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Infos & Contact
           </button>
        </div>

        {/* Products Grid */}
        <div className="mkt-grid">
          {products.map((p: any) => (
            <div key={p.id} className="mkt-card">
              <div className="mkt-card-img">
                <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} alt={p.name} />
              </div>
              <div className="mkt-card-body">
                <div className="mkt-card-name">{p.name}</div>
                <div className="mkt-card-price">{fmt(p.price)} <span className="mkt-card-unit">DT/{p.unit}</span></div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
              <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontWeight: 700 }}>Aucun produit ne correspond à votre recherche chez ce vendeur.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
