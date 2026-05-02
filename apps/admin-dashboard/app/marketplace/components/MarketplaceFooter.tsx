import React from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin, Mail, Phone, Heart } from 'lucide-react';

export default function MarketplaceFooter() {
  return (
    <footer className="mkt-cocote-footer" style={{ background: '#0F172A', color: '#CBD5E1', padding: '64px 0 32px', marginTop: '64px' }}>
      <div className="mkt-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '48px', marginBottom: '48px' }}>
          
          <div>
            <Link href="/marketplace" className="mkt-cocote-logo" style={{ color: '#fff', marginBottom: '16px' }}>
              <div className="mkt-cocote-logo-icon" style={{ background: '#10B981', color: '#fff' }}><ShoppingBag size={20} /></div>
              Coffee<span style={{ color: '#10B981' }}>Market</span>
            </Link>
            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              La première place de marché B2B dédiée aux professionnels du café en Tunisie. Circuit court, proximité et qualité garantie.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
               <a href="#" style={{ color: '#94A3B8' }}><MapPin size={20} /></a>
               <a href="#" style={{ color: '#94A3B8' }}><Mail size={20} /></a>
               <a href="#" style={{ color: '#94A3B8' }}><Phone size={20} /></a>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>À propos</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/marketplace/about" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Le concept Proximité</Link></li>
              <li><Link href="/marketplace/vendors" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Devenir Vendeur</Link></li>
              <li><Link href="/marketplace/faq" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Foire aux questions</Link></li>
              <li><Link href="/marketplace/terms" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Conditions générales</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Top Villes</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/marketplace?loc=Tunis" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Tunis & Banlieues</Link></li>
              <li><Link href="/marketplace?loc=Sousse" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Sousse & Sahel</Link></li>
              <li><Link href="/marketplace?loc=Sfax" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Sfax & Sud</Link></li>
              <li><Link href="/marketplace?loc=Bizerte" style={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '14px' }}>Bizerte</Link></li>
            </ul>
          </div>

        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
          <p style={{ margin: 0 }}>© 2026 CoffeeShop B2B Marketplace. Tous droits réservés.</p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>Fait avec <Heart size={14} color="#EF4444" fill="#EF4444" /> en Tunisie</p>
        </div>
      </div>
    </footer>
  );
}
