'use client';

import React, { useState, useTransition } from 'react';
import { Truck, Plus, Package, Edit, Trash2, Search, FileText } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createSupplier, updateSupplier, deleteSupplier } from '../../actions';

export default function SuppliersClient({ initialSuppliers }: { initialSuppliers: any[] }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', contact: '', phone: '' });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.contact && s.contact.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search))
  );

  const openAddModal = () => {
    setFormData({ id: '', name: '', contact: '', phone: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ id: s.id, name: s.name, contact: s.contact || '', phone: s.phone || '' });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) return;
    
    startTransition(async () => {
      await deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
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

  return (
    <>
      <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Mes Fournisseurs</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>Gérez vos fournisseurs et consultez l'historique des produits commandés.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Ajouter un Fournisseur
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Suppliers List */}
        <div className="card">
          <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9' }}>
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
                {filteredSuppliers.map(supplier => (
                  <tr 
                    key={supplier.id} 
                    onClick={() => setSelectedSupplier(supplier)}
                    style={{ cursor: 'pointer', background: selectedSupplier?.id === supplier.id ? '#F8FAFC' : 'transparent' }}
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
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{supplier.phone || '-'}</div>
                    </td>
                    <td>
                      <span className="badge blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={12} /> {supplier.orders?.length || 0} commande(s)
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn-icon" onClick={(e) => openEditModal(supplier, e)}><Edit size={16} color="#64748B" /></button>
                        <button className="btn-icon" onClick={(e) => handleDelete(supplier.id, e)} disabled={isPending}><Trash2 size={16} color="#EF4444" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                      Aucun fournisseur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Details & Ordered Products */}
        <div className="card" style={{ padding: '24px', alignSelf: 'start', position: 'sticky', top: '24px' }}>
          {selectedSupplier ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: 56, height: 56, borderRadius: '12px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800 }}>
                  {selectedSupplier.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: '0 0 4px' }}>{selectedSupplier.name}</h2>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>{selectedSupplier.phone || 'Pas de téléphone'} • {selectedSupplier.contact || 'Pas de contact'}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#6366F1" /> Produits Commandés
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {(() => {
                  const orderedItemsMap = new Map();
                  selectedSupplier.orders?.forEach((order: any) => {
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

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Modifier le fournisseur" : "Nouveau fournisseur"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Nom de l'entreprise *</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Nom du Contact</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Téléphone</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
