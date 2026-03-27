'use client';

import React, { useState } from 'react';
import { Coffee, Mail, Lock, User, Store as StoreIcon, MapPin, CheckCircle, FileUp, ShieldCheck, ArrowRight, Building2, Truck, Star } from 'lucide-react';
import Link from 'next/link';
import { registerStoreAction } from '../actions';

export default function RegisterPage() {
  const [step, setStep] = useState(0); // 0 = Role Selection
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    address: '',
    city: '',
    phone: '',
    rne: '',
    cin: '',
    role: 'STORE_OWNER'
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerStoreAction(form);
      setStep(3);
    } catch (err: any) {
      alert("Erreur: " + (err.message || "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { 
    width: '100%', padding: '14px 16px', borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s'
  };
  
  const labelStyle: React.CSSProperties = { 
    display: 'block', fontSize: '12px', fontWeight: 800, 
    color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', overflow: 'hidden' }}>
      
      {/* Left side: Animated Brand / Info */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', color: '#fff' }} className="hide-mobile">
         <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', filter: 'blur(80px)' }} />
         
         <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
               <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee size={28} />
               </div>
               <span style={{ fontSize: '24px', fontWeight: 900 }}>CoffeeSaaS B2B</span>
            </div>

            <div style={{ maxWidth: '440px' }}>
               <h1 style={{ fontSize: '44px', fontWeight: 900, lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-1.5px' }}>
                  Commencez votre essai gratuit.
               </h1>
               <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '40px' }}>
                  Rejoignez plus de 200 établissements qui transforment leur gestion quotidienne avec notre écosystème.
               </p>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    "Caisse tactile ultra-rapide",
                    "Gestion de stock automatique",
                    "Marketplace B2B intégré",
                    "Zéro frais d'installation"
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#CBD5E1', fontWeight: 600 }}>
                       <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10B98130', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle size={14} />
                       </div>
                       {text}
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div style={{ position: 'absolute', bottom: '40px', left: '80px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '-4px' }}>
               {[1,2,3].map(i => <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#312E81', border: '2px solid #1E1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>⭐</div>)}
            </div>
            <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Noté 4.9/5 par les baristas</span>
         </div>
      </div>

      {/* Right side: Registration Form */}
      <div style={{ width: '640px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }} className="full-width-mobile">
         
         <div style={{ width: '100%', maxWidth: '440px' }}>
            
            {/* Step 0: Choose Path */}
            {step === 0 && (
              <div>
                <div style={{ marginBottom: '40px' }}>
                   <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Choisissez votre voie</h2>
                   <p style={{ color: '#64748B' }}>Comment souhaitez-vous utiliser la plateforme ?</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <button onClick={() => { setForm({...form, role: 'STORE_OWNER'}); setStep(1); }} style={{ padding: '24px', borderRadius: '20px', border: '1.5px solid #E2E8F0', background: '#fff', textAlign: 'left', display: 'flex', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' }} className="role-btn">
                      <div style={{ width: '48px', height: '48px', background: '#6366F110', color: '#6366F1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><StoreIcon size={24} /></div>
                      <div>
                         <div style={{ fontWeight: 800, fontSize: '16px', color: '#1E293B' }}>Coffee Shop / Café</div>
                         <div style={{ fontSize: '14px', color: '#64748B' }}>Gérer ma caisse, mon stock et mon staff.</div>
                      </div>
                   </button>
                   <button onClick={() => alert('Inscription Vendeur (Flux spécifique bientôt disponible)')} style={{ padding: '24px', borderRadius: '20px', border: '1.5px solid #E2E8F0', background: '#fff', textAlign: 'left', display: 'flex', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' }} className="role-btn">
                      <div style={{ width: '48px', height: '48px', background: '#10B98110', color: '#10B981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={24} /></div>
                      <div>
                         <div style={{ fontWeight: 800, fontSize: '16px', color: '#1E293B' }}>Fournisseur / Grossiste</div>
                         <div style={{ fontSize: '14px', color: '#64748B' }}>Vendre mes produits aux établissements Tunisiens.</div>
                      </div>
                   </button>
                </div>
                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                   <p style={{ fontSize: '14px', color: '#64748B' }}>Déjà membre ? <Link href="/login" style={{ color: '#6366F1', fontWeight: 800, textDecoration: 'none' }}>Se connecter</Link></p>
                </div>
              </div>
            )}

            {/* Step 1: Account Info */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: '32px' }}>
                   <div style={{ fontSize: '12px', fontWeight: 900, color: '#6366F1', textTransform: 'uppercase', marginBottom: '8px' }}>Étape 1 sur 2</div>
                   <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Créez votre profil</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div>
                      <label style={labelStyle}>Nom complet</label>
                      <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Sami Ben Ahmed" />
                   </div>
                   <div>
                      <label style={labelStyle}>Email professionnel</label>
                      <input type="email" style={inputStyle} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="sami@cafe.tn" />
                   </div>
                   <div>
                      <label style={labelStyle}>Mot de passe</label>
                      <input type="password" style={inputStyle} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
                   </div>
                   <button onClick={() => setStep(2)} disabled={!form.email || !form.password} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: '#1E1B4B', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>Continuer <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} /></button>
                </div>
              </div>
            )}

            {/* Step 2: Store Info */}
            {step === 2 && (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '32px' }}>
                   <div style={{ fontSize: '12px', fontWeight: 900, color: '#6366F1', textTransform: 'uppercase', marginBottom: '8px' }}>Étape 2 sur 2</div>
                   <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Votre Établissement</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div>
                      <label style={labelStyle}>Nom du Café / Restaurant</label>
                      <input style={inputStyle} value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} placeholder="ex: L'Artisan Coffee" required />
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Ville</label>
                        <input style={inputStyle} value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Tunis" required />
                      </div>
                      <div>
                        <label style={labelStyle}>Téléphone</label>
                        <input style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="71 ..." required />
                      </div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Identifiant RNE</label>
                        <input style={inputStyle} value={form.rne} onChange={e => setForm({...form, rne: e.target.value})} placeholder="1234567M" required />
                      </div>
                      <div>
                        <label style={labelStyle}>Numéro de CIN</label>
                        <input style={inputStyle} value={form.cin} onChange={e => setForm({...form, cin: e.target.value})} placeholder="01234567" required />
                      </div>
                   </div>
                   <div style={{ padding: '20px', background: '#F0F9FF', borderRadius: '16px', border: '1px solid #BAE6FD', display: 'flex', gap: '12px' }}>
                      <Star size={24} color="#0369A1" />
                      <div>
                         <div style={{ fontSize: '14px', fontWeight: 800, color: '#0369A1', marginBottom: '4px' }}>Essai Gratuit activé</div>
                         <div style={{ fontSize: '12px', color: '#0369A1', lineHeight: '1.4' }}>Vous bénéficiez de 30 jours d'accès complet dès la création de votre compte.</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                      <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '16px', borderRadius: '14px', background: '#fff', color: '#64748B', border: '1.5px solid #E2E8F0', fontWeight: 700 }}>Retour</button>
                      <button type="submit" disabled={loading} style={{ flex: 2, padding: '16px', borderRadius: '14px', background: '#1E1B4B', color: '#fff', border: 'none', fontWeight: 800 }}>{loading ? 'Création en cours...' : 'Finaliser mon inscription'}</button>
                   </div>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div style={{ textAlign: 'center' }}>
                 <div style={{ width: '80px', height: '80px', background: '#F0FDF4', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                    <CheckCircle size={48} />
                 </div>
                 <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', marginBottom: '16px' }}>On y est presque !</h2>
                 <p style={{ color: '#64748B', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>Un email de confirmation vient d'être envoyé à <b>{form.email}</b>. Merci de cliquer sur le lien pour activer votre accès.</p>
                 <Link href="/login" style={{ display: 'block', width: '100%', padding: '18px', borderRadius: '16px', background: '#6366F1', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '16px' }}>Aller à la page de connexion</Link>
              </div>
            )}

         </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .full-width-mobile { width: 100% !important; }
        }
        .role-btn:hover {
          border-color: #6366F1 !important;
          background: #F8FAFC !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
