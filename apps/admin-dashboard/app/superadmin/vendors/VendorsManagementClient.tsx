'use client';

import React, { useTransition } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { updateVendorStatus } from '../../actions';

export default function VendorsManagementClient({ initialVendors }: { initialVendors: any[] }) {
  const [isPending, startTransition] = useTransition();

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
    </div>
  );
}
