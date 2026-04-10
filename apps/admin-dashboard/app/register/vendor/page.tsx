"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Mail, Lock, Phone, MapPin, Send, CheckCircle, Store, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { registerVendorAction, checkEmailAvailability } from '../../actions';

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function VendorRegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    address: '',
    city: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Debounced email check
  const checkEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        setEmailStatus('idle');
        return;
      }
      setEmailStatus('checking');
      try {
        const res = await checkEmailAvailability(email);
        if (res && typeof res.available === 'boolean') {
          setEmailStatus(res.available ? 'available' : 'taken');
        } else {
          setEmailStatus('idle');
        }
      } catch (err) {
        setEmailStatus('idle');
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (form.email) {
      checkEmail(form.email);
    }
  }, [form.email, checkEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerVendorAction(form);
      setStep(3);
    } catch (err: any) {
      alert('Erreur: ' + (err.message || "Une erreur est survenue"));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { 
    width: '100%', 
    padding: '12px 16px', 
    borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', 
    fontSize: '15px', 
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '8px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '500px', width: '100%', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', padding: '40px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Progress header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: '#4F46E510', color: '#4F46E5', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', margin: '0 0 8px' }}>Devenir Fournisseur</h1>
          <p style={{ color: '#64748B', fontSize: '15px' }}>Rejoignez le premier écosystème B2B pour Cafés en Tunisie</p>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Votre Nom complet</label>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle} placeholder="ex: Ahmed Ben Ali" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email Professionnel</label>
              <input 
                type="email" 
                style={{ 
                  ...inputStyle, 
                  borderColor: emailStatus === 'taken' ? '#F43F5E' : emailStatus === 'available' ? '#10B981' : '#E2E8F0' 
                }} 
                placeholder="nom@entreprise.tn" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
              />
              {emailStatus === 'checking' && <span style={{ fontSize: '12px', color: '#64748B' }}>Vérification...</span>}
              {emailStatus === 'taken' && <span style={{ fontSize: '12px', color: '#F43F5E' }}>Cet email est déjà utilisé</span>}
              {emailStatus === 'available' && <span style={{ fontSize: '12px', color: '#10B981' }}>Email disponible</span>}
            </div>
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  style={{ ...inputStyle, paddingRight: '48px' }} 
                  placeholder="••••••••" 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                if (emailStatus === 'taken') {
                  alert("Cet email est déjà utilisé. Veuillez en choisir un autre.");
                  return;
                }
                if (emailStatus === 'checking') {
                  alert("Veuillez patienter pendant la vérification de l'email.");
                  return;
                }
                setStep(2);
              }}
              disabled={!form.email || !form.password}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: '12px', opacity: (!form.email || !form.password) ? 0.5 : 1 }}
            >
              Continuer →
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#64748B' }}>
              Déjà un compte ? <Link href="/login" style={{ color: '#4F46E5', fontWeight: 700 }}>Se connecter</Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Nom de l'Entreprise</label>
              <input style={inputStyle} placeholder="ex: Ben Yaghlane Distribution" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input style={inputStyle} placeholder="+216 71..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input style={inputStyle} placeholder="Tunis, Sousse..." value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Adresse du Siège</label>
              <input style={inputStyle} placeholder="ex: Zone Industrielle Charguia II" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
            </div>
            <div>
              <label style={labelStyle}>Description de vos produits</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Quels types de produits vendez-vous ?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', color: '#475569', border: '1.5px solid #E2E8F0', fontWeight: 700 }}>Retour</button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Création...' : <><Send size={18} /> Finaliser l'inscription</>}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '80px', height: '80px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={48} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>Inscription Envoyée !</h2>
            <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '32px' }}>
              Votre demande est en cours de validation par notre équipe. Vous recevrez un email dès que votre accès au Marketplace sera activé.
            </p>
            <Link href="/" style={{ display: 'inline-block', width: '100%', padding: '14px', borderRadius: '12px', background: '#4F46E5', color: '#fff', textDecoration: 'none', fontWeight: 800 }}>
              Retour à l'accueil
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
