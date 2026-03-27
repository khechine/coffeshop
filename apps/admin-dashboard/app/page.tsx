'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, TrendingUp, AlertTriangle, Coffee, ArrowRight, 
  Package, Layers, Users, Zap, ArrowUpRight, User, Wallet,
  ShieldCheck, Globe, Rocket, CheckCircle2, Star, Building2
} from 'lucide-react';
import { prisma } from '@coffeeshop/database'; // Wait, client component can't use prisma directly

// I'll need a Dashboard component or fetch data.
// For now, I'll just implement the Landing Page logic.

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', color: '#1E293B' }}>
        {/* Navbar */}
        <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, borderBottom: '1px solid #F1F5F9' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                 <Coffee size={24} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#1E1B4B', letterSpacing: '-0.5px' }}>CoffeeSaaS</span>
           </div>
           <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link href="/login" style={{ color: '#64748B', fontWeight: 700, textDecoration: 'none', fontSize: '15px' }}>Connexion</Link>
              <Link href="/register" style={{ padding: '12px 24px', borderRadius: '12px', background: '#6366F1', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '15px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>Essai Gratuit 30j</Link>
           </div>
        </nav>

        {/* Hero Section */}
        <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', background: 'radial-gradient(circle at top right, #EEF2FF 0%, #fff 50%)' }}>
           <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#EEF2FF', color: '#6366F1', borderRadius: '100px', fontSize: '13px', fontWeight: 700, marginBottom: '24px' }}>
                 <Rocket size={16} /> <span>Nouveau : Marketplace B2B intégré</span>
              </div>
              <h1 style={{ fontSize: '64px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-2px' }}>
                Gérez votre Coffee Shop <br />
                <span style={{ color: '#6366F1' }}>Intelligemment.</span>
              </h1>
              <p style={{ fontSize: '20px', color: '#64748B', lineHeight: '1.6', marginBottom: '40px' }}>
                La plateforme tout-en-un pour les cafés et bistrots tunisiens. POS tactile, <br />
                gestion des stocks en temps réel et marketplace fournisseurs.
              </p>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                 <Link href="/register" style={{ padding: '18px 36px', borderRadius: '16px', background: '#1E1B4B', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '18px', boxShadow: '0 20px 25px -5px rgba(30, 27, 75, 0.2)' }}>Démarrer mon Trial</Link>
                 <Link href="/login" style={{ padding: '18px 36px', borderRadius: '16px', background: '#fff', color: '#1E1B4B', fontWeight: 800, textDecoration: 'none', fontSize: '18px', border: '1.5px solid #E2E8F0' }}>Démo Live</Link>
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

        {/* Role Selection / Call to Action */}
        <section style={{ padding: '80px 20px', background: '#F8FAFC' }}>
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
