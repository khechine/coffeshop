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

const fmt = (n: any) => Number(n).toFixed(2);

export default function ProductMobile({ product, isVendor, relatedProducts = [] }: any) {
  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [tradeMessagerOpen, setTradeMessagerOpen] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '50px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 1000, borderBottom: '1px solid #eee' }}>
        <Link href="/marketplace" style={{ color: '#333' }}><ArrowLeft size={24} /></Link>
        <div style={{ display: 'flex', gap: '20px', color: '#333' }}>
          <Share2 size={22} />
          <Heart size={22} />
          <Link href="/marketplace/cart" style={{ color: '#333', position: 'relative' }}>
            <ShoppingCart size={22} />
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
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{product.vendor?.companyName}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{product.vendor?.city} • Diamond Member</div>
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
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: '12px 16px', display: 'flex', gap: '12px', zIndex: 1000 }}>
        <div 
          onClick={() => setTradeMessagerOpen(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#666', cursor: 'pointer' }}
        >
          <MessageSquare size={20} />
          <span style={{ fontSize: '10px', fontWeight: 800 }}>Chat</span>
        </div>
        <button 
          onClick={() => setTradeMessagerOpen(true)}
          style={{ flex: 1, background: '#111827', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '14px' }}
        >
          Contacter
        </button>
        <button 
          style={{ flex: 1, background: '#E31E24', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '14px' }}
        >
          Inquiry
        </button>
      </div>

      {/* TradeMessager Mobile Drawer */}
      {tradeMessagerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
           <div style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 950 }}>Contact Supplier</h3>
                 <button onClick={() => setTradeMessagerOpen(false)} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
              </div>
              <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '12px', color: '#666', border: '1px solid #eee' }}>
                <strong>Note:</strong> Your personal contact info will be masked to ensure secure platform communication.
              </div>
              <textarea 
                value={tradeMessage}
                onChange={e => setTradeMessage(e.target.value)}
                placeholder="Hi, I'm interested in this product..."
                style={{ width: '100%', height: '120px', borderRadius: '12px', border: '1px solid #ddd', padding: '12px', outline: 'none', fontSize: '14px' }}
              />
              <button 
                onClick={handleSendTradeMessage}
                disabled={isSendingMsg || !tradeMessage.trim()}
                style={{ width: '100%', height: '50px', background: '#E31E24', color: '#fff', borderRadius: '100px', fontWeight: 800, border: 'none', marginTop: '16px', opacity: isSendingMsg ? 0.5 : 1 }}
              >
                {isSendingMsg ? 'Sending...' : 'Send Inquiry Now'}
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
