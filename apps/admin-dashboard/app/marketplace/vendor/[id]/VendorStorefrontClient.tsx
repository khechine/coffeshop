'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Search, LayoutGrid, Star, MapPin, 
  Phone, Mail, Calendar, ChevronRight, Package, Info,
  ShoppingCart, Plus, Minus, Send, X, MessageCircle,
  Play, Maximize2, ShieldCheck, Heart, Building2
} from 'lucide-react';
import { useCart } from '../../CartContext';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import MarketplaceFooter from '../../components/MarketplaceFooter';
import MarketplaceProductCard from '../../components/MarketplaceProductCard';
import { sanitizeUrl } from '../../../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(2);


export default function VendorStorefrontClient({ vendor, ratings, isVendor = false, allCategories = [] }: any) {
  const [activeTab, setActiveTab] = useState('Home');
  const [activeCollection, setActiveCollection] = useState<Record<string, string>>({});
  const { addToCart } = useCart();
  
  const isPremium = vendor.isPremium;
  const cust = vendor.customization || {};
  const primaryColor = isPremium ? (cust.primaryColor || '#E31E24') : '#111827';
  const accentColor = isPremium ? (cust.secondaryColor || '#475569') : '#F3F4F6';
  
  const logoUrl = sanitizeUrl(cust.logoUrl);
  const bannerUrl = sanitizeUrl(cust.bannerUrl) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600';

  const products = vendor.vendorProducts.map((vp: any) => ({
    id: vp.id,
    name: vp.name || vp.productStandard?.name,
    price: vp.price,
    unit: vp.unit || vp.productStandard?.unit,
    image: vp.image || vp.productStandard?.image,
    categoryId: vp.categoryId || vp.productStandard?.categoryId,
    minOrderQty: vp.minOrderQty,
    vendorId: vendor.id,
    vendor: {
      companyName: vendor.companyName,
      city: vendor.city,
      isEcoResponsible: vendor.isEcoResponsible
    },
    distance: null 
  }));

  const { productsByCategory, categoryMap } = useMemo(() => {
     const groups: Record<string, any[]> = {};
     const map: Record<string, string> = {};
     allCategories.forEach((c: any) => { map[c.id] = c.name; });
     products.forEach((p: any) => {
        const catId = p.categoryId || 'Other';
        if (!groups[catId]) groups[catId] = [];
        groups[catId].push(p);
     });
     return { productsByCategory: groups, categoryMap: map };
  }, [products, allCategories]);

  const navItems = isPremium ? ['Home', 'Products', 'About Us', 'Solutions', 'Discover', 'Contact Us'] : ['Tous les Produits', 'À Propos'];

  if (!isPremium) {
    return (
      <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <MarketplaceHeader isVendor={isVendor} />
        
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '40px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '16px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden' }}>
              {logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={48} color="#E5E7EB" />}
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>{vendor.companyName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> {vendor.city || 'Tunisie'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={16} /> {products.length} Produits</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={16} fill="#F59E0B" color="#F59E0B" /> 4.5/5</div>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
               <button style={{ height: '48px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '12px', background: '#F3F4F6', color: '#111827', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <MessageCircle size={18} /> Chat
               </button>
               <button style={{ height: '48px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '12px', background: '#E31E24', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                 Suivre
               </button>
            </div>
          </div>
        </div>

        <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
              {products.map((p: any) => (
                <div key={p.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                   <MarketplaceProductCard product={p} isVendor={isVendor} hidePrice={isVendor} />
                </div>
              ))}
           </div>
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader isVendor={isVendor} />

      {/* ── Vendor Top Header (Badges & Quick Actions) ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 0' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
               <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{vendor.companyName}</span>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>
                    <ShieldCheck size={14} /> Diamond Member
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <img src="https://img.made-in-china.com/2f0j00fSvaGZlKEnbe/Audited-Supplier.jpg" alt="Audited" style={{ height: '14px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                     {[1,2,3,4].map(i => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
                  </div>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button style={{ height: '32px', padding: '0 16px', border: `1px solid ${primaryColor}`, color: primaryColor, borderRadius: '4px', background: 'transparent', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Send Inquiry</button>
               <button style={{ height: '32px', padding: '0 16px', border: 'none', color: '#fff', borderRadius: '100px', background: '#2563EB', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <MessageCircle size={14} /> Chat Now
               </button>
            </div>
         </div>
      </div>

      {/* ── Vendor Identity Bar (Logo & Name) ── */}
      <div style={{ background: '#fff', padding: '24px 0' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '80px', height: '80px', border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
               {logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={40} color="#E5E7EB" />}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>{vendor.companyName}</h1>
         </div>
      </div>

      {/* ── Vendor Navigation Bar ── */}
      <div style={{ background: accentColor, color: '#fff' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex' }}>
               {navItems.map(item => (
                 <button 
                  key={item} 
                  onClick={() => setActiveTab(item)}
                  style={{ 
                    padding: '16px 24px', 
                    background: activeTab === item ? primaryColor : 'transparent', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                 >
                   {item}
                 </button>
               ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '4px', padding: '0 12px', height: '36px', width: '300px' }}>
               <input type="text" placeholder="Rechercher dans cette boutique..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#111827' }} />
               <Search size={16} color="#64748B" />
            </div>
         </div>
      </div>

      {/* ── Hero Banner ── */}
      <div style={{ width: '100%', height: '400px', position: 'relative', overflow: 'hidden' }}>
         <img src={bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
         <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
            {[1,2,3].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i === 1 ? primaryColor : '#fff', opacity: i === 1 ? 1 : 0.5 }} />)}
         </div>
      </div>

      {/* ── Main Content Area ── */}
      <main style={{ maxWidth: '1400px', margin: '48px auto', padding: '0 24px' }}>
         
         {activeTab === 'Home' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
              {Object.entries(productsByCategory).map(([catId, items]: [string, any]) => (
                <section key={catId} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
                    <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', padding: '40px 32px', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
                          {catId === 'Other' ? 'Notre Sélection' : (categoryMap[catId] || 'Collection')}
                        </h2>
                        <div style={{ width: '40px', height: '4px', background: primaryColor, borderRadius: '2px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collections</span>
                        {['All', 'Best Sellers', 'New Arrivals', 'Promotion', 'Liquidation'].map(tag => {
                          const isSelected = (activeCollection[catId] || 'All') === tag;
                          return (
                            <div key={tag} onClick={() => setActiveCollection(prev => ({ ...prev, [catId]: tag }))} style={{ fontSize: '15px', color: isSelected ? primaryColor : '#475569', cursor: 'pointer', fontWeight: isSelected ? 800 : 700, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                              <ChevronRight size={14} strokeWidth={isSelected ? 3 : 2} /> {tag}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: '#E5E7EB' }}>
                      {items.filter((p: any) => (activeCollection[catId] || 'All') === 'All' || Math.random() > 0.3).slice(0, 8).map((p: any) => (
                        <div key={p.id} style={{ background: '#fff', padding: '24px', transition: 'all 0.2s' }}>
                          <MarketplaceProductCard product={p} isVendor={isVendor} hidePrice={isVendor} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
           </div>
         )}

         {activeTab === 'Products' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
               {products.map((p: any) => <MarketplaceProductCard key={p.id} product={p} isVendor={isVendor} hidePrice={isVendor} />)}
            </div>
         )}
      </main>

      <MarketplaceFooter />

      <style jsx global>{`
        .hover-shadow-premium:hover { box-shadow: 0 12px 24px rgba(0,0,0,0.1); transform: translateY(-4px); }
      `}</style>
    </div>
  );
}
