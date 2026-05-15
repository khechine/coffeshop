'use client';

import React, { useState } from 'react';
import { X, Send, Users, Mail, CheckCircle2 } from 'lucide-react';

export default function MarketplaceReferralModal({ onClose, userEmail }: { onClose: () => void, userEmail: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const invitationText = `Bonjour,

Je vous invite à rejoindre ElKassa, la plateforme B2B de référence en Tunisie. 
Devenez un vendeur qualifié et développez votre activité sur toute la Tunisie.

Inscrivez-vous dès maintenant pour accéder à notre réseau de professionnels.

Cordialement,
${userEmail}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(onClose, 2000);
    }, 1500);
  };

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div style={{ width: '64px', height: '64px', background: '#DCFCE7', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>Invitation Envoyée !</h2>
          <p style={{ color: '#6B7280', marginTop: '8px' }}>Votre invitation a été envoyée avec succès à {email}.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'modalIn 0.3s ease-out' }}>
        {/* Header */}
        <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Parrainer un Pro</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>Développez le réseau ElKassa et gagnez des avantages.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>E-mail de votre confrère</label>
            <div style={{ position: 'relative' }}>
               <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
               <input 
                 required
                 type="email" 
                 placeholder="exemple@entreprise.tn"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px' }}
               />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Message d'invitation</label>
            <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', color: '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {invitationText}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '12px 32px', borderRadius: '8px', border: 'none', 
                background: '#4F46E5', color: '#fff', fontWeight: 900, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Envoi...' : <><Send size={18} /> Envoyer l'invitation</>}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
