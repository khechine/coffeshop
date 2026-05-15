'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar, User, ArrowLeft } from 'lucide-react';

export default function BlogListingClient({ initialPosts }: { initialPosts: any[] }) {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/marketplace" style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Retour
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0 }}>Perspectives Commerciales</h1>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '48px auto', padding: '0 24px' }}>
        
        {/* Title Section */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#111827', marginBottom: '16px' }}>Blog & Analyses</h2>
          <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '700px', lineHeight: 1.6 }}>
            Découvrez les dernières tendances du marché B2B en Tunisie, des conseils d'approvisionnement et des analyses d'experts pour développer votre commerce.
          </p>
        </div>

        {initialPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: '24px', border: '1px solid #E5E7EB' }}>
            <p style={{ color: '#9CA3AF', fontSize: '18px', fontWeight: 600 }}>Bientôt de nouveaux articles...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
            {initialPosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/marketplace/blog/${post.slug}`}
                style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E5E7EB', textDecoration: 'none', transition: 'transform 0.3s, box-shadow 0.3s', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: '240px', overflow: 'hidden' }}>
                  <img src={post.coverImage || '/images/elkassa-logo.png'} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ background: '#FFF1F2', color: '#E31E24', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>
                      {post.category}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '12px', lineHeight: 1.4 }}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px', flex: 1 }}>
                    {post.excerpt || post.content.substring(0, 120) + '...'}
                  </p>
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '13px', fontWeight: 600 }}>
                      <Calendar size={14} />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E31E24', fontWeight: 800, fontSize: '14px' }}>
                      Lire la suite <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
