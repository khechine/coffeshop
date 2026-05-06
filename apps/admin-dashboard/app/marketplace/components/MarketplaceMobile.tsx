'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Menu, Search, Camera, User, Grid, MessageSquare, 
  ShieldCheck, Video, Gift, ChevronRight, Play,
  ShoppingBag, Star, Zap, Clock, Flame
} from 'lucide-react';
import { sanitizeUrl } from '../../lib/imageUtils';

export default function MarketplaceMobile({ initialData, store, setRfqOpen, blogPosts = [], isVendor = false, hidePrices = false }: any) {
  const router = useRouter();
  const { categories = [], products = [], banners = [] } = initialData || {};

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
        { id: 1, title: "Quels sont les avantages des pilotes de moteur...", author: "Kaylee Watson", date: "05/05/2026", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200", slug: null },
        { id: 2, title: "3 façons d'équilibrer le coût et la fonctionnalité...", author: "Jadyn Moyer", date: "05/05/2026", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200", slug: null },
      ];
  const [activeTab, setActiveTab] = useState('All');
  const [scope, setScope] = useState('Products');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}&scope=${scope.toUpperCase() === 'PRODUCTS' ? 'PRODUCT' : 'VENDOR'}`);
  };

  return (
    <div style={{ background: '#F4F4F4', minHeight: '100vh', paddingBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Mobile Header */}
      <header style={{ background: '#fff', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Menu size={24} color="#333" />
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '100px', padding: '2px' }}>
             {['Products', 'Suppliers'].map(s => (
               <div 
                key={s}
                onClick={() => setScope(s)}
                style={{ 
                  padding: '4px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800,
                  background: scope === s ? '#fff' : 'transparent',
                  color: scope === s ? '#111827' : '#6B7280',
                  boxShadow: scope === s ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
               >
                 {s}
               </div>
             ))}
          </div>
          <User size={24} color="#333" />
        </div>
        
        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '12px', color: '#999' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder={`Search ${scope}`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 40px', 
              borderRadius: '100px', 
              border: '1px solid #ddd', 
              background: '#F9FAFB',
              fontSize: '14px',
              outline: 'none'
            }} 
          />
          <div style={{ position: 'absolute', right: '12px', color: '#666', display: 'flex', gap: '8px' }}>
            <Camera size={20} />
          </div>
        </form>
      </header>

      {/* Popular Searches */}
      <div style={{ background: '#fff', padding: '16px 12px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
           <Flame size={16} color="#E31E24" fill="#E31E24" />
           <span style={{ fontSize: '13px', fontWeight: 900 }}>Popular Searches</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
           {['Coffee Beans', 'Espresso Machines', 'Recyclable Cups', 'Local Syrups', 'Latte Art Tools'].map(s => (
             <div key={s} style={{ padding: '6px 16px', background: '#F3F4F6', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#4B5563', whiteSpace: 'nowrap' }}>{s}</div>
           ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ background: '#fff', padding: '12px 0', overflowX: 'auto', display: 'flex', gap: '20px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
        {['All', 'Beverages', 'Packaging', 'Equipment', 'Raw Materials', 'Tunisian Pride'].map((cat, i) => (
          <div 
            key={i} 
            onClick={() => setActiveTab(cat)}
            style={{ 
              padding: '0 16px', 
              fontSize: '14px', 
              fontWeight: activeTab === cat ? 800 : 500,
              color: activeTab === cat ? '#E31E24' : '#666',
              position: 'relative'
            }}
          >
            {cat}
            {activeTab === cat && (
              <div style={{ position: 'absolute', bottom: '-12px', left: '16px', right: '16px', height: '3px', background: '#E31E24', borderRadius: '100px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Hero Promo Banner */}
      <div style={{ padding: '12px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #6B21A8 0%, #DB2777 100%)', 
          borderRadius: '12px', 
          padding: '16px', 
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Keep Sourcing Best Local Products</h3>
            <div style={{ background: '#fff', color: '#E31E24', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
               <div style={{ width: '12px', height: '12px', background: '#E31E24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Play size={6} fill="#fff" color="#fff" />
               </div>
               Open
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
             {products.slice(0, 4).map((p: any, i: number) => (
               <Link key={i} href={`/marketplace/product/${p.id}`} style={{ background: '#fff', borderRadius: '8px', padding: '4px', height: '70px', display: 'block' }}>
                 <img src={sanitizeUrl(p.image ?? undefined)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="prod" />
               </Link>
             ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div style={{ background: '#fff', padding: '20px 12px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {[
          { icon: <Grid size={24} />, label: 'All Categories', color: '#333' },
          { icon: <MessageSquare size={24} />, label: 'RFQ', color: '#E31E24', action: () => setRfqOpen(true) },
          { icon: <ShieldCheck size={24} />, label: 'Secured Trading', color: '#059669' },
          { icon: <Video size={24} />, label: 'Video Channel', color: '#333' },
          { icon: <Gift size={24} />, label: 'Benefits', color: '#D97706' },
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
            <div style={{ color: item.color }}>{item.icon}</div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#666', lineHeight: 1.2 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Trending Products */}
      <div style={{ marginTop: '12px', padding: '16px', background: '#fff' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>Trending Products</h3>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {products.slice(0, 6).map((p: any, i: number) => (
            <Link key={i} href={`/marketplace/product/${p.id}`} style={{ minWidth: '100px', textAlign: 'center', textDecoration: 'none' }}>
               <div style={{ width: '100px', height: '100px', background: '#F9FAFB', borderRadius: '12px', padding: '10px', marginBottom: '8px' }}>
                 <img src={sanitizeUrl(p.image ?? undefined)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="trend" />
               </div>
               <span style={{ fontSize: '11px', fontWeight: 600, color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Dual Section Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px' }}>
        {/* Popular in Tunisia */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px' }}>🇹🇳</span>
            <span style={{ fontSize: '13px', fontWeight: 900 }}>Popular in Tunisia</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {products.slice(2, 4).map((p: any, i: number) => (
              <div key={i}>
                <div style={{ width: '100%', height: '70px', background: '#F9FAFB', borderRadius: '8px', padding: '4px', marginBottom: '4px' }}>
                  <img src={sanitizeUrl(p.image ?? undefined)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="pop" />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800 }}>{!hidePrices ? `${Number(p.price).toFixed(0)} DT` : 'P.S.D'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Low MOQ Products */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Zap size={16} color="#E31E24" fill="#E31E24" />
            <span style={{ fontSize: '13px', fontWeight: 900 }}>Low MOQ</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {products.slice(4, 6).map((p: any, i: number) => (
              <div key={i}>
                <div style={{ width: '100%', height: '70px', background: '#F9FAFB', borderRadius: '8px', padding: '4px', marginBottom: '4px' }}>
                  <img src={sanitizeUrl(p.image ?? undefined)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="moq" />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800 }}>1 Set</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perspectives Commerciales - Blog */}
      <div style={{ marginTop: '12px', padding: '16px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 950 }}>Perspectives Commerciales</h3>
          <Link href="/marketplace/blog" style={{ fontSize: '12px', fontWeight: 700, color: '#E31E24', textDecoration: 'none' }}>Voir plus</Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
          {perspectives.map((item: any) => (
            <Link key={item.id} href={item.slug ? `/marketplace/blog/${item.slug}` : '#'} style={{ minWidth: '240px', background: '#F9FAFB', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', textDecoration: 'none' }}>
              <div style={{ height: '120px' }}>
                <img src={item.image || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="blog" />
              </div>
              <div style={{ padding: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px', lineHeight: 1.4 }}>
                  {item.title}
                </h4>
                <div style={{ fontSize: '11px', color: '#999', fontWeight: 600 }}>Par {item.author}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* You May Like - Feed */}
      <div style={{ marginTop: '12px', padding: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 950, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           You may like
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {products.map((p: any, i: number) => (
            <Link key={i} href={`/marketplace/product/${p.id}`} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textDecoration: 'none' }}>
               <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative' }}>
                 <img src={sanitizeUrl(p.image ?? undefined)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="feed" />
                 {p.tags?.includes('Tunisie') && (
                   <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255,255,255,0.9)', borderRadius: '4px', padding: '2px 4px', fontSize: '10px' }}>🇹🇳</div>
                 )}
                 <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Play size={12} fill="#fff" />
                 </div>
               </div>
               <div style={{ padding: '10px' }}>
                 <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#333', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>
                   {p.name}
                 </h4>
                 {!hidePrices ? (
                   <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{Number(p.price).toFixed(2)} DT</div>
                 ) : (
                   <div style={{ fontSize: '12px', fontWeight: 800, color: '#E31E24' }}>Prix sur demande</div>
                 )}
                 <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{p.minOrderQty} {p.unit || 'Units'}</div>
               </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div 
        onClick={() => setRfqOpen(true)}
        style={{ 
          position: 'fixed', right: '16px', bottom: '100px', 
          background: '#E31E24', color: '#fff', 
          padding: '8px 16px', borderRadius: '100px', 
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 12px rgba(227,30,36,0.3)',
          fontWeight: 800, fontSize: '13px',
          zIndex: 1000
        }}
      >
        <MessageSquare size={18} fill="#fff" />
        Open RFQ
      </div>

      {/* Navigation Bar Mobile */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #eee', zIndex: 1000 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#E31E24' }}>
          <ShoppingBag size={20} />
          <span style={{ fontSize: '10px', fontWeight: 800, marginTop: '4px' }}>Market</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
          <Star size={20} />
          <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>Featured</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
          <MessageSquare size={20} />
          <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>Messages</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
          <User size={20} />
          <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>Account</span>
        </div>
      </nav>

    </div>
  );
}
