'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Zap, ShieldCheck, Trophy, Globe, Rocket, 
  ArrowRight, CheckCircle2, Star, Building2, Users, 
  LayoutGrid, Search, Menu, MessageSquare, Target, 
  Headphones, Smartphone, FileText, ChevronDown, Check
} from 'lucide-react';
import MarketplaceHeader from './marketplace/components/MarketplaceHeader';
import MarketplaceFooter from './marketplace/components/MarketplaceFooter';
import { CartProvider } from './marketplace/CartContext';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      if (user.role === 'VENDOR') {
        window.location.href = '/vendor/portal';
      } else if (user.role === 'SUPERADMIN') {
        window.location.href = '/superadmin';
      } else {
        window.location.href = '/admin';
      }
    }
  }, [user]);

  if (loading) return null;

  // If user exists, we are already redirecting. 
  // If not, we show this premium landing page.
  if (user) return null;

  return (
    <CartProvider>
      <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', scrollBehavior: 'smooth' }}>
        
        <MarketplaceHeader minimal={true} />

      {/* ── HERO SECTION ── */}
      <section style={{ 
        position: 'relative', 
        padding: '100px 0', 
        background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '60px', alignItems: 'center' }}>
          <div style={{ zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', padding: '8px 16px', borderRadius: '100px', color: '#E31E24', fontWeight: 800, fontSize: '13px', marginBottom: '24px' }}>
              <Zap size={16} fill="#E31E24" /> NOUVELLE GÉNÉRATION B2B
            </div>
            <h1 style={{ fontSize: '72px', fontWeight: 950, color: '#111827', lineHeight: 1, letterSpacing: '-3px', marginBottom: '24px' }}>
              Le commerce B2B <br/> 
              <span style={{ color: '#E31E24' }}>réinventé</span> en Tunisie.
            </h1>
            <p style={{ fontSize: '20px', color: '#4B5563', lineHeight: 1.6, marginBottom: '40px', maxWidth: '600px', fontWeight: 500 }}>
              ElKassa connecte les fournisseurs vérifiés aux professionnels les plus exigeants. Une plateforme robuste pour sourcer, négocier et gérer vos achats en toute confiance.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/register" style={{ 
                background: '#E31E24', 
                color: '#fff', 
                padding: '18px 48px', 
                borderRadius: '100px', 
                fontWeight: 800, 
                fontSize: '18px', 
                textDecoration: 'none',
                boxShadow: '0 20px 40px rgba(227, 30, 36, 0.2)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Commencer gratuitement
              </Link>
              <Link href="/marketplace" style={{ 
                background: '#fff', 
                color: '#111827', 
                padding: '18px 48px', 
                borderRadius: '100px', 
                fontWeight: 800, 
                fontSize: '18px', 
                textDecoration: 'none',
                border: '2px solid #E5E7EB'
              }}>
                Explorer la Marketplace
              </Link>
            </div>
            
            <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>1500+</span>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Fournisseurs</span>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>50k+</span>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Produits B2B</span>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>98%</span>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Satisfaction</span>
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
             <div style={{ 
               background: '#fff', 
               borderRadius: '32px', 
               padding: '12px', 
               boxShadow: '0 40px 80px rgba(0,0,0,0.1)',
               transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
               border: '1px solid #F1F5F9'
             }}>
               <img 
                 src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80" 
                 style={{ width: '100%', borderRadius: '24px', display: 'block' }}
                 alt="Dashboard Preview"
               />
             </div>
             {/* Floating UI elements */}
             <div style={{ position: 'absolute', top: '20px', left: '-40px', background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                   <Check size={20} strokeWidth={3} />
                </div>
                <div>
                   <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>Paiement Sécurisé</div>
                   <div style={{ fontSize: '10px', color: '#6B7280' }}>Garantie de livraison</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── LOGO CLOUD (Trust) ── */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid #F1F5F9' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#9CA3AF', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ILS NOUS FONT CONFIANCE</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', flexWrap: 'wrap', opacity: 0.5 }}>
               {['Coca-Cola', 'Danone', 'Nestlé', 'Tunisie Telecom', 'SFBT'].map(brand => (
                 <span key={brand} style={{ fontSize: '24px', fontWeight: 900, color: '#111827', letterSpacing: '-1px' }}>{brand}</span>
               ))}
            </div>
         </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{ padding: '120px 0' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
               <h2 style={{ fontSize: '48px', fontWeight: 950, color: '#111827', letterSpacing: '-2px', marginBottom: '16px' }}>Une plateforme, des possibilités infinies.</h2>
               <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>Tout ce dont vous avez besoin pour digitaliser vos opérations B2B, que vous soyez acheteur ou vendeur.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
               {[
                 { icon: Search, title: 'Recherche Intelligente', desc: 'Filtrez par catégorie, fournisseur, ville ou proximité géographique.' },
                 { icon: MessageSquare, title: 'RFQ & Négociation', desc: 'Demandez des devis personnalisés et négociez en direct avec les vendeurs.' },
                 { icon: ShieldCheck, title: 'Vérification Pro', desc: 'Chaque fournisseur est audité pour garantir la fiabilité et la qualité.' },
                 { icon: Smartphone, title: 'Mobile First', desc: 'Gérez vos commandes et vos stocks depuis votre smartphone n\'importe où.' },
                 { icon: LayoutGrid, title: 'Gestion de Stock', desc: 'Inventaire automatisé et alertes de stock bas en temps réel.' },
                 { icon: Globe, title: 'Réseau National', sub: 'Livraison partout en Tunisie avec suivi logistique intégré.' },
               ].map((feat, i) => (
                 <div key={i} style={{ 
                   background: '#fff', 
                   padding: '40px', 
                   borderRadius: '24px', 
                   border: '1px solid #F1F5F9',
                   transition: 'all 0.3s'
                 }}
                 onMouseEnter={e => {
                   e.currentTarget.style.borderColor = '#E31E24';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05)';
                 }}
                 onMouseLeave={e => {
                   e.currentTarget.style.borderColor = '#F1F5F9';
                   e.currentTarget.style.boxShadow = 'none';
                 }}
                 >
                    <div style={{ width: '56px', height: '56px', background: '#FEF2F2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24', marginBottom: '24px' }}>
                       <feat.icon size={28} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>{feat.title}</h3>
                    <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6 }}>{feat.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── ADVANTAGES SECTION ── */}
      <section style={{ padding: '100px 0', background: '#111827', color: '#fff', borderRadius: '60px', margin: '0 24px' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '80px', alignItems: 'center' }}>
               <div>
                  <div style={{ color: '#E31E24', fontWeight: 800, fontSize: '14px', marginBottom: '16px', letterSpacing: '0.1em' }}>POUR LES VENDEURS</div>
                  <h2 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '32px', lineHeight: 1.1 }}>Accélérez votre croissance <br/> digitale sans effort.</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     {[
                       'Visibilité massive auprès de milliers d\'acheteurs pro.',
                       'Tableau de bord de gestion des commandes intuitif.',
                       'Outils CRM intégrés pour fidéliser vos clients.',
                       'Paiements sécurisés et garantis par la plateforme.',
                       'Rapports d\'analyse de performance en temps réel.'
                     ].map((item, i) => (
                       <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '24px', height: '24px', background: '#E31E24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Check size={14} strokeWidth={4} />
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>{item}</span>
                       </div>
                     ))}
                  </div>
                  <button style={{ marginTop: '48px', background: '#E31E24', color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer' }}>Créer ma boutique pro</button>
               </div>
               <div style={{ position: 'relative' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80" 
                    style={{ width: '100%', borderRadius: '40px', filter: 'grayscale(0.2)' }}
                    alt="Vendor advantage"
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,24,39,0.8), transparent)', borderRadius: '40px' }} />
               </div>
            </div>

            <div style={{ height: '120px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '80px', alignItems: 'center' }}>
               <div style={{ order: 2 }}>
                  <div style={{ color: '#E31E24', fontWeight: 800, fontSize: '14px', marginBottom: '16px', letterSpacing: '0.1em' }}>POUR LES ACHETEURS</div>
                  <h2 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '32px', lineHeight: 1.1 }}>Trouvez les meilleurs <br/> produits, au meilleur prix.</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     {[
                       'Accès direct aux prix de gros sans intermédiaires.',
                       'Filtres de recherche avancés (stock, ville, vérification).',
                       'Système de devis (RFQ) ultra-rapide.',
                       'Protection acheteur sur toutes les transactions.',
                       'Suivi centralisé de tous vos fournisseurs.'
                     ].map((item, i) => (
                       <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '24px', height: '24px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}>
                             <Check size={14} strokeWidth={4} />
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>{item}</span>
                       </div>
                     ))}
                  </div>
                  <button style={{ marginTop: '48px', background: '#fff', color: '#111827', border: 'none', padding: '16px 36px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer' }}>Lancer un sourcing</button>
               </div>
               <div style={{ position: 'relative', order: 1 }}>
                  <img 
                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80" 
                    style={{ width: '100%', borderRadius: '40px', filter: 'grayscale(0.2)' }}
                    alt="Buyer advantage"
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,24,39,0.8), transparent)', borderRadius: '40px' }} />
               </div>
            </div>
         </div>
      </section>

      {/* ── PRICING SECTION (Packs) ── */}
      <section style={{ padding: '120px 0' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
               <h2 style={{ fontSize: '48px', fontWeight: 950, color: '#111827', letterSpacing: '-2px', marginBottom: '16px' }}>Choisissez votre plan de croissance.</h2>
               <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>Des options flexibles adaptées à la taille de votre entreprise.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
               {[
                 { name: 'RACHMA', price: 'Gratuit', color: '#10B981', tagline: 'Petits commerces', features: ['Gestion produits', 'Stock basique', 'Historique ventes'] },
                 { name: 'STARTER', price: '29 DT', color: '#3B82F6', tagline: 'Démarrez pro', features: ['Mode POS Premium', 'Conformité fiscale', 'Rapports Z'] },
                 { name: 'PRO', price: '79 DT', color: '#8B5CF6', tagline: 'Le pack complet', features: ['Accès Marketplace B2B', 'Multi-caisses', 'Fidélité client'], highlight: true },
                 { name: 'ENTERPRISE', price: 'Sur devis', color: '#F59E0B', tagline: 'Chaînes & Grands comptes', features: ['Multi-boutiques illimité', 'API personnalisée', 'Support VIP'] },
               ].map((plan, i) => (
                 <div key={i} style={{ 
                   background: '#fff', 
                   padding: '40px', 
                   borderRadius: '32px', 
                   border: plan.highlight ? '3px solid #E31E24' : '1px solid #E5E7EB',
                   position: 'relative',
                   display: 'flex',
                   flexDirection: 'column',
                   justifyContent: 'space-between',
                   transform: plan.highlight ? 'scale(1.05)' : 'none',
                   zIndex: plan.highlight ? 2 : 1,
                   boxShadow: plan.highlight ? '0 30px 60px rgba(0,0,0,0.1)' : 'none'
                 }}>
                    {plan.highlight && (
                      <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: '#E31E24', color: '#fff', padding: '4px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>RECOMMANDÉ</div>
                    )}
                    <div>
                       <div style={{ color: plan.color, fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', marginBottom: '12px' }}>{plan.name}</div>
                       <div style={{ fontSize: '36px', fontWeight: 950, color: '#111827', marginBottom: '8px' }}>{plan.price}</div>
                       <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px', fontWeight: 600 }}>{plan.tagline}</div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                          {plan.features.map((f, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>
                               <CheckCircle2 size={16} color={plan.color} /> {f}
                            </div>
                          ))}
                       </div>
                    </div>
                    <button style={{ 
                      width: '100%', 
                      padding: '14px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: plan.highlight ? '#E31E24' : '#F3F4F6', 
                      color: plan.highlight ? '#fff' : '#111827', 
                      fontWeight: 800, 
                      cursor: 'pointer' 
                    }}>Choisir ce plan</button>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: '100px 0', textAlign: 'center' }}>
         <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{ fontSize: '56px', fontWeight: 950, color: '#111827', letterSpacing: '-3px', lineHeight: 1, marginBottom: '32px' }}>Prêt à passer au niveau supérieur ?</h2>
            <p style={{ fontSize: '20px', color: '#6B7280', marginBottom: '48px', fontWeight: 500 }}>Inscrivez-vous aujourd'hui et commencez à digitaliser vos échanges commerciaux avec ElKassa.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
               <button style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '20px 60px', borderRadius: '100px', fontWeight: 900, fontSize: '18px', cursor: 'pointer', boxShadow: '0 20px 40px rgba(227,30,36,0.2)' }}>S'inscrire maintenant</button>
               <button style={{ background: 'transparent', border: '2px solid #111827', color: '#111827', padding: '20px 60px', borderRadius: '100px', fontWeight: 900, fontSize: '18px', cursor: 'pointer' }}>Contacter un expert</button>
            </div>
         </div>
      </section>

      <MarketplaceFooter />

      </div>
    </CartProvider>
  );
}
