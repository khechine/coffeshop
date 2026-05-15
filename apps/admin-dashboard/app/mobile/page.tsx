'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, TrendingUp, Package, MessageSquare, ArrowRight, Star } from 'lucide-react';

export default function MobileHome() {
  const stats = [
    { label: 'Ventes', value: '1.2k DT', icon: TrendingUp, color: '#10B981' },
    { label: 'Articles', value: '42', icon: Package, color: '#4F46E5' },
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Section */}
      <div style={{ marginTop: '10px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>Bonjour ! 👋</h1>
        <p style={{ color: '#6B7280', fontSize: '15px', marginTop: '4px' }}>Voici un résumé de votre activité.</p>
      </div>

      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${s.color}10`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <s.icon size={20} />
             </div>
             <div style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>{s.value}</div>
             <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Primary Action Card */}
      <Link href="/mobile/marketplace" style={{ textDecoration: 'none' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', 
          borderRadius: '24px', padding: '24px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <Star size={18} fill="#FCD34D" color="#FCD34D" />
               <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Accès Privilégié</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Marketplace B2B</h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: '4px 0 0' }}>Commandez vos matières premières.</p>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={20} />
          </div>
        </div>
      </Link>

      {/* Recent Activity List (Placeholders) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0 }}>Dernières Commandes</h3>
          <Link href="/mobile/orders" style={{ fontSize: '14px', fontWeight: 700, color: '#E31E24', textDecoration: 'none' }}>Tout voir</Link>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                <ShoppingBag size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#111827' }}>Commande #124{i}</div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>Il y a 2 heures • 4 articles</div>
              </div>
              <div style={{ fontWeight: 900, color: '#111827' }}>180 DT</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
