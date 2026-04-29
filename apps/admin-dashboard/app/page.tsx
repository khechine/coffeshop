'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, TrendingUp, AlertTriangle, Coffee, ArrowRight, 
  Package, Layers, Users, Zap, ArrowUpRight, User, Wallet,
  ShieldCheck, Globe, Rocket, CheckCircle2, Star, Building2
} from 'lucide-react';
import { PLAN_FEATURES } from '../lib/planFeatures';

// I'll need a Dashboard component or fetch data.
// For now, I'll just implement the Landing Page logic.

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      window.location.href = '/admin';
    }
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', color: '#1E293B', overflowX: 'hidden' }}>
        {/* Navbar */}
        <nav style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, borderBottom: '1px solid rgba(241, 245, 249, 0.8)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4F46E5, #06B6D4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                 <Building2 size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#1E1B4B', letterSpacing: '-0.5px', lineHeight: 1 }}>Alkassa</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>الكاسة</span>
              </div>
           </div>

           {/* Desktop Nav */}
           <div className="desktop-nav" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link href="/login" style={{ color: '#64748B', fontWeight: 700, textDecoration: 'none', fontSize: '15px' }}>Connexion</Link>
              <Link href="/register" style={{ padding: '10px 24px', borderRadius: '12px', background: '#4F46E5', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '14px', boxShadow: '0 8px 16px -4px rgba(79, 102, 241, 0.4)' }}>Essai Gratuit</Link>
           </div>

           {/* Mobile Toggle */}
           <button 
            className="mobile-toggle" 
            onClick={() => setIsDrawerOpen(true)}
            style={{ display: 'none', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px', color: '#1E293B', cursor: 'pointer' }}
           >
              <Users size={20} />
           </button>
        </nav>

        {/* Mobile Drawer */}
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 200, 
          visibility: isDrawerOpen ? 'visible' : 'hidden', 
          opacity: isDrawerOpen ? 1 : 0, 
          transition: 'all 0.3s' 
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setIsDrawerOpen(false)} />
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            bottom: 0, 
            width: '300px', 
            background: '#fff', 
            boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', 
            padding: '40px 24px',
            transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Building2 size={18} />
                </div>
                <span style={{ fontWeight: 900, color: '#1E1B4B' }}>Alkassa</span>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8' }}><Zap size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link href="/login" onClick={() => setIsDrawerOpen(false)} style={{ padding: '14px', borderRadius: '12px', background: '#F8FAFC', fontSize: '16px', fontWeight: 700, color: '#1E293B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <User size={18} /> Connexion
              </Link>
              <Link href="/register" onClick={() => setIsDrawerOpen(false)} style={{ padding: '14px', borderRadius: '12px', background: '#4F46E5', fontSize: '16px', fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Rocket size={18} /> Essai Gratuit
              </Link>
              <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '8px 0' }} />
              <Link href="/register/vendor" onClick={() => setIsDrawerOpen(false)} style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', textDecoration: 'none', padding: '4px 14px' }}>Devenir Fournisseur</Link>
              <Link href="/register/courier" onClick={() => setIsDrawerOpen(false)} style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', textDecoration: 'none', padding: '4px 14px' }}>Devenir Livreur</Link>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', background: 'radial-gradient(circle at 50% 0%, #EEF2FF 0%, #fff 70%)' }}>
           <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '100px', fontSize: '13px', fontWeight: 800, marginBottom: '32px', boxShadow: '0 4px 12px rgba(79,70,229,0.1)' }}>
                 <Zap size={16} fill="#4F46E5" /> <span>SYSTÈME TOUT-EN-UN POUR LA RESTAURATION</span>
              </div>
              <h1 className="hero-title" style={{ fontSize: '72px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1.05, marginBottom: '28px', letterSpacing: '-3px' }}>
                Gérez votre établissement <br />
                <span style={{ background: 'linear-gradient(to right, #4F46E5, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sans limites.</span>
              </h1>
              <p className="hero-p" style={{ fontSize: '22px', color: '#64748B', lineHeight: '1.6', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px' }}>
                La solution complète pour **Cafés, Restaurants et Pâtisseries**. <br />
                Caisse tactile, Stock automatique, Marketplace B2B & Rapports LIVE.
              </p>
              <div className="hero-actions" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                 <Link href="/register" style={{ padding: '18px 40px', borderRadius: '16px', background: '#1E1B4B', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '18px', boxShadow: '0 20px 40px -10px rgba(30, 27, 75, 0.3)', transition: 'all 0.2s' }}>Ouvrir un compte Alkassa</Link>
                 <Link href="/login" style={{ padding: '18px 40px', borderRadius: '16px', background: '#fff', color: '#1E1B4B', fontWeight: 800, textDecoration: 'none', fontSize: '18px', border: '2px solid #E2E8F0' }}>Explorer la démo</Link>
              </div>

              {/* Mockup Display */}
              <div style={{ marginTop: '80px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.3)', border: '12px solid rgba(255,255,255,0.8)', background: '#fff' }}>
                 <img 
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80" 
                    alt="Alkassa Dashboard POS" 
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '700px', objectFit: 'cover' }} 
                 />
              </div>
           </div>
        </section>

        {/* Features for Specific Verticals */}
        <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
           <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#1E1B4B', marginBottom: '16px' }}>Adapté à votre métier</h2>
              <p style={{ color: '#64748B', fontSize: '18px' }}>Des fonctionnalités pensées pour chaque type d'établissement.</p>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
              <div style={{ padding: '40px', borderRadius: '32px', background: '#EEF2FF', border: '1px solid #E0E7FF' }}>
                 <Coffee size={40} color="#4F46E5" style={{ marginBottom: '24px' }} />
                 <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: '#1E1B4B' }}>Coffee Shops</h3>
                 <ul style={{ padding: 0, listStyle: 'none', color: '#475569', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#4F46E5" /> Recettes précises (grains, lait, sirop)</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#4F46E5" /> Fidélité client intégrée</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#4F46E5" /> Commandes rapides au comptoir</li>
                 </ul>
              </div>
              <div style={{ padding: '40px', borderRadius: '32px', background: '#F0F9FF', border: '1px solid #E0F2FE' }}>
                 <Building2 size={40} color="#0EA5E9" style={{ marginBottom: '24px' }} />
                 <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: '#1E1B4B' }}>Restaurants</h3>
                 <ul style={{ padding: 0, listStyle: 'none', color: '#475569', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0EA5E9" /> Gestion de plan de salle tactile</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0EA5E9" /> Impression en cuisine multi-zones</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0EA5E9" /> Suivi des serveurs & commissions</li>
                 </ul>
              </div>
              <div style={{ padding: '40px', borderRadius: '32px', background: '#FDF2F8', border: '1px solid #FCE7F3' }}>
                 <Package size={40} color="#EC4899" style={{ marginBottom: '24px' }} />
                 <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: '#1E1B4B' }}>Pâtisseries</h3>
                 <ul style={{ padding: 0, listStyle: 'none', color: '#475569', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#EC4899" /> Commandes spéciales & Avances</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#EC4899" /> Gestion des stocks produits finis</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#EC4899" /> Rapports de pertes & Invendus</li>
                 </ul>
              </div>
           </div>
        </section>

        {/* B2B Ecosystem */}
        <section style={{ padding: '100px 20px', background: '#0F172A', color: '#fff' }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' }}>
              <div>
                 <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1 }}>Marketplace B2B <br /><span style={{ color: '#38BDF8' }}>Intégrée.</span></h2>
                 <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '40px' }}>
                    Ne soyez plus jamais en rupture de stock. Commandez vos matières premières directement auprès de nos fournisseurs partenaires. Livraison suivie et facturation centralisée.
                 </p>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                       { title: 'Fournisseurs Certifiés', sub: 'Accès aux meilleurs grossistes tunisiens.' },
                       { title: 'Prix Négociés', sub: 'Bénéficiez de tarifs préférentiels B2B.' },
                       { title: 'Réappro automatique', sub: 'Alertes stock bas et commandes en 1 clic.' }
                    ].map((item, i) => (
                       <div key={i} style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle2 size={14} color="#fff" /></div>
                          <div>
                             <div style={{ fontWeight: 800, fontSize: '16px' }}>{item.title}</div>
                             <div style={{ color: '#64748B', fontSize: '14px' }}>{item.sub}</div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div style={{ position: 'relative' }}>
                 <img 
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80" 
                  style={{ width: '100%', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }} 
                  alt="Marketplace Interface" 
                 />
              </div>
           </div>
        </section>

        {/* Pricing Section */}
        <section style={{ padding: '100px 20px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px', color: '#1E1B4B' }}>Forfaits Alkassa</h2>
            <p style={{ color: '#64748B', fontSize: '17px', marginBottom: '48px' }}>Une tarification transparente pour tous les besoins.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {Object.entries(PLAN_FEATURES).filter(([k]) => k !== 'ENTERPRISE').map(([key, plan]) => (
                <div key={key} style={{ padding: '32px', background: '#fff', borderRadius: '24px', border: `2px solid ${plan.color}20`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>{plan.icon}</span>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: plan.color, margin: 0 }}>{key}</h3>
                  </div>
                  <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '24px', lineHeight: 1.5 }}>{plan.tagline}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {plan.features.map(f => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: f.included ? '#1E293B' : '#CBD5E1' }}>
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{f.included ? '✅' : '❌'}</span>
                        <span style={{ fontWeight: f.included ? 600 : 400 }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/register" style={{ display: 'block', marginTop: '32px', padding: '16px', borderRadius: '14px', background: plan.color, color: '#fff', fontWeight: 800, textDecoration: 'none', textAlign: 'center', fontSize: '15px', boxShadow: `0 10px 20px -5px ${plan.color}40` }}>Commencer maintenant</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderTop: '1px solid #F1F5F9' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: 32, height: 32, background: '#1E1B4B', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                 <Building2 size={18} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#1E1B4B' }}>Alkassa الكاسة</span>
           </div>
           <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            La technologie au service de la restauration en Tunisie. <br />
            Rejoignez des centaines d'établissements qui nous font confiance.
           </p>
           <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '40px' }}>
              <Link href="/register/vendor" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>Espace Fournisseur</Link>
              <Link href="/register/courier" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>Espace Livreur</Link>
              <Link href="/login" style={{ color: '#64748B', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>Support Client</Link>
           </div>
           <p style={{ color: '#94A3B8', fontSize: '13px' }}>© 2026 Alkassa B2B Platform. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  // If user exists, we show the Dashboard.
  window.location.href = '/admin'; 
  return null;
}
