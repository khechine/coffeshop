'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, ChevronRight, ShoppingBag, Grid, MessageSquare, User } from 'lucide-react';
import { sanitizeUrl } from '../../../lib/imageUtils';
import '../../marketplace-mobile-mic.css';

export default function CategoryMobile({ category, products = [], subcategories = [], isVendor = false }: any) {
  return (
    <div className="mic-mkt">
      <header className="mic-mkt-header">
        <div className="mic-mkt-header-top" style={{ marginBottom: 10 }}>
          <Link href="/marketplace" style={{ color: '#333', padding: 4 }} aria-label="Retour">
            <ArrowLeft size={22} />
          </Link>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 900, color: '#222', textAlign: 'center' }}>
            {category.name}
          </div>
          <Filter size={22} color="#666" />
        </div>
        <div className="mic-mkt-search">
          <Search size={16} className="mic-search-icon" />
          <input type="search" placeholder={`Rechercher dans ${category.name}`} />
        </div>
      </header>

      {subcategories.length > 0 && (
        <div className="mic-section" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div className="mic-hot-tags mic-no-scrollbar">
            {subcategories.map((sub: any) => (
              <Link
                key={sub.id}
                href={`/marketplace/category/${sub.slug || sub.id}`}
                className="mic-hot-tag"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '12px' }}>
        <div className="mic-section-title-row" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#666' }}>
            {products.length} produit{products.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#888', display: 'flex', alignItems: 'center', gap: 2 }}>
            Trier <ChevronRight size={14} />
          </span>
        </div>

        <div className="mic-product-grid" style={{ padding: 0 }}>
          {products.map((p: any) => (
            <Link key={p.id} href={`/marketplace/product/${p.id}`} className="mic-product-card">
              <div className="mic-p-img">
                <img src={sanitizeUrl(p.image)} alt={p.name} />
              </div>
              <div className="mic-p-body">
                <h4>{p.name}</h4>
                {!isVendor ? (
                  <div className="mic-p-price">{Number(p.price).toFixed(2)} DT</div>
                ) : (
                  <div className="mic-p-price" style={{ fontSize: 11 }}>Prix sur demande</div>
                )}
                <div className="mic-p-moq">
                  MOQ {p.minOrderQty || 1} {p.unit || 'unité'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <nav className="mic-bottom-nav" aria-label="Navigation">
        <Link href="/marketplace">
          <ShoppingBag size={22} />
          Accueil
        </Link>
        <Link href="/marketplace/categories" className="active">
          <Grid size={22} strokeWidth={2.5} />
          Catégories
        </Link>
        <Link href="/marketplace/my-requests">
          <MessageSquare size={22} />
          RFQ
        </Link>
        <Link href="/marketplace/messages">
          <User size={22} />
          Messages
        </Link>
        <Link href="/admin">
          <User size={22} />
          Compte
        </Link>
      </nav>
    </div>
  );
}
