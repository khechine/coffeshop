'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Share2, Heart, ShoppingCart,
  MessageSquare, ChevronRight, Star, ShieldCheck,
  Building2, Plus, Minus, X,
} from 'lucide-react';
import { sanitizeUrl } from '../../../lib/imageUtils';
import { sendTradeMessageAction } from '../../../actions';
import { useVault } from '../../VaultContext';
import { useCart } from '../../CartContext';
import CartDrawer from '../../CartDrawer';
import '../../marketplace-mobile-mic.css';

const fmt = (n: any) => Number(n).toFixed(2);

export default function ProductMobile({ product, isVendor, relatedProducts = [] }: any) {
  const minQty = product.minOrderQty ? Number(product.minOrderQty) : 1;
  const [qty, setQty] = useState(minQty);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [tradeMessagerOpen, setTradeMessagerOpen] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const { addToCart, cartCount } = useCart();
  const { maskName, identityVisible } = useVault(product.vendorId, product.vendor?.isPremium);

  const gallery = [
    sanitizeUrl(product.image),
    ...(product.images || []).map((img: string) => sanitizeUrl(img)),
  ].filter(Boolean) as string[];

  const specs = product.specifications
    ? Object.entries(product.specifications)
    : [
        ['Catégorie', product.category?.name || '—'],
        ['Unité', product.unit || 'pièce'],
        ['Origine', product.vendor?.city || 'Tunisie'],
      ];

  const scrollToImage = (idx: number) => {
    setActiveImageIdx(idx);
    if (galleryRef.current) {
      galleryRef.current.scrollTo({ left: idx * galleryRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  const handleGalleryScroll = () => {
    if (!galleryRef.current) return;
    const idx = Math.round(galleryRef.current.scrollLeft / galleryRef.current.clientWidth);
    setActiveImageIdx(idx);
  };

  const handleSendTradeMessage = async () => {
    if (!tradeMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      const res = await sendTradeMessageAction({
        receiverId: product.vendor?.userId || '',
        productId: product.id,
        content: tradeMessage,
      });
      if (res.success) {
        alert('Message envoyé !');
        setTradeMessagerOpen(false);
        setTradeMessage('');
      }
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, qty);
    setCartOpen(true);
  };

  const displayPrice = product.discountPrice || product.price;

  return (
    <div className="mic-pdp">
      <div className="mic-pdp-top">
        <Link href={product.categoryId ? `/marketplace/category/${product.category?.slug || product.categoryId}` : '/marketplace'} aria-label="Retour">
          <ArrowLeft size={20} />
        </Link>
        <div className="mic-pdp-top-actions">
          <button type="button" aria-label="Partager">
            <Share2 size={18} />
          </button>
          <button type="button" aria-label="Favoris">
            <Heart size={18} />
          </button>
          <Link href="/marketplace/cart" aria-label="Panier" style={{ position: 'relative', display: 'flex', color: 'inherit', textDecoration: 'none' }}>
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#e31e24', color: '#fff', fontSize: 9, fontWeight: 900, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <section className="mic-pdp-gallery">
        <div
          ref={galleryRef}
          className="mic-pdp-gallery-track mic-no-scrollbar"
          onScroll={handleGalleryScroll}
        >
          {gallery.map((img, i) => (
            <div key={i} className="mic-pdp-gallery-slide">
              <img src={img} alt={product.name} />
            </div>
          ))}
        </div>
        {gallery.length > 1 && (
          <span className="mic-pdp-counter">
            {activeImageIdx + 1} / {gallery.length}
          </span>
        )}
        {gallery.length > 1 && (
          <div className="mic-pdp-thumbs mic-no-scrollbar">
            {gallery.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`mic-pdp-thumb ${activeImageIdx === i ? 'active' : ''}`}
                onClick={() => scrollToImage(i)}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mic-pdp-block">
        {!isVendor ? (
          <>
            <div className="mic-pdp-price">
              {fmt(displayPrice)} <span>DT / {product.unit || 'pièce'}</span>
            </div>
            {product.discountPrice && Number(product.discountPrice) < Number(product.price) && (
              <div style={{ fontSize: 13, color: '#999', textDecoration: 'line-through', marginBottom: 6 }}>
                {fmt(product.price)} DT
              </div>
            )}
          </>
        ) : (
          <div className="mic-pdp-price" style={{ fontSize: 16 }}>Prix sur demande</div>
        )}
        <div className="mic-pdp-moq">
          Commande min. : {product.minOrderQty || 1} {product.unit || 'unité'}(s)
        </div>
        <h1 className="mic-pdp-title">{product.name}</h1>
        <div className="mic-pdp-badges">
          <span className="mic-pdp-badge" style={{ background: '#ecfdf5', color: '#166534' }}>
            <ShieldCheck size={12} /> Fournisseur vérifié
          </span>
          <span className="mic-pdp-badge" style={{ background: '#fef2f2', color: '#e31e24' }}>
            <Star size={12} fill="#e31e24" /> 4.8
          </span>
        </div>
        {!isVendor && (
          <div className="mic-pdp-qty">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#666' }}>Quantité</span>
            <button type="button" onClick={() => setQty(Math.max(minQty, qty - 1))} aria-label="Moins">
              <Minus size={16} />
            </button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty(qty + 1)} aria-label="Plus">
              <Plus size={16} />
            </button>
          </div>
        )}
      </section>

      {product.vendor && (
        <section className="mic-pdp-block">
          <Link href={`/marketplace/vendor/${product.vendor.id}`} className="mic-pdp-vendor">
            <div className="mic-pdp-vendor-logo">
              {product.vendor.logoUrl ? (
                <img src={sanitizeUrl(product.vendor.logoUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Building2 size={22} color="#999" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h4>{maskName(product.vendor.companyName)}</h4>
              <p>
                {identityVisible ? product.vendor.city : 'Ville masquée'} ·{' '}
                {identityVisible ? 'Membre premium' : 'Membre vérifié'}
              </p>
            </div>
            <ChevronRight size={18} color="#ccc" />
          </Link>
        </section>
      )}

      {(product.description || specs.length > 0) && (
        <section className="mic-pdp-block">
          <h3 style={{ fontSize: 14, fontWeight: 900, margin: '0 0 12px' }}>Détails du produit</h3>
          {product.description && (
            <p className="mic-pdp-desc" style={{ marginBottom: specs.length ? 16 : 0 }}>
              {product.description}
            </p>
          )}
          <dl style={{ margin: 0 }}>
            {specs.map(([key, value]: any) => (
              <div key={key} className="mic-pdp-spec-row">
                <dt>{key}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Bundle Items Section */}
      {product.isBundle && product.items && product.items.length > 0 && (
        <section className="mic-pdp-block">
          <h3 style={{ fontSize: 14, fontWeight: 900, margin: '0 0 12px' }}>Contenu du pack</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {product.items.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '4px', padding: '2px', border: '1px solid #E5E7EB' }}>
                  <img src={sanitizeUrl(item.vendorProduct?.image)} alt={item.vendorProduct?.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#333', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.vendorProduct?.name}</div>
                  <div style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Qté: {Number(item.quantity)} {item.vendorProduct?.unit || 'unité'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mic-section">
          <div className="mic-section-title-row">
            <h2 className="mic-section-title" style={{ margin: 0 }}>Produits similaires</h2>
            <Link href={`/marketplace/category/${product.category?.slug || product.categoryId}`} className="mic-see-all">
              Voir plus
            </Link>
          </div>
          <div className="mic-product-grid" style={{ padding: 0 }}>
            {relatedProducts.slice(0, 6).map((p: any) => (
              <Link key={p.id} href={`/marketplace/product/${p.id}`} className="mic-product-card">
                <div className="mic-p-img">
                  <img src={sanitizeUrl(p.image)} alt={p.name} />
                </div>
                <div className="mic-p-body">
                  <h4>{p.name}</h4>
                  {!isVendor && <div className="mic-p-price">{fmt(p.price)} DT</div>}
                  <div className="mic-p-moq">MOQ {p.minOrderQty || 1}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mic-pdp-sticky">
        <button type="button" className="mic-pdp-sticky-chat" onClick={() => setTradeMessagerOpen(true)} aria-label="Discuter">
          <MessageSquare size={22} />
        </button>
        <button
          type="button"
          className="mic-pdp-sticky-cart"
          onClick={isVendor ? () => setTradeMessagerOpen(true) : handleAddToCart}
        >
          {isVendor ? 'Contacter le fournisseur' : 'Ajouter au panier'}
        </button>
      </div>

      {tradeMessagerOpen && (
        <div className="mic-pdp-sheet-overlay" onClick={() => setTradeMessagerOpen(false)} role="presentation">
          <div className="mic-pdp-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Contacter le fournisseur</h3>
              <button type="button" onClick={() => setTradeMessagerOpen(false)} style={{ background: '#f5f5f5', border: 'none', width: 32, height: 32, borderRadius: 4, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="mic-pdp-sheet-notice">
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>Vos coordonnées sont protégées et masquées automatiquement sur la plateforme.</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#444', margin: '0 0 8px' }}>Sujet : {product.name}</p>
            <textarea
              value={tradeMessage}
              onChange={(e) => setTradeMessage(e.target.value)}
              placeholder="Bonjour, je souhaite obtenir un devis pour ce produit…"
            />
            <button
              type="button"
              className="mic-pdp-sheet-send"
              onClick={handleSendTradeMessage}
              disabled={isSendingMsg || !tradeMessage.trim()}
            >
              {isSendingMsg ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </div>
      )}

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </div>
  );
}
