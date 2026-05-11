'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Play, Maximize2, MessageCircle, Star, Loader2 } from 'lucide-react';
import { sanitizeUrl } from '../../lib/imageUtils';
import { useVault } from '../VaultContext';
import { sendTradeMessageAction } from '../../actions';

const fmt = (n: any) => Number(n).toFixed(2);

interface MarketplaceProductCardProps {
  product: any;
  isVendor?: boolean;
  hidePrice?: boolean;
}

export default function MarketplaceProductCard({ product, isVendor = false, hidePrice = false }: MarketplaceProductCardProps) {
  const { maskName, identityVisible } = useVault(product.vendorId, product.vendor?.isPremium);
  const [isChatLoading, setIsChatLoading] = React.useState(false);

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isChatLoading) return;
    setIsChatLoading(true);
    try {
      await sendTradeMessageAction({
        receiverId: product.vendor.userId,
        productId: product.id,
        content: `Bonjour, je suis intéressé par votre produit : ${product.name}. Pouvez-vous m'en dire plus ?`
      });
      window.location.href = `/marketplace/messages?userId=${product.vendor.userId}`;
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Non authentifié') || err.message?.includes('Non autorisé')) {
        window.location.href = '/login';
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  
  return (
    <div 
      style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        border: '1px solid #E5E7EB', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        transition: 'all 0.3s ease',
        height: '100%'
      }} 
      className="mkt-prof-card"
    >
      {/* Media Container */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#F9FAFB' }}>
        <img 
          src={sanitizeUrl(product.image) || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'} 
          alt={product.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        
        {/* Favorite Icon */}
        <button style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
          <Heart size={16} color="#6B7280" />
        </button>

        {/* Eco Badge */}
        {product.vendor?.isEcoResponsible && (
          <div style={{ 
            position: 'absolute', top: '12px', left: '12px', 
            background: '#DCFCE7', color: '#166534', 
            padding: '4px 10px', borderRadius: '100px', 
            fontSize: '11px', fontWeight: 800, 
            display: 'flex', alignItems: 'center', gap: '4px', 
            zIndex: 2, border: '1px solid #BBF7D0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            🌱 Éco-responsable
          </div>
        )}

        {/* Tunisia Badge */}
        {product.tags?.some((t: string) => t.includes('Tunis') || t.includes('🇹🇳')) && (
          <div style={{ 
            position: 'absolute', 
            top: product.vendor?.isEcoResponsible ? '44px' : '12px', 
            left: '12px', 
            background: '#FFF1F2', color: '#E31E24', 
            padding: '4px 10px', borderRadius: '100px', 
            fontSize: '11px', fontWeight: 800, 
            display: 'flex', alignItems: 'center', gap: '4px', 
            zIndex: 2, border: '1px solid #FECACA',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            🇹🇳 Produit Tunisien
          </div>
        )}

        {/* Media Overlays */}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700 }}>
          <Play size={10} fill="#fff" /> 1/6
        </div>
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', color: '#fff', cursor: 'pointer' }}>
          <Maximize2 size={18} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <Link href={`/marketplace/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: 800, 
            color: '#111827', 
            margin: 0, 
            lineHeight: 1.4, 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden', 
            minHeight: '42px' 
          }}>
            {product.name}
          </h3>
        </Link>

        <div>
          {!hidePrice ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>{fmt(product.price)} DT</span>
                <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>/ {product.unit || 'Pièce'}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '4px' }}>
                {product.minOrderQty} {product.unit || 'Pièces'} (MOQ)
              </div>
            </>
          ) : (
            <div style={{ fontSize: '14px', color: '#E31E24', fontWeight: 800, padding: '8px 0' }}>
              Prix sur demande
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
          {!isVendor && (
            <Link 
              href={`/marketplace/product/${product.id}`}
              className="btn-decouvrir"
              style={{ flex: 1, height: '36px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: '100px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              Découvrir
            </Link>
          )}
          <button 
            onClick={handleStartChat}
            disabled={isChatLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: isChatLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, color: '#374151', textDecoration: 'none', opacity: isChatLoading ? 0.5 : 1 }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            </div>
            Chat
          </button>
        </div>

        {/* Supplier Info */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
          <Link 
            href={`/marketplace/vendor/${product.vendorId}`}
            style={{ fontSize: '13px', color: '#111827', fontWeight: 700, textDecoration: 'none', display: 'block', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {maskName(product.vendor?.companyName)}
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, color: '#E31E24' }}>
               AUDITÉ
             </div>
             
             {product.vendor?.isPremium && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                 <Star size={10} fill="#2563EB" color="#2563EB" />
                 <span style={{ fontSize: '10px', fontWeight: 900, color: '#1C4ED8', textTransform: 'uppercase' }}>Premium</span>
               </div>
             )}
             
             {product.vendor?.city && (
               <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>• {identityVisible ? product.vendor.city : 'Ville masquée'}</span>
             )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mkt-prof-card:hover {
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          transform: translateY(-4px);
          border-color: #D1D5DB;
        }
        .btn-decouvrir {
          transition: all 0.2s ease;
        }
        .btn-decouvrir:hover {
          background: #C81A20 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(227, 30, 36, 0.3);
        }
      `}</style>
    </div>
  );
}

