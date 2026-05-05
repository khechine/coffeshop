'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Menu, ChevronRight, ChevronLeft, ChevronDown,
  User, MessageSquare, HelpCircle, Smartphone, 
  Languages, ShoppingBag, ShieldCheck, Trophy, 
  Users, ArrowRight, Grid, Camera, Star,
  CheckCircle2, Globe, Rocket, Heart, ShoppingCart,
  Target, ShieldAlert, Zap, Headphones, ArrowUp,
  FileText, Calendar
} from 'lucide-react';
import MarketplaceProductCard from './components/MarketplaceProductCard';
import MarketplaceHeader from './components/MarketplaceHeader';
import MarketplaceFooter from './components/MarketplaceFooter';

/* --- UI Components --- */
const BannerBadge = ({ children, color = '#E31E24' }: any) => (
  <span style={{ 
    background: color, 
    color: '#fff', 
    padding: '4px 12px', 
    borderRadius: '100px', 
    fontSize: '11px', 
    fontWeight: 800, 
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }}>
    {children}
  </span>
);


export default function MarketplaceClient({ initialData, store }: { initialData: any; store?: any }) {
  const { categories = [], products = [], banners = [] } = initialData || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('PRODUCT');
  const [shuffledTags, setShuffledTags] = useState<string[]>([]);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const router = useRouter();

  // URL State
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search');
  const urlScope = searchParams.get('scope') || 'PRODUCT';

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}&scope=${searchScope}`);
  };

  const filteredResults = useMemo(() => {
    if (!urlSearch) return null;
    const q = urlSearch.toLowerCase();

    if (urlScope === 'PRODUCT') {
      return products.filter((p: any) => 
        p.name.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.vendor?.companyName?.toLowerCase().includes(q)
      );
    }
    if (urlScope === 'VENDOR') {
      const vendors = Array.from(new Set(products.map((p: any) => p.vendor?.id)))
        .map(id => products.find((p: any) => p.vendor?.id === id)?.vendor)
        .filter(Boolean);
      return vendors.filter((v: any) => v.companyName.toLowerCase().includes(q));
    }
    if (urlScope === 'CATEGORY') {
      const allCats: any[] = [];
      const traverse = (cats: any[]) => {
        cats.forEach(c => {
          allCats.push(c);
          if (c.children) traverse(c.children);
        });
      };
      traverse(categories);
      return allCats.filter((c: any) => c.name.toLowerCase().includes(q));
    }
    return [];
  }, [urlSearch, urlScope, products, categories]);

  const marketplaceSegments = [
    { 
      id: 'matieres-premieres', 
      name: 'Matières Premières',
      subcategories: [
        { name: 'Café Vert', items: ['Robusta', 'Arabica', 'Mélanges Spéciaux'] },
        { name: 'Sucre & Édulcorants', items: ['Sucre Blanc', 'Sucre Roux', 'Stevia', 'Sirops de base'] },
        { name: 'Boulangerie & Pâtisserie', items: ['Farine', 'Levure', 'Améliorants', 'Chocolat de couverture'] },
        { name: 'Produits Laitiers', items: ['Lait UHT', 'Crème Liquide', 'Beurre', 'Fromage'] }
      ]
    },
    { 
      id: 'semi-finis', 
      name: 'Produits Semi-Finis',
      subcategories: [
        { name: 'Bases & Mixes', items: ['Base Glace', 'Mix Gaufre', 'Mix Crêpe'] },
        { name: 'Garnitures', items: ['Toppings', 'Coulis de fruits', 'Nappages'] },
        { name: 'Surgelés', items: ['Pâtes à pain', 'Viennoiseries prêtes à cuire'] }
      ]
    },
    { 
      id: 'produits-finis', 
      name: 'Produits Finis (B2B / Revente)',
      subcategories: [
        { name: 'Boissons Chaudes', items: ['Café Torréfié', 'Thé Premium', 'Tisanes', 'Chocolat en poudre'] },
        { name: 'Boissons Froides', items: ['Eaux Minérales', 'Jus de fruits', 'Sodas', 'Energy Drinks'] },
        { name: 'Snacking', items: ['Biscuits', 'Fruits Secs', 'Confiseries'] }
      ]
    },
    { 
      id: 'equipements', 
      name: 'Équipements & Matériel',
      subcategories: [
        { name: 'Barista & Café', items: ['Machines Espresso', 'Moulins', 'Accessoires Barista'] },
        { name: 'Cuisine & Cuisson', items: ['Fours', 'Plaques', 'Toasters', 'Friteuses'] },
        { name: 'Froid & Conservation', items: ['Réfrigérateurs', 'Congélateurs', 'Machines à Glaçons'] },
        { name: 'Mobilier', items: ['Tables', 'Chaises', 'Comptoirs'] }
      ]
    },
    { 
      id: 'emballages', 
      name: 'Emballages',
      subcategories: [
        { name: 'Vente à emporter', items: ['Gobelets Carton', 'Porte-gobelets', 'Couvercles'] },
        { name: 'Boîtages', items: ['Boîtes Pâtisserie', 'Boîtes Burger', 'Sacs Papier'] },
        { name: 'Consommables', items: ['Serviettes', 'Pailles Papier', 'Couverts'] }
      ]
    },
    { 
      id: 'hygiene', 
      name: 'Hygiène & Nettoyage',
      subcategories: [
        { name: 'Entretien Cuisine', items: ['Dégraissants', 'Produits Lave-vaisselle', 'Liquide vaisselle'] },
        { name: 'Désinfection', items: ['Gel Hydroalcoolique', 'Désinfectant surfaces'] },
        { name: 'Matériel', items: ['Gants', 'Chiffons microfibres', 'Balais'] }
      ]
    },
    { 
      id: 'services', 
      name: 'Services',
      subcategories: [
        { name: 'Technique', items: ['Maintenance Équipements', 'Installation', 'Réparation'] },
        { name: 'Conseil', items: ['Formation Barista', 'Audit Hygiène', 'Design Menu'] },
        { name: 'Digital', items: ['Systèmes POS', 'Logiciels Gestion Stock'] }
      ]
    }
  ];

  const heroBanner = banners.find((b: any) => b.position === 'HERO') || {
    title: 'Achats Intelligents : Affaires Prêtes',
    subtitle: 'Vision Globale, Achats Précis, Efficacité Maximale',
    imageUrl: '/marketplace_hero_banner.png'
  };

  useEffect(() => {
    const names: string[] = [];
    const traverse = (cats: any[]) => {
      cats.forEach(cat => {
        names.push(cat.name);
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(categories);
    
    const finalNames = names.length > 0 ? names : ["Nouveautés", "Promotions", "Vérifiés", "Stock"];
    const shuffled = [...finalNames].sort(() => Math.random() - 0.5);
    setShuffledTags(shuffled);
  }, [categories]);

  const historyProducts = products.length > 0 ? products.slice(0, 7) : [];

  const perspectives = [
    { 
      id: 1, 
      title: "Quels sont les avantages des pilotes de moteur pour répondre aux besoin...", 
      author: "Kaylee Watson", 
      date: "05/05/2026",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200"
    },
    { 
      id: 2, 
      title: "3 façons d'équilibrer le coût et la fonctionnalité lors du choix d'une...", 
      author: "Jadyn Moyer", 
      date: "05/05/2026",
      image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200"
    },
    { 
      id: 3, 
      title: "Ai-je besoin d'un HDD et d'un SSD ?", 
      author: "Ramon Beasley", 
      date: "05/05/2026",
      image: "https://images.unsplash.com/photo-1544244015-0cd4b3ffc6b0?w=200"
    },
    { 
      id: 4, 
      title: "Conception de bijoux plaqués or : un guide complet pour répondre aux...", 
      author: "Joshua Price", 
      date: "05/05/2026",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200"
    }
  ];

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', scrollBehavior: 'smooth' }}>
      
      <MarketplaceHeader />

      {/* Main Layout */}
      <main style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 24px' }}>
        
        {urlSearch ? (
          <div style={{ minHeight: '60vh' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827' }}>
                Résultats pour "{urlSearch}" 
                <span style={{ color: '#6B7280', fontSize: '16px', fontWeight: 600, marginLeft: '12px' }}>
                  ({filteredResults?.length || 0} {urlScope.toLowerCase()}s trouvés)
                </span>
              </h1>
              <div style={{ height: '4px', width: '60px', background: '#E31E24', marginTop: '8px', borderRadius: '10px' }} />
            </div>

            {filteredResults && filteredResults.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: urlScope === 'PRODUCT' ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', 
                gap: '24px' 
              }}>
                {urlScope === 'PRODUCT' && filteredResults.map((p: any) => (
                  <MarketplaceProductCard key={p.id} product={p} />
                ))}

                {urlScope === 'VENDOR' && filteredResults.map((v: any) => (
                  <Link 
                    key={v.id} 
                    href={`/marketplace/vendor/${v.id}`}
                    style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #F1F5F9', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}
                  >
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      <img src={v.logoUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>{v.companyName}</h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0' }}>{v.city}, {v.sector}</p>
                    </div>
                    <button style={{ background: '#F3F4F6', color: '#111827', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '12px' }}>Voir la boutique</button>
                  </Link>
                ))}

                {urlScope === 'CATEGORY' && filteredResults.map((c: any) => (
                  <Link 
                    key={c.id} 
                    href={`/marketplace/category/${c.id}`}
                    style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #F1F5F9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24' }}>
                      <Grid size={24} />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{c.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: '24px', border: '2px dashed #E5E7EB' }}>
                <Search size={64} color="#D1D5DB" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#4B5563' }}>Désolé, aucun résultat trouvé</h3>
                <p style={{ color: '#9CA3AF', marginTop: '8px' }}>Essayez d'autres mots clés ou une autre catégorie de recherche.</p>
                <button 
                  onClick={() => router.push('/marketplace')}
                  style={{ marginTop: '24px', background: '#E31E24', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Retour à l'accueil
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Top Part: Sidebar + Hero */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '48px' }}>
              {/* Sidebar Categories with Mega Menu */}
              <aside 
                style={{ width: '280px', flexShrink: 0, background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: 'fit-content', position: 'relative' }}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#111827' }}>
                  <Menu size={20} />
                  <h2 style={{ fontSize: '18px', fontWeight: 900 }}>Catégories</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {marketplaceSegments.map((seg: any) => (
                    <Link 
                      key={seg.id} 
                      href={`/marketplace/category/${seg.id}`}
                      style={{ 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        color: hoveredSegment === seg.id ? '#E31E24' : '#4B5563', 
                        background: hoveredSegment === seg.id ? '#FEF2F2' : 'transparent',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={() => setHoveredSegment(seg.id)}
                    >
                      <span>{seg.name}</span>
                      <ChevronRight size={14} opacity={hoveredSegment === seg.id ? 1 : 0.5} />
                    </Link>
                  ))}
                </div>

                {/* Mega Menu Overlay */}
                {hoveredSegment && (
                  <div style={{ 
                    position: 'absolute', 
                    left: '280px', 
                    top: 0, 
                    width: '720px', 
                    minHeight: '100%', 
                    background: '#fff', 
                    boxShadow: '20px 0 40px rgba(0,0,0,0.1)', 
                    zIndex: 50, 
                    borderRadius: '0 16px 16px 0',
                    borderLeft: '1px solid #F1F5F9',
                    padding: '30px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '30px'
                  }}>
                    {marketplaceSegments.find(s => s.id === hoveredSegment)?.subcategories.map((sub: any, idx: number) => (
                      <div key={idx}>
                        <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {sub.name} <ArrowRight size={12} />
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {sub.items.map((item: string, i: number) => (
                            <Link 
                              key={i} 
                              href={`/marketplace/category/${item.toLowerCase().replace(/\s+/g, '-')}`}
                              style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }} 
                              onMouseEnter={e => e.currentTarget.style.color = '#E31E24'} 
                              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
                            >
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
                  <button style={{ 
                    width: '100%', 
                    background: '#F9FAFB', 
                    border: '1px solid #E5E7EB', 
                    padding: '12px', 
                    borderRadius: '10px', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    Toutes les Catégories
                  </button>
                </div>
              </aside>

              {/* Hero + Featured Area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Hero Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
                  <div style={{ position: 'relative', height: '480px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <img 
                      src={heroBanner.imageUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt="Marketplace Hero"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)', display: 'flex', alignItems: 'center', padding: '60px' }}>
                      <div style={{ maxWidth: '450px' }}>
                        <BannerBadge color="#E31E24">B2B Platform</BannerBadge>
                        <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '20px 0' }}>
                          {heroBanner.title}
                        </h1>
                        <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px', fontWeight: 500 }}>
                          {heroBanner.subtitle}
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <button style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '14px 36px', borderRadius: '100px', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>
                            S'inscrire Gratuitement
                          </button>
                          <button style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '14px 36px', borderRadius: '100px', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>
                            Publier RFQ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', flex: 1, border: '1px solid #E31E24', borderLeftWidth: '6px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>Service Sécurisé</h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '20px' }}>Protection complète de vos paiements et garantie de conformité des produits.</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                         {[1,2,3].map(i => <div key={i} style={{ width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '8px' }} />)}
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: '20px', padding: '24px', color: '#fff', flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '12px' }}>RFQ Express</h3>
                      <p style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.5, marginBottom: '20px' }}>Dites-nous ce dont vous avez besoin et recevez des devis en moins de 24h.</p>
                      <button style={{ width: '100%', background: '#fff', color: '#1E1B4B', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                        Demander Devis
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trusted Suppliers / Features */}
                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  {[
                    { icon: ShieldCheck, title: 'Fournisseurs Vérifiés', sub: 'Audités par ElKassa' },
                    { icon: Globe, title: 'Réseau National', sub: 'Toute la Tunisie' },
                    { icon: Trophy, title: 'Qualité Garantie', sub: 'Standards Pro' },
                    { icon: Rocket, title: 'Logistique Rapide', sub: 'Livraison Express' },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                      <div style={{ width: '40px', height: '40px', background: '#FEF2F2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24' }}>
                        <f.icon size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{f.title}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>{f.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Part: Full Width Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
              
              {/* Products Section */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827' }}>Sélectionnés pour vous</h2>
                    <div style={{ height: '4px', width: '60px', background: '#E31E24', marginTop: '8px', borderRadius: '10px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                     <button style={{ padding: '8px 20px', borderRadius: '100px', background: '#fff', border: '1px solid #E5E7EB', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Nouveautés</button>
                     <button style={{ padding: '8px 20px', borderRadius: '100px', background: '#E31E24', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Top Ventes</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }}>
                  {products.length > 0 ? products.slice(0, 10).map((p: any) => (
                    <MarketplaceProductCard key={p.id} product={p} />
                  )) : (
                    [1,2,3,4,5,6,7,8,9,10].map(i => (
                      <div key={i} style={{ height: '350px', background: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.5 }}>
                        <div style={{ flex: 1, background: '#F3F4F6', borderRadius: '8px' }} />
                        <div style={{ height: '20px', background: '#F3F4F6', borderRadius: '4px', width: '80%' }} />
                        <div style={{ height: '20px', background: '#F3F4F6', borderRadius: '4px', width: '40%' }} />
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Special Categories / Collections */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', borderRadius: '24px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ color: '#E31E24', fontWeight: 800, fontSize: '14px' }}>PROMOS FLASH</span>
                    <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', margin: '12px 0' }}>Jusqu'à -40% sur le packaging</h2>
                    <button style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, marginTop: '20px', cursor: 'pointer' }}>
                      Découvrir
                    </button>
                  </div>
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '200px', height: '200px', background: '#fff', borderRadius: '50%', opacity: 0.5 }} />
                </div>
                <div style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', borderRadius: '24px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ color: '#10B981', fontWeight: 800, fontSize: '14px' }}>BIO & LOCAL</span>
                    <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', margin: '12px 0' }}>Sourcing Responsable Tunisie</h2>
                    <button style={{ background: '#10B981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, marginTop: '20px', cursor: 'pointer' }}>
                      Explorer
                    </button>
                  </div>
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '200px', height: '200px', background: '#fff', borderRadius: '50%', opacity: 0.5 }} />
                </div>
              </section>

              {/* Basé sur votre Navigation */}
              {historyProducts.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '24px' }}>Basé sur votre Navigation</h2>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                    {historyProducts.map((p: any) => (
                      <Link 
                        key={p.id} 
                        href={`/marketplace/product/${p.id}`}
                        style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
                      >
                        <div style={{ 
                          width: '140px', 
                          height: '140px', 
                          borderRadius: '50%', 
                          overflow: 'hidden', 
                          background: '#fff', 
                          boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                          border: '1px solid #F1F5F9',
                          transition: 'transform 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <img 
                            src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200'} 
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          color: '#1F2937', 
                          maxWidth: '130px', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3
                        }}>
                          {p.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Service Commercial Section */}
              <section>
                 <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '32px' }}>Service Commercial</h2>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div style={{ background: 'linear-gradient(to bottom, #fff, #F9FAFB)', borderRadius: '20px', padding: '40px', border: '1px solid #F1F5F9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24', marginBottom: '24px' }}>
                        <Target size={32} />
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '16px' }}>Acheter Facile</h3>
                      <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6, marginBottom: '32px', minHeight: '80px' }}>
                        Un service de sourcing en ligne pour que les acheteurs obtiennent des devis exacts de fournisseurs correspondants.
                      </p>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 700, color: '#111827', cursor: 'pointer' }}>
                        Voir plus <ArrowRight size={16} />
                      </button>
                    </div>

                    <div style={{ background: 'linear-gradient(to bottom, #fff, #F9FAFB)', borderRadius: '20px', padding: '40px', border: '1px solid #F1F5F9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', marginBottom: '24px' }}>
                        <ShieldCheck size={32} />
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '16px' }}>Fournisseur Audité</h3>
                      <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6, marginBottom: '32px', minHeight: '80px' }}>
                        Un fournisseur audité est authentique et a déjà été vérifié sur site. Il sera marqué avec le logo "Fournisseur audité".
                      </p>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 700, color: '#111827', cursor: 'pointer' }}>
                        Voir plus <ArrowRight size={16} />
                      </button>
                    </div>

                    <div style={{ background: 'linear-gradient(to bottom, #fff, #F9FAFB)', borderRadius: '20px', padding: '40px', border: '1px solid #F1F5F9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '24px' }}>
                        <MessageSquare size={32} />
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '16px' }}>TradeMessager</h3>
                      <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6, marginBottom: '32px', minHeight: '80px' }}>
                        En tant que logiciel de messagerie instantanée, il permet de communiquer de manière aussi succincte, efficace et efficace que possible.
                      </p>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 700, color: '#111827', cursor: 'pointer' }}>
                        Voir plus <ArrowRight size={16} />
                      </button>
                    </div>
                 </div>
              </section>

              {/* Perspectives Commerciales Section */}
              <section>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>Perspectives Commerciales</h2>
                    <button style={{ background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 700, color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Voir plus <ChevronRight size={16} />
                    </button>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                    {perspectives.map((item) => (
                      <div key={item.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F1F5F9', transition: 'transform 0.3s' }}>
                        <div style={{ height: '160px', overflow: 'hidden', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={item.image} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ padding: '20px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '16px', lineHeight: 1.4, height: '44px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {item.title}
                          </h3>
                          <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
                            Par {item.author} {item.date}
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </section>

              {/* Produits Populaires Section */}
              <section style={{ paddingBottom: '100px' }}>
                 <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '24px' }}>Produits Populaires</h2>
                 <div style={{ 
                   display: 'flex', 
                   flexWrap: 'wrap', 
                   gap: '12px', 
                   maxHeight: '150px', 
                   overflow: 'hidden',
                   lineHeight: '48px'
                 }}>
                    {shuffledTags.map((tag, i) => (
                      <div key={i} style={{ 
                        padding: '0 20px', 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '100px', 
                        border: '1px solid #E5E7EB', 
                        background: '#fff', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#E31E24';
                        e.currentTarget.style.color = '#E31E24';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.color = '#374151';
                      }}
                      >
                        {tag}
                      </div>
                    ))}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '13px', 
                      fontWeight: 700, 
                      color: '#6B7280', 
                      cursor: 'pointer',
                      padding: '0 10px',
                      height: '40px'
                    }}>
                      Plus <ChevronDown size={14} />
                    </div>
                 </div>
              </section>
            </div>
          </>
        )}
      </main>

      <MarketplaceFooter />

      {/* Floating Buttons */}
      <div style={{ position: 'fixed', right: '30px', bottom: '30px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1000 }}>
         <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
           <button style={{ width: '60px', height: '60px', border: 'none', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer' }}>
              <MessageSquare size={20} color="#E31E24" />
              <span style={{ fontSize: '10px', fontWeight: 800 }}>RFQ</span>
           </button>
           <button style={{ width: '60px', height: '60px', border: 'none', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer' }}>
              <Headphones size={20} color="#6B7280" />
              <span style={{ fontSize: '10px', fontWeight: 700 }}>Aide</span>
           </button>
           <button 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
             style={{ width: '60px', height: '60px', border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
           >
              <ArrowUp size={24} color="#9CA3AF" />
           </button>
         </div>
      </div>

    </div>
  );
}
