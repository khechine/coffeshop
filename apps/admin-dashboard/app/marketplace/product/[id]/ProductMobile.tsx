'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Share2, Heart, ShoppingCart, 
  MessageSquare, ChevronRight, Star, ShieldCheck,
  CheckCircle2, Building2, MapPin, Zap, Truck,
  Plus, Minus, X
} from 'lucide-react';
import { sanitizeUrl } from '../../../lib/imageUtils';
import { sendTradeMessageAction } from '../../../actions';
import { useVault } from '../../VaultContext';
import VaultReveal from '../../components/VaultReveal';

const fmt = (n: any) => Number(n).toFixed(2);

export default function ProductMobile({ product, isVendor, relatedProducts = [] }: any) {
  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [tradeMessagerOpen, setTradeMessagerOpen] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  
  const { maskName, identityVisible } = useVault(product.vendorId, product.vendor?.isPremium);


  const gallery = [product.image, ...(product.images || [])].filter(Boolean);

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
        alert("Message envoyé !");
        setTradeMessagerOpen(false);
        setTradeMessage('');
      }
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setIsSendingMsg(false);
    }
  };

  return (
    <div style={{ background: '#F4F4F4', minHeight: '100vh', paddingBottom: '100px', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 1000, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <Link href="/marketplace" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', textDecoration: 'none' }}>
          <ArrowLeft size={22} />
        </Link>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F9FAFB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}>
            <Share2 size={20} />
          </button>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F9FAFB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}>
            <Heart size={20} />
          </button>
          <Link href="/marketplace/cart" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', textDecoration: 'none' }}>
            <ShoppingCart size={20} />
          </Link>
        </div>
      </div>

      {/* Image Carousel */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#fff', marginTop: '50px' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }} className="no-scrollbar">
          {gallery.map((img, i) => (
            <div key={i} style={{ minWidth: '100%', height: '100%', scrollSnapAlign: 'start' }}>
              <img src={sanitizeUrl(img)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="prod" />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>
          {activeImageIdx + 1} / {gallery.length}
        </div>
      </div>

      {/* Product Info Section */}
      <div style={{ background: '#fff', padding: '16px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#E31E24' }}>{fmt(product.discountPrice || product.price)}</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#E31E24' }}>DT</span>
          <span style={{ fontSize: '12px', color: '#999', marginLeft: '4px' }}>/ {product.unit || 'pièce'}</span>
        </div>
        
        <div style={{ fontSize: '13px', color: '#666', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ background: '#F9FAFB', padding: '4px 8px', borderRadius: '4px' }}>Min. Order: {product.minOrderQty} {product.unit || 'unit'}(s)</span>
        </div>

        <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', lineHeight: 1.4, margin: '0 0 12px' }}>
          {product.name}
        </h1>

        <div style={{ display: 'flex', gap: '12px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F0FDF4', color: '#16A34A', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
             <ShieldCheck size={12} /> Verified
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', color: '#E31E24', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
             <Star size={12} fill="#E31E24" /> 4.8 (120+)
           </div>
        </div>
      </div>

      {/* Vendor Section */}
      <Link href={`/marketplace/vendor/${product.vendor?.id}`} style={{ background: '#fff', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', textDecoration: 'none' }}>
        <div style={{ width: '40px', height: '40px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={24} color="#666" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
            {maskName(product.vendor?.companyName)}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>{identityVisible ? product.vendor?.city : 'Ville masquée'} • {identityVisible ? 'Diamond Member' : 'Membre Vérifié'}</div>
        </div>
        <ChevronRight size={20} color="#ccc" />
      </Link>

      {/* Specifications */}
      <div style={{ background: '#fff', padding: '16px', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '16px' }}>Specifications</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           {[
             { label: 'Matériau', value: 'Acier Inoxydable' },
             { label: 'Certification', value: 'CE, ISO9001' },
             { label: 'Garantie', value: '2 Ans' },
             { label: 'Origine', value: 'Tunisie' }
           ].map((spec, i) => (
             <div key={i} style={{ display: 'flex', fontSize: '13px' }}>
               <span style={{ width: '120px', color: '#999', fontWeight: 600 }}>{spec.label}</span>
               <span style={{ color: '#333', fontWeight: 700 }}>{spec.value}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Recommendation Section */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '16px' }}>Produits Similaires</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {relatedProducts.slice(0, 4).map((p: any, i: number) => (
            <Link key={i} href={`/marketplace/product/${p.id}`} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none' }}>
              <div style={{ width: '100%', aspectRatio: '1/1' }}>
                <img src={sanitizeUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="rel" />
              </div>
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>{p.name}</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#E31E24', marginTop: '4px' }}>{fmt(p.price)} DT</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F1F5F9', padding: '16px 20px', display: 'flex', gap: '12px', zIndex: 1000, boxShadow: '0 -10px 25px rgba(0,0,0,0.05)' }}>
        <div 
          onClick={() => setTradeMessagerOpen(true)}
          style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F9FAFB', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0, cursor: 'pointer' }}
        >
          <MessageSquare size={24} />
        </div>
        <button 
          style={{ flex: 1, height: '56px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 900, boxShadow: '0 8px 16px rgba(227,30,36,0.2)' }}
        >
          {isVendor ? 'Contacter' : 'Ajouter au Panier'}
        </button>
      </div>

      {/* TradeMessager Mobile Drawer */}
      {tradeMessagerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
           <div style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '32px 24px', position: 'relative', animation: 'slideUp 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#111827' }}>Contacter le fournisseur</h3>
                 <button onClick={() => setTradeMessagerOpen(false)} style={{ background: '#F9FAFB', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}><X size={20} /></button>
              </div>
              <div style={{ background: '#EEF2FF', padding: '14px 16px', borderRadius: '14px', marginBottom: '24px', fontSize: '13px', color: '#4338CA', border: '1px solid #C7D2FE', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} />
                <span>Vos coordonnées sont protégées et masquées automatiquement.</span>
              </div>
              <textarea 
                value={tradeMessage}
                onChange={e => setTradeMessage(e.target.value)}
                placeholder="Ex: Bonjour, je souhaiterais obtenir plus d'informations sur ce produit..."
                style={{ width: '100%', height: '140px', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '16px', outline: 'none', fontSize: '15px', fontFamily: 'inherit', resize: 'none', background: '#F9FAFB' }}
              />
              <button 
                onClick={handleSendTradeMessage}
                disabled={isSendingMsg || !tradeMessage.trim()}
                style={{ width: '100%', height: '58px', background: '#E31E24', color: '#fff', borderRadius: '16px', fontWeight: 900, border: 'none', marginTop: '20px', fontSize: '16px', boxShadow: '0 8px 20px rgba(227,30,36,0.25)', opacity: isSendingMsg ? 0.7 : 1 }}
              >
                {isSendingMsg ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
           </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

