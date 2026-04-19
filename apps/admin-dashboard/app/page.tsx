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
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                 <Coffee size={20} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#1E1B4B', letterSpacing: '-0.5px' }}>CoffeeSaaS</span>
           </div>

           {/* Desktop Nav */}
           <div className="desktop-nav" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link href="/login" style={{ color: '#64748B', fontWeight: 700, textDecoration: 'none', fontSize: '15px' }}>Connexion</Link>
              <Link href="/register" style={{ padding: '10px 20px', borderRadius: '10px', background: '#6366F1', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '14px', boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)' }}>Essai Gratuit</Link>
           </div>

           {/* Mobile Toggle */}
           <button 
            className="mobile-toggle" 
            onClick={() => setIsDrawerOpen(true)}
            style={{ display: 'none', background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px', color: '#1E293B', cursor: 'pointer' }}
           >
              <Users size={20} />
           </button>
        </nav>

        {/* CSS for Page-Specific Responsiveness */}
        <style jsx global>{`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-toggle { display: block !important; }
            .hero-title { font-size: 38px !important; letter-spacing: -1px !important; }
            .hero-p { font-size: 16px !important; }
            .hero-actions { flex-direction: column; width: 100%; }
            .hero-actions a { width: 100%; text-align: center; }
          }
        `}</style>

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
            width: '280px', 
            background: '#fff', 
            boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', 
            padding: '40px 24px',
            transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '32px' }}>Menu</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Link href="/login" onClick={() => setIsDrawerOpen(false)} style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', textDecoration: 'none' }}>Connexion</Link>
              <Link href="/register" onClick={() => setIsDrawerOpen(false)} style={{ fontSize: '18px', fontWeight: 700, color: '#6366F1', textDecoration: 'none' }}>Créer un compte</Link>
              <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9' }} />
              <Link href="/register/vendor" onClick={() => setIsDrawerOpen(false)} style={{ fontSize: '15px', color: '#64748B', textDecoration: 'none' }}>Devenir Fournisseur</Link>
              <Link href="/register/courier" onClick={() => setIsDrawerOpen(false)} style={{ fontSize: '15px', color: '#64748B', textDecoration: 'none' }}>Devenir Livreur</Link>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center', background: 'radial-gradient(circle at top right, #EEF2FF 0%, #fff 50%)' }}>
           <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#EEF2FF', color: '#6366F1', borderRadius: '100px', fontSize: '12px', fontWeight: 800, marginBottom: '24px' }}>
                 <Rocket size={14} /> <span>B2B Market & POS Intégré</span>
              </div>
              <h1 className="hero-title" style={{ fontSize: '64px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-2px' }}>
                Gérez votre Coffee Shop <br />
                <span style={{ color: '#6366F1' }}>Intelligemment.</span>
              </h1>
              <p className="hero-p" style={{ fontSize: '20px', color: '#64748B', lineHeight: '1.6', marginBottom: '40px' }}>
                La plateforme tout-en-un pour les cafés tunisiens. <br />
                Tactile, Temps réel, Connectée.
              </p>
              <div className="hero-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                 <Link href="/register" style={{ padding: '16px 32px', borderRadius: '14px', background: '#1E1B4B', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '17px', boxShadow: '0 15px 30px rgba(30, 27, 75, 0.2)' }}>Essayer Gratuitement</Link>
                 <Link href="/login" style={{ padding: '16px 32px', borderRadius: '14px', background: '#fff', color: '#1E1B4B', fontWeight: 800, textDecoration: 'none', fontSize: '17px', border: '1.5px solid #E2E8F0' }}>Démo Live</Link>
              </div>

              {/* Hero Image */}
              <div style={{ marginTop: '60px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '8px solid rgba(255,255,255,0.5)', background: '#fff' }}>
                 <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80" 
                    alt="Coffee Shop POS Dashboard" 
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '600px', objectFit: 'cover', objectPosition: 'center' }} 
                 />
              </div>
           </div>
        </section>

        {/* Features Grid */}
        <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              <div style={{ padding: '32px', borderRadius: '24px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                 <div style={{ width: 48, height: 48, background: '#6366F1', color: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <ShoppingCart size={24} />
                 </div>
                 <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>POS Multi-Mode</h3>
                 <p style={{ color: '#64748B', lineHeight: 1.5 }}>Mode Table pour le service en salle ou Simpliste pour le comptoir rapide.</p>
              </div>
              <div style={{ padding: '32px', borderRadius: '24px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                 <div style={{ width: 48, height: 48, background: '#10B981', color: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Globe size={24} />
                 </div>
                 <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>Marketplace B2B</h3>
                 <p style={{ color: '#64748B', lineHeight: 1.5 }}>Commandez vos grains, lait et packaging directement auprès de nos fournisseurs certifiés.</p>
              </div>
              <div style={{ padding: '32px', borderRadius: '24px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                 <div style={{ width: 48, height: 48, background: '#F59E0B', color: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Layers size={24} />
                 </div>
                 <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>Stock & Recettes</h3>
                 <p style={{ color: '#64748B', lineHeight: 1.5 }}>Chaque café vendu déduit automatiquement les grammes de grains et ml de lait de votre stock.</p>
              </div>
           </div>
        </section>

        {/* Pricing Section */}
        <section style={{ padding: '100px 20px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px', color: '#1E1B4B' }}>Nos Forfaits</h2>
            <p style={{ color: '#64748B', fontSize: '17px', marginBottom: '48px' }}>Choisissez le plan adapté à votre activité</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {Object.entries(PLAN_FEATURES).filter(([k]) => k !== 'ENTERPRISE').map(([key, plan]) => (
                <div key={key} style={{ padding: '32px', background: '#fff', borderRadius: '24px', border: `2px solid ${plan.color}20`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>{plan.icon}</span>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: plan.color, margin: 0 }}>{key}</h3>
                  </div>
                  <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '24px', lineHeight: 1.5 }}>{plan.tagline}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    {plan.features.map(f => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: f.included ? '#1E293B' : '#CBD5E1' }}>
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{f.included ? '✅' : '❌'}</span>
                        <span style={{ fontWeight: f.included ? 600 : 400 }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/register" style={{ display: 'block', marginTop: '24px', padding: '14px', borderRadius: '12px', background: plan.color, color: '#fff', fontWeight: 800, textDecoration: 'none', textAlign: 'center', fontSize: '14px' }}>Commencer</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role Selection / Call to Action */}
        <section style={{ padding: '80px 20px' }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '40px' }}>Rejoignez l'écosystème</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                 <div style={{ padding: '40px', background: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '56px', height: '56px', background: '#4F46E510', color: '#4F46E5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                       <Building2 size={28} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Fournisseurs</h3>
                    <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '15px' }}>Vendez vos produits aux meilleurs cafés de Tunisie et gérez vos stocks B2B.</p>
                    <Link href="/register/vendor" style={{ display: 'block', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', color: '#1E1B4B', fontWeight: 700, textDecoration: 'none' }}>Déposer mon catalogue</Link>
                 </div>
                 <div style={{ padding: '40px', background: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '56px', height: '56px', background: '#10B98110', color: '#10B981', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                       <Globe size={28} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Livreurs</h3>
                    <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '15px' }}>Gagnez des revenus en livrant les commandes B2B de nos partenaires fournisseurs.</p>
                    <Link href="/register/courier" style={{ display: 'block', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', color: '#1E1B4B', fontWeight: 700, textDecoration: 'none' }}>S'inscrire comme livreur</Link>
                 </div>
              </div>
           </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '60px 20px', textAlign: 'center', borderTop: '1px solid #F1F5F9' }}>
           <p style={{ color: '#94A3B8', fontSize: '14px' }}>© 2026 CoffeeSaaS B2B. Propulsé par la technologie et le café.</p>
        </footer>
      </div>
    );
  }

  // If user exists, we show the Dashboard.
  window.location.href = '/admin'; 
  return null;
}
