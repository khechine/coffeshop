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
import CartDrawer from '../../CartDrawer';
import '../../marketplace.css';
import 'leaflet/dist/leaflet.css';
import { sanitizeUrl } from '../../../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(3);



export default function VendorStorefrontClient({ vendor, ratings }: any) {
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  const { addToCart, cartCount } = useCart();
  
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
    <div className="mkt-page" style={{ fontFamily: `${fontFamily}, sans-serif` }}>
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
            <button className="mkt-cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="mkt-cart-badge">{cartCount}</span>}
            </button>
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
           <button 
            onClick={() => setActiveTab('products')}
            style={{ padding: '16px 8px', border: 'none', background: 'none', borderBottom: activeTab === 'products' ? `3px solid ${primaryColor}` : '3px solid transparent', color: activeTab === 'products' ? '#1E1B4B' : '#94A3B8', fontWeight: activeTab === 'products' ? 900 : 700, fontSize: 15, cursor: 'pointer' }}
           >
              Tous les produits ({products.length})
           </button>
           <button 
            onClick={() => setActiveTab('reviews')}
            style={{ padding: '16px 8px', border: 'none', background: 'none', borderBottom: activeTab === 'reviews' ? `3px solid ${primaryColor}` : '3px solid transparent', color: activeTab === 'reviews' ? '#1E1B4B' : '#94A3B8', fontWeight: activeTab === 'reviews' ? 900 : 700, fontSize: 15, cursor: 'pointer' }}
           >
              Avis Clients
           </button>
           <button 
            onClick={() => setActiveTab('info')}
            style={{ padding: '16px 8px', border: 'none', background: 'none', borderBottom: activeTab === 'info' ? `3px solid ${primaryColor}` : '3px solid transparent', color: activeTab === 'info' ? '#1E1B4B' : '#94A3B8', fontWeight: activeTab === 'info' ? 900 : 700, fontSize: 15, cursor: 'pointer' }}
           >
              Infos & Contact
           </button>
        </div>

        {activeTab === 'products' && (
          <div className="mkt-grid">
            {products.map((p: any) => (
              <div key={p.id} className="mkt-card">
                <Link href={`/marketplace/product/${p.id}`} className="mkt-card-img" style={{ display: 'block', textDecoration: 'none' }}>
                  <img src={sanitizeUrl(p.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} alt={p.name} />
                  <div className="mkt-card-add">
                    <button className="mkt-card-add-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); }}>
                      <Plus size={14} /> AJOUTER AU PANIER
                    </button>
                  </div>
                </Link>
                <div className="mkt-card-body">
                  <Link href={`/marketplace/product/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div className="mkt-card-name">{p.name}</div>
                  </Link>
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
        )}

        {activeTab === 'reviews' && (
          <div style={{ padding: 40, background: '#fff', borderRadius: 24, border: '1px solid #F1F5F9', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1E1B4B', margin: '0 0 8px' }}>Avis Clients</h3>
            <p style={{ color: '#64748B', maxWidth: 400, margin: '0 auto' }}>
              Moyenne de {ratings.overallAvg.toFixed(1)} basée sur {ratings.totalReviews} commandes.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginTop: 40 }}>
               <div style={{ padding: 20, background: '#F8FAFC', borderRadius: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Rapidité</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1E1B4B' }}>{ratings.avgSpeed.toFixed(1)}/5</div>
               </div>
               <div style={{ padding: 20, background: '#F8FAFC', borderRadius: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Qualité</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1E1B4B' }}>{ratings.avgQuality.toFixed(1)}/5</div>
               </div>
               <div style={{ padding: 20, background: '#F8FAFC', borderRadius: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Fiabilité</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1E1B4B' }}>{ratings.avgReliability.toFixed(1)}/5</div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div style={{ padding: 40, background: '#fff', borderRadius: 24, border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1E1B4B', margin: '0 0 24px' }}>À propos de {vendor.companyName}</h3>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: 32 }}>{vendor.description || "Aucune description fournie par ce vendeur."}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48 }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>Contact Direct</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#1E293B', fontWeight: 600 }}>
                          <Phone size={18} style={{ color: primaryColor }} /> {vendor.phone}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#1E293B', fontWeight: 600 }}>
                          <MapPin size={18} style={{ color: primaryColor }} /> {vendor.address}, {vendor.city}
                       </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>Coordonnées GPS</div>
                    <div style={{ color: '#1E293B', fontWeight: 600, fontSize: 14 }}>
                       Lat: {vendor.lat} <br/> Lng: {vendor.lng}
                    </div>
                  </div>
               </div>

               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>Localisation</div>
                  <div ref={mapContainerRef} style={{ width: '100%', height: '300px', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', zIndex: 1 }} />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer onClose={() => setCartOpen(false)} />
      )}
    </div>
  );
}
