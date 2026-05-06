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

      <main style={{ maxWidth: '1200px', margin: '48px auto', padding: '0 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Annuaire des Catégories</h1>
          <p style={{ fontSize: '16px', color: '#6B7280' }}>Explorez tout le catalogue professionnel par segment et sous-segment.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          {categories.map((cat: any) => (
            <section key={cat.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: cat.color || '#E31E24', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '24px'
                }}>
                  {cat.icon || <Grid size={24} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0 }}>{cat.name}</h2>
                  <Link href={`/marketplace/category/${cat.id}`} style={{ fontSize: '14px', color: cat.color || '#E31E24', fontWeight: 700, textDecoration: 'none' }}>
                    Voir tout {cat.name} <ChevronRight size={14} style={{ display: 'inline' }} />
                  </Link>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                {(cat.children || []).map((sub: any) => (
                  <Link 
                    key={sub.id} 
                    href={`/marketplace/category/${sub.id}`} 
                    style={{ 
                      background: '#fff', 
                      borderRadius: '16px', 
                      overflow: 'hidden', 
                      border: '1px solid #E5E7EB', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      textDecoration: 'none', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{sub.name}</span>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={14} color="#94A3B8" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
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
      `}</style>
    </div>
  );
}
