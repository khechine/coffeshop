'use client';

import React, { useTransition } from 'react';
import { approveCourierAction, deactivateCourierAction } from '../../actions';
import { CheckCircle, XCircle, Edit, MapPin } from 'lucide-react';

export default function CourierActionButtons({ courier }: { courier: any }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveCourierAction(courier.id);
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      await deactivateCourierAction(courier.id);
    });
  };

  const handleEdit = () => {
    alert('Modification du livreur ' + courier.user.name);
  };

  const handleGPS = () => {
    alert('Suivi GPS en temps réel de ' + courier.user.name);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
       {courier.status === 'OFFLINE' && (
         <button onClick={handleApprove} disabled={isPending} className="btn btn-outline" style={{ padding: '6px 10px', color: '#10B981' }}>
           <CheckCircle size={14} />
         </button>
       )}
       {courier.status !== 'OFFLINE' && (
         <button onClick={handleDeactivate} disabled={isPending} className="btn btn-outline" style={{ padding: '6px 10px', color: '#EF4444' }}>
           <XCircle size={14} />
         </button>
       )}
       <button onClick={handleEdit} className="btn btn-outline" style={{ padding: '6px 10px' }}>
         <Edit size={14} />
       </button>
       <button onClick={handleGPS} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '11px', background: '#1E293B', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
         <MapPin size={12} /> GPS
       </button>
    </div>
  );
}
