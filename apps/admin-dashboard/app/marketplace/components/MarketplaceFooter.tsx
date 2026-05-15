import React from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin, Mail, Phone, Heart } from 'lucide-react';

export default function MarketplaceFooter() {
  return (
    <footer className="mkt-cocote-footer" style={{ background: '#0F172A', color: '#CBD5E1', padding: '80px 0 40px', marginTop: '80px' }}>
      <div className="mkt-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '64px', marginBottom: '64px' }}>
          
          <div style={{ maxWidth: '400px' }}>
            <Link href="/marketplace" className="mkt-cocote-logo" style={{ color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 950, textDecoration: 'none' }}>
              <img src="/images/elkassa-logo.png" alt="ElKassa Marketplace" style={{ height: '40px', width: 'auto' }} />
            </Link>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#94A3B8', marginBottom: '32px' }}>
              La première place de marché B2B dédiée à la proximité en Tunisie. Connectez votre établissement aux meilleurs fournisseurs locaux en quelques clics.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
               <a href="#" style={{ color: '#64748B' }} className="hover:text-indigo-400 transition-colors"><MapPin size={22} /></a>
               <a href="#" style={{ color: '#64748B' }} className="hover:text-indigo-400 transition-colors"><Mail size={22} /></a>
               <a href="#" style={{ color: '#64748B' }} className="hover:text-indigo-400 transition-colors"><Phone size={22} /></a>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 900, marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plateforme</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li><Link href="/marketplace/about" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/marketplace/concept" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Le concept Proximité</Link></li>
              <li><Link href="/marketplace/vendors" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Devenir Vendeur</Link></li>
              <li><Link href="/marketplace/faq" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Foire aux questions</Link></li>
              <li><Link href="/marketplace/terms" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Conditions générales</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 900, marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top Villes</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li><Link href="/marketplace?loc=Tunis" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Tunis & Banlieues</Link></li>
              <li><Link href="/marketplace?loc=Sousse" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Sousse & Sahel</Link></li>
              <li><Link href="/marketplace?loc=Sfax" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Sfax & Sud</Link></li>
              <li><Link href="/marketplace?loc=Bizerte" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white transition-colors">Bizerte</Link></li>
            </ul>
          </div>

        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', fontSize: '14px', color: '#64748B' }}>
          <p style={{ margin: 0 }}>© 2026 ElKassa Marketplace. Plateforme B2B de proximité.</p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>Fait avec <Heart size={16} color="#6366F1" fill="#6366F1" /> en Tunisie</p>
        </div>
      </div>
    </footer>
  );
}
