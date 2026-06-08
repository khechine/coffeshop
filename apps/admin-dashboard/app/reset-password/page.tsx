'use client';

import { useState, useEffect, Suspense } from 'react';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Building2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordAction } from '../actions';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide. Aucun token trouvé.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 4) {
      setError('Le mot de passe doit faire au moins 4 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await resetPasswordAction(token, password);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', color: '#fff' }} className="hide-mobile">
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(79,70,229,0.15)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '0', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', filter: 'blur(60px)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '60px' }}>
            <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #4F46E5, #06B6D4)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }}>
              <Building2 size={32} />
            </div>
            <span style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-1.5px' }}>Alkassa</span>
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: '1', marginBottom: '40px', letterSpacing: '-2px' }}>
            Nouveau <br />
            <span style={{ color: '#818CF8' }}>mot de passe</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: '1.6' }}>
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>
      </div>

      <div style={{ width: '560px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }} className="full-width-mobile">
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 size={32} color="#10B981" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>Mot de passe réinitialisé !</h2>
              <p style={{ color: '#64748B', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                Vous allez être redirigé vers la page de connexion...
              </p>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366F1', fontWeight: 800, textDecoration: 'none', fontSize: '15px' }}>
                Se connecter <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748B', textDecoration: 'none', fontSize: '13px', fontWeight: 700, marginBottom: '32px' }}>
                <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Retour à la connexion
              </Link>

              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Nouveau mot de passe</h2>
              <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '32px' }}>Choisissez un mot de passe sécurisé.</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && (
                  <div style={{ padding: '14px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '13px', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Nouveau mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#CBD5E1" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Confirmer le mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#CBD5E1" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px' }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1E1B4B', color: '#fff', border: 'none', fontWeight: 800, fontSize: '16px', cursor: loading || !token ? 'not-allowed' : 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading || !token ? 0.6 : 1 }}
                >
                  {loading ? 'Réinitialisation...' : <><Lock size={18} /> Réinitialiser</>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .full-width-mobile { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#94A3B8' }}>
        Chargement...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
