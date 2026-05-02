'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShoppingCart, Star, ShieldCheck, 
  Truck, RefreshCcw, Plus, Minus, MessageSquare,
  ChevronRight, Building2, LayoutGrid, ShoppingBag
} from 'lucide-react';
import { useCart } from '../../CartContext';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import MarketplaceFooter from '../../components/MarketplaceFooter';
import '../../marketplace.css';
import { sanitizeUrl } from '../../../lib/imageUtils';

const fmt = (n: any) => Number(n).toFixed(3);

export default function ProductDetailClient({ product, isVendor = false }: { product: any; isVendor?: boolean }) {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  const cust = product.vendor?.customization || {};
  const primaryColor = cust.primaryColor || '#1E1B4B';
  const fontFamily = cust.fontFamily || 'Inter';

  const imageUrl = sanitizeUrl(product.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800';
  
  const gallery = [imageUrl, ...(product.images || []).map((img: string) => sanitizeUrl(img))].filter(Boolean);
  const [activeImage, setActiveImage] = useState(gallery[0]);

  const handleAddToCart = () => {
    // Custom add logic for specific qty
    for(let i=0; i<qty; i++) {
        addToCart(product);
    }
  };

  return (
    <div className="mkt-page cocote-theme" style={{ fontFamily: `${fontFamily}, sans-serif` }}>
      <MarketplaceHeader isVendor={isVendor} />

      <div className="mkt-container" style={{ marginTop: 40, paddingBottom: 80 }}>
        <Link href="/marketplace" className="mkt-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748B', fontWeight: 700, textDecoration: 'none', marginBottom: 24, fontSize: 14 }}>
          <ArrowLeft size={16} /> Retour au Marketplace
        </Link>

        <div className="mkt-product-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 64, background: '#fff', padding: 48, borderRadius: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
          
          {/* Gallery */}
          <div className="mkt-product-gallery">
            <div style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '1/1', background: '#F8FAFC', border: '1px solid #F1F5F9', marginBottom: 16 }}>
               <img src={activeImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }} />
            </div>
            
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
                {gallery.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(img)}
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: 16, 
                      overflow: 'hidden', 
                      border: activeImage === img ? `2px solid ${primaryColor}` : '2px solid transparent',
                      padding: 0,
                      background: '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mkt-product-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
               <Link href={`/marketplace/vendor/${product.vendorId}`} style={{ color: primaryColor, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' }}>
                  {product.vendor?.companyName}
               </Link>
               <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#CBD5E1' }} />
               <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700 }}>{product.category?.name}</span>
            </div>

            <h1 style={{ fontSize: 40, fontWeight: 950, color: '#1E1B4B', margin: '0 0 16px', lineHeight: 1.1 }}>{product.name}</h1>
            
            {product.tags && product.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {product.tags.map((tag: string) => (
                  <span key={tag} style={{ 
                    padding: '6px 12px', 
                    borderRadius: 10, 
                    fontSize: 10, 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    background: tag.toLowerCase().includes('bio') ? '#F0FDF4' : '#F8FAFC',
                    color: tag.toLowerCase().includes('bio') ? '#166534' : '#64748B',
                    border: tag.toLowerCase().includes('bio') ? '1px solid #DCFCE7' : '1px solid #E2E8F0'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Prix Unitaire</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 950, color: '#1E1B4B', filter: isVendor ? 'blur(8px)' : 'none', userSelect: isVendor ? 'none' : 'auto', pointerEvents: isVendor ? 'none' : 'auto' }}>{fmt(product.price)}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#64748B' }}>DT/{product.unit}</span>
                  </div>
               </div>
               {product.minOrderQty > 1 && (
                 <div style={{ paddingLeft: 24, borderLeft: '2px solid #F1F5F9' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Minimum commande</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1E1B4B' }}>{product.minOrderQty} {product.unit}s</div>
                 </div>
               )}
            </div>

            <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.7, marginBottom: 40, whiteSpace: 'pre-line' }}>
              {product.description || "Ce produit premium est sélectionné pour sa qualité exceptionnelle. Contactez le fournisseur pour plus de détails techniques ou des commandes en gros volumes."}
            </p>

            <div style={{ background: '#F8FAFC', padding: 32, borderRadius: 24, marginBottom: 40 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div className="mkt-qty-ctrl" style={{ padding: 4, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14 }}>
                    <button className="mkt-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 40, height: 40 }}>−</button>
                    <span className="mkt-qty-val" style={{ width: 60, fontSize: 18 }}>{qty}</span>
                    <button className="mkt-qty-btn" onClick={() => setQty(qty + 1)} style={{ width: 40, height: 40 }}>+</button>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', display: 'block' }}>Total HT</span>
                    <span style={{ fontSize: 24, fontWeight: 950, color: primaryColor, filter: isVendor ? 'blur(8px)' : 'none', userSelect: isVendor ? 'none' : 'auto', pointerEvents: isVendor ? 'none' : 'auto' }}>{fmt(product.price * qty)} DT</span>
                  </div>
               </div>

               {!isVendor ? (
                 <button 
                  onClick={handleAddToCart}
                  style={{ width: '100%', padding: '20px', background: primaryColor, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: `0 10px 20px ${primaryColor}33` }}
                 >
                    <ShoppingCart size={20} /> AJOUTER AU PANIER
                 </button>
               ) : (
                 <div style={{ background: '#EEF2FF', color: primaryColor, padding: '20px', borderRadius: '16px', textAlign: 'center', fontSize: '15px', fontWeight: 800, border: `1px dashed ${primaryColor}33` }}>
                   Mode Consultation : Connectez-vous en tant qu'acheteur pour commander
                 </div>
               )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', fontSize: 13, fontWeight: 700 }}>
                  <Truck size={16} /> Livraison 24/48h
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', fontSize: 13, fontWeight: 700 }}>
                  <ShieldCheck size={16} /> Paiement Sécurisé
               </div>
            </div>
          </div>
        </div>

        {/* Vendor Card */}
        <div style={{ marginTop: 64, background: '#1E1B4B', padding: 48, borderRadius: 32, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 80, height: 80, background: '#fff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                 {product.vendor?.customization?.logoUrl ? <img src={sanitizeUrl(product.vendor.customization.logoUrl) || ''} style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <Building2 size={32} color="#1E1B4B" />}
              </div>
              <div>
                <h4 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>{product.vendor?.companyName}</h4>
                <p style={{ color: '#94A3B8', fontWeight: 600, margin: 0 }}>Vendeur certifié ElKassa Marketplace</p>
              </div>
           </div>
           <Link href={`/marketplace/vendor/${product.vendorId}`} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 32px', borderRadius: 16, fontWeight: 900, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
              Voir toute la boutique
           </Link>
        </div>
      </div>


      <MarketplaceFooter />
    </div>
  );
}
