'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Grid, LayoutGrid } from 'lucide-react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { sanitizeUrl } from '../../lib/imageUtils';

export default function CategoriesListClient({ categories, user }: any) {
  const isVendor = user?.role === 'VENDOR';

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader isVendor={isVendor} />

      <main className="categories-main" style={{ maxWidth: '1200px', margin: '48px auto', padding: '0 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Annuaire des Catégories</h1>
          <p style={{ fontSize: '16px', color: '#6B7280' }}>Explorez tout le catalogue professionnel par segment et sous-segment.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }} className="categories-list-container">
          {categories.map((cat: any) => {
            const children = cat.children || [];
            const grouped: Record<string, any[]> = {};
            
            children.forEach((child: any) => {
              const group = child.groupTitle || 'Général';
              if (!grouped[group]) grouped[group] = [];
              grouped[group].push(child);
            });

            return (
              <section key={cat.id}>
                <div className="category-header-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div className="cat-icon-box" style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '16px', 
                    background: cat.color || '#E31E24', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '28px',
                    boxShadow: `0 8px 16px ${cat.color ? cat.color + '33' : '#E31E2433'}`,
                    flexShrink: 0
                  }}>
                    {cat.icon || <Grid size={28} />}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>{cat.name}</h2>
                    <Link href={`/marketplace/category/${cat.slug || cat.id}`} style={{ fontSize: '15px', color: cat.color || '#E31E24', fontWeight: 700, textDecoration: 'none' }}>
                      Tout voir dans {cat.name} <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  {Object.entries(grouped).map(([groupName, groupChildren]) => (
                    <div key={groupName}>
                      {groupName !== 'Général' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            {groupName}
                          </h3>
                          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                        </div>
                      )}
                      
                      <div className="subcategories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {groupChildren.map((sub: any) => (
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
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }} 
                            className="category-card-premium"
                          >
                            <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#F1F5F9' }}>
                              <img 
                                src={sanitizeUrl(sub.image) || '/images/elkassa-logo.png'} 
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
                            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{sub.name}</span>
                              <div style={{ width: '32px', height: '32px', borderRadius: '12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="arrow-box">
                                <ChevronRight size={18} color="#94A3B8" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <MarketplaceFooter />

      <style jsx global>{`
        .category-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #111827;
        }
        
        .category-card-premium:hover .category-img {
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .categories-main {
            margin: 20px auto !important;
            padding: 0 16px !important;
          }
          .categories-main h1 {
            font-size: 24px !important;
          }
          .categories-main p {
            font-size: 14px !important;
          }
          .categories-list-container {
            gap: 40px !important;
          }
          .category-header-row {
            margin-bottom: 20px !important;
            gap: 12px !important;
          }
          .category-header-row .cat-icon-box {
            width: 44px !important;
            height: 44px !important;
            border-radius: 12px !important;
            font-size: 20px !important;
          }
          .category-header-row h2 {
            font-size: 20px !important;
          }
          .category-header-row a {
            font-size: 13px !important;
          }
          .subcategories-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .category-card-premium {
            border-radius: 16px !important;
          }
          .category-card-premium span {
            font-size: 13px !important;
          }
          .category-card-premium .arrow-box {
            width: 24px !important;
            height: 24px !important;
            border-radius: 8px !important;
          }
          .category-card-premium .arrow-box svg {
            width: 14px !important;
            height: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
