'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Zap, ShieldCheck, Trophy, Globe, Rocket, 
  ArrowRight, CheckCircle2, Star, Building2, Users, 
  LayoutGrid, Search, Menu, MessageSquare, Target, 
  Headphones, Smartphone, FileText, ChevronDown, Check,
  Layout, MapPin, Package
} from 'lucide-react';
import MarketplaceHeader from './marketplace/components/MarketplaceHeader';
import MarketplaceFooter from './marketplace/components/MarketplaceFooter';
import { CartProvider } from './marketplace/CartContext';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
  if (user) return null;

  const sectionPadding = isMobile ? '60px 20px' : '120px 24px';
  const headingSize = isMobile ? '36px' : '72px';
  const subHeadingSize = isMobile ? '28px' : '48px';

  return (
    <CartProvider>
      <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', scrollBehavior: 'smooth', overflowX: 'hidden' }}>
        
        <MarketplaceHeader minimal={true} />

      {/* ── HERO SECTION ── */}
      <section style={{ 
        position: 'relative', 
        padding: isMobile ? '60px 0' : '100px 0', 
        background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 24px', 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: isMobile ? '40px' : '60px', 
          alignItems: 'center',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <div style={{ zIndex: 1, flex: 1.2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', padding: '8px 16px', borderRadius: '100px', color: '#E31E24', fontWeight: 800, fontSize: '13px', marginBottom: '24px' }}>
              <Zap size={16} fill="#E31E24" /> NOUVELLE GÉNÉRATION B2B
            </div>
            <h1 style={{ fontSize: headingSize, fontWeight: 950, color: '#111827', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px' }}>
              Le commerce B2B <br/> 
              <span style={{ color: '#E31E24' }}>réinventé</span> en Tunisie.
            </h1>
            <p style={{ fontSize: isMobile ? '16px' : '20px', color: '#4B5563', lineHeight: 1.6, marginBottom: '40px', maxWidth: isMobile ? '100%' : '600px', fontWeight: 500, margin: isMobile ? '0 auto 40px' : '0 0 40px' }}>
              ElKassa connecte les fournisseurs vérifiés aux professionnels les plus exigeants. Une plateforme robuste pour sourcer, négocier et gérer vos achats en toute confiance.
            </p>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Link href="/register" style={{ 
                background: '#E31E24', 
                color: '#fff', 
                padding: '18px 48px', 
                borderRadius: '100px', 
                fontWeight: 800, 
                fontSize: '18px', 
                textDecoration: 'none',
                boxShadow: '0 20px 40px rgba(227, 30, 36, 0.2)',
                textAlign: 'center'
              }}>
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
                border: '2px solid #E5E7EB',
                textAlign: 'center'
              }}>
                Marketplace
              </Link>
            </div>
            
            <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: isMobile ? '20px' : '32px', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#111827' }}>1500+</span>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Fournisseurs</span>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#111827' }}>50k+</span>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Produits B2B</span>
              </div>
              {!isMobile && <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }} />}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#111827' }}>98%</span>
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Satisfaction</span>
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative', flex: 0.8, width: '100%', maxWidth: '500px' }}>
             <div style={{ 
               background: '#fff', 
               borderRadius: isMobile ? '20px' : '32px', 
               padding: '8px', 
               boxShadow: '0 40px 80px rgba(0,0,0,0.1)',
               transform: isMobile ? 'none' : 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
               border: '1px solid #F1F5F9'
             }}>
               <img 
                 src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80" 
                 style={{ width: '100%', borderRadius: isMobile ? '16px' : '24px', display: 'block' }}
                 alt="Dashboard Preview"
               />
             </div>
             {!isMobile && (
               <div style={{ position: 'absolute', top: '20px', left: '-40px', background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                     <Check size={20} strokeWidth={3} />
                  </div>
                  <div>
                     <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>Paiement Sécurisé</div>
                     <div style={{ fontSize: '10px', color: '#6B7280' }}>Garantie de livraison</div>
                  </div>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* ── LOGO CLOUD (Trust) ── */}
      <section style={{ padding: isMobile ? '40px 0' : '60px 0', borderBottom: '1px solid #F1F5F9' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', marginBottom: isMobile ? '24px' : '32px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ILS NOUS FONT CONFIANCE</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '32px' : '80px', flexWrap: 'wrap', opacity: 0.5 }}>
               {['Coca-Cola', 'Danone', 'Nestlé', 'SFBT'].map(brand => (
                 <span key={brand} style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 900, color: '#111827', letterSpacing: '-1px' }}>{brand}</span>
               ))}
            </div>
         </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{ padding: sectionPadding }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px' }}>
               <h2 style={{ fontSize: subHeadingSize, fontWeight: 950, color: '#111827', letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: 1.2 }}>Une plateforme, <br/> des possibilités infinies.</h2>
               <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>Tout ce dont vous avez besoin pour digitaliser vos opérations B2B.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px' }}>
               {[
                 { icon: Search, title: 'Recherche Intelligente', desc: 'Filtrez par catégorie, fournisseur ou proximité.' },
                 { icon: MessageSquare, title: 'RFQ & Négociation', desc: 'Demandez des devis et négociez en direct.' },
                 { icon: ShieldCheck, title: 'Vérification Pro', desc: 'Fournisseurs audités pour garantir la fiabilité.' },
                 { icon: Smartphone, title: 'Mobile First', desc: 'Gérez tout depuis votre smartphone.' },
                 { icon: LayoutGrid, title: 'Gestion de Stock', desc: 'Inventaire automatisé et alertes.' },
                 { icon: Globe, title: 'Réseau National', desc: 'Livraison partout en Tunisie.' },
               ].map((feat, i) => (
                 <div key={i} style={{ 
                   background: '#fff', 
                   padding: isMobile ? '24px' : '40px', 
                   borderRadius: '20px', 
                   border: '1px solid #F1F5F9',
                   transition: 'all 0.3s'
                 }}>
                    <div style={{ width: '48px', height: '48px', background: '#FEF2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24', marginBottom: '20px' }}>
                       <feat.icon size={24} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>{feat.title}</h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>{feat.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── ADVANTAGES SECTION ── */}
      <section style={{ padding: isMobile ? '40px 10px' : '100px 0', background: '#111827', color: '#fff', borderRadius: isMobile ? '0' : '60px', margin: isMobile ? '0' : '0 24px' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '40px' : '80px', alignItems: 'center' }}>
               <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
                  <div style={{ color: '#E31E24', fontWeight: 800, fontSize: '14px', marginBottom: '16px', letterSpacing: '0.1em' }}>POUR LES VENDEURS</div>
                  <h2 style={{ fontSize: isMobile ? '28px' : '42px', fontWeight: 900, marginBottom: '24px', lineHeight: 1.2 }}>Accélérez votre croissance digitale sans effort.</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: isMobile ? 'center' : 'flex-start' }}>
                     {[
                       'Visibilité massive auprès des acheteurs pro.',
                       'Tableau de bord de gestion intuitif.',
                       'Paiements sécurisés et garantis.',
                       'Analyses de performance en temps réel.'
                     ].map((item, i) => (
                       <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', textAlign: 'left' }}>
                          <div style={{ width: '20px', height: '20px', background: '#E31E24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                             <Check size={12} strokeWidth={4} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{item}</span>
                       </div>
                     ))}
                  </div>
                  <button style={{ marginTop: '32px', background: '#E31E24', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>Créer ma boutique</button>
               </div>
               {!isMobile && (
                <div style={{ flex: 1, position: 'relative' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80" 
                      style={{ width: '100%', borderRadius: '40px', filter: 'grayscale(0.2)' }}
                      alt="Vendor advantage"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,24,39,0.8), transparent)', borderRadius: '40px' }} />
                </div>
               )}
            </div>

            <div style={{ height: isMobile ? '60px' : '120px' }} />

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: isMobile ? '40px' : '80px', alignItems: 'center' }}>
               {!isMobile && (
                 <div style={{ flex: 1, position: 'relative' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80" 
                      style={{ width: '100%', borderRadius: '40px', filter: 'grayscale(0.2)' }}
                      alt="Buyer advantage"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,24,39,0.8), transparent)', borderRadius: '40px' }} />
                 </div>
               )}
               <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
                  <div style={{ color: '#E31E24', fontWeight: 800, fontSize: '14px', marginBottom: '16px', letterSpacing: '0.1em' }}>POUR LES ACHETEURS</div>
                  <h2 style={{ fontSize: isMobile ? '28px' : '42px', fontWeight: 900, marginBottom: '24px', lineHeight: 1.2 }}>Trouvez les meilleurs produits, au meilleur prix.</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: isMobile ? 'center' : 'flex-start' }}>
                     {[
                       'Accès direct aux prix de gros.',
                       'Filtres de recherche avancés.',
                       'Système de devis (RFQ) rapide.',
                       'Suivi centralisé des fournisseurs.'
                     ].map((item, i) => (
                       <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', textAlign: 'left' }}>
                          <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', flexShrink: 0 }}>
                             <Check size={12} strokeWidth={4} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{item}</span>
                       </div>
                     ))}
                  </div>
                  <button style={{ marginTop: '32px', background: '#fff', color: '#111827', border: 'none', padding: '14px 32px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>Lancer un sourcing</button>
               </div>
            </div>
         </div>
      </section>

      {/* ── PREMIUM FEATURES SECTION ── */}
      <section style={{ padding: sectionPadding, background: '#F8FAFC' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px' }}>
               <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', padding: '6px 12px', borderRadius: '100px', color: '#E31E24', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                 <Star size={14} fill="#E31E24" /> Solutions Premium
               </div>
               <h2 style={{ fontSize: subHeadingSize, fontWeight: 950, color: '#111827', letterSpacing: '-2px', marginBottom: '16px', lineHeight: 1.1 }}>Dominez votre secteur <br/> avec nos outils Premium.</h2>
               <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>Des fonctionnalités exclusives pour les leaders.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px' }}>
               {[
                 { icon: Layout, title: "Vitrine Branding", desc: "Personnalisez vos couleurs, bannières et logos.", color: "#E31E24" },
                 { icon: Zap, title: "Intelligence Prédictive", desc: "Soyez alerté quand vos clients manquent de stock.", color: "#F59E0B" },
                 { icon: MapPin, title: "Gestion Franchises", desc: "Gérez vos points de vente sur une carte interactive.", color: "#3B82F6" },
                 { icon: Package, title: "Boost Bundles", desc: "Mettez en avant vos packs promotionnels.", color: "#10B981" },
                 { icon: MessageSquare, title: "TradeMessager Pro", desc: "Messagerie sécurisée avec filtrage automatique.", color: "#8B5CF6" },
                 { icon: ShieldCheck, title: "Audit & Badge", desc: "Gagnez en crédibilité avec le badge Premium.", color: "#111827" }
               ].map((f, i) => (
                 <div key={i} style={{ 
                   background: '#fff', 
                   padding: isMobile ? '24px' : '40px', 
                   borderRadius: isMobile ? '16px' : '24px', 
                   border: '1px solid #F1F5F9',
                   boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                   transition: 'all 0.3s'
                 }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px', 
                      background: '#F8FAFC', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: f.color,
                      marginBottom: '16px'
                    }}>
                       <f.icon size={20} />
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{f.title}</h3>
                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, fontWeight: 500 }}>{f.desc}</p>
                 </div>
               ))}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: isMobile ? '40px' : '64px' }}>
               <Link href="/vendor/premium" style={{ 
                 display: 'inline-flex', 
                 alignItems: 'center', 
                 gap: '8px', 
                 color: '#E31E24', 
                 fontWeight: 800, 
                 textDecoration: 'none',
                 fontSize: '15px'
               }}>
                 Découvrir tous les avantages Premium <ArrowRight size={18} />
               </Link>
            </div>
         </div>
      </section>

      {/* ── PRICING SECTION (Packs) ── */}
      <section style={{ padding: sectionPadding }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '48px' : '80px' }}>
               <h2 style={{ fontSize: subHeadingSize, fontWeight: 950, color: '#111827', letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: 1.1 }}>Choisissez votre plan <br/> de croissance.</h2>
               <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>Des options flexibles adaptées à votre taille.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
               {[
                 { name: 'RACHMA', price: 'Gratuit', color: '#10B981', tagline: 'Petits commerces', features: ['Gestion produits', 'Stock basique'] },
                 { name: 'STARTER', price: '29 DT', color: '#3B82F6', tagline: 'Démarrez pro', features: ['Mode POS Premium', 'Conformité fiscale'] },
                 { name: 'PRO', price: '79 DT', color: '#8B5CF6', tagline: 'Le pack complet', features: ['Accès Marketplace B2B', 'Fidélité client'], highlight: true },
                 { name: 'ENTERPRISE', price: 'Sur devis', color: '#F59E0B', tagline: 'Grands comptes', features: ['Multi-boutiques', 'Support VIP'] },
               ].map((plan, i) => (
                 <div key={i} style={{ 
                   background: '#fff', 
                   padding: '32px', 
                   borderRadius: '24px', 
                   border: plan.highlight ? '3px solid #E31E24' : '1px solid #E5E7EB',
                   position: 'relative',
                   display: 'flex',
                   flexDirection: 'column',
                   justifyContent: 'space-between',
                   transform: (plan.highlight && !isMobile) ? 'scale(1.05)' : 'none',
                   zIndex: plan.highlight ? 2 : 1,
                   boxShadow: plan.highlight ? '0 20px 40px rgba(0,0,0,0.1)' : 'none'
                 }}>
                    {plan.highlight && (
                      <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#E31E24', color: '#fff', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>RECOMMANDÉ</div>
                    )}
                    <div>
                       <div style={{ color: plan.color, fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>{plan.name}</div>
                       <div style={{ fontSize: '32px', fontWeight: 950, color: '#111827', marginBottom: '4px' }}>{plan.price}</div>
                       <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', fontWeight: 600 }}>{plan.tagline}</div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                          {plan.features.map((f, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>
                               <CheckCircle2 size={14} color={plan.color} /> {f}
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
                    }}>Choisir</button>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: isMobile ? '60px 0' : '100px 0', textAlign: 'center' }}>
         <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{ fontSize: isMobile ? '36px' : '56px', fontWeight: 950, color: '#111827', letterSpacing: '-2.5px', lineHeight: 1.1, marginBottom: '24px' }}>Prêt à passer au niveau supérieur ?</h2>
            <p style={{ fontSize: isMobile ? '16px' : '20px', color: '#6B7280', marginBottom: '40px', fontWeight: 500 }}>Inscrivez-vous aujourd'hui sur ElKassa.</p>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: '16px' }}>
               <button style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '18px 48px', borderRadius: '100px', fontWeight: 900, fontSize: '18px', cursor: 'pointer', boxShadow: '0 20px 40px rgba(227,30,36,0.2)' }}>S'inscrire</button>
               <button style={{ background: 'transparent', border: '2px solid #111827', color: '#111827', padding: '18px 48px', borderRadius: '100px', fontWeight: 900, fontSize: '18px', cursor: 'pointer' }}>Contacter un expert</button>
            </div>
         </div>
      </section>

      <MarketplaceFooter />

      </div>
    </CartProvider>
  );
}
