'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle, XCircle, Filter, Eye, Building2, Package, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { approveVendorAction, rejectVendorAction } from '../../actions';
import Modal from '../../../components/Modal';

export default function SuperAdminVendorsTable({ vendors }: { vendors: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string } | null>(null);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await approveVendorAction(id);
      showToast('Compte vendeur activé !');
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      await rejectVendorAction(id);
      showToast('Candidature rejetée.');
    });
  };

  const filteredVendors = vendors.filter(v => {
    if (filter === 'ALL') return true;
    return v.status === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search & Filter Bar */}
      <div style={{ background: '#fff', borderRadius: '24px', padding: '16px 24px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 800 }}>
            <Filter size={18} /> FILTRER PAR STATUT :
         </div>
         <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'PENDING', 'ACTIVE', 'REJECTED'].map((f) => (
               <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{ 
                    padding: '8px 16px', borderRadius: '12px', border: '1px solid', 
                    background: filter === f ? '#1E293B' : '#fff',
                    borderColor: filter === f ? '#1E293B' : '#E2E8F0',
                    color: filter === f ? '#fff' : '#64748B',
                    fontSize: '11px', fontWeight: 900, cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase'
                  }}
               >
                  {f === 'ALL' ? 'Tous' : f === 'PENDING' ? 'En attente' : f === 'ACTIVE' ? 'Actifs' : 'Refusés'}
               </button>
            ))}
         </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>Fournisseur</th>
              <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>Ville / Zone</th>
              <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>Catégories</th>
              <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>Statut</th>
              <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9', transition: '0.2s' }}>
                <td style={{ padding: '24px' }}>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                    onClick={() => setSelectedVendor(v)}
                  >
                     <div style={{ width: 44, height: 44, background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', fontWeight: 900, color: '#1E293B' }}>{v.companyName.charAt(0)}</div>
                     <div className="hover-underline">
                       <div style={{ fontWeight: 800, color: '#1E293B' }}>{v.companyName}</div>
                       <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 700 }}>Voir la fiche complète →</div>
                     </div>
                  </div>
                </td>
                <td style={{ padding: '24px', fontSize: '14px', color: '#1E293B', fontWeight: 600 }}>{v.city || 'Tunis'}</td>
                <td style={{ padding: '24px' }}>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {v.categories?.map((c: any) => <span key={c.id} style={{ padding: '4px 8px', borderRadius: '6px', background: '#F1F5F9', fontSize: '10px', color: '#64748B', fontWeight: 800 }}>{c.name}</span>)}
                   </div>
                </td>
                <td style={{ padding: '24px' }}>
                   <span style={{ 
                     padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
                     background: v.status === 'ACTIVE' ? '#D1FAE5' : v.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                     color: v.status === 'ACTIVE' ? '#065F46' : v.status === 'REJECTED' ? '#991B1B' : '#92400E'
                   }}>
                     {v.status === 'ACTIVE' ? 'Activé' : v.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                   </span>
                </td>
                <td style={{ padding: '24px', textAlign: 'right' }}>
                   <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleApprove(v.id)} 
                        disabled={v.status === 'ACTIVE' || isPending} 
                        className="btn btn-primary" 
                        style={{ fontSize: '11px', background: '#10B981', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                      >
                        <CheckCircle size={14} /> Approuver
                      </button>
                      <button 
                         onClick={() => handleReject(v.id)} 
                         disabled={v.status === 'REJECTED' || isPending}
                         className="btn btn-outline" 
                         style={{ fontSize: '11px', color: '#EF4444', padding: '10px 16px' }}
                      >
                        <XCircle size={14} /> Rejeter
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vendor Detail Modal */}
      <Modal open={!!selectedVendor} onClose={() => setSelectedVendor(null)} title="Fiche Fournisseur Certifié">
         {selectedVendor && (
           <div style={{ width: '850px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                 <div style={{ width: 80, height: 80, background: '#4F46E5', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 900 }}>{selectedVendor.companyName.charAt(0)}</div>
                 <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{selectedVendor.companyName}</h3>
                    <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '14px' }}>{selectedVendor.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                       <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {selectedVendor.user?.email}</div>
                       <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {selectedVendor.phone}</div>
                       <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {selectedVendor.city}</div>
                    </div>
                 </div>
              </div>

              <div>
                 <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="#6366F1" /> Catalogue de produits ({selectedVendor.products?.length || 0})
                 </h4>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                    {selectedVendor.products?.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '16px', border: '1px solid #F1F5F9', background: '#fff' }}>
                         <div style={{ width: 44, height: 44, borderRadius: '8px', overflow: 'hidden', background: '#F8FAFC' }}>
                            <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100&auto=format&fit=crop'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         </div>
                         <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{p.name}</div>
                            <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 700 }}>{Number(p.price).toFixed(3)} DT / {p.unit}</div>
                         </div>
                      </div>
                    ))}
                    {(!selectedVendor.products || selectedVendor.products.length === 0) && (
                      <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '14px' }}>Aucun produit dans le catalogue.</div>
                    )}
                 </div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px', display: 'flex', gap: '12px' }}>
                 <button onClick={() => setSelectedVendor(null)} className="btn btn-outline" style={{ flex: 1 }}>Fermer</button>
                 {selectedVendor.status === 'PENDING' && (
                   <button onClick={() => { handleApprove(selectedVendor.id); setSelectedVendor(null); }} className="btn btn-primary" style={{ flex: 2, background: '#10B981', border: 'none' }}>Valider le commerçant</button>
                 )}
              </div>
           </div>
         )}
      </Modal>

      {/* Floating Notification */}
      {toast?.show && (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: '#fff', padding: '16px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 999 }}>
           <div style={{ background: '#10B981', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CheckCircle2 size={18} />
           </div>
           <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#1E293B' }}>Admin System</div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>{toast.message}</div>
           </div>
        </div>
      )}
    </div>
  );
}
