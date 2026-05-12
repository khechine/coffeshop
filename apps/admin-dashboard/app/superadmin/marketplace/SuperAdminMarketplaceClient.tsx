'use client';

import React, { useState } from 'react';
import { Search, Filter, Package, ShoppingCart, Settings, Save, Clock, Percent, Target, ArrowUpRight, CheckCircle2, AlertCircle, TrendingUp, BarChart3, Globe, Edit3, Trash2, X, Power, Image as ImageIcon } from 'lucide-react';
import { updateMarketplaceConfig, updateMarketplaceProductAction, deleteMarketplaceProductAction } from '../../actions';

export default function SuperAdminMarketplaceClient({ products: initialProducts, orders, config: initialConfig }: { products: any[], orders: any[], config: any }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'performance'>('catalog');
  
  // Product management state
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [updatingProd, setUpdatingProd] = useState(false);

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

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setUpdatingProd(true);
    try {
      await updateMarketplaceProductAction(editingProduct.id, {
        image: editingProduct.image,
        stockStatus: editingProduct.stockStatus
      });
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour du produit');
    } finally {
      setUpdatingProd(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) return;
    try {
      await deleteMarketplaceProductAction(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const stats = [
    { label: 'Produits Actifs', value: products.length, icon: Package, color: '#4F46E5' },
    { label: 'Commandes (30j)', value: orders.length, icon: ShoppingCart, color: '#10B981' },
    { label: 'Volume d\'Affaires', value: `${orders.reduce((s,o) => s + Number(o.total), 0).toFixed(2)} DT`, icon: TrendingUp, color: '#F59E0B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 950, color: '#1E293B', margin: 0, letterSpacing: '-0.03em' }}>Catalogue & Flux Marketplace</h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '18px', fontWeight: 500 }}>Supervision stratégique des produits et flux transactionnels.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button
             onClick={() => setIsSettingsOpen(!isSettingsOpen)}
             style={{
               display:'flex', alignItems:'center', gap:'8px',
               padding:'14px 24px', borderRadius:'16px',
               background: isSettingsOpen ? '#1E293B' : '#fff',
               color: isSettingsOpen ? '#fff' : '#1E293B', 
               border:'1px solid #E2E8F0', fontSize:'15px', fontWeight:800,
               cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
             }}
           >
             <Settings size={20} /> Configuration
           </button>
           <a
             href="/superadmin/marketplace/banners"
             style={{
               display:'flex', alignItems:'center', gap:'8px',
               padding:'14px 24px', borderRadius:'16px',
               background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
               color:'#fff', textDecoration:'none', fontSize:'15px', fontWeight:800,
               boxShadow:'0 10px 20px rgba(79,70,229,0.25)'
             }}
           >
             🎯 Bannières
           </a>
        </div>
      </div>

      {/* Stats Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${s.color}10`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={28} />
             </div>
             <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{s.value}</div>
             </div>
          </div>
        ))}
      </div>

      {isSettingsOpen && (
        <div style={{ 
          background: '#fff', padding: '40px', borderRadius: '32px', border: '2px solid #4F46E5',
          boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.15)',
          animation: 'slideDown 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Target size={28} className="text-indigo-600" /> Marketplace Global Config
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Ajustez les paramètres financiers et de durée de vie des flux.</p>
            </div>
            <button 
              onClick={handleUpdateConfig}
              disabled={saving}
              style={{
                display:'flex', alignItems:'center', gap:'8px',
                padding:'14px 32px', borderRadius:'16px',
                background:'#4F46E5', color:'#fff', border:'none',
                fontSize:'15px', fontWeight:900, cursor: 'pointer',
                opacity: saving ? 0.5 : 1, boxShadow: '0 8px 16px rgba(79,70,229,0.3)'
              }}
            >
              <Save size={20} /> {saving ? 'Enregistrement...' : 'Valider les changements'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Commission sur RFQ (%)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number"
                    step="0.1"
                    value={config.rfqCommissionRate}
                    onChange={(e) => setConfig({ ...config, rfqCommissionRate: e.target.value })}
                    style={{ 
                      width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0',
                      fontSize: '18px', fontWeight: 800, outline: 'none', background: '#F8FAFC'
                    }}
                  />
                  <Percent size={24} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#4F46E5' }} />
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Délai d'Expiration RFQ (Heures)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number"
                    value={config.rfqExpirationHours}
                    onChange={(e) => setConfig({ ...config, rfqExpirationHours: e.target.value })}
                    style={{ 
                      width: '100%', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0',
                      fontSize: '18px', fontWeight: 800, outline: 'none', background: '#F8FAFC'
                    }}
                  />
                  <Clock size={24} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#4F46E5' }} />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '0 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', gap: '32px' }}>
              {[
                { id: 'catalog', label: 'Catalogue Produits', icon: Package },
                { id: 'orders', label: 'Flux Transactions', icon: ShoppingCart }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '24px 0', border: 'none', background: 'none',
                    fontSize: '15px', fontWeight: 800, color: activeTab === tab.id ? '#4F46E5' : '#64748B',
                    borderBottom: activeTab === tab.id ? '3px solid #4F46E5' : '3px solid transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
           </div>
           
           <div style={{ position: 'relative', width: '300px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un flux..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '14px', border: '1px solid #F1F5F9', background: '#F8FAFC', fontSize: '14px', outline: 'none', fontWeight: 600 }}
              />
           </div>
        </div>

        <div style={{ padding: '32px' }}>
           {activeTab === 'catalog' && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {filteredProducts.map(p => (
                  <div key={p.id} style={{ position: 'relative', padding: '16px', borderRadius: '24px', border: '1px solid #F1F5F9', background: '#fff', transition: 'all 0.3s' }}>
                     <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '18px', overflow: 'hidden', marginBottom: '16px', background: '#F8FAFC' }}>
                        <img src={p.image || ''} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                     <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '4px' }}>
                        <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', borderRadius: '8px', fontSize: '10px', fontWeight: 900, color: p.stockStatus === 'IN_STOCK' ? '#10B981' : '#E31E24', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                           {p.stockStatus === 'IN_STOCK' ? 'EN STOCK' : 'RUPTURE'}
                        </div>
                        <button 
                          onClick={() => setEditingProduct(p)}
                          style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                        >
                          <Edit3 size={14} />
                        </button>
                     </div>
                     <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>{p.name}</h4>
                     <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>{p.vendor?.companyName}</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 950, color: '#4F46E5' }}>{Number(p.price).toFixed(3)} <span style={{ fontSize: '12px' }}>DT</span></div>
                        <a href={`/marketplace/product/${p.id}`} target="_blank" style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #F1F5F9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B', cursor: 'pointer' }}>
                          <ArrowUpRight size={18} />
                        </a>
                     </div>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'orders' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '16px 24px', background: '#F8FAFC', borderRadius: '14px', fontSize: '12px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   <span>Acheteur</span>
                   <span>Fournisseur</span>
                   <span>Date</span>
                   <span>Articles</span>
                   <span style={{ textAlign: 'right' }}>Total</span>
                </div>
                {orders.map(o => (
                  <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '24px', borderRadius: '20px', border: '1px solid #F1F5F9', alignItems: 'center' }}>
                     <span style={{ fontWeight: 800, color: '#1E293B' }}>{o.store.name}</span>
                     <span style={{ fontWeight: 700, color: '#4F46E5' }}>{o.vendor?.companyName}</span>
                     <span style={{ color: '#64748B', fontSize: '14px' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                     <span style={{ color: '#64748B' }}>{o.items.length} unités</span>
                     <span style={{ textAlign: 'right', fontWeight: 950, fontSize: '16px', color: '#111827' }}>{Number(o.total).toFixed(3)} DT</span>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '560px', borderRadius: '32px', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
            <div style={{ padding: '32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1E293B' }}>Modifier le produit</h3>
                 <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>ID: {editingProduct.id}</p>
               </div>
               <button onClick={() => setEditingProduct(null)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>URL de l'image</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={editingProduct.image || ''} 
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                    />
                    <ImageIcon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>Statut du Stock (Visibilité)</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                     {[
                       { id: 'IN_STOCK', label: 'En Stock', color: '#10B981', icon: CheckCircle2 },
                       { id: 'OUT_OF_STOCK', label: 'Rupture', color: '#E31E24', icon: Power }
                     ].map(opt => (
                       <button
                         key={opt.id}
                         onClick={() => setEditingProduct({ ...editingProduct, stockStatus: opt.id })}
                         style={{ 
                           flex: 1, padding: '14px', borderRadius: '14px', border: editingProduct.stockStatus === opt.id ? `2px solid ${opt.color}` : '1px solid #E2E8F0',
                           background: editingProduct.stockStatus === opt.id ? `${opt.color}08` : '#fff',
                           color: editingProduct.stockStatus === opt.id ? opt.color : '#64748B',
                           fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                         }}
                       >
                         <opt.icon size={18} /> {opt.label}
                       </button>
                     ))}
                  </div>
               </div>

               <div style={{ marginTop: '12px', padding: '20px', borderRadius: '18px', background: '#FFF1F2', border: '1px solid #FECDD3' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 900, color: '#9F1239', display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={16} /> Zone de danger</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#BE123C', lineHeight: 1.5 }}>La suppression du produit est définitive et supprimera tout l'historique associé dans le catalogue vendeur.</p>
                  <button 
                    onClick={() => handleDeleteProduct(editingProduct.id)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#E31E24', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Supprimer définitivement le produit
                  </button>
               </div>
            </div>

            <div style={{ padding: '24px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '12px' }}>
               <button onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#fff', color: '#1E293B', fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
               <button 
                onClick={handleSaveProduct}
                disabled={updatingProd}
                style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#4F46E5', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: updatingProd ? 0.5 : 1 }}
               >
                {updatingProd ? 'Enregistrement...' : 'Enregistrer'}
               </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
