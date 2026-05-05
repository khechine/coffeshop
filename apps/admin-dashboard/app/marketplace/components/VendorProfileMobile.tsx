'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, Search, MoreHorizontal, User, 
  MessageSquare, Send, Grid, Filter, MapPin, 
  ShieldCheck, Star, Info, Phone, Mail, ChevronRight
} from 'lucide-react';
import { sanitizeUrl } from '../../lib/imageUtils';

export default function VendorProfileMobile({ vendor, products }: any) {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <div style={{ background: '#F4F4F4', minHeight: '100vh', paddingBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Header with Search */}
      <div style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '12px' }}>
          <ChevronLeft size={24} onClick={() => window.history.back()} />
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#999' }} />
            <input 
              type="text" 
              placeholder={`Rechercher chez ${vendor.companyName}`} 
              style={{ width: '100%', padding: '8px 36px', borderRadius: '100px', border: '1px solid #ddd', background: '#F9FAFB', fontSize: '13px', outline: 'none' }} 
            />
          </div>
          <MoreHorizontal size={24} color="#666" />
        </div>

        {/* Vendor Banner/Info Card */}
        <div style={{ padding: '16px', background: 'linear-gradient(to bottom, #f8f9fa, #fff)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '60px', height: '60px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '4px' }}>
              <img src={sanitizeUrl(vendor.logo || '')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="logo" />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 4px' }}>{vendor.companyName}</h1>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ background: '#E31E24', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>AUDITED</div>
                <div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 700 }}>
                  <ShieldCheck size={12} /> SECURED
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', padding: '0 16px' }}>
          {['Home', 'Product', 'Company', 'Discover', 'Contact'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '12px 16px', 
                fontSize: '14px', 
                fontWeight: activeTab === tab ? 800 : 500,
                color: activeTab === tab ? '#E31E24' : '#666',
                position: 'relative'
              }}
            >
              {tab}
              {activeTab === tab && (
                <div style={{ position: 'absolute', bottom: 0, left: '16px', right: '16px', height: '3px', background: '#E31E24', borderRadius: '100px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {activeTab === 'Home' && (
        <div style={{ padding: '12px' }}>
          {/* Featured Products List */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900 }}>Featured Products</h2>
              <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center' }}>View More <ChevronRight size={14} /></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {products.slice(0, 3).map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '80px', height: '80px', background: '#F9FAFB', borderRadius: '8px', padding: '4px' }}>
                    <img src={sanitizeUrl(p.image || '')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="p" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#333', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h4>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>{Number(p.price).toFixed(2)} DT</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{p.minOrderQty} {p.unit || 'Pieces'}(MOQ)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Overview */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px' }}>Company Overview</h2>
            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, marginBottom: '12px' }}>
              {vendor.description || `${vendor.companyName} est un fournisseur professionnel basé à ${vendor.city}, spécialisé dans le sourcing B2B de haute qualité pour le secteur de l'hôtellerie et de la restauration en Tunisie.`}
            </p>
            <span style={{ color: '#E31E24', fontSize: '13px', fontWeight: 700 }}>View All</span>
          </div>

          {/* Member Info */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
             <h2 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>Member Info</h2>
             {[
               { label: 'Main Products:', value: vendor.mktSectors?.map((s: any) => s.name).join(', ') || 'Coffee, Packaging' },
               { label: 'Address:', value: `${vendor.address}, ${vendor.city}, Tunisie` },
               { label: 'Main Markets:', value: 'Local, North Africa' },
               { label: 'Payment Terms:', value: 'Bank Transfer, Cash, Check' }
             ].map((info, i) => (
               <div key={i} style={{ display: 'flex', marginBottom: '12px', fontSize: '13px' }}>
                 <span style={{ width: '120px', color: '#999', fontWeight: 500 }}>{info.label}</span>
                 <span style={{ flex: 1, color: '#333', fontWeight: 600 }}>{info.value}</span>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'Product' && (
        <div style={{ padding: '12px' }}>
          {/* Product Category Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
            {['All', 'Beverages', 'Equipment', 'Food'].map(c => (
              <div key={c} style={{ padding: '6px 16px', background: '#fff', borderRadius: '100px', fontSize: '13px', fontWeight: 700, border: '1px solid #ddd' }}>{c}</div>
            ))}
          </div>
          
          {/* Product List made-in-china style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.map((p: any, i: number) => (
              <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px' }}>
                <div style={{ width: '100px', height: '100px', background: '#F9FAFB', borderRadius: '8px', padding: '4px' }}>
                  <img src={sanitizeUrl(p.image || '')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="p" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#333', margin: '0 0 8px' }}>{p.name}</h4>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>{Number(p.price).toFixed(2)} DT</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{p.minOrderQty} {p.unit || 'Pieces'} (MOQ)</div>
                  <button style={{ background: 'none', border: '1px solid #E31E24', color: '#E31E24', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>Send Inquiry</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Bar Mobile */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #eee', gap: '12px', zIndex: 1000 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
          <Grid size={20} color="#666" />
          <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px', color: '#666' }}>Categories</span>
        </div>
        <button style={{ flex: 1, height: '44px', borderRadius: '100px', border: '2px solid #111827', background: '#fff', color: '#111827', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
          <MessageSquare size={18} /> Chat Now
        </button>
        <button style={{ flex: 1, height: '44px', borderRadius: '100px', border: 'none', background: '#E31E24', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
          Send Inquiry
        </button>
      </div>

    </div>
  );
}
