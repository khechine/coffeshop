'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Mail, ArrowRight, CheckCircle2, AlertTriangle, Loader2, Key } from 'lucide-react';
import Link from 'next/link';
import { verifyEmailAction } from '../actions';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoVerifying, setAutoVerifying] = useState(!!tokenFromUrl);

  // Auto-verify if token is in URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleVerify = async (tokenToUse: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await verifyEmailAction(tokenToUse, email || undefined);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.message || "Votre adresse email a été validée.");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la validation.");
    } finally {
      setLoading(false);
      setAutoVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Veuillez saisir le code de validation.");
      return;
    }
    handleVerify(token);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'inherit' }}>
      {/* Decorative blurred circles */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(79,70,229,0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(6,182,212,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '480px', background: '#ffffff', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative', zIndex: 1 }}>
        
        {/* Header Branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #4F46E5, #06B6D4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1 }}>Alkassa</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Validation de compte</span>
          </div>
        </div>

        {autoVerifying ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: '#6366F1', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Validation en cours...</h3>
            <p style={{ color: '#64748B', fontSize: '15px' }}>Veuillez patienter pendant que nous validons votre adresse email.</p>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ECFDF5', border: '2px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', margin: '0 auto 24px' }}>
              <CheckCircle2 size={36} />
            </div>
            
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.5px' }}>Email Validé !</h3>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
              {success}
            </p>

            <Link 
              href="/login" 
              style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1E1B4B', color: '#ffffff', textDecoration: 'none', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(30, 27, 75, 0.2)', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Se Connecter <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Saisir le code de validation
            </h3>
            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.5', marginBottom: '28px' }}>
              Entrez l'adresse email de votre compte ainsi que le code de validation à 6 caractères reçu par email.
            </p>

            {error && (
              <div style={{ display: 'flex', gap: '10px', padding: '14px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '13px', fontWeight: 700, marginBottom: '24px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Adresse Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#CBD5E1" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="email" 
                    placeholder="nom@exemple.com"
                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px', color: '#1E293B' }} 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Code de Validation</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} color="#CBD5E1" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    required
                    maxLength={10}
                    placeholder="Saisir le code"
                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, color: '#1E293B' }} 
                    value={token}
                    onChange={e => setToken(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1E1B4B', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Valider mon compte
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <p style={{ color: '#64748B', fontSize: '14px' }}>
                Retourner à la page de <Link href="/login" style={{ color: '#6366F1', fontWeight: 800, textDecoration: 'none' }}>connexion</Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#6366F1' }} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
