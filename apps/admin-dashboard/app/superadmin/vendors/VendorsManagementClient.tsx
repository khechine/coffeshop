'use client';

import React, { useTransition, useState } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Mail, Phone, MapPin, History, Monitor } from 'lucide-react';
import { updateVendorStatus, getUserLoginHistory } from '../../actions';
import Modal from '../../../components/Modal';

export default function VendorsManagementClient({ initialVendors }: { initialVendors: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const handleOpenHistory = async (vendor: any) => {
    setSelectedVendor(vendor);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    const logs = await getUserLoginHistory(vendor.user.id);
    setLoginHistory(logs);
    setLoadingHistory(false);
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      await updateVendorStatus(id, status);
    });
  };

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Fournisseur</th>
            <th>Contact / Email</th>
            <th>Localisation</th>
            <th>Statut</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialVendors.map(vendor => (
            <tr key={vendor.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', border: '1px solid #E2E8F0' }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1E293B' }}>{vendor.companyName}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{vendor.description || 'Pas de description'}</div>
                  </div>
                </div>
              </td>
              <td style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600 }}>
                  {vendor.user.name}
                </div>
                <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} /> {vendor.user.email}
                </div>
              </td>
              <td style={{ fontSize: '13px', color: '#64748B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {vendor.city}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {vendor.phone}</div>
              </td>
              <td>
                {vendor.status === 'PENDING' && <span className="badge orange">En attente</span>}
                {vendor.status === 'ACTIVE' && <span className="badge green">Actif</span>}
                {vendor.status === 'REJECTED' && <span className="badge red">Refusé</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handleOpenHistory(vendor)}
                    className="btn btn-outline" 
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <History size={14} /> Traces
                  </button>
                  {vendor.status !== 'ACTIVE' && (
                    <button 
                      onClick={() => handleStatusChange(vendor.id, 'ACTIVE')}
                      disabled={isPending}
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '12px', background: '#10B981', borderColor: '#10B981' }}
                    >
                      <CheckCircle size={14} /> Activer
                    </button>
                  )}
                  {vendor.status === 'PENDING' && (
                    <button 
                      onClick={() => handleStatusChange(vendor.id, 'REJECTED')}
                      disabled={isPending}
                      className="btn btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '12px', color: '#EF4444' }}
                    >
                      <XCircle size={14} /> Refuser
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {initialVendors.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '64px', color: '#94A3B8' }}>Aucune inscription en attente.</td></tr>
          )}
        </tbody>
      </table>

      <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="Historique des Connexions">
        <div style={{ minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Fournisseur</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>{selectedVendor?.companyName}</div>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>Chargement des traces...</div>
            ) : loginHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                Aucune connexion récente trouvée.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loginHistory.map((log: any) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0E7FF', color: '#4F46E5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         <Monitor size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                          {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={10} /> {log.ip} • {log.device}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
