'use client';

import React, { useState, useTransition } from 'react';
import { Truck, Plus, Package, Edit, Trash2, Search, FileText, ShoppingBag, Store, ExternalLink, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createSupplier, updateSupplier, deleteSupplier, sendSupplierWhatsAppVerificationAction } from '../../actions';

type SupplierView = { type: 'local'; data: any } | { type: 'marketplace'; data: any };

/* ── Premium form field styles ── */
const fieldGroupStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '6px',
};
const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px',
};
const inputWrapStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '12px',
  background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px',
  padding: '0 16px', transition: 'all 0.2s ease',
};
const inputStyle: React.CSSProperties = {
  flex: 1, border: 'none', background: 'transparent', outline: 'none',
  padding: '13px 0', fontSize: '14px', fontWeight: 600, color: '#1E293B',
};
const textareaStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #E2E8F0', background: '#F8FAFC',
  borderRadius: '14px', padding: '13px 16px', fontSize: '14px', fontWeight: 600,
  color: '#1E293B', outline: 'none', resize: 'vertical' as const, minHeight: '72px',
  fontFamily: 'inherit', transition: 'all 0.2s ease',
};
const sectionDividerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0',
};
const sectionLabelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase',
  letterSpacing: '0.08em', whiteSpace: 'nowrap',
};
const sectionLineStyle: React.CSSProperties = {
  flex: 1, height: '1px', background: 'linear-gradient(90deg, #E2E8F0, transparent)',
};

