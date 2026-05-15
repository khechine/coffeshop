'use client';

import React from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import MarketplaceProductCard from '../components/MarketplaceProductCard';
import { Leaf, Sprout, ShieldCheck, Globe, ArrowRight } from 'lucide-react';

export default function EcoMarketplaceClient({ initialData, store, user }: any) {
  const { products = [] } = initialData || {};
  const isVendor = user?.role === 'VENDOR';
  const hidePrices = isVendor;

  return (
    <div style={{ background: '#F0F9F4', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader store={store} isVendor={isVendor} />

      {/* Eco Hero */}
      <div style={{ 
        background: 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)', 
        padding: '80px 24px', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
          <Leaf size={400} />
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '100px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Sprout size={18} color="#34D399" />
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sourcing Responsable Tunisie</span>
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 950, marginBottom: '24px', lineHeight: 1.1 }}>BIO & LOCAL</h1>
          <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '40px', fontWeight: 500 }}>
            Découvrez une sélection exclusive de produits issus de fournisseurs tunisiens engagés dans une démarche éco-responsable et durable.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="#34D399" />
              <span style={{ fontWeight: 700 }}>Certifié Local</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={24} color="#34D399" />
              <span style={{ fontWeight: 700 }}>Empreinte Carbone Réduite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{ width: '48px', height: '48px', background: '#34D399', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Leaf size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#064E3B', margin: 0 }}>Notre Sélection Éco-Responsable</h2>
            <p style={{ color: '#059669', margin: '4px 0 0', fontWeight: 600 }}>{products.length} produits trouvés 🌱</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: '32px', border: '2px dashed #D1FAE5' }}>
            <Sprout size={64} color="#D1FAE5" style={{ marginBottom: '24px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#064E3B' }}>Aucun produit disponible pour le moment</h3>
            <p style={{ color: '#6B7280', marginTop: '8px' }}>Revenez bientôt pour découvrir de nouveaux arrivages BIO & LOCAUX.</p>
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
                hidePrice={hidePrices}
              />
            ))}
          </div>
        )}

        {/* Eco Message Card */}
        <div style={{ 
          marginTop: '80px', background: '#fff', borderRadius: '32px', padding: '60px', 
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid #ECFDF5'
        }}>
          <div>
            <span style={{ color: '#059669', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '13px' }}>Pourquoi choisir Bio & Local ?</span>
            <h2 style={{ fontSize: '40px', fontWeight: 950, color: '#064E3B', marginTop: '16px', marginBottom: '24px' }}>Un impact positif sur votre business et la planète.</h2>
            <p style={{ color: '#4B5563', fontSize: '18px', lineHeight: 1.6, marginBottom: '32px' }}>
              En privilégiant le sourcing local et responsable, vous réduisez vos coûts logistiques, soutenez l'économie tunisienne et répondez à une demande croissante des consommateurs pour plus de transparence.
            </p>
            <button style={{ 
              background: '#059669', color: '#fff', border: 'none', padding: '16px 32px', 
              borderRadius: '100px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' 
            }}>
              Devenir Fournisseur Éco <ArrowRight size={20} />
            </button>
          </div>
          <div style={{ borderRadius: '24px', overflow: 'hidden', height: '400px' }}>
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              alt="Eco Farming"
            />
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
