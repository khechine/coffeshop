'use client';

import React, { useTransition } from 'react';
import { updateStoreAdminAction } from '../../actions';

export default function StoreActionButtons({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleMetrics = () => {
    alert('Redirection vers les métriques du store ' + storeId);
  };

  const handleParams = () => {
    const newName = prompt('Nouveau nom du store ?');
    if (newName) {
      startTransition(async () => {
        await updateStoreAdminAction(storeId, { name: newName });
      });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
       <button 
         onClick={handleMetrics}
         className="btn btn-primary" 
         style={{ flex: 1, background: '#1E293B', border: 'none' }}
       >
         Accéder aux Metrics
       </button>
       <button 
         onClick={handleParams}
         disabled={isPending}
         className="btn btn-outline" 
         style={{ flex: 1 }}
       >
         {isPending ? 'En cours...' : 'Paramètres'}
       </button>
    </div>
  );
}
