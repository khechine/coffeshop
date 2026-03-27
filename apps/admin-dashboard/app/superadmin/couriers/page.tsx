import { prisma } from '@coffeeshop/database';
import { Truck, Navigation, Settings, Search, Clock, CheckCircle, Package } from 'lucide-react';
import CourierActionButtons from './CourierActionButtons';

export const dynamic = 'force-dynamic';

export default async function SuperAdminCouriersPage() {
  const couriers = await prisma.courierProfile.findMany({
    include: { user: true, _count: { select: { orders: true } } }
  });

  const stats = [
    { label: 'Total Livreurs', value: couriers.length, icon: Truck, color: '#4F46E5' },
    { label: 'Livraisons Cumulées', value: couriers.reduce((acc, c) => acc + c._count.orders, 0), icon: Package, color: '#10B981' },
    { label: 'En Mission', value: couriers.filter(c => c.status === 'BUSY').length, icon: Clock, color: '#F59E0B' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Réseau de Livreurs</h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Supervision du service logistique et des missions de livraison.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
         {stats.map((s, idx) => (
           <div key={idx} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: 56, height: 56, background: `${s.color}10`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <s.icon size={24} color={s.color} />
              </div>
              <div>
                 <div style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>{s.value}</div>
                 <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>{s.label}</div>
              </div>
           </div>
         ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Livreur</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Véhicule</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Commandes</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Statut</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Détails</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ width: 44, height: 44, background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', fontWeight: 900, fontSize: '18px', color: '#1E293B' }}>🚚</div>
                     <div>
                       <div style={{ fontWeight: 800, color: '#1E293B' }}>{c.user.name}</div>
                       <div style={{ fontSize: '12px', color: '#64748B' }}>{c.user.email}</div>
                     </div>
                  </div>
                </td>
                <td style={{ padding: '24px', fontSize: '14px', color: '#1E293B', fontWeight: 700 }}>{c.vehicleType}</td>
                <td style={{ padding: '24px', fontSize: '14px', color: '#1E293B', fontWeight: 700 }}>{c._count.orders}</td>
                <td style={{ padding: '24px' }}>
                   <span style={{ 
                     padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
                     background: c.status === 'AVAILABLE' ? '#D1FAE5' : c.status === 'BUSY' ? '#FEF3C7' : '#F1F5F9',
                     color: c.status === 'AVAILABLE' ? '#065F46' : c.status === 'BUSY' ? '#92400E' : '#64748B'
                   }}>
                     {c.status === 'AVAILABLE' ? 'Disponible' : c.status === 'BUSY' ? 'En Mission' : 'Hors Ligne'}
                   </span>
                </td>
                 <td style={{ padding: '24px', textAlign: 'right' }}>
                    <CourierActionButtons courier={c} />
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
