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
import { useVault } from '../../VaultContext';
import VaultReveal from '../../components/VaultReveal';

export default function VendorStorefrontMobile({ vendor, products = [], isVendor = false }: any) {
  const [activeTab, setActiveTab] = useState('Home');
  const { level, maskName, identityVisible } = useVault(vendor.id, vendor.isPremium);
  
  const cust = vendor.customization || {};
  const logoUrl = sanitizeUrl(cust.logoUrl);
  const bannerUrl = sanitizeUrl(cust.bannerUrl) || '/images/elkassa-logo.png';
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
        <VaultReveal 
          vendorId={vendor.id} 
          levelRequired={2}
          isPremium={vendor.isPremium}
          placeholder={vendor.isPremium ? (logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={40} color="#E5E7EB" />) : null}
          style={{ position: 'absolute', bottom: '-40px', left: '16px', width: '80px', height: '80px', background: '#fff', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden' }}
        >
           {logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={40} color="#E5E7EB" />}
        </VaultReveal>
      </div>

      {/* Identity Section */}
      <div style={{ background: '#fff', paddingTop: '50px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '0 0 4px' }}>
                {maskName(vendor.companyName)}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666', fontWeight: 600 }}>
                 <MapPin size={12} /> {identityVisible ? (vendor.city || 'Tunisie') : 'Ville masquée'}
              </div>
           </div>
           <button style={{ background: primaryColor, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>
             Suivre
           </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>
             <ShieldCheck size={12} /> {identityVisible ? 'Diamond Member' : 'Membre Vérifié'}
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
      <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #eee', position: 'sticky', top: '45px', zIndex: 999, overflowX: 'auto' }}>
        {(vendor.isPremium ? ['Home', 'Products', 'Franchises', 'About Us', 'Solutions', 'Discover', 'Contact Us'] : ['Home', 'Products', 'About Us']).map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              flex: '0 0 auto', padding: '12px 16px', fontSize: '13px', fontWeight: activeTab === tab ? 800 : 600, 
              color: activeTab === tab ? primaryColor : '#666',
              position: 'relative',
              whiteSpace: 'nowrap'
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
               <VaultReveal vendorId={vendor.id} levelRequired={3} isPremium={vendor.isPremium}>
                  <button style={{ background: '#fff', color: '#111827', border: 'none', padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 800 }}>
                    Envoyer RFQ
                  </button>
               </VaultReveal>
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

        {activeTab === 'Franchises' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px' }}>Réseau de distribution</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Ce fournisseur possède <strong>{vendor.posList?.length || 0} points de vente</strong> actifs.
            </p>
            
            <VaultReveal vendorId={vendor.id} levelRequired={3} isPremium={vendor.isPremium}>
               <div style={{ height: '200px', background: '#eee', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <MapPin size={32} color="#999" />
                 <span style={{ fontSize: '12px', color: '#999', fontWeight: 700, marginLeft: '8px' }}>Interactive Map Loaded</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {vendor.posList?.map((pos: any, idx: number) => (
                   <div key={idx} style={{ padding: '12px', border: '1px solid #eee', borderRadius: '12px' }}>
                     <div style={{ fontSize: '14px', fontWeight: 800 }}>{pos.name}</div>
                     <div style={{ fontSize: '12px', color: '#666' }}>{pos.address}</div>
                   </div>
                 ))}
               </div>
            </VaultReveal>
          </div>
        )}

        {['About Us', 'Solutions', 'Discover', 'Contact Us'].includes(activeTab) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '16px' }}>
               <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px' }}>{activeTab}</h3>
               <div 
                  className="prose prose-sm max-w-none"
                  style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ 
                    __html: (cust.themeConfig?.[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(' ', '')] || vendor.description || `<p style="color: #9CA3AF;">Cette section n'a pas encore été configurée par le vendeur.</p>`) 
                  }}
               />
            </div>
            
            {activeTab === 'About Us' && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px' }}>Coordonnées Directes</h3>
                <VaultReveal vendorId={vendor.id} levelRequired={3} isPremium={vendor.isPremium}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={16} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{vendor.email || 'Email non renseigné'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapPin size={16} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{vendor.address || 'Adresse non renseignée'}</span>
                      </div>
                    </div>
                </VaultReveal>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}


      {/* Fixed Bottom Action Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: '12px 16px', display: 'flex', gap: '12px', zIndex: 1001 }}>
        <VaultReveal vendorId={vendor.id} levelRequired={3} isPremium={vendor.isPremium} style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
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
        </VaultReveal>
      </div>

    </div>
  );
}

