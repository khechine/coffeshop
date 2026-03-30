import { prisma } from '@coffeeshop/database';
import { Store as StoreIcon, User, MapPin, Coffee, TrendingUp, CreditCard, Monitor, Calendar } from 'lucide-react';
import StoreActionButtons from './StoreActionButtons';

export const dynamic = 'force-dynamic';

export default async function SuperAdminCafesPage() {
  const stores = await prisma.store.findMany({
    include: { 
      _count: { select: { sales: true, stockItems: true, owners: true, terminals: true, products: true } },
      subscription: { include: { plan: true } },
      activityPole: true,
      sales: { select: { total: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>Réseau des Coffee Shops</h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Surveillance et gestion centralisée des {stores.length} points de vente.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px' }}>
        {stores.map(s => {
          const totalRevenue = s.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
          const statusColors: any = {
            'ACTIVE': { bg: '#D1FAE5', text: '#065F46' },
            'PENDING_VERIFICATION': { bg: '#FEF3C7', text: '#92400E' },
            'PENDING_DOCS': { bg: '#F1F5F9', text: '#475569' },
            'SUSPENDED': { bg: '#FEE2E2', text: '#991B1B' }
          };
          const colors = statusColors[s.status] || { bg: '#F1F5F9', text: '#475569' };

          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              {/* Header section with ID and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 44, height: 44, background: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StoreIcon size={22} color="#FFF" />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</h3>
                    <code style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold' }}>ID: {s.id}</code>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '99px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    background: colors.bg, 
                    color: colors.text,
                    textTransform: 'uppercase'
                  }}>
                    {s.status.replace('_', ' ')}
                  </span>
                  {s.isVerified && <span style={{ fontSize: '10px', color: '#059669', fontWeight: 800 }}>✅ VÉRIFIÉ</span>}
                </div>
              </div>

              {/* Params section (Plan, Location) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <CreditCard size={16} color="#64748B" />
                   <div>
                     <div style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Abonnement</div>
                     <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{s.subscription?.plan.name || 'Aucun'}</div>
                   </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <MapPin size={16} color="#64748B" />
                   <div>
                     <div style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Ville</div>
                     <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{s.city || 'Non renseigné'}</div>
                   </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#E2E8F0', borderRadius: '24px', overflow: 'hidden', padding: '1px', marginBottom: '24px' }}>
                <div style={{ background: '#FFF', padding: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{s._count.sales}</div>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>VENTES</div>
                </div>
                <div style={{ background: '#FFF', padding: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#4F46E5' }}>{totalRevenue.toFixed(2)}</div>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>CA (DT)</div>
                </div>
                <div style={{ background: '#FFF', padding: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{s._count.products}</div>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>PRODUITS</div>
                </div>
                <div style={{ background: '#FFF', padding: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{s._count.terminals}</div>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>TERMINAUX</div>
                </div>
                <div style={{ background: '#FFF', padding: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{s._count.owners}</div>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>STAFF</div>
                </div>
                <div style={{ background: '#FFF', padding: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{s.activityPole?.icon || '☕'}</div>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>PÔLE</div>
                </div>
              </div>

              {/* Additional Context */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', padding: '0 8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B' }}>
                   <Calendar size={14} />
                   <span style={{ fontSize: '11px', fontWeight: 600 }}>Essai termine : {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : 'N/A'}</span>
                 </div>
              </div>

              <StoreActionButtons storeId={s.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
