'use client';

import { useState } from 'react';
import { Coffee, Lock, Mail, Eye, EyeOff, ShieldCheck, Truck, Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../actions';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result: any = await loginUser(email, password);
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      
      localStorage.setItem('user', JSON.stringify(result));
      
      // Legacy storage sync for Sidebar & Dashboard
      localStorage.setItem('pos_cashier', result.name);
      localStorage.setItem('pos_cashier_role', result.role);
      localStorage.setItem('pos_cashier_permissions', JSON.stringify(['DASHBOARD', 'POS', 'PRODUCTS', 'STOCK', 'STAFF', 'SUBS', 'SUPPLY']));

      if (result.role === 'VENDOR') router.push('/vendor/portal');
      else if (result.role === 'SUPERADMIN') router.push('/superadmin');
      else if (result.role === 'STORE_OWNER') router.push('/admin');
      else router.push('/pos');
    } catch (err: any) {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', overflow: 'hidden', fontFamily: 'inherit' }}>
      
      {/* Left side: Animated Brand / Info (Visible on Desktop) */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', color: '#fff' }} className="hide-mobile">
         {/* Decorative elements */}
         <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', filter: 'blur(80px)' }} />
         <div style={{ position: 'absolute', bottom: '10%', right: '0', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', filter: 'blur(60px)' }} />

         <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
               <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee size={28} />
               </div>
               <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-1px' }}>CoffeeSaaS <span style={{ color: '#818CF8' }}>B2B</span></span>
            </div>

            <h1 style={{ fontSize: '48px', fontWeight: 900, lineHeight: '1.1', marginBottom: '32px', letterSpacing: '-1.5px' }}>
               Propulsez votre <br />
               business café.
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               {[
                 { icon: <Store size={20} />, title: "Pour les Coffee Shops", desc: "Caisse tactille, gestion de stock et marketplace." },
                 { icon: <ShieldCheck size={20} />, title: "Pour les Fournisseurs", desc: "Catalogue digital et gestion de commandes b2b." },
                 { icon: <Truck size={20} />, title: "Pour les Livreurs", desc: "Réseau logistique intégré pour toute la Tunisie." }
               ].map((item, i) => (
                 <div key={i} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ color: '#818CF8', marginTop: '4px' }}>{item.icon}</div>
                    <div>
                       <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>{item.title}</div>
                       <div style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.5' }}>{item.desc}</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         
         <div style={{ position: 'absolute', bottom: '40px', left: '80px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            © 2026 Plateforme Marketplace Tunisie
         </div>
      </div>

      {/* Right side: Login Form */}
      <div style={{ width: '560px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }} className="full-width-mobile">
         <div style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ marginBottom: '40px' }}>
               <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', marginBottom: '8px', letterSpacing: '-0.5px' }}>Bienvenue</h2>
               <p style={{ color: '#64748B', fontSize: '16px' }}>Identifiez-vous pour continuer.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               {error && (
                 <div style={{ padding: '14px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                    {error}
                 </div>
               )}

               <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Identifiant mail</label>
                  <div style={{ position: 'relative' }}>
                     <Mail size={18} color="#CBD5E1" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                     <input 
                        type="email" 
                        required 
                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px' }} 
                        placeholder="nom@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                     />
                  </div>
               </div>

               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                     <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mot de passe</label>
                     <a href="#" style={{ fontSize: '12px', color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>Oublié ?</a>
                  </div>
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

               <button 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1E1B4B', color: '#fff', border: 'none', fontWeight: 800, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
               >
                  {loading ? 'Connexion en cours...' : <><CheckCircle2 size={18} /> Se Connecter</>}
               </button>
            </form>

            <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
               <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>Pas encore partenaire ?</p>
               <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366F1', fontWeight: 800, textDecoration: 'none', fontSize: '15px' }}>
                  Ouvrir un compte gratuitement <ArrowRight size={18} />
               </Link>
            </div>
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
