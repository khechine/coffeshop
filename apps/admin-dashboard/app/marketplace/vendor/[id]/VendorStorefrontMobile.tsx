'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, MessageSquare, Share2, 
  Heart, ChevronRight, ShieldCheck, Star, 
  MapPin, Building2, Package, Globe, Clock,
  ArrowUpRight, LayoutGrid
} from 'lucide-react';
import { sanitizeUrl } from '../../../lib/imageUtils';

export default function VendorStorefrontMobile({ vendor, products = [], isVendor = false }: any) {
  const [activeTab, setActiveTab] = useState('Home');
  const cust = vendor.customization || {};
  const logoUrl = sanitizeUrl(cust.logoUrl);
  const bannerUrl = sanitizeUrl(cust.bannerUrl) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600';
  const primaryColor = vendor.isPremium ? (cust.primaryColor || '#E31E24') : '#111827';

  return (
    <div style={{ background: '#F4F4F4', minHeight: '100vh', paddingBottom: '80px', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      
      {/* Mini Top Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#fff', borderBottom: '1px solid #eee', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/marketplace" style={{ color: '#333' }}><ArrowLeft size={24} /></Link>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Share2 size={22} color="#666" />
          <Search size={22} color="#666" />
        </div>
      </div>

      {/* Hero Banner with Logo Overlay */}
      <div style={{ position: 'relative', width: '100%', height: '180px' }}>
        <img src={bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
        <div style={{ position: 'absolute', bottom: '-40px', left: '16px', width: '80px', height: '80px', background: '#fff', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
           {logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={40} color="#E5E7EB" />}
        </div>
      </div>

      {/* Identity Section */}
      <div style={{ background: '#fff', paddingTop: '50px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '0 0 4px' }}>{vendor.companyName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666', fontWeight: 600 }}>
                 <MapPin size={12} /> {vendor.city || 'Tunisie'}
              </div>
           </div>
           <button style={{ background: primaryColor, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>
             Suivre
           </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>
             <ShieldCheck size={12} /> Diamond Member
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', color: '#E31E24', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>
             AUDITÉ
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
             <Star size={12} fill="#F59E0B" color="#F59E0B" /> 4.8 (250+)
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #eee', position: 'sticky', top: '45px', zIndex: 999 }}>
        {['Home', 'Products', 'Franchises', 'About'].map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              flex: 1, textAlign: 'center', padding: '12px 0', fontSize: '13px', fontWeight: activeTab === tab ? 800 : 600, 
              color: activeTab === tab ? primaryColor : '#666',
              position: 'relative'
            }}
          >
            {tab}
            {activeTab === tab && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '3px', background: primaryColor, borderRadius: '100px' }} />}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '16px' }}>
        {activeTab === 'Home' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ fontSize: '16px', fontWeight: 900 }}>Top Products</h3>
               <Link href="#" style={{ fontSize: '12px', fontWeight: 800, color: primaryColor }}>See All</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {products.slice(0, 4).map((p: any, i: number) => (
                <Link key={i} href={`/marketplace/product/${p.id}`} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1' }}>
                    <img src={sanitizeUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>{p.name}</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>{Number(p.price).toFixed(2)} DT</div>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: '24px', background: '#111827', borderRadius: '16px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: primaryColor, opacity: 0.3, borderRadius: '50%' }} />
               <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>Besoins de sur-mesure ?</h3>
               <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '16px' }}>Demandez un devis personnalisé pour vos volumes pro.</p>
               <button style={{ background: '#fff', color: '#111827', border: 'none', padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 800 }}>
                 Envoyer RFQ
               </button>
            </div>
          </>
        )}

        {activeTab === 'Products' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {products.map((p: any, i: number) => (
              <Link key={i} href={`/marketplace/product/${p.id}`} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none' }}>
                <div style={{ width: '100%', aspectRatio: '1/1' }}>
                  <img src={sanitizeUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>{p.name}</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>{Number(p.price).toFixed(2)} DT</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: '12px 16px', display: 'flex', gap: '12px', zIndex: 1001 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#666' }}>
          <MessageSquare size={22} />
          <span style={{ fontSize: '10px', fontWeight: 800 }}>Chat</span>
        </div>
        <button style={{ flex: 1, background: '#111827', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '14px' }}>
          Contact Supplier
        </button>
        <button style={{ flex: 1, background: primaryColor, color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '14px' }}>
          Send Inquiry
        </button>
      </div>

    </div>
  );
}
