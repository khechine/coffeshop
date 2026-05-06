'use client';

import React, { useState } from 'react';
import { Search, Filter, Package, ShoppingCart, Settings, Save, Clock, Percent, Target } from 'lucide-react';
import { updateMarketplaceConfig } from '../../actions';

export default function SuperAdminMarketplaceClient({ products, orders, config: initialConfig }: { products: any[], orders: any[], config: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  
  const filteredProducts = (products || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.vendor?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateConfig = async () => {
    setSaving(true);
    try {
      const updated = await updateMarketplaceConfig({
        rfqCommissionRate: Number(config.rfqCommissionRate),
        rfqExpirationHours: Number(config.rfqExpirationHours)
      });
      setConfig(updated);
      setIsSettingsOpen(false);
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la mise à jour de la configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Catalogue & Flux Marketplace</h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Supervisez l'ensemble des produits et des transactions B2B.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button
             onClick={() => setIsSettingsOpen(!isSettingsOpen)}
             style={{
               display:'flex', alignItems:'center', gap:'8px',
               padding:'12px 20px', borderRadius:'16px',
               background: isSettingsOpen ? '#1E293B' : '#F1F5F9',
               color: isSettingsOpen ? '#fff' : '#1E293B', 
               border:'none', fontSize:'14px', fontWeight:800,
               cursor: 'pointer', transition: 'all 0.2s'
             }}
           >
             <Settings size={18} /> Configuration
           </button>
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
             🎯 Bannières
           </a>
           <a
             href="/superadmin/marketplace/categories"
             style={{
               display:'flex', alignItems:'center', gap:'8px',
               padding:'12px 20px', borderRadius:'16px',
               background:'linear-gradient(135deg,#10B981,#059669)',
               color:'#fff', textDecoration:'none', fontSize:'14px', fontWeight:800,
               boxShadow:'0 8px 16px rgba(16,185,129,0.3)'
             }}
           >
             📁 Catégories
           </a>
           <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '12px 12px 12px 40px', borderRadius: '16px', border: '1px solid #E2E8F0', width: '200px', fontSize: '14px', outline: 'none' }}
              />
           </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div style={{ 
          background: '#fff', padding: '32px', borderRadius: '32px', border: '2px solid #4F46E5',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={24} className="text-indigo-600" /> Paramètres des RFQ (Appels d'Offres)
            </h2>
            <button 
              onClick={handleUpdateConfig}
              disabled={saving}
              style={{
                display:'flex', alignItems:'center', gap:'8px',
                padding:'12px 24px', borderRadius:'14px',
                background:'#4F46E5', color:'#fff', border:'none',
                fontSize:'14px', fontWeight:800, cursor: 'pointer',
                opacity: saving ? 0.5 : 1
              }}
            >
              <Save size={18} /> {saving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Commission sur RFQ (%)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number"
                    step="0.1"
                    value={config.rfqCommissionRate}
                    onChange={(e) => setConfig({ ...config, rfqCommissionRate: e.target.value })}
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0',
                      fontSize: '16px', fontWeight: 700, outline: 'none', background: '#F8FAFC'
                    }}
                  />
                  <Percent size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  Cette commission est déduite du wallet du vendeur lors de l'acceptation d'une offre.
                </p>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Expiration des Demandes (Heures)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number"
                    value={config.rfqExpirationHours}
                    onChange={(e) => setConfig({ ...config, rfqExpirationHours: e.target.value })}
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0',
                      fontSize: '16px', fontWeight: 700, outline: 'none', background: '#F8FAFC'
                    }}
                  />
                  <Clock size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  Délai après lequel un RFQ est automatiquement clôturé.
                </p>
             </div>
          </div>
        </div>
      )}

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
