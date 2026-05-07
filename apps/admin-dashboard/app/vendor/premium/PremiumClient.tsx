'use client';
import React from 'react';
import { Check, Star, Zap, MapPin, MessageCircle, BarChart3, ShieldCheck, ArrowRight, Package, Layout, Globe } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPage() {
  const features = [
    {
      title: "Vitrine Personnalisée & Branding",
      description: "Prenez le contrôle total de votre image. Personnalisez vos couleurs, votre bannière et votre logo pour une expérience de marque unique.",
      icon: Layout,
      color: "#E31E24"
    },
    {
      title: "Intelligence Prédictive de Vente",
      description: "Anticipez les besoins de vos clients. Recevez des alertes automatiques quand un client de proximité manque de stock sur vos produits.",
      icon: Zap,
      color: "#F59E0B"
    },
    {
      title: "Gestion Multicentre (Franchises)",
      description: "Affichez vos points de vente sur une carte interactive avec des stocks localisés. Idéal pour les réseaux de distribution.",
      icon: MapPin,
      color: "#3B82F6"
    },
    {
      title: "Packs & Bundles Prioritaires",
      description: "Créez des offres groupées irrésistibles. Vos packs sont mis en avant sur la page d'accueil et dans les recherches pour maximiser le panier moyen.",
      icon: Package,
      color: "#10B981"
    },
    {
      title: "TradeMessager Pro",
      description: "Communiquez en direct avec vos acheteurs via notre messagerie sécurisée. Répondez aux appels d'offres (RFQ) en un clic.",
      icon: MessageCircle,
      color: "#8B5CF6"
    },
    {
      title: "Badge Vendeur Vérifié & Premium",
      description: "Gagnez la confiance instantanée des acheteurs avec le badge 'Premium Member' et 'Audité' sur tous vos produits.",
      icon: ShieldCheck,
      color: "#111827"
    }
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)', 
        padding: '100px 24px', 
        color: '#fff', 
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(227,30,36,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '100px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Star size={16} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em' }}>OFFRE VENDEUR PREMIUM</span>
          </div>
          <h1 style={{ fontSize: '64px', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1 }}>Dominez le Marché B2B avec Elkassa Premium</h1>
          <p style={{ fontSize: '20px', color: '#94A3B8', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px', lineHeight: 1.6 }}>
            Accédez à des outils de vente exclusifs, une visibilité maximale et une intelligence artificielle qui anticipe les besoins de vos clients.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button style={{ padding: '18px 36px', borderRadius: '12px', background: '#E31E24', color: '#fff', border: 'none', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Devenir Premium Maintenant <ArrowRight size={20} />
            </button>
            <button style={{ padding: '18px 36px', borderRadius: '12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>
              Parler à un Expert
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#111827', marginBottom: '16px' }}>Pourquoi passer au Premium ?</h2>
          <p style={{ color: '#64748B', fontSize: '18px', fontWeight: 500 }}>Des fonctionnalités conçues pour décupler votre chiffre d'affaires.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ 
              padding: '40px', 
              borderRadius: '24px', 
              background: '#F8FAFC', 
              border: '1px solid #F1F5F9',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'default'
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '16px', 
                background: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '24px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                color: f.color
              }}>
                <f.icon size={28} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '16px' }}>{f.title}</h3>
              <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '15px', fontWeight: 500 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section style={{ background: '#F1F5F9', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#111827' }}>Tableau Comparatif</h2>
          </div>
          
          <div style={{ background: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '32px', fontSize: '18px', fontWeight: 800, color: '#111827' }}>Fonctionnalités</th>
                  <th style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>Standard</th>
                  <th style={{ padding: '32px', textAlign: 'center', background: '#FEF2F2', color: '#E31E24', fontWeight: 900 }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "Visibilité Marketplace", "Messagerie B2B", "Statistiques de Vente", "Branding Personnalisé", 
                  "Carte des Franchises", "Intelligence Prédictive", "Promotion des Packs", "Support 24/7"
                ].map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '24px 32px', fontWeight: 600, color: '#374151' }}>{item}</td>
                    <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                      {idx < 3 ? <Check size={20} color="#10B981" style={{ margin: '0 auto' }} /> : <div style={{ width: '12px', height: '2px', background: '#E5E7EB', margin: '0 auto' }} />}
                    </td>
                    <td style={{ padding: '24px 32px', textAlign: 'center', background: idx === 7 ? '#FEF2F2' : '#FEF2F2' }}>
                      <Check size={20} color="#E31E24" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
         <div style={{ maxWidth: '800px', margin: '0 auto', background: '#E31E24', borderRadius: '40px', padding: '64px', color: '#fff' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '24px' }}>Prêt à passer à la vitesse supérieure ?</h2>
            <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '40px', fontWeight: 500 }}>Rejoignez le cercle fermé des fournisseurs leaders sur Elkassa.</p>
            <button style={{ padding: '20px 48px', borderRadius: '16px', background: '#fff', color: '#E31E24', border: 'none', fontSize: '18px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
              Contactez un Conseiller
            </button>
         </div>
      </section>
    </div>
  );
}
