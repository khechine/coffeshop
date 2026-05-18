'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShoppingCart, Star, ShieldCheck, 
  Truck, RefreshCw, Plus, Minus, MessageSquare,
  ChevronRight, Building2, LayoutGrid, ShoppingBag,
  Heart, Share2, Play, CheckCircle2, ChevronDown, 
  MapPin, Globe, Headphones, ArrowUp, ChevronLeft, X,
  FileText, Calendar, Leaf, Award, Shield, Package
} from 'lucide-react';
import { useVault } from '../../VaultContext';
import { useCart } from '../../CartContext';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import MarketplaceFooter from '../../components/MarketplaceFooter';
import { sanitizeUrl } from '../../../lib/imageUtils';
import { sendTradeMessageAction } from '../../../actions';


import ProductMobile from './ProductMobile';
import '../../marketplace-responsive.css';

const fmt = (n: any) => Number(n).toFixed(2);

export default function ProductDetailClient({ product, isVendor = false, relatedProducts = [], allCategories = [] }: { product: any; isVendor?: boolean; relatedProducts?: any[]; allCategories?: any[] }) {
  const minQty = product.minOrderQty ? Number(product.minOrderQty) : 1;
  const [qty, setQty] = useState(minQty);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { level, maskName, identityVisible } = useVault(product.vendorId, product.vendor?.isPremium);
  
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const imageUrl = sanitizeUrl(product.image) || '/images/elkassa-logo.png';
  const gallery = [imageUrl, ...(product.images || []).map((img: string) => sanitizeUrl(img))].filter(Boolean);
  const [activeImage, setActiveImage] = useState(gallery[0]);

  const [tradeMessagerOpen, setTradeMessagerOpen] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const handleSendTradeMessage = async () => {
    if (!tradeMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      const res = await sendTradeMessageAction({
        receiverId: product.vendor?.userId || '',
        productId: product.id,
        content: tradeMessage
      });
      if (res.success) {
        alert("Message envoyé ! Les coordonnées personnelles ont été masquées selon nos conditions.");
        setTradeMessagerOpen(false);
        setTradeMessage('');
      }
    } catch (e: any) {
      alert("Erreur lors de l'envoi du message : " + e.message);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (isMobile) {
    return <ProductMobile product={product} isVendor={isVendor} relatedProducts={relatedProducts} />;
  }

  return (
    <div className="mkt-page" style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader isVendor={isVendor} allCategories={allCategories} />

      <main className="mkt-main">
        
        {/* Breadcrumbs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>
          <Link href="/marketplace" style={{ color: '#6B7280', textDecoration: 'none' }}>Accueil</Link>
          <ChevronRight size={14} />
          <Link href={`/marketplace/category/${product.category?.slug || product.categoryId}`} style={{ color: '#6B7280', textDecoration: 'none' }}>{product.category?.name || 'Catégorie'}</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#111827', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </span>
        </nav>

        <div className="mkt-product-layout">
          
          {/* Left Column: Media & Gallery */}
          <div className="mkt-product-gallery">
            <div style={{ background: '#fff', borderRadius: '24px', padding: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#fff', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <img 
                    src={activeImage} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.5s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                 />
                 
                 {/* Overlay Icons */}
                 <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 }}>
                    <button 
                      onClick={() => {
                        if (toggleWishlist) toggleWishlist(product);
                      }}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Heart size={22} color={isInWishlist?.(product.id) ? "#E31E24" : "#374151"} fill={isInWishlist?.(product.id) ? "#E31E24" : "none"} />
                    </button>
                    
                    {/* Share Dropdown Trigger */}
                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={() => {
                          const menu = document.getElementById('share-menu');
                          if (menu) menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
                        }}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Share2 size={22} color="#374151" />
                      </button>
                      <div id="share-menu" style={{ display: 'none', position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid #F1F5F9', padding: '8px', flexDirection: 'column', gap: '4px', minWidth: '160px', zIndex: 20 }}>
                        {[
                          { name: 'WhatsApp', icon: MessageSquare, color: '#25D366' },
                          { name: 'Facebook', icon: Globe, color: '#1877F2' },
                          { name: 'LinkedIn', icon: Building2, color: '#0A66C2' },
                          { name: 'Copier le lien', icon: Plus, color: '#6B7280' },
                        ].map((s, i) => (
                          <button key={i} onClick={() => {
                            if (s.name === 'Copier le lien') {
                              navigator.clipboard.writeText(window.location.href);
                              alert("Lien copié !");
                            } else {
                              alert(`Partage sur ${s.name} simulé`);
                            }
                            const menu = document.getElementById('share-menu');
                            if (menu) menu.style.display = 'none';
                          }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <s.icon size={16} color={s.color} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>

                 {/* Navigation Arrows */}
                 <button 
                  onClick={() => {
                    const idx = gallery.indexOf(activeImage);
                    setActiveImage(gallery[(idx + 1) % gallery.length]);
                  }}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                 >
                    <ChevronRight size={28} color="#111827" />
                 </button>
                 <button 
                  onClick={() => {
                    const idx = gallery.indexOf(activeImage);
                    setActiveImage(gallery[(idx - 1 + gallery.length) % gallery.length]);
                  }}
                  style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                 >
                    <ChevronLeft size={28} color="#111827" />
                 </button>
              </div>

              {/* Thumbnails */}
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 0' }} className="no-scrollbar">
                 {gallery.map((img, i) => (
                   <button 
                    key={i} 
                    onClick={() => setActiveImage(img)}
                    style={{ 
                      flexShrink: 0,
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '12px', 
                      border: activeImage === img ? '3px solid #E31E24' : '1px solid #F1F5F9', 
                      padding: '4px', 
                      background: '#fff',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => activeImage !== img && (e.currentTarget.style.borderColor = '#FECACA')}
                    onMouseLeave={(e) => activeImage !== img && (e.currentTarget.style.borderColor = '#F1F5F9')}
                   >
                     <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                   </button>
                 ))}
              </div>
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="mkt-product-info">
            
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>U</div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Verified Supplier</span>
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.3, marginBottom: '20px' }}>
                {product.name}
              </h1>

              {/* Premium Value Props: Eco & Tunisian */}
              {(() => {
                const isEco = product.vendor?.isEcoResponsible || product.tags?.includes('🌱 Éco-responsable');
                const isTunisian = product.tags?.some((t: string) => t.includes('Tunis') || t.includes('🇹🇳'));
                if (!isEco && !isTunisian) return null;
                return (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #FFF1F2 100%)', 
                    padding: '16px 20px', 
                    borderRadius: '16px', 
                    border: '1px dashed #BBF7D0',
                    marginBottom: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✨ Avantages du Produit
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {isEco && (
                        <div style={{ 
                          flex: '1 1 200px',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          background: '#fff', 
                          padding: '10px 14px', 
                          borderRadius: '10px',
                          border: '1px solid #DCFCE7',
                          boxShadow: '0 2px 6px rgba(22,101,52,0.05)'
                        }}>
                          <span style={{ fontSize: '20px' }}>🌱</span>
                          <div>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#166534', fontWeight: 900 }}>Éco-responsable</strong>
                            <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 600 }}>Sourcing durable & respectueux</span>
                          </div>
                        </div>
                      )}
                      {isTunisian && (
                        <div style={{ 
                          flex: '1 1 200px',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          background: '#fff', 
                          padding: '10px 14px', 
                          borderRadius: '10px',
                          border: '1px solid #FFE4E6',
                          boxShadow: '0 2px 6px rgba(227,30,36,0.05)'
                        }}>
                          <span style={{ fontSize: '20px' }}>🇹🇳</span>
                          <div>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#9F1239', fontWeight: 900 }}>Produit Tunisien</strong>
                            <span style={{ fontSize: '11px', color: '#BE123C', fontWeight: 600 }}>Production locale de proximité</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={{ padding: '20px 0', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', marginBottom: '24px' }}>
                {!isVendor ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Main Price */}
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Prix unitaire</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 900, color: '#E31E24' }}>{fmt(product.discountPrice || product.price)}</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#E31E24' }}>DT</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#9CA3AF' }}>/ {product.unit || 'unité'}</span>
                      </div>
                    </div>

                    {/* Discount badge if applicable */}
                    {product.discountPrice && Number(product.discountPrice) < Number(product.price) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#9CA3AF', textDecoration: 'line-through' }}>{fmt(product.price)} DT</span>
                        <span style={{ 
                          background: '#FEF2F2', color: '#E31E24', fontWeight: 800, fontSize: '12px', 
                          padding: '4px 10px', borderRadius: '100px'
                        }}>
                          -{Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100)}%
                        </span>
                      </div>
                    )}
                    
                    {/* MOQ info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', fontWeight: 600, background: '#F9FAFB', padding: '8px 14px', borderRadius: '8px', width: 'fit-content' }}>
                      <ShoppingCart size={14} />
                      <span>Commande minimum : <strong style={{ color: '#111827' }}>{product.minOrderQty} {product.unit || 'unité'}(s)</strong></span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#E31E24' }}>
                    Prix sur demande
                  </div>
                )}
              </div>

              {!isVendor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: '#F9FAFB', padding: '12px 20px', borderRadius: '12px', width: 'fit-content' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#6B7280' }}>Quantité:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <button 
                      onClick={() => setQty(Math.max(minQty, qty - 1))}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                     >
                       <Minus size={16} />
                     </button>
                     <span style={{ fontSize: '18px', fontWeight: 800, color: '#111827', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                     <button 
                      onClick={() => setQty(qty + 1)}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                     >
                       <Plus size={16} />
                     </button>
                  </div>
                </div>
              )}

              <div className="mkt-product-actions">
                <button 
                  onClick={() => {
                    addToCart(product, qty);
                    const btn = document.getElementById('add-to-cart-btn');
                    if (btn) {
                      const oldText = btn.innerHTML;
                      btn.innerHTML = '<span style="display:flex;align-items:center;gap:8px;"><svg size="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg> Ajouté !</span>';
                      setTimeout(() => { btn.innerHTML = oldText; }, 2000);
                    }
                  }}
                  id="add-to-cart-btn"
                  style={{ flex: 1, height: '64px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(227,30,36,0.25)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(227,30,36,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(227,30,36,0.25)'; }}
                >
                  {isVendor ? 'Contacter Vendeur' : 'Ajouter au Panier'}
                </button>
                <button 
                  onClick={() => setTradeMessagerOpen(true)}
                  style={{ flex: 1, height: '64px', background: '#fff', color: '#111827', border: '2px solid #F1F5F9', borderRadius: '16px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
                >
                  <MessageSquare size={20} className="text-indigo-600" />
                  Discuter
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', margin: 0 }}>
                Vous hésitez encore ? <Link href="#" style={{ color: '#E31E24', fontWeight: 700, textDecoration: 'none' }}>Demande d'Échantillon</Link>
              </p>
            </div>

            {/* Product Details Section */}
            {(product.description || product.specifications) && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Détails du Produit</h2>
                  <ChevronRight size={18} color="#9CA3AF" />
                </div>

                {product.description && (
                  <div style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6, marginBottom: '24px' }}>
                    {product.description}
                  </div>
                )}

                {product.specifications && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(product.specifications).map(([key, value]: any) => (
                      <div key={key} style={{ display: 'flex', fontSize: '14px' }}>
                        <span style={{ width: '150px', color: '#6B7280', fontWeight: 600 }}>{key}:</span>
                        <span style={{ color: '#111827', fontWeight: 700 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bundle Items Section */}
            {product.isBundle && product.items && product.items.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                   <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Contenu du pack</h2>
                   <Package size={18} color="#9CA3AF" />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {product.items.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#fff', padding: '4px', border: '1px solid #E5E7EB' }}>
                          <img src={sanitizeUrl(item.vendorProduct?.image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.vendorProduct?.name}</h4>
                          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Quantité : {Number(item.quantity)} {item.vendorProduct?.unit || 'unité'}</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Vendor Card */}
            <Link 
              href={`/marketplace/vendor/${product.vendorId}`}
              style={{ 
                textDecoration: 'none', 
                display: 'block', 
                background: '#F9FAFB', 
                borderRadius: '16px', 
                padding: '24px', 
                border: '1px solid #F1F5F9',
                transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                cursor: 'pointer'
              }}
              className="hover-vendor-card"
            >
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <Building2 size={24} color="#E31E24" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>{maskName(product.vendor?.companyName)}</h4>
                      <ChevronRight size={14} color="#E31E24" />
                    </div>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>{identityVisible ? 'Société Commerciale' : 'Fournisseur Vérifié'}</span>
                  </div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginRight: '8px' }}>Évaluation</span>
                  {[1,2,3,4].map(i => <Star key={i} size={14} fill="#E31E24" color="#E31E24" />)}
                  <Star size={14} fill="#E5E7EB" color="#E5E7EB" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827', marginLeft: '8px' }}>4.5</span>
                  <ChevronRight size={14} color="#E31E24" />
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
                    <ShieldCheck size={16} color="#2563EB" />
                    <span style={{ color: '#111827' }}>{identityVisible ? 'Membre Diamant' : 'Membre Vérifié'}</span>
                    <span style={{ color: '#6B7280' }}>{identityVisible ? 'Depuis 2025' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
                    <CheckCircle2 size={16} color="#F59E0B" />
                    <span style={{ color: '#111827' }}>{identityVisible ? 'Fournisseur Audité' : 'Qualité Garantie'}</span>
                  </div>
               </div>
            </Link>

          </div>
        </div>

        {/* Spotlight Section */}
        {relatedProducts.length > 0 && (
          <section style={{ background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Spotlight</h2>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, maxWidth: '900px' }}>
                Découvrez des produits complémentaires dans la catégorie {product.category?.name || 'similaire'}. Sourcing professionnel direct.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <div 
                ref={scrollRef}
                style={{ 
                  display: 'flex', 
                  gap: '24px', 
                  overflowX: 'auto', 
                  scrollBehavior: 'smooth',
                  padding: '12px 4px',
                  scrollbarWidth: 'none',
                }}
                className="no-scrollbar"
              >
                {relatedProducts.map((p, i) => (
                  <Link 
                    key={p.id} 
                    href={`/marketplace/product/${p.id}`}
                    style={{ 
                      flex: '0 0 240px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '16px', 
                      cursor: 'pointer',
                      textDecoration: 'none',
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid #F1F5F9',
                      transition: 'all 0.3s'
                    }}
                    className="hover-shadow-premium"
                  >
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '1/1', 
                      background: '#F9FAFB', 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '12px'
                    }}>
                      <img 
                        src={sanitizeUrl(p.image) || '/images/elkassa-logo.png'} 
                        alt={p.name || ''} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {p.category?.name || 'Catégorie'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px' }}>
                          <Star size={10} fill="#E31E24" color="#E31E24" />
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#E31E24' }}>4.8</span>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#111827', 
                        fontWeight: 700, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden', 
                        lineHeight: 1.3,
                        minHeight: '36px'
                      }}>
                        {(p.name || '').split(' - ')[0].split(' #')[0] || 'Produit'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginBottom: '4px' }}>
                        <Building2 size={12} color="#94A3B8" />
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{maskName(p.vendor?.companyName)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>
                          {isVendor ? 'Prix sur demande' : `${fmt(p.price)} DT`}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                          {p.minOrderQty} {p.unit || 'pièce'}(s) (MOQ)
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={() => scroll('left')}
                style={{ position: 'absolute', left: '-20px', top: '40%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <ChevronLeft size={24} color="#374151" />
              </button>
              <button 
                onClick={() => scroll('right')}
                style={{ position: 'absolute', right: '-20px', top: '40%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <ChevronRight size={24} color="#374151" />
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Floating Messenger Bar */}
      <div className="mkt-trade-float">
         {tradeMessagerOpen && (
           <div className="mkt-trade-panel" style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
             <div style={{ background: '#111827', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <MessageSquare size={18} />
                 <span style={{ fontWeight: 800 }}>TradeMessager</span>
               </div>
               <button onClick={() => setTradeMessagerOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={18} /></button>
             </div>
             <div style={{ padding: '20px', flex: 1, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
               <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', background: '#FEF2F2', padding: '12px', borderRadius: '8px', border: '1px solid #FEE2E2' }}>
                 <strong style={{ color: '#E31E24' }}>Sécurité B2B :</strong> Les numéros de téléphone et adresses emails sont automatiquement filtrés pour garantir la sécurité des transactions sur la plateforme.
               </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>Sujet : {product.name}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Vendeur : {maskName(product.vendor?.companyName || product.vendor?.name)}</p>
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
         <button onClick={() => setTradeMessagerOpen(!tradeMessagerOpen)} style={{ height: '48px', padding: '0 24px', background: '#111827', color: '#fff', border: 'none', borderRadius: '100px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '14px' }}>
            <MessageSquare size={16} />
            TradeMessager
         </button>
      </div>

      <MarketplaceFooter />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hover-shadow-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #E31E24 !important;
        }
        .hover-vendor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -10px rgba(227, 30, 36, 0.15);
          border-color: #E31E24 !important;
          background: #FFF8F8 !important;
        }
      `}</style>
    </div>
  );
}
