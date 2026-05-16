'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { sendTradeMessageAction } from '../../../actions';
import { useToast } from '../../../components/Toast';


import VendorStorefrontMobile from './VendorStorefrontMobile';
import { useVault } from '../../VaultContext';

const fmt = (n: any) => Number(n).toFixed(2);


export default function VendorStorefrontClient({ vendor, ratings, isVendor = false, allCategories = [] }: any) {
  const [activeTab, setActiveTab] = useState('Home');
  const [activeCollection, setActiveCollection] = useState<Record<string, string>>({});
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [tradeMessagerOpen, setTradeMessagerOpen] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Franchises / POS state
  const [selectedPos, setSelectedPos] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [stockSearch, setStockSearch] = useState('');

  const { level, maskName, maskLogo, maskCity, identityVisible } = useVault(vendor.id, vendor.isPremium);

  useEffect(() => {
    if (activeTab === 'Franchises' && typeof window !== 'undefined' && mapContainerRef.current && !mapRef.current) {
      const initMap = async () => {
        const L = (await import('leaflet')).default;
        // @ts-ignore
        import('leaflet/dist/leaflet.css');

        const map = L.map(mapContainerRef.current!).setView([36.80, 10.18], 7);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const vendorLogo = (vendor.customization?.logoUrl) || '/default-vendor.png';
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 3px solid #E31E24; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                   <img src="${vendorLogo}" style="width: 100%; height: 100%; object-fit: contain;" />
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        const posList = vendor.posList || [];
        posList.forEach((pos: any) => {
          if (pos.lat && pos.lng) {
            const marker = L.marker([pos.lat, pos.lng], { icon: customIcon }).addTo(map);
            marker.bindPopup(`<b>${pos.name}</b><br/>${pos.address || ''}`);
          }
        });

        if (posList.length > 0 && posList[0].lat) {
            map.setView([posList[0].lat, posList[0].lng], 10);
            setSelectedPos(posList[0]);
        }

        mapRef.current = map;
      };
      initMap();
    }
  }, [activeTab, vendor.posList, vendor.customization?.logoUrl]);

  const handleSendTradeMessage = async () => {
    if (!tradeMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      const res = await sendTradeMessageAction({
        receiverId: vendor.userId,
        content: tradeMessage
      });
      if (res.success) {
        showToast("Message envoyé ! Les coordonnées personnelles ont été masquées selon nos conditions.");
        setTradeMessagerOpen(false);
        setTradeMessage('');
      }
    } catch (e: any) {
      showToast("Erreur lors de l'envoi du message : " + e.message, 'error');
    } finally {
      setIsSendingMsg(false);
    }
  };

  const isPremium = vendor.isPremium;
  const cust = vendor.customization || {};
  const primaryColor = isPremium ? (cust.primaryColor || '#E31E24') : '#111827';
  const accentColor = isPremium ? (cust.secondaryColor || '#475569') : '#F3F4F6';
  
  const logoUrl = sanitizeUrl(cust.logoUrl);
  const bannerUrl = sanitizeUrl(cust.bannerUrl) || '/images/elkassa-logo.png';

  const products = (vendor.vendorProducts || []).map((vp: any) => ({
    id: vp.id,
    name: vp.name || vp.productStandard?.name,
    price: vp.price,
    unit: vp.unit || vp.productStandard?.unit,
    image: vp.image || vp.productStandard?.image,
    categoryId: vp.categoryId || vp.productStandard?.categoryId,
    minOrderQty: vp.minOrderQty,
    vendorId: vendor.id,
    vendor: {
      id: vendor.id,
      userId: vendor.userId,
      companyName: vendor.companyName, // Pass raw name, child will mask if needed
      city: vendor.city || 'Tunisie', // Pass raw city
      isEcoResponsible: vendor.isEcoResponsible,
      isPremium: vendor.isPremium
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

  const navItems = isPremium ? ['Home', 'Products', 'Franchises', 'About Us', 'Solutions', 'Discover', 'Contact Us'] : ['Tous les Produits', 'À Propos'];

  if (!isPremium) {
    return (
      <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <MarketplaceHeader isVendor={isVendor} />
        
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '40px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '16px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden', position: 'relative' }}>
              {maskLogo(logoUrl) ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={48} color="#E5E7EB" />}
              {!identityVisible && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)' }}><ShieldCheck size={32} color="#111827" /></div>}
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>{maskName(vendor.companyName)}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> {maskCity(vendor.city)}</div>
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

  if (isMobile) {
    return <VendorStorefrontMobile vendor={vendor} products={products} isVendor={isVendor} />;
  }

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader isVendor={isVendor} />

      {/* ── Vendor Top Header (Badges & Quick Actions) ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
               <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{maskName(vendor.companyName)}</span>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>
                    <ShieldCheck size={14} /> {identityVisible ? 'Diamond Member' : 'Membre Vérifié'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, color: '#E31E24' }}>
                     AUDITÉ
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                     {[1,2,3,4].map(i => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
                  </div>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
               <button style={{ height: '32px', padding: '0 16px', border: `1px solid ${primaryColor}`, color: primaryColor, borderRadius: '4px', background: 'transparent', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Send Inquiry</button>
               <button onClick={() => setTradeMessagerOpen(!tradeMessagerOpen)} style={{ height: '32px', padding: '0 16px', border: 'none', color: '#fff', borderRadius: '100px', background: '#2563EB', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <MessageCircle size={14} /> TradeMessager
               </button>
               
               {tradeMessagerOpen && (
                 <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 1000, width: '380px', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ background: '#111827', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <MessageCircle size={18} />
                       <span style={{ fontWeight: 800 }}>TradeMessager</span>
                     </div>
                     <button onClick={() => setTradeMessagerOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={18} /></button>
                   </div>
                   <div style={{ padding: '20px', flex: 1, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                     <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', background: '#FEF2F2', padding: '12px', borderRadius: '8px', border: '1px solid #FEE2E2' }}>
                       <strong style={{ color: '#E31E24' }}>Sécurité B2B :</strong> Les numéros de téléphone et adresses emails sont automatiquement filtrés pour garantir la sécurité des transactions sur la plateforme.
                     </div>
                     <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>Vendeur : {vendor.companyName}</p>
                   </div>
                   <div style={{ padding: '16px', background: '#fff' }}>
                     <textarea 
                       value={tradeMessage}
                       onChange={e => setTradeMessage(e.target.value)}
                       placeholder="Posez vos questions techniques, demandez un devis sur-mesure..."
                       style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'none', outline: 'none' }}
                     />
                     <button 
                       onClick={handleSendTradeMessage}
                       disabled={isSendingMsg || !tradeMessage.trim()}
                       style={{ width: '100%', padding: '12px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, marginTop: '12px', cursor: isSendingMsg || !tradeMessage.trim() ? 'not-allowed' : 'pointer', opacity: isSendingMsg || !tradeMessage.trim() ? 0.5 : 1 }}
                     >
                       {isSendingMsg ? 'Envoi...' : 'Envoyer le message'}
                     </button>
                   </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* ── Vendor Identity Bar (Logo & Name) ── */}
      <div style={{ background: '#fff', padding: '24px 0' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '80px', height: '80px', border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', position: 'relative' }}>
               {logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={40} color="#E5E7EB" />}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>{maskName(vendor.companyName)}</h1>
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

         {activeTab === 'Franchises' && (
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', height: '700px' }}>
              <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative' }}>
                 <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'hidden' }}>
                 <div style={{ paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 12px' }}>Points de Vente</h3>
                   <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="Chercher un article en stock..." 
                        value={stockSearch}
                        onChange={e => setStockSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none' }}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                   </div>
                 </div>

                 <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                   {(vendor.posList || []).map((pos: any) => (
                     <div 
                      key={pos.id} 
                      onClick={() => {
                        setSelectedPos(pos);
                        if (mapRef.current && pos.lat && pos.lng) {
                          mapRef.current.setView([pos.lat, pos.lng], 14);
                        }
                      }}
                      style={{ 
                        background: selectedPos?.id === pos.id ? '#fff' : '#F9FAFB', 
                        padding: '16px', 
                        borderRadius: '20px', 
                        border: selectedPos?.id === pos.id ? `2px solid ${primaryColor}` : '1px solid #E5E7EB',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                     >
                       <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{pos.name}</h4>
                       <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <MapPin size={12} /> {pos.address || pos.city}
                       </p>
                       
                       <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                             {(pos.stockItems || [])
                               .filter((s: any) => {
                                 const vp = vendor.vendorProducts.find((p: any) => p.id === s.vendorProductId);
                                 if (!vp) return false;
                                 if (!stockSearch) return true;
                                 return vp.name.toLowerCase().includes(stockSearch.toLowerCase());
                               })
                               .slice(0, selectedPos?.id === pos.id ? 10 : 3)
                               .map((s: any) => {
                                 const vp = vendor.vendorProducts.find((p: any) => p.id === s.vendorProductId);
                                 const qty = Number(s.quantity);
                                 return (
                                   <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{vp?.name}</span>
                                     <span style={{ fontSize: '11px', fontWeight: 800, color: qty > 0 ? '#10B981' : '#EF4444' }}>{qty} {vp?.unit}</span>
                                   </div>
                                 );
                               })}
                             {(!stockSearch && (pos.stockItems?.length || 0) > (selectedPos?.id === pos.id ? 10 : 3)) && (
                               <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textAlign: 'center', display: 'block', paddingTop: '4px' }}>
                                 {selectedPos?.id === pos.id ? `+ ${(pos.stockItems?.length || 0) - 10} autres` : `Voir les ${pos.stockItems?.length} articles`}
                               </span>
                             )}
                             {(stockSearch && pos.stockItems?.length === 0) && <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center' }}>Aucun article trouvé</span>}
                          </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'Products' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
               {products.map((p: any) => <MarketplaceProductCard key={p.id} product={p} isVendor={isVendor} hidePrice={isVendor} />)}
            </div>
         )}
         
         {['About Us', 'Solutions', 'Discover', 'Contact Us'].includes(activeTab) && (
           <div style={{ background: '#fff', borderRadius: '32px', padding: '64px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', marginBottom: '32px', textAlign: 'center' }}>{activeTab}</h2>
              <div 
                className="prose prose-slate max-w-none"
                style={{ fontSize: '18px', lineHeight: 1.8, color: '#475569' }}
                dangerouslySetInnerHTML={{ 
                  __html: (cust.themeConfig?.[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(' ', '')] || `<p style="text-align: center; color: #94A3B8;">Cette section n'a pas encore été configurée par le vendeur.</p>`) 
                }} 
              />
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
