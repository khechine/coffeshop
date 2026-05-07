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
  FileText, Calendar, Leaf, MapPin, Award
} from 'lucide-react';
import MarketplaceProductCard from './components/MarketplaceProductCard';
import MarketplaceHeader from './components/MarketplaceHeader';
import MarketplaceFooter from './components/MarketplaceFooter';
import MarketplaceRFQModal from './components/MarketplaceRFQModal';
import MarketplaceMobile from './components/MarketplaceMobile';
import MarketplaceReferralModal from './components/MarketplaceReferralModal';

const normalize = (str: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

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


export default function MarketplaceClient({ initialData, store, blogPosts = [], user }: { initialData: any; store?: any; blogPosts?: any[]; user?: any }) {
  const isVendor = user?.role === 'VENDOR';
  const hidePrices = isVendor;
  const [rfqOpen, setRfqOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const { categories = [], products = [], banners = [] } = initialData || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('PRODUCT');
  const [shuffledTags, setShuffledTags] = useState<string[]>([]);
  const [homeTab, setHomeTab] = useState('Top Ventes');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Advanced Filters State
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);

  const router = useRouter();

  // URL State
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search');
  const urlScope = searchParams.get('scope') || 'PRODUCT';
  const urlRadius = searchParams.get('radius') || 'all';

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}&scope=${searchScope}`);
  };

  const searchData = useMemo(() => {
    if (!urlSearch) return { results: [], totalFound: 0, outsideRadius: 0 };
    const q = normalize(urlSearch);
    
    // 500km is treated as National (Infinity) to avoid confusion with null distances
    const maxD = (urlRadius === 'all' || urlRadius === '500') ? Infinity : parseFloat(urlRadius);

    let allMatches = [];
    if (urlScope === 'PRODUCT') {
      allMatches = products.filter((p: any) => 
        normalize(p.name).includes(q) || 
        normalize(p.description || '').includes(q) ||
        normalize(p.vendor?.companyName || '').includes(q)
      );
    } else if (urlScope === 'VENDOR') {
      const vendors = Array.from(new Set(products.map((p: any) => p.vendor?.id)))
        .map(id => products.find((p: any) => p.vendor?.id === id)?.vendor)
        .filter(Boolean);
      allMatches = vendors.filter((v: any) => normalize(v.companyName).includes(q));
    } else if (urlScope === 'CATEGORY') {
      const allCats: any[] = [];
      const traverse = (cats: any[]) => {
        cats.forEach(c => {
          allCats.push(c);
          if (c.children) traverse(c.children);
        });
      };
      traverse(categories);
      allMatches = allCats.filter((c: any) => normalize(c.name).includes(q));
    }

    const filtered = allMatches.filter((item: any) => {
      const distMatch = maxD === Infinity || (item.distance !== null && item.distance <= maxD);
      const priceMatch = (minPrice === '' || item.price >= parseFloat(minPrice)) && 
                         (maxPrice === '' || item.price <= parseFloat(maxPrice));
      const ratingMatch = minRating === 0 || (item.vendor?.ratings?.overallAvg >= minRating);
      
      return distMatch && priceMatch && ratingMatch;
    });

    return {
      results: filtered,
      totalFound: allMatches.length,
      outsideRadius: allMatches.length - filtered.length,
      allMatches // For similarity suggestions
    };
  }, [urlSearch, urlScope, urlRadius, products, categories, minPrice, maxPrice, minRating]);

  const marketplaceSegments = categories;

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

  // Proximity Filtered Data
  const maxD = (urlRadius === 'all' || urlRadius === '500') ? Infinity : parseFloat(urlRadius);
  const filteredProducts = useMemo(() => 
    products.filter((p: any) => maxD === Infinity || (p.distance !== null && p.distance <= maxD)),
    [products, maxD]
  );
  
  const historyProducts = filteredProducts.length > 0 ? filteredProducts.slice(0, 7) : [];

  // blog posts from DB or fallback
  const perspectives = blogPosts.length > 0
    ? blogPosts.map((p: any, i: number) => ({
        id: p.id,
        title: p.title,
        author: p.author,
        date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '',
        image: p.coverImage || `https://images.unsplash.com/photo-${['1518770660439-4636190af475','1523170335258-f5ed11844a49','1544244015-0cd4b3ffc6b0','1515562141207-7a88fb7ce338'][i % 4]}?w=200`,
        slug: p.slug,
      }))
    : [
        { id: 1, title: "Quels sont les avantages des pilotes de moteur pour répondre aux besoin...", author: "Kaylee Watson", date: "05/05/2026", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200", slug: null },
        { id: 2, title: "3 façons d'équilibrer le coût et la fonctionnalité lors du choix d'une...", author: "Jadyn Moyer", date: "05/05/2026", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200", slug: null },
        { id: 3, title: "Ai-je besoin d'un HDD et d'un SSD ?", author: "Ramon Beasley", date: "05/05/2026", image: "https://images.unsplash.com/photo-1544244015-0cd4b3ffc6b0?w=200", slug: null },
        { id: 4, title: "Conception de bijoux plaqués or : guide complet...", author: "Joshua Price", date: "05/05/2026", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200", slug: null },
      ];

  if (isMobile) {
    return <MarketplaceMobile initialData={initialData} store={store} setRfqOpen={setRfqOpen} blogPosts={blogPosts} isVendor={isVendor} hidePrices={hidePrices} />;
  }

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', scrollBehavior: 'smooth' }}>
      
      <MarketplaceHeader isVendor={isVendor} store={store} allCategories={categories} />

      {/* Main Layout */}
      <main style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 24px' }}>
        
        {urlSearch ? (
          <div style={{ minHeight: '60vh' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>
                  Résultats pour "{urlSearch}" 
                </h1>
                <div style={{ height: '4px', width: '60px', background: '#E31E24', marginTop: '12px', borderRadius: '10px' }} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#111827', fontSize: '18px', fontWeight: 900 }}>
                  {searchData.results.length} {urlScope.toLowerCase()}s
                </span>
                {searchData.outsideRadius > 0 && (
                  <div style={{ color: '#E31E24', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                    + {searchData.outsideRadius} hors de votre rayon ({urlRadius} km)
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'start' }}>
               {/* Sidebar Filters */}
               <aside style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', color: '#111827' }}>
                    <Menu size={20} />
                    <h2 style={{ fontSize: '18px', fontWeight: 900 }}>Filtres</h2>
                  </div>

                  {/* Distance Filter */}
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Distance</h4>
                    <select 
                      value={urlRadius}
                      onChange={(e) => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('radius', e.target.value);
                        router.push(`/marketplace?${params.toString()}`);
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="all">Toute la Tunisie</option>
                      <option value="5">Rayon 5 km</option>
                      <option value="10">Rayon 10 km</option>
                      <option value="25">Rayon 25 km</option>
                      <option value="50">Rayon 50 km</option>
                      <option value="100">Rayon 100 km</option>
                      <option value="500">Rayon 500 km</option>
                    </select>
                  </div>

                  {/* Price Filter */}
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Prix (DT)</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        placeholder="Min" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none' }}
                      />
                      <span style={{ color: '#9CA3AF' }}>-</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Note Fournisseur</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[4, 3, 2].map((stars) => (
                        <label key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>
                          <input 
                            type="radio" 
                            name="rating" 
                            checked={minRating === stars}
                            onChange={() => setMinRating(stars)}
                            style={{ accentColor: '#E31E24' }} 
                          />
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < stars ? "#F59E0B" : "none"} color={i < stars ? "#F59E0B" : "#D1D5DB"} />
                            ))}
                          </div>
                          <span>& plus</span>
                        </label>
                      ))}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>
                        <input 
                          type="radio" 
                          name="rating" 
                          checked={minRating === 0}
                          onChange={() => setMinRating(0)}
                          style={{ accentColor: '#E31E24' }} 
                        />
                        Toutes les notes
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setMinPrice(''); setMaxPrice(''); setMinRating(0); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', background: 'transparent', color: '#111827', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                  >
                    Réinitialiser
                  </button>
               </aside>

               {/* Results Area */}
               <section>
                {searchData.results.length > 0 ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: urlScope === 'PRODUCT' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', 
                    gap: '24px' 
                  }}>
                    {urlScope === 'PRODUCT' && searchData.results.map((p: any) => (
                      <MarketplaceProductCard 
                        key={p.id} 
                        product={p} 
                        hidePrice={hidePrices}
                      />
                    ))}

                    {urlScope === 'VENDOR' && searchData.results.map((v: any) => (
                      <Link 
                        key={v.id} 
                        href={`/marketplace/vendor/${v.id}`}
                        style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #F1F5F9', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', transition: 'all 0.2s' }}
                        className="vendor-card"
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

                    {urlScope === 'CATEGORY' && searchData.results.map((c: any) => (
                      <Link 
                        key={c.id} 
                        href={`/marketplace/category/${c.id}`}
                        style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #F1F5F9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }}
                        className="cat-card"
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24' }}>
                          <Grid size={24} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{c.name}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '100px 20px', background: '#fff', borderRadius: '24px', border: '2px dashed #E5E7EB' }}>
                    <div style={{ width: '80px', height: '80px', background: '#F9FAFB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <Search size={40} color="#D1D5DB" />
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#111827' }}>Aucun résultat exact</h3>
                    <p style={{ color: '#6B7280', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0', lineHeight: 1.6 }}>
                      Ajustez vos filtres ou élargissez votre rayon de recherche pour voir plus de résultats.
                      {searchData.outsideRadius > 0 && (
                        <span style={{ display: 'block', marginTop: '12px', color: '#E31E24', fontWeight: 700 }}>
                          Note : {searchData.outsideRadius} résultats existent en dehors de votre rayon de {urlRadius} km.
                        </span>
                      )}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
                      <button 
                        onClick={() => { setMinPrice(''); setMaxPrice(''); setMinRating(0); }}
                        style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Réinitialiser les filtres
                      </button>
                      {searchData.outsideRadius > 0 && (
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('radius', 'all');
                            router.push(`/marketplace?${params.toString()}`);
                          }}
                          style={{ background: '#fff', border: '1px solid #E5E7EB', color: '#111827', padding: '14px 28px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Élargir le rayon (National)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Similar Products Suggestions */}
                {searchData.allMatches.length > searchData.results.length && (
                  <div style={{ marginTop: '64px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <Zap size={24} color="#E31E24" fill="#E31E24" />
                      <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#111827' }}>Produits similaires (Plus loin)</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                      {searchData.allMatches.filter((m: any) => !searchData.results.includes(m)).slice(0, 8).map((p: any) => (
                        <MarketplaceProductCard 
                          key={p.id} 
                          product={p} 
                          hidePrice={hidePrices}
                        />
                      ))}
                    </div>
                  </div>
                )}
               </section>
            </div>
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

                {/* Mega Menu Overlay — Alibaba-style grouped subcategories */}
                {hoveredSegment && (() => {
                  const hoveredCat = marketplaceSegments.find((s: any) => s.id === hoveredSegment);
                  const children = hoveredCat?.children || [];
                  
                  // Group children by groupTitle
                  const grouped: Record<string, any[]> = {};
                  children.forEach((child: any) => {
                    const group = child.groupTitle || 'Autres';
                    if (!grouped[group]) grouped[group] = [];
                    grouped[group].push(child);
                  });
                  const groupEntries = Object.entries(grouped);

                  if (children.length === 0) return (
                    <div style={{ 
                      position: 'absolute', left: '280px', top: 0, width: '400px', minHeight: '200px',
                      background: '#fff', boxShadow: '20px 0 40px rgba(0,0,0,0.1)', zIndex: 50, 
                      borderRadius: '0 16px 16px 0', borderLeft: '1px solid #F1F5F9', padding: '40px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px'
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                        {hoveredCat?.icon || '📦'}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#9CA3AF' }}>Aucune sous-catégorie</span>
                      <Link 
                        href={`/marketplace/category/${hoveredCat?.slug || hoveredCat?.id}`}
                        style={{ fontSize: '13px', color: '#E31E24', fontWeight: 800, textDecoration: 'none' }}
                      >
                        Voir la catégorie →
                      </Link>
                    </div>
                  );

                  return (
                    <div style={{ 
                      position: 'absolute', left: '280px', top: 0, width: '720px', minHeight: '100%',
                      background: '#fff', boxShadow: '20px 0 40px rgba(0,0,0,0.1)', zIndex: 50, 
                      borderRadius: '0 16px 16px 0', borderLeft: '1px solid #F1F5F9', padding: '28px 32px',
                    }}>
                      {/* Category title bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                          <span style={{ color: hoveredCat?.color || '#E31E24' }}>{hoveredCat?.icon || '•'}</span>
                          {hoveredCat?.name}
                        </h3>
                        <Link 
                          href={`/marketplace/category/${hoveredCat?.slug || hoveredCat?.id}`}
                          style={{ fontSize: '12px', color: '#E31E24', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          Tout voir <ArrowRight size={12} />
                        </Link>
                      </div>

                      {/* Grouped subcategories grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', alignItems: 'start' }}>
                        {groupEntries.map(([groupName, items]: [string, any[]]) => (
                          <div key={groupName}>
                            <h4 style={{ 
                              fontSize: '13px', fontWeight: 900, color: '#111827', marginBottom: '14px', 
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                              paddingBottom: '8px', borderBottom: '2px solid #E31E24',
                              display: 'inline-block'
                            }}>
                              {groupName}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {items.map((child: any) => (
                                <Link 
                                  key={child.id} 
                                  href={`/marketplace/category/${child.slug || child.id}`}
                                  style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s', textDecoration: 'none', lineHeight: 1.3 }} 
                                  onMouseEnter={e => e.currentTarget.style.color = '#E31E24'} 
                                  onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

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
                      <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>Sourcing Garanti</h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '20px' }}>Accès exclusif à des fournisseurs vérifiés et accompagnement personnalisé pour vos achats B2B.</p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                         <div style={{ width: '40px', height: '40px', background: '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24' }}>
                           <ShieldCheck size={24} />
                         </div>
                         <div style={{ width: '40px', height: '40px', background: '#F0F9FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                           <CheckCircle2 size={24} />
                         </div>
                         <div style={{ width: '40px', height: '40px', background: '#F0FDF4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                           <Award size={24} />
                         </div>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: '20px', padding: '24px', color: '#fff', flex: 1, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.2 }}>
                         <Users size={80} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '12px', position: 'relative' }}>Parrainez un Pro</h3>
                      <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.5, marginBottom: '20px', position: 'relative' }}>Invitez un confrère sur ElKassa et profitez d'avantages exclusifs sur vos prochaines commandes.</p>
                      <button 
                        onClick={() => setShowReferralModal(true)}
                        style={{ width: '100%', background: '#fff', color: '#4F46E5', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', position: 'relative' }}
                      >
                        Inviter maintenant
                      </button>
                    </div>
                  </div>
                </div>

                {showReferralModal && (
                  <MarketplaceReferralModal 
                    onClose={() => setShowReferralModal(false)} 
                    userEmail={isVendor ? "vendeur@elkassa.tn" : "client@elkassa.tn"} // Fallback placeholder
                  />
                )}

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
                     {['Nouveautés', 'Top Ventes'].map(tab => (
                       <button 
                        key={tab}
                        onClick={() => setHomeTab(tab)}
                        style={{ 
                          padding: '8px 24px', borderRadius: '100px', 
                          background: homeTab === tab ? '#E31E24' : '#fff', 
                          border: homeTab === tab ? 'none' : '1px solid #E5E7EB', 
                          color: homeTab === tab ? '#fff' : '#6B7280', 
                          fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                       >
                         {tab}
                       </button>
                     ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }}>
                  {(homeTab === 'Nouveautés' ? [...products].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : products).slice(0, 10).map((p: any) => (
                    <MarketplaceProductCard 
                      key={p.id} 
                      product={p} 
                      hidePrice={hidePrices}
                    />
                  ))}
                </div>
              </section>

              {/* Special Categories / Collections */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <Link href="/marketplace/tunisia" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)', borderRadius: '24px', padding: '40px', position: 'relative', overflow: 'hidden', display: 'block', minHeight: '200px' }}>
                  {/* Tunisia Map - local asset */}
                  <img
                    src="/tunisia-flag-map.png"
                    alt="Tunisia Flag Map"
                    style={{ 
                      position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)',
                      height: '130%', width: 'auto', opacity: 0.25,
                      pointerEvents: 'none',
                      filter: 'drop-shadow(0 4px 12px rgba(227,30,36,0.2))'
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 1, maxWidth: '60%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🇹🇳</span>
                      <span style={{ color: '#E31E24', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>MADE IN TUNISIA</span>
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: '0 0 8px', lineHeight: 1.2 }}>Soutenons nos producteurs locaux</h2>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Découvrez des produits authentiques, fabriqués en Tunisie par des artisans et producteurs locaux.</p>
                    <div style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'inline-block' }}>
                      Explorer →
                    </div>
                  </div>
                </Link>

                <Link href="/marketplace/eco" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', borderRadius: '24px', padding: '40px', position: 'relative', overflow: 'hidden', display: 'block', minHeight: '200px' }}>
                  <div style={{ position: 'absolute', right: '-10px', bottom: '-30px', color: '#10B981', opacity: 0.15 }}>
                    <Leaf size={220} strokeWidth={0.8} />
                  </div>
                  <div style={{ position: 'absolute', right: '60px', top: '20px', color: '#10B981', opacity: 0.2, transform: 'rotate(20deg)' }}>
                    <Leaf size={60} strokeWidth={1} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1, maxWidth: '65%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🌱</span>
                      <span style={{ color: '#10B981', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>BIO & LOCAL</span>
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: '0 0 8px', lineHeight: 1.2 }}>Sourcing Responsable Tunisie</h2>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Produits bio, éco-responsables et cultivés localement pour un approvisionnement durable.</p>
                    <div style={{ background: '#10B981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'inline-block' }}>
                      Explorer →
                    </div>
                  </div>
                </Link>
              </section>

              {/* Basé sur votre Navigation */}
              {historyProducts.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', marginBottom: '24px' }}>Basé sur votre Navigation</h2>
                  <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
                    {Array.from(new Map(historyProducts.map((p: any) => [p.id, p])).values()).map((p: any) => {
                      const cleanName = p.name.split(' - ')[0].split(' #')[0];
                      return (
                        <Link 
                          key={p.id} 
                          href={`/marketplace/product/${p.id}`}
                          style={{ flex: '0 0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textDecoration: 'none', width: '160px' }}
                        >
                          <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            borderRadius: '50%', 
                            overflow: 'hidden', 
                            background: '#fff', 
                            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                            border: '1px solid #F1F5F9',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.borderColor = '#E31E24';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = '#F1F5F9';
                          }}
                          >
                            <img 
                              src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200'} 
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: 800, 
                              color: '#1F2937', 
                              maxWidth: '140px', 
                              display: '-webkit-box', 
                              WebkitLineClamp: 1, 
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3
                            }}>
                              {cleanName}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: hidePrices ? '#E31E24' : '#111827' }}>
                              {hidePrices ? 'Prix sur demande' : `${Number(p.price).toFixed(2)} DT`}
                            </span>
                            {!hidePrices && (
                              <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600 }}>
                                {p.minOrderQty} {p.unit || 'Pièce'}(s) (MOQ)
                              </div>
                            )}
                            {p.vendor?.city && (
                              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
                                <MapPin size={8} /> {p.vendor.city}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
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
                        Communiquez en toute sécurité avec les fournisseurs pour valider vos stocks et spécificités techniques. 
                        Négociez vos conditions de sourcing sans partager vos coordonnées personnelles.
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
                    <Link href="/marketplace/blog" style={{ background: 'transparent', border: 'none', fontSize: '14px', fontWeight: 700, color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      Voir plus <ChevronRight size={16} />
                    </Link>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                     {blogPosts.slice(0, 4).map((item: any) => (
                       <Link key={item.id} href={item.slug ? `/marketplace/blog/${item.slug}` : '#'} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F1F5F9', transition: 'transform 0.3s', textDecoration: 'none', display: 'block' }}>
                         <div style={{ height: '160px', overflow: 'hidden', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <img src={item.image} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                         </div>
                         <div style={{ padding: '20px' }}>
                           <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '16px', lineHeight: 1.4, height: '44px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                             {item.title}
                           </h3>
                           <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
                             Par {item.author} · {item.date}
                           </div>
                         </div>
                       </Link>
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
                   lineHeight: '48px'
                 }}>
                    {(() => {
                      // Build flat lookup: name -> { slug, id }
                      const catLookup = new Map<string, { slug?: string; id: string }>();
                      const traverse = (cats: any[]) => {
                        cats.forEach(cat => {
                          catLookup.set(cat.name, { slug: cat.slug, id: cat.id });
                          if (cat.children) traverse(cat.children);
                        });
                      };
                      traverse(categories);

                      return shuffledTags.map((tag, i) => {
                        const catInfo = catLookup.get(tag);
                        const href = catInfo 
                          ? `/marketplace/category/${catInfo.slug || catInfo.id}` 
                          : `/marketplace?search=${encodeURIComponent(tag)}&scope=CATEGORY`;
                        
                        return (
                          <Link 
                            key={i} 
                            href={href}
                            style={{ 
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
                              whiteSpace: 'nowrap',
                              textDecoration: 'none'
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
                          </Link>
                        );
                      });
                    })()}
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
           <button onClick={() => setRfqOpen(true)} style={{ width: '60px', height: '60px', border: 'none', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer' }}>
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

      {rfqOpen && <MarketplaceRFQModal onClose={() => setRfqOpen(false)} />}
    </div>
  );
}
