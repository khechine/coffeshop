'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShoppingCart, Star, ShieldCheck, 
  Truck, RefreshCw, Plus, Minus, MessageSquare,
  ChevronRight, Building2, LayoutGrid, ShoppingBag,
  Heart, Share2, Play, CheckCircle2, ChevronDown, 
  MapPin, Globe, Headphones, ArrowUp, ChevronLeft
} from 'lucide-react';
import { useCart } from '../../CartContext';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import MarketplaceFooter from '../../components/MarketplaceFooter';
import { sanitizeUrl } from '../../../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(2);

export default function ProductDetailClient({ product, isVendor = false, relatedProducts = [] }: { product: any; isVendor?: boolean; relatedProducts?: any[] }) {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const imageUrl = sanitizeUrl(product.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800';
  const gallery = [imageUrl, ...(product.images || []).map((img: string) => sanitizeUrl(img))].filter(Boolean);
  const [activeImage, setActiveImage] = useState(gallery[0]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader isVendor={isVendor} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* Breadcrumbs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>
          <Link href="/marketplace" style={{ color: '#6B7280', textDecoration: 'none' }}>Accueil</Link>
          <ChevronRight size={14} />
          <Link href={`/marketplace/category/${product.category?.slug || product.categoryId}`} style={{ color: '#6B7280', textDecoration: 'none' }}>{product.category?.name || 'Catégorie'}</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#111827', fontWeight: 600 }}>Détail Produit</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '48px', alignItems: 'start', marginBottom: '48px' }}>
          
          {/* Left Column: Media & Gallery */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#F9FAFB', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <img 
                  src={activeImage} 
                  alt={product.name} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
               />
               
               {/* Overlay Icons */}
               <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Heart size={20} color="#374151" />
                  </button>
                  <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Share2 size={20} color="#374151" />
                  </button>
               </div>

               {/* Play Button Overlay */}
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                  <Play size={32} fill="#fff" color="#fff" />
               </div>

               {/* Navigation Arrows */}
               <button style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={24} color="#374151" />
               </button>
            </div>

            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }} className="no-scrollbar">
               {gallery.map((img, i) => (
                 <button 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '8px', 
                    border: activeImage === img ? '2px solid #E31E24' : '1px solid #E5E7EB', 
                    padding: '4px', 
                    background: '#fff',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                 >
                   <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                 </button>
               ))}
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>U</div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Verified Supplier</span>
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.3, marginBottom: '20px' }}>
                {product.name}
              </h1>

              <div style={{ padding: '20px 0', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', marginBottom: '24px' }}>
                {!isVendor ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>{fmt(product.price * 0.8)} - {fmt(product.price)}</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>DT</span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>{product.minOrderQty} {product.unit} (MOQ)</span>
                  </>
                ) : (
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#E31E24' }}>
                    Prix sur demande
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <button 
                  onClick={() => addToCart(product)}
                  style={{ flex: 1, height: '56px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: '100px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s' }}
                >
                  Envoyer demande
                </button>
                <button style={{ flex: 1, height: '56px', background: '#fff', color: '#111827', border: '1px solid #E5E7EB', borderRadius: '100px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563EB' }} />
                  Discuter
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', margin: 0 }}>
                Vous hésitez encore ? <Link href="#" style={{ color: '#E31E24', fontWeight: 700, textDecoration: 'none' }}>Demande d'Échantillon</Link>
              </p>
            </div>

            {/* Product Details Section */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Détails du Produit</h2>
                <ChevronRight size={18} color="#9CA3AF" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Personnalisation:', value: 'Disponible' },
                  { label: 'Certificat:', value: 'ISO, FDA' },
                  { label: 'Méthode de dosage:', value: 'HPLC' },
                  { label: 'Pureté:', value: '98%+' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', fontSize: '14px' }}>
                    <span style={{ width: '150px', color: '#6B7280', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Card */}
            <div style={{ background: '#F9FAFB', borderRadius: '16px', padding: '24px', border: '1px solid #F1F5F9' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <Building2 size={24} color="#E31E24" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>{product.vendor?.companyName}</h4>
                      <ChevronRight size={14} color="#9CA3AF" />
                    </div>
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Société Commerciale</span>
                  </div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginRight: '8px' }}>Évaluation</span>
                  {[1,2,3,4].map(i => <Star key={i} size={14} fill="#E31E24" color="#E31E24" />)}
                  <Star size={14} fill="#E5E7EB" color="#E5E7EB" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827', marginLeft: '8px' }}>4.5</span>
                  <ChevronRight size={14} color="#9CA3AF" />
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
                    <ShieldCheck size={16} color="#2563EB" />
                    <span style={{ color: '#111827' }}>Membre Diamant</span>
                    <span style={{ color: '#6B7280' }}>Depuis 2025</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
                    <CheckCircle2 size={16} color="#F59E0B" />
                    <span style={{ color: '#111827' }}>Fournisseur Audité</span>
                  </div>
               </div>
            </div>

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
                  overflowX: 'hidden', 
                  scrollBehavior: 'smooth',
                  padding: '4px'
                }}
              >
                {relatedProducts.map((p, i) => (
                  <Link 
                    key={p.id} 
                    href={`/marketplace/product/${p.id}`}
                    style={{ 
                      flex: '0 0 calc(20% - 20px)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '16px', 
                      cursor: 'pointer',
                      textDecoration: 'none'
                    }}
                  >
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '1/1', 
                      background: '#F9FAFB', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '20px',
                      border: '1px solid #F1F5F9'
                    }}>
                      <img 
                        src={sanitizeUrl(p.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200'} 
                        alt={p.name} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      />
                    </div>
                    <span style={{ 
                      fontSize: '13px', 
                      color: '#111827', 
                      fontWeight: 600, 
                      textAlign: 'center', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden', 
                      lineHeight: 1.4,
                      height: '36px'
                    }}>
                      {p.name}
                    </span>
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
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px' }}>
         <button style={{ height: '48px', padding: '0 24px', background: '#fff', border: 'none', borderRadius: '100px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '14px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB' }} />
            TradeMessager
         </button>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
