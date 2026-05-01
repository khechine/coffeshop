'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, CheckCircle2, Star, Zap, 
  TrendingUp, Globe, ShieldCheck, ArrowRight
} from 'lucide-react';

export default function PremiumRequestClient({ store }: any) {
  const [step, setStep] = useState(1); // 1: Info, 2: Success
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call to save request for superadmin
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '20px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/marketplace" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#1E1B4B', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><ShoppingBag size={20} /></div>
            <span style={{ fontSize: 20, fontWeight: 950, color: '#1E1B4B' }}>CoffeeMarket</span>
          </Link>
          <Link href="/marketplace" style={{ fontSize: 14, fontWeight: 700, color: '#64748B', textDecoration: 'none' }}>Retour au Marketplace</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '48px auto', padding: '0 24px' }}>
        {step === 1 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48, alignItems: 'start' }}>
            {/* Left: Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
               <h1 style={{ fontSize: 40, fontWeight: 950, color: '#1E1B4B', lineHeight: 1.1, marginBottom: 24 }}>Devenez Fournisseur <span style={{ color: '#4F46E5' }}>Premium</span></h1>
               <p style={{ fontSize: 18, color: '#64748B', lineHeight: 1.6, marginBottom: 40 }}>Multipliez vos ventes × 3 sur le premier marketplace B2B du café.</p>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                 {[
                   { icon: <TrendingUp />, title: 'Visibilité Prioritaire', desc: 'Vos produits apparaissent en tête des recherches.' },
                   { icon: <Globe />, title: 'Vitrine Personnalisée', desc: 'Logo, couleurs et bannières aux couleurs de votre marque.' },
                   { icon: <Star />, title: 'Badge de Confiance', desc: 'Le label PRO ⭐ pour rassurer les acheteurs.' },
                   { icon: <ShieldCheck />, title: 'Accès VIP', desc: 'Support dédié et outils de marketing avancés.' }
                 ].map((item, i) => (
                   <div key={i} style={{ display: 'flex', gap: 20 }}>
                     <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
                       {item.icon}
                     </div>
                     <div>
                       <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>{item.title}</div>
                       <div style={{ fontSize: 14, color: '#64748B' }}>{item.desc}</div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Right: Form */}
            <div style={{ background: '#fff', borderRadius: 32, padding: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>
               <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1E1B4B', marginBottom: 24 }}>Formulaire de demande</h2>
               <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Nom de l'entreprise</label>
                    <input type="text" readOnly value={store?.name} style={{ padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 600 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Secteur d'activité</label>
                    <input type="text" placeholder="ex: Torréfacteur, Grossiste..." required style={{ padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Pourquoi voulez-vous devenir Premium ?</label>
                    <textarea rows={4} placeholder="Décrivez votre entreprise et vos produits..." required style={{ padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600, resize: 'none' }} />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                      marginTop: 12, padding: 18, background: '#1E1B4B', color: '#fff', border: 'none', 
                      borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Un administrateur validera votre demande sous 24/48h.</p>
               </form>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 40, padding: '80px 40px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
             <div style={{ width: 100, height: 100, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', margin: '0 auto 32px' }}>
                <CheckCircle2 size={56} />
             </div>
             <h1 style={{ fontSize: 36, fontWeight: 950, color: '#1E1B4B', marginBottom: 16 }}>Demande envoyée !</h1>
             <p style={{ fontSize: 18, color: '#64748B', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6 }}>
                Votre demande est bien enregistrée. Notre équipe va l'étudier et vous recevrez une notification dès qu'elle sera validée.
             </p>
             <Link href="/marketplace" style={{ display: 'inline-flex', padding: '18px 40px', background: '#1E1B4B', color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 16, textDecoration: 'none' }}>
                Retour au Marketplace
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
