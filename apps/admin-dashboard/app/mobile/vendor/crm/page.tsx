import React from 'react';
import { Users, Filter, Star, Plus } from 'lucide-react';
import { getVendorClientListsAction } from '../../../actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MobileVendorCRMPage() {
  let crmData = null;
  try {
    const res = await getVendorClientListsAction();
    if (res.success) {
      crmData = res.lists;
    }
  } catch (error) {}

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>CRM Clients</h1>
         <button style={{ background: '#111827', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <Plus size={20} />
         </button>
      </div>

      <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid #BBF7D0' }}>
        <Star size={24} color="#16A34A" />
        <div>
          <h4 style={{ margin: 0, color: '#166534', fontWeight: 800 }}>Fidélisation B2B</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#15803D' }}>Segmentez vos meilleurs clients.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#111827' }}>Vos Segments</h3>
          <Filter size={16} color="#6B7280" />
        </div>

        {!crmData || crmData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F9FAFB', borderRadius: '20px', border: '1px dashed #D1D5DB' }}>
            <Users size={32} style={{ margin: '0 auto 12px', color: '#9CA3AF' }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Aucune liste client. Créez un segment pour vos campagnes.</p>
          </div>
        ) : (
          crmData.map((list: any) => (
            <div key={list.id} style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
                   <Users size={20} />
                 </div>
                 <div>
                   <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>{list.name}</h4>
                   <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>{list.customers.length} acheteurs</p>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
