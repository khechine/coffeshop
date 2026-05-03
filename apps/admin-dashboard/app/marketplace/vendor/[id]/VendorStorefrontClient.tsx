'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Search, LayoutGrid, Star, MapPin, 
  Phone, Mail, Calendar, ChevronRight, Package, Info,
  ShoppingCart, Plus, Minus, Send, X
} from 'lucide-react';
import { placeMarketplaceOrder } from '../../../actions';
import { useCart } from '../../CartContext';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import MarketplaceFooter from '../../components/MarketplaceFooter';
import '../../marketplace.css';
import 'leaflet/dist/leaflet.css';
import { sanitizeUrl } from '../../../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(3);



export default function VendorStorefrontClient({ vendor, ratings, isVendor = false }: any) {
  const [activeTab, setActiveTab] = useState('products');
  
  const { addToCart } = useCart();
  
  const cust = vendor.customization || {};
  const isPremium = vendor.isPremium || !!cust.id;

  const products = vendor.vendorProducts.map((vp: any) => ({
    id: vp.id,
    name: vp.name || vp.productStandard?.name,
    price: vp.price,
    unit: vp.unit || vp.productStandard?.unit,
    image: vp.image || vp.productStandard?.image,
    categoryId: vp.categoryId || vp.productStandard?.categoryId
  }));

  // Map and Theme colors
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com';
  const primaryColor = isPremium ? (cust.primaryColor || '#1E1B4B') : '#1E1B4B';
  const bannerUrl = isPremium ? (sanitizeUrl(cust.bannerUrl) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600') : null;
  const logoUrl = isPremium ? (sanitizeUrl(cust.logoUrl) || null) : null;
  const fontFamily = isPremium ? (cust.fontFamily || 'Inter') : 'Inter';

  useEffect(() => {
    if (activeTab === 'info' && vendor.lat && vendor.lng && typeof window !== 'undefined') {
      const initMap = async () => {
        const L = (await import('leaflet')).default;
        if (!mapRef.current && mapContainerRef.current) {
          mapRef.current = L.map(mapContainerRef.current).setView([vendor.lat, vendor.lng], 13);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapRef.current);

          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="background-color: ${primaryColor}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                <div style={{ transform: 'rotate(45deg)', color: 'white', marginBottom: '2px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          L.marker([vendor.lat, vendor.lng], { icon: customIcon }).addTo(mapRef.current);
        }
      };
      initMap();
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activeTab, vendor.lat, vendor.lng, primaryColor]);

  return (
    <div className="mkt-page cocote-theme" style={{ fontFamily: `${fontFamily}, sans-serif` }}>
      <MarketplaceHeader isVendor={isVendor} />

      {/* Hero Banner / Store Header (Faire Style) */}
      <div style={{ position: 'relative', marginBottom: 64 }}>
        {bannerUrl ? (
          <div style={{ height: 400, width: '100%', overflow: 'hidden' }}>
             <img src={bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Banner" />
             <div className="mkt-category-hero-overlay" />
          </div>
        ) : (
          <div style={{ height: 250, background: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }} />
        )}

        <div className="mkt-container" style={{ marginTop: -100, position: 'relative', zIndex: 10 }}>
          <div style={{ background: '#fff', padding: '48px', borderRadius: 4, border: '1px solid #E5E7EB', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
            
            {/* Logo */}
            <div style={{ 
              width: 160, height: 160, borderRadius: 4, background: '#fff', 
              border: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
              overflow: 'hidden', flexShrink: 0
            }}>
              {logoUrl ? <img src={logoUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '🏪'}
            </div>

            {/* Vendor Info */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', margin: 0 }}>{vendor.companyName}</h1>
                {isPremium && <span style={{ background: '#111827', color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Distributeur Certifié</span>}
              </div>
              
              <div style={{ display: 'flex', gap: 24, color: '#64748B', fontSize: 16, fontWeight: 500, flexWrap: 'wrap', marginBottom: 24 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} /> {vendor.city || 'Tunis'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingBag size={18} /> Min. Commande: 150 DT</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Star size={18} fill="#111827" color="#111827" /> {ratings.overallAvg.toFixed(1)} ({ratings.totalReviews} avis)</span>
              </div>

              {cust.welcomeMessage && (
                <p style={{ color: '#475569', fontSize: 18, lineHeight: 1.6, maxWidth: 700 }}>{cust.welcomeMessage}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <button className="mkt-cocote-btn-primary" style={{ padding: '16px 40px', fontSize: 16 }}>
                  Acheter la marque
               </button>
               <button className="px-8 py-4 border border-slate-200 text-slate-900 font-bold rounded-[4px] hover:bg-slate-50 transition-all">
                  Suivre
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mkt-container">
        {/* Navigation Tabs (Sober) */}
        <div style={{ display: 'flex', gap: 48, marginBottom: 48, borderBottom: '1px solid #E5E7EB' }}>
           <button 
            onClick={() => setActiveTab('products')}
            style={{ padding: '16px 0', border: 'none', background: 'none', borderBottom: activeTab === 'products' ? `2px solid #111827` : '2px solid transparent', color: activeTab === 'products' ? '#111827' : '#94A3B8', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
           >
              Produits ({products.length})
           </button>
           <button 
            onClick={() => setActiveTab('reviews')}
            style={{ padding: '16px 0', border: 'none', background: 'none', borderBottom: activeTab === 'reviews' ? `2px solid #111827` : '2px solid transparent', color: activeTab === 'reviews' ? '#111827' : '#94A3B8', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
           >
              Avis ({ratings.totalReviews})
           </button>
           <button 
            onClick={() => setActiveTab('info')}
            style={{ padding: '16px 0', border: 'none', background: 'none', borderBottom: activeTab === 'info' ? `2px solid #111827` : '2px solid transparent', color: activeTab === 'info' ? '#111827' : '#94A3B8', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
           >
              Notre Histoire
           </button>
        </div>

        {activeTab === 'products' && (
          <div className="mkt-cocote-grid">
            {products.map((p: any) => (
              <div key={p.id} className="mkt-cocote-card">
                <Link href={`/marketplace/product/${p.id}`} className="mkt-cocote-card-img-wrap">
                  <img src={sanitizeUrl(p.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} className="mkt-cocote-card-img" alt={p.name} />
                </Link>
                <div className="mkt-cocote-card-body">
                  <Link href={`/marketplace/product/${p.id}`} style={{ textDecoration: 'none' }}>
                    <h3 className="mkt-cocote-card-title">{p.name}</h3>
                  </Link>
                  <div className="mkt-cocote-card-footer">
                    <div className="mkt-cocote-price-wrap" style={isVendor ? { filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' } : {}}>
                      <span className="mkt-cocote-price">{fmt(p.price)}</span>
                      <span className="mkt-cocote-unit">DT/{p.unit}</span>
                    </div>
                    {!isVendor && (
                      <button className="mkt-cocote-add-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); }}>
                        <ShoppingCart size={16} />
                      </button>
                    )}
                  </div>
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
        )}

        {activeTab === 'reviews' && (
          <div style={{ padding: 64, background: '#fff', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', gap: 64, alignItems: 'center', marginBottom: 64 }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{ratings.overallAvg.toFixed(1)}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '16px 0' }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={20} fill={s <= Math.round(ratings.overallAvg) ? "#111827" : "none"} color="#111827" />)}
                  </div>
                  <div style={{ color: '#64748B', fontWeight: 600 }}>Basé sur {ratings.totalReviews} avis</div>
               </div>
               <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
                  <div style={{ padding: '24px', border: '1px solid #F3F4F6', borderRadius: 4 }}>
                     <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Qualité Produits</div>
                     <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{ratings.avgQuality.toFixed(1)}/5</div>
                  </div>
                  <div style={{ padding: '24px', border: '1px solid #F3F4F6', borderRadius: 4 }}>
                     <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Réactivité</div>
                     <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{ratings.avgSpeed.toFixed(1)}/5</div>
                  </div>
                  <div style={{ padding: '24px', border: '1px solid #F3F4F6', borderRadius: 4 }}>
                     <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Service Livraison</div>
                     <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{ratings.avgDelivery.toFixed(1)}/5</div>
                  </div>
                  <div style={{ padding: '24px', border: '1px solid #F3F4F6', borderRadius: 4 }}>
                     <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Fiabilité</div>
                     <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{ratings.avgReliability.toFixed(1)}/5</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div style={{ padding: 64, background: '#fff', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
              <div>
                <h3 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 32px' }}>Notre Mission</h3>
                <p style={{ color: '#475569', fontSize: 18, lineHeight: 1.8, marginBottom: 48 }}>{vendor.description || "Nous sommes engagés à fournir les meilleurs produits pour les professionnels de la restauration et du café en Tunisie."}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>Contact</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#111827', fontWeight: 600 }}>
                          <Phone size={18} /> {vendor.phone}
                       </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>Siège Social</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#111827', fontWeight: 600 }}>
                       <MapPin size={18} /> {vendor.city}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 16 }}>Localisation de l'établissement</div>
                <div ref={mapContainerRef} style={{ width: '100%', height: '400px', borderRadius: 4, border: '1px solid #E5E7EB', overflow: 'hidden', zIndex: 1 }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
}
