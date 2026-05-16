'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import MarketplaceProductCard from '../components/MarketplaceProductCard';
import { Heart, Star, Flag, MapPin, ArrowRight } from 'lucide-react';

export default function TunisiaMarketplaceClient({ initialData, store, user }: any) {
  const { products = [] } = initialData || {};
  const isVendor = user?.role === 'VENDOR';
  const hidePrices = isVendor;

  return (
    <div style={{ background: '#FFF5F5', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader store={store} isVendor={isVendor} />

      {/* Tunisia Hero */}
      <div style={{ 
        background: 'linear-gradient(135deg, #E31E24 0%, #9B1C1C 100%)', 
        padding: '80px 24px', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, pointerEvents: 'none' }}>
           <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg" style={{ width: '800px' }} alt="Tunisia Flag" />
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '100px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Flag size={18} color="#fff" />
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fierté Nationale • Sourcing Local</span>
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 950, marginBottom: '24px', lineHeight: 1.1 }}>MADE IN TUNISIA</h1>
          <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '40px', fontWeight: 500 }}>
            Soutenez l'économie locale en choisissant des produits cultivés, fabriqués et transformés avec passion sur notre terre.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={24} color="#FBBF24" fill="#FBBF24" />
              <span style={{ fontWeight: 700 }}>Qualité Supérieure</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={24} color="#fff" />
              <span style={{ fontWeight: 700 }}>Direct Producteur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{ width: '48px', height: '48px', background: '#E31E24', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Star size={24} fill="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>Sélection 100% Tunisienne</h2>
            <p style={{ color: '#E31E24', margin: '4px 0 0', fontWeight: 600 }}>Découvrez le meilleur de nos régions 🇹🇳</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: '32px', border: '2px dashed #FECACA' }}>
            <Flag size={64} color="#FECACA" style={{ marginBottom: '24px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#9B1C1C' }}>Bientôt disponible</h3>
            <p style={{ color: '#6B7280', marginTop: '8px' }}>Nous préparons une sélection exceptionnelle de produits du terroir.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '32px' 
          }}>
            {products.map((p: any) => (
              <MarketplaceProductCard 
                key={p.id} 
                product={p} 
                isVendor={isVendor}
                hidePrice={hidePrices}
              />
            ))}
          </div>
        )}

        {/* Tunisia Map Section */}
        <div style={{ 
          marginTop: '80px', background: '#fff', borderRadius: '32px', padding: '60px', 
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid #FEE2E2'
        }}>
          <div style={{ borderRadius: '24px', overflow: 'hidden', height: '400px', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_map_of_Tunisia.svg" 
               style={{ height: '90%', objectFit: 'contain' }} 
               alt="Tunisia Map"
             />
          </div>
          <div>
            <span style={{ color: '#E31E24', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '13px' }}>Nos régions ont du talent</span>
            <h2 style={{ fontSize: '40px', fontWeight: 950, color: '#111827', marginTop: '16px', marginBottom: '24px' }}>Du producteur à votre établissement.</h2>
            <p style={{ color: '#4B5563', fontSize: '18px', lineHeight: 1.6, marginBottom: '32px' }}>
              En choisissant le "Made in Tunisia", vous garantissez la fraîcheur des produits, réduisez les intermédiaires et participez activement à la souveraineté alimentaire de notre pays.
            </p>
            <button style={{ 
              background: '#111827', color: '#fff', border: 'none', padding: '16px 32px', 
              borderRadius: '100px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' 
            }}>
              Voir la carte interactive <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