export default function SuppliersClient({
  initialSuppliers,
  marketplaceOrders = [],
}: {
  initialSuppliers: any[];
  marketplaceOrders?: any[];
}) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupplierView | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', contact: '', phone: '', email: '', address: '' });

  // Deduplicate marketplace vendors from orders
  const marketplaceVendors: any[] = [];
  const seenVendorIds = new Set<string>();
  for (const order of marketplaceOrders) {
    if (order.vendor && !seenVendorIds.has(order.vendor.id)) {
      seenVendorIds.add(order.vendor.id);
      marketplaceVendors.push({
        ...order.vendor,
        orders: marketplaceOrders.filter(o => o.vendorId === order.vendor.id),
      });
    }
  }

  const filteredLocal = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact && s.contact.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search))
  );

  const filteredMarketplace = marketplaceVendors.filter(v =>
    v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    v.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setFormData({ id: '', name: '', contact: '', phone: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ id: s.id, name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', address: s.address || '' });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) return;
    startTransition(async () => {
      await deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      if (selected?.type === 'local' && selected.data.id === id) setSelected(null);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (formData.id) {
        const updated = await updateSupplier(formData.id, formData);
        setSuppliers(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
      } else {
        const created = await createSupplier(formData);
        setSuppliers(prev => [{ ...created, orders: [] }, ...prev]);
      }
      setIsModalOpen(false);
    });
  };

  const selectedLocal = selected?.type === 'local' ? selected.data : null;
  const selectedMarketplace = selected?.type === 'marketplace' ? selected.data : null;

  /* Avatar initial + gradient */
  const avatarInitial = formData.name ? formData.name.charAt(0).toUpperCase() : '?';

  return (
    <>
      <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Mes Fournisseurs</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>Gérez vos fournisseurs locaux et consultez vos achats sur la Marketplace.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Ajouter un Fournisseur
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Suppliers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Search */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Search size={18} color="#94A3B8" />
              <input
                type="text"
                placeholder="Rechercher un fournisseur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '12px', width: '100%', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* ── Marketplace Vendors ── */}
          {filteredMarketplace.length > 0 && (
            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', borderRadius: '12px 12px 0 0' }}>
                <ShoppingBag size={18} color="#7C3AED" />
                <span style={{ fontWeight: 800, color: '#5B21B6', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Fournisseurs Marketplace
                </span>
                <span style={{ marginLeft: 'auto', background: '#7C3AED', color: '#fff', borderRadius: '999px', fontSize: '11px', fontWeight: 800, padding: '2px 10px' }}>
                  {filteredMarketplace.length}
                </span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendeur</th>
                      <th>Commandes</th>
                      <th>Total dépensé</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMarketplace.map(vendor => {
                      const totalSpent = vendor.orders.reduce((acc: number, o: any) =>
                        acc + (o.items || []).reduce((s: number, i: any) => s + Number(i.price || 0) * Number(i.quantity || 1), 0), 0);
                      const isSelected = selected?.type === 'marketplace' && selected.data.id === vendor.id;
                      return (
                        <tr
                          key={vendor.id}
                          onClick={() => setSelected({ type: 'marketplace', data: vendor })}
                          style={{ cursor: 'pointer', background: isSelected ? '#F5F3FF' : 'transparent' }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                {(vendor.businessName || vendor.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#1E293B' }}>{vendor.businessName || vendor.name}</div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EDE9FE', color: '#7C3AED', borderRadius: '6px', padding: '1px 8px', fontSize: '10px', fontWeight: 800, marginTop: '2px' }}>
                                  <ShoppingBag size={9} /> Marketplace
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: '#EDE9FE', color: '#7C3AED', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Package size={12} /> {vendor.orders.length} commande(s)
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: '#5B21B6' }}>{totalSpent.toFixed(3)} DT</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <a href={`/marketplace/vendor/${vendor.id}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#7C3AED', fontWeight: 700, textDecoration: 'none' }}>
                              Voir <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Local Suppliers ── */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck size={18} color="#3B82F6" />
              <span style={{ fontWeight: 800, color: '#1E40AF', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Fournisseurs Locaux
              </span>
              <span style={{ marginLeft: 'auto', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '999px', fontSize: '11px', fontWeight: 800, padding: '2px 10px' }}>
                {filteredLocal.length}
              </span>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fournisseur</th>
                    <th>Contact</th>
                    <th>Commandes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocal.map(supplier => {
                    const isSelected = selected?.type === 'local' && selected.data.id === supplier.id;
                    return (
                      <tr
                        key={supplier.id}
                        onClick={() => setSelected({ type: 'local', data: supplier })}
                        style={{ cursor: 'pointer', background: isSelected ? '#F8FAFC' : 'transparent' }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              {supplier.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 800, color: '#1E293B' }}>{supplier.name}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', color: '#475569' }}>{supplier.contact || '-'}</div>
                          <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {supplier.phone || '-'}
                            {supplier.whatsappVerified && <span style={{ fontSize: '10px', color: '#16A34A' }}>✅</span>}
                          </div>
                        </td>
                        <td>
                          <span className="badge blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Package size={12} /> {supplier.orders?.length || 0} commande(s)
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="btn-icon" onClick={e => openEditModal(supplier, e)}><Edit size={16} color="#64748B" /></button>
                            <button className="btn-icon" onClick={e => handleDelete(supplier.id, e)} disabled={isPending}><Trash2 size={16} color="#EF4444" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLocal.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                        Aucun fournisseur local. <button onClick={openAddModal} style={{ color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Ajouter le premier</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="card" style={{ padding: '24px', alignSelf: 'start', position: 'sticky', top: '24px' }}>
          {selectedMarketplace ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #EDE9FE' }}>
                <div style={{ width: 56, height: 56, borderRadius: '12px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800 }}>
                  {(selectedMarketplace.businessName || selectedMarketplace.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{selectedMarketplace.businessName || selectedMarketplace.name}</h2>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EDE9FE', color: '#7C3AED', borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 800, marginTop: '4px' }}>
                    <ShoppingBag size={10} /> Fournisseur Marketplace
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#F5F3FF', borderRadius: '12px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', marginBottom: '4px' }}>COMMANDES</div>
                  <div style={{ fontWeight: 900, fontSize: '22px', color: '#5B21B6' }}>{selectedMarketplace.orders.length}</div>
                </div>
                <div style={{ background: '#F5F3FF', borderRadius: '12px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', marginBottom: '4px' }}>DÉPENSÉ</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#5B21B6' }}>
                    {selectedMarketplace.orders.reduce((acc: number, o: any) =>
                      acc + (o.items || []).reduce((s: number, i: any) => s + Number(i.price || 0) * Number(i.quantity || 1), 0), 0).toFixed(3)} DT
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#7C3AED" /> Produits Achetés
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                {(() => {
                  const map = new Map<string, { quantity: number; price: number }>();
                  selectedMarketplace.orders.forEach((o: any) => {
                    (o.items || []).forEach((item: any) => {
                      const key = item.name || item.productId || 'Produit';
                      const existing = map.get(key) || { quantity: 0, price: Number(item.price || 0) };
                      existing.quantity += Number(item.quantity || 1);
                      map.set(key, existing);
                    });
                  });
                  const arr = Array.from(map.entries());
                  if (arr.length === 0) return <div style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Aucun produit.</div>;
                  return arr.map(([name, data], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F5F3FF', borderRadius: '10px', border: '1px solid #EDE9FE' }}>
                      <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>{name}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#7C3AED' }}>{data.quantity} u.</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{data.price.toFixed(3)} DT/u</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : selectedLocal ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: 56, height: 56, borderRadius: '12px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800 }}>
                  {selectedLocal.name.charAt(0).toUpperCase()}
                </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: '0 0 4px' }}>{selectedLocal.name}</h2>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>{selectedLocal.phone || 'Pas de téléphone'} • {selectedLocal.contact || 'Pas de contact'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    {selectedLocal.whatsappVerified ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DCFCE7', color: '#16A34A', borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 800 }}>
                        ✅ WhatsApp vérifié
                      </span>
                    ) : selectedLocal.phone ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Envoyer le code de vérification WhatsApp à ${selectedLocal.name} ?`)) return;
                          startTransition(async () => {
                            await sendSupplierWhatsAppVerificationAction(selectedLocal.id);
                            setSuppliers(prev => prev.map(s => s.id === selectedLocal.id ? { ...s, whatsappVerificationToken: 'sent' } : s));
                          });
                        }}
                        disabled={isPending}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#D97706', border: 'none', borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        📱 Vérifier WhatsApp
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#6366F1" /> Produits Commandés
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {(() => {
                  const orderedItemsMap = new Map();
                  selectedLocal.orders?.forEach((order: any) => {
                    order.items?.forEach((item: any) => {
                      const itemName = item.name || item.stockItem?.name || 'Produit Inconnu';
                      if (!orderedItemsMap.has(itemName)) {
                        orderedItemsMap.set(itemName, { quantity: 0, latestPrice: Number(item.price) });
                      }
                      const existing = orderedItemsMap.get(itemName);
                      existing.quantity += Number(item.quantity);
                    });
                  });

                  const itemsArray = Array.from(orderedItemsMap.entries());

                  if (itemsArray.length === 0) {
                    return <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>Aucun produit commandé pour le moment.</div>;
                  }

                  return itemsArray.map(([name, data], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                      <div style={{ fontWeight: 700, color: '#334155', fontSize: '14px' }}>{name}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#4F46E5' }}>{data.quantity} u.</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Dernier achat: {data.latestPrice.toFixed(3)} DT</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94A3B8' }}>
              <Truck size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>Sélectionnez un fournisseur pour voir ses informations et les produits commandés.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/*  PREMIUM SUPPLIER MODAL                    */}
      {/* ═══════════════════════════════════════════ */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Modifier le fournisseur" : "Nouveau fournisseur"} width={540}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* ── Avatar Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', padding: '20px', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: '16px', border: '1px solid #C7D2FE' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '14px', flexShrink: 0,
              background: formData.name ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 900, boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.3s ease',
            }}>
              {avatarInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formData.name || 'Nouveau fournisseur'}
              </div>
              <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: 700, marginTop: '2px' }}>
                {formData.id ? 'Modification en cours' : 'Création d\'une nouvelle fiche'}
              </div>
            </div>
          </div>

          {/* ── Section: Entreprise ── */}
          <div style={sectionDividerStyle}>
            <Building2 size={13} color="#94A3B8" />
            <span style={sectionLabelStyle}>Entreprise</span>
            <div style={sectionLineStyle} />
          </div>

          <div style={{ ...fieldGroupStyle, marginTop: '12px', marginBottom: '20px' }}>
            <label style={labelStyle}>
              Nom de l'entreprise <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={inputWrapStyle}>
              <Building2 size={16} color="#94A3B8" />
              <input
                type="text"
                required
                placeholder="Ex: EL BARAKA, Boulangerie Ben Ali..."
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── Section: Contact ── */}
          <div style={sectionDividerStyle}>
            <User size={13} color="#94A3B8" />
            <span style={sectionLabelStyle}>Informations de contact</span>
            <div style={sectionLineStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px', marginBottom: '20px' }}>
            {/* Contact Name */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Nom du contact</label>
              <div style={inputWrapStyle}>
                <User size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Nom et prénom"
                  value={formData.contact}
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Téléphone</label>
              <div style={inputWrapStyle}>
                <Phone size={16} color="#94A3B8" />
                <input
                  type="tel"
                  placeholder="+216 XX XXX XXX"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div style={{ ...fieldGroupStyle, marginBottom: '20px' }}>
            <label style={labelStyle}>Email</label>
            <div style={inputWrapStyle}>
              <Mail size={16} color="#94A3B8" />
              <input
                type="email"
                placeholder="contact@fournisseur.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── Section: Localisation ── */}
          <div style={sectionDividerStyle}>
            <MapPin size={13} color="#94A3B8" />
            <span style={sectionLabelStyle}>Adresse</span>
            <div style={sectionLineStyle} />
          </div>

          <div style={{ ...fieldGroupStyle, marginTop: '12px', marginBottom: '28px' }}>
            <label style={labelStyle}>Adresse complète</label>
            <textarea
              placeholder="Rue, ville, code postal..."
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              style={textareaStyle}
              rows={2}
            />
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                flex: 1, padding: '14px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: 700,
                border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={e => { (e.target as HTMLButtonElement).style.borderColor = '#CBD5E1'; (e.target as HTMLButtonElement).style.background = '#F8FAFC'; }}
              onMouseOut={e => { (e.target as HTMLButtonElement).style.borderColor = '#E2E8F0'; (e.target as HTMLButtonElement).style.background = '#fff'; }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                flex: 2, padding: '14px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: 800,
                border: 'none', color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer',
                background: isPending ? '#94A3B8' : 'linear-gradient(135deg, #4F46E5, #6366F1)',
                boxShadow: isPending ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseOver={e => { if (!isPending) { (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.45)'; }}}
              onMouseOut={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; (e.target as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.35)'; }}
            >
              {isPending ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Enregistrement...
                </>
              ) : (
                formData.id ? '✓ Enregistrer les modifications' : '+ Créer le fournisseur'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
