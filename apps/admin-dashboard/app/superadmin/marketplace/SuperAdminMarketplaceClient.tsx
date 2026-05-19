'use client';

import React, { useState } from 'react';
import { Search, Package, ShoppingCart, Settings, Save, Clock, Percent, Target, ArrowUpRight, CheckCircle2, TrendingUp, Edit3, Trash2, X, Power, Image as ImageIcon, Users, Layers, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { updateMarketplaceConfig, updateMarketplaceProductAction, deleteMarketplaceProductAction, superadminToggleProductStatusAction, superadminToggleBundleActiveAction } from '../../actions';

export default function SuperAdminMarketplaceClient({ products: initialProducts, orders, config: initialConfig, bundles: initialBundles = [], vendors = [], superadminUserId = '' }: { products: any[], orders: any[], config: any, bundles?: any[], vendors?: any[], superadminUserId?: string }) {
  const [products, setProducts] = useState(initialProducts);
  const [bundles, setBundles] = useState(initialBundles);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'bundles' | 'vendors'>('catalog');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [updatingProd, setUpdatingProd] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

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

  const handleToggleProduct = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'IN_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK';
    setTogglingId(id);
    try {
      await superadminToggleProductStatusAction(id, newStatus as any);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stockStatus: newStatus } : p));
    } catch (err) { alert('Erreur'); } finally { setTogglingId(null); }
  };

  const handleToggleBundle = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      await superadminToggleBundleActiveAction(id, !currentActive);
      setBundles(prev => prev.map((b: any) => b.id === id ? { ...b, isActive: !currentActive } : b));
    } catch (err) { alert('Erreur'); } finally { setTogglingId(null); }
  };

  const handleImpersonate = async (vendor: any) => {
    if (!confirm(`Se connecter en tant que "${vendor.companyName}" ?`)) return;
    setImpersonating(vendor.id);
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id, superadminUserId })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.data.redirectTo;
      } else { alert(data.error || 'Erreur'); }
    } catch (err) { alert('Erreur réseau'); } finally { setImpersonating(null); }
  };

  const filteredVendors = vendors.filter((v: any) =>
    (v.companyName || '').toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const stats = [
    { label: 'Produits', value: products.length, icon: Package, color: '#4F46E5' },
    { label: 'Commandes (30j)', value: orders.length, icon: ShoppingCart, color: '#10B981' },
    { label: 'Volume d\'Affaires', value: `${orders.reduce((s,o) => s + Number(o.total), 0).toFixed(2)} DT`, icon: TrendingUp, color: '#F59E0B' },
    { label: 'Vendeurs', value: vendors.length, icon: Users, color: '#8B5CF6' },
    { label: 'Packs Actifs', value: bundles.filter((b: any) => b.isActive).length, icon: Layers, color: '#F59E0B' },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
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
           <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { id: 'catalog', label: 'Produits', icon: Package },
                { id: 'bundles', label: 'Packs', icon: Layers },
                { id: 'vendors', label: 'Vendeurs', icon: Users },
                { id: 'orders', label: 'Transactions', icon: ShoppingCart }
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
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(p => {
                  const isActive = p.stockStatus === 'IN_STOCK';
                  return (
                  <div key={p.id} style={{ position: 'relative', padding: '16px', borderRadius: '20px', border: `1px solid ${isActive ? '#E2E8F0' : '#FEE2E2'}`, background: isActive ? '#fff' : '#FFF8F8', transition: 'all 0.3s', opacity: isActive ? 1 : 0.75 }}>
                     <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px', background: '#F8FAFC' }}>
                        <img src={p.image || ''} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                     <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '4px' }}>
                        <button
                          title={isActive ? 'Désactiver' : 'Activer'}
                          disabled={togglingId === p.id}
                          onClick={() => handleToggleProduct(p.id, p.stockStatus)}
                          style={{ padding: '4px 8px', borderRadius: '8px', background: isActive ? '#DCFCE7' : '#FEE2E2', border: 'none', fontSize: '10px', fontWeight: 900, color: isActive ? '#16A34A' : '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          {isActive ? 'ACTIF' : 'INACTIF'}
                        </button>
                        <button onClick={() => setEditingProduct(p)} style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                          <Edit3 size={12} />
                        </button>
                     </div>
                     <h4 style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 900, color: '#1E293B' }}>{p.name}</h4>
                     <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>{p.vendor?.companyName}</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 950, color: '#4F46E5' }}>{Number(p.price).toFixed(3)} <span style={{ fontSize: '11px' }}>DT</span></div>
                        <a href={`/marketplace/product/${p.id}`} target="_blank" style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #F1F5F9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B' }}>
                          <ArrowUpRight size={14} />
                        </a>
                     </div>
                  </div>
                  );
                })}
             </div>
           )}

           {/* ── BUNDLES TAB ── */}
           {activeTab === 'bundles' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 20px', background: '#F8FAFC', borderRadius: '12px', fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                 <span>Pack</span><span>Vendeur</span><span>Prix</span><span style={{ textAlign: 'right' }}>Statut</span>
               </div>
               {bundles.filter((b: any) =>
                 !searchTerm || (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (b.vendor?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
               ).map((b: any) => (
                 <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '20px', borderRadius: '16px', border: `1px solid ${b.isActive ? '#F1F5F9' : '#FEE2E2'}`, background: b.isActive ? '#fff' : '#FFF8F8', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: 900, color: '#1E293B', fontSize: '14px' }}>{b.name}</div>
                     <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{b.items?.length || 0} produit(s) inclus</div>
                   </div>
                   <span style={{ fontSize: '13px', fontWeight: 700, color: '#4F46E5' }}>{b.vendor?.companyName}</span>
                   <span style={{ fontWeight: 900, color: '#1E293B' }}>{Number(b.price).toFixed(3)} DT</span>
                   <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                     <button
                       disabled={togglingId === b.id}
                       onClick={() => handleToggleBundle(b.id, b.isActive)}
                       style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: b.isActive ? '#DCFCE7' : '#FEE2E2', color: b.isActive ? '#16A34A' : '#DC2626', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                     >
                       {b.isActive ? <><ToggleRight size={14} /> Actif</> : <><ToggleLeft size={14} /> Inactif</>}
                     </button>
                   </div>
                 </div>
               ))}
               {bundles.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '40px', fontWeight: 600 }}>Aucun pack configuré sur la plateforme.</p>}
             </div>
           )}

           {/* ── VENDORS IMPERSONATION TAB ── */}
           {activeTab === 'vendors' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ position: 'relative', marginBottom: '8px' }}>
                 <input type="text" placeholder="Rechercher un vendeur..." value={vendorSearch} onChange={e => setVendorSearch(e.target.value)}
                   style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none', fontWeight: 600 }}
                 />
                 <Users style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
               </div>
               <div style={{ padding: '12px 20px', background: '#FFF8E1', border: '1px solid #FEF3C7', borderRadius: '12px', fontSize: '13px', color: '#92400E', fontWeight: 600 }}>
                 ⚠️ <strong>Mode Impersonation</strong> — Vous serez connecté temporairement (2h) en tant que ce vendeur pour auditer ou modifier son catalogue. La session superadmin sera restaurée automatiquement.
               </div>
               {filteredVendors.map((v: any) => (
                 <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9', background: '#fff' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: v.isPremium ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: v.isPremium ? '#fff' : '#7C3AED' }}>
                       {(v.companyName || 'V')[0]}
                     </div>
                     <div>
                       <div style={{ fontWeight: 900, color: '#1E293B', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         {v.companyName}
                         {v.isPremium && <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '6px', fontWeight: 900 }}>PREMIUM</span>}
                       </div>
                       <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{v.city || '—'} · {v._count?.products || 0} produits · <span style={{ color: v.status === 'ACTIVE' ? '#10B981' : '#F59E0B' }}>{v.status}</span></div>
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <a href={`/superadmin/vendors`} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', color: '#1E293B', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Eye size={14} /> Profil
                     </a>
                     <button
                       onClick={() => handleImpersonate(v)}
                       disabled={impersonating === v.id}
                       style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: impersonating === v.id ? '#94A3B8' : 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                     >
                       {impersonating === v.id ? '...' : <><Users size={14} /> Voir en tant que</>}
                     </button>
                   </div>
                 </div>
               ))}
               {filteredVendors.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '40px', fontWeight: 600 }}>Aucun vendeur trouvé.</p>}
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
