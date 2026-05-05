import React from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin, Mail, Phone, Heart } from 'lucide-react';

export default function MarketplaceFooter() {
  return (
    <footer style={{ background: '#111827', color: '#9CA3AF', padding: '60px 0 40px', marginTop: '80px', borderTop: '4px solid #E31E24' }}>
      <div className="mkt-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '48px', marginBottom: '48px' }}>
           
          <div>
            <Link href="/marketplace" style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: 950, textDecoration: 'none', letterSpacing: '-0.03em' }}>
              <div style={{ background: '#fff', color: '#111827', width: '36px', height: '36px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px' }}>
                EK
              </div>
              ElKassa <span style={{ fontWeight: 700 }}>Market</span>
            </Link>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#6B7280', margin: '16px 0 24px' }}>
              La marketplace B2B de proximité en Tunisie. Commandez en gros auprès des meilleurs fournisseurs locaux.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#F9FAFB', fontSize: '12px', fontWeight: 900, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plateforme</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/marketplace/about" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>À propos</Link></li>
              <li><Link href="/marketplace/concept" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Le concept</Link></li>
              <li><Link href="/marketplace/vendors" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Devenir Vendeur</Link></li>
              <li><Link href="/marketplace/faq" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#F9FAFB', fontSize: '12px', fontWeight: 900, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Catégories</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/marketplace/category/matieres-premieres" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Matières Premières</Link></li>
              <li><Link href="/marketplace/category/equipements-materiel" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Équipements</Link></li>
              <li><Link href="/marketplace/category/produits-finis-b2b-revente" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Produits Finis</Link></li>
              <li><Link href="/marketplace/category/emballages" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Emballages</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#F9FAFB', fontSize: '12px', fontWeight: 900, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Légal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/marketplace/terms" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Conditions générales</Link></li>
              <li><Link href="/marketplace/privacy" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>Politique de confidentialité</Link></li>
            </ul>
          </div>

        </div>

        <div style={{ borderTop: '1px solid #1F2937', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
          <p style={{ margin: 0 }}>© 2026 ElKassa Marketplace. Tous droits réservés.</p>
          <p style={{ margin: 0 }}>Fait avec précision en Tunisie</p>
        </div>
      </div>
    </footer>
  );
}
