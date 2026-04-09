'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStoreAdminAction } from '../../actions';
import { BarChart3, Settings, ExternalLink } from 'lucide-react';

export default function StoreActionButtons({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleMetrics = () => {
    router.push(`/superadmin/cafes/${storeId}/metrics`);
  };

  const handleParams = () => {
    router.push(`/superadmin/cafes/${storeId}`);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
       <button 
         onClick={handleMetrics}
         className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition-colors"
         style={{ flex: 1 }}
       >
         <BarChart3 size={14} /> Metrics
       </button>
       <button 
         onClick={handleParams}
         disabled={isPending}
         className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs transition-colors"
         style={{ flex: 1 }}
       >
         {isPending ? '...' : <><Settings size={14} /> Params</>}
       </button>
    </div>
  );
}
