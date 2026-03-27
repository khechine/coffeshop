import { prisma } from '@coffeeshop/database';
import { Store, User, MapPin, Coffee, TrendingUp } from 'lucide-react';
import StoreActionButtons from './StoreActionButtons';

export const dynamic = 'force-dynamic';

export default async function SuperAdminCafesPage() {
  const stores = await prisma.store.findMany({
    include: { _count: { select: { sales: true, stockItems: true, owners: true } } }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Réseau des Coffee Shops</h1>
        <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Surveillez les performances et la santé des points de vente utilisant CoffeeSaaS.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
        {stores.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 56, height: 56, background: '#4F46E510', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Store size={28} color="#4F46E5" />
                </div>
                <div>
                   <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{s.name}</h3>
                   <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {s.city || 'Tunis'}</div>
                </div>
              </div>
              <span className="super-status-badge" style={{ background: '#D1FAE5', color: '#065F46' }}>Actif</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px', background: '#F8FAFC', borderRadius: '20px', marginBottom: '24px' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>{s._count.sales}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Ventes</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>{s._count.stockItems}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Items</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>{s._count.owners}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Staff</div>
               </div>
            </div>

            <StoreActionButtons storeId={s.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
