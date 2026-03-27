'use client';

import React, { useState, useTransition } from 'react';
import { Settings, Check, CreditCard } from 'lucide-react';
import Modal from '../../../components/Modal';
import { assignPlanAction } from '../../actions';

export default function PlanMerchantActions({ storeId, storeName, plans }: { storeId: string, storeName: string, plans: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleAssign = (planId: string) => {
    startTransition(async () => {
      await assignPlanAction(storeId, planId);
      setOpen(false);
    });
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="btn btn-ghost" 
        style={{ fontSize: '12px', padding: '4px 10px' }}
      >
        <Settings size={12} /> Gérer
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Gérer l'abonnement : ${storeName}`} width={450}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Assignez manuellement un forfait à ce marchand :</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plans.map(plan => (
                <button 
                  key={plan.id}
                  onClick={() => handleAssign(plan.id)}
                  disabled={isPending}
                  style={{ 
                    padding: '16px', borderRadius: '14px', border: '2px solid #F1F5F9', background: '#fff', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    textAlign: 'left', width: '100%', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#4F46E5'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#F1F5F9'}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>{plan.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>{Number(plan.price)} DT / mois</div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                    <CreditCard size={16} />
                  </div>
                </button>
              ))}
            </div>

            {plans.length === 0 && (
                <p style={{ textAlign: 'center', padding: '12px', color: '#94A3B8' }}>Aucun forfait disponible.</p>
            )}

            <button className="btn btn-outline" style={{ marginTop: '12px' }} onClick={() => setOpen(false)}>Annuler</button>
         </div>
      </Modal>
    </>
  );
}
