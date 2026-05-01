'use client';

import React, { useState } from 'react';
import { Search, Filter, Package, ShoppingCart } from 'lucide-react';

export default function SuperAdminMarketplaceClient({ products, orders }: { products: any[], orders: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProducts = (products || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.vendor?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Catalogue & Flux Marketplace</h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Supervisez l'ensemble des produits et des transactions B2B.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <a
             href="/superadmin/marketplace/banners"
             style={{
               display:'flex', alignItems:'center', gap:'8px',
               padding:'12px 20px', borderRadius:'16px',
               background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
               color:'#fff', textDecoration:'none', fontSize:'14px', fontWeight:800,
               boxShadow:'0 8px 16px rgba(79,70,229,0.3)'
             }}
           >
             🎯 Gestion des Bannières
           </a>
           <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un produit ou vendeur..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '12px 12px 12px 40px', borderRadius: '16px', border: '1px solid #E2E8F0', width: '320px', fontSize: '14px', outline: 'none' }}
              />
           </div>
           <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} /> Filtres
           </button>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
         
         {/* Global Catalog Overview */}
         <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 900 }}>Derniers Produits Ajoutés</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
               {filteredProducts.slice(0, 9).map(p => (
                 <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '16px', background: '#F8FAFC' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden' }}>
                       <img src={p.image || ''} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                       <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{p.name}</div>
                       <div style={{ fontSize: '11px', color: '#64748B' }}>Vendeur: {p.vendor.companyName}</div>
                       <div style={{ fontSize: '14px', fontWeight: 900, color: '#4F46E5', marginTop: '4px' }}>{Number(p.price).toFixed(3)} DT</div>
                    </div>
                 </div>
               ))}
               {filteredProducts.length === 0 && <div style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Aucun produit trouvé</div>}
            </div>
            <button className="btn btn-outline" style={{ marginTop: '24px', width: '100%', fontWeight: 700 }}>Voir tout le catalogue ({filteredProducts.length} produits)</button>
         </div>

         {/* Transactions Feed */}
         <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 900 }}>Transactions Récentes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {orders.map(o => (
                 <div key={o.id} style={{ padding: '16px', borderRadius: '16px', background: '#FDFDFD', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                       <span style={{ fontWeight: 800, fontSize: '14px', color: '#1E293B' }}>{o.store.name}</span>
                       <span style={{ fontWeight: 900, color: '#4F46E5', fontSize: '14px' }}>{Number(o.total).toFixed(3)} DT</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Fournisseur: {o.vendor?.companyName}</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')} • {o.items.length} articles</div>
                 </div>
               ))}
            </div>
         </div>

      </div>
    </div>
  );
}
