import { prisma } from '@coffeeshop/database';
import { Crown, PlusCircle, Settings, Trash2, Check, Users, Store } from 'lucide-react';
import PlanMerchantActions from './PlanMerchantActions';
import PlansClient from './PlansClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPlans() {
  // Use raw query to ensure we get all fields (like hasMarketplace) even if client is stale
  const plans: any[] = await prisma.$queryRawUnsafe('SELECT * FROM "Plan" ORDER BY name ASC');

  // Enrich with subscriber counts
  const plansWithSubs = await Promise.all(plans.map(async (plan) => {
    const subCount = await prisma.subscription.count({ where: { planId: plan.id } });
    const activeCount = await prisma.subscription.count({ where: { planId: plan.id, status: 'ACTIVE' } });
    return { ...plan, subCount, activeCount };
  }));

  const totalStores = await prisma.store.count();
  const totalRevenue = plansWithSubs.reduce((acc, p) => acc + (Number(p.price) * p.activeCount), 0);
  const totalActive = plansWithSubs.reduce((acc, p) => acc + p.activeCount, 0);

  const merchants = await prisma.store.findMany({
    include: { subscription: { include: { plan: true } }, owners: true }
  });

  return (
    <div className="page-content">
      <PlansClient initialPlans={plansWithSubs} />

      {/* === SUPER ADMIN KPIs === */}
      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:'40px'}}>
        <div className="kpi-card purple">
          <div className="kpi-icon purple"><Crown size={22} /></div>
          <div>
            <div className="kpi-label">MRR (Revenu Mensuel)</div>
            <div className="kpi-value">{totalRevenue.toFixed(0)}<span style={{fontSize:'14px',fontWeight:500,color:'#94A3B8'}}> DT/m</span></div>
            <div className="kpi-sub kpi-trend-up">↑ {totalActive} abonnés actifs</div>
          </div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Store size={22} /></div>
          <div>
            <div className="kpi-label">Cafés Inscrits</div>
            <div className="kpi-value">{totalStores}</div>
            <div className="kpi-sub">multi-tenants sur la plateforme</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><Users size={22} /></div>
          <div>
            <div className="kpi-label">Total Forfaits</div>
            <div className="kpi-value">{plans.length}</div>
            <div className="kpi-sub">configurés dans la plateforme</div>
          </div>
        </div>
      </div>

      {/* === MERCHANTS TABLE === */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Store size={16} /> Marchands Inscrits</span>
          <button className="btn btn-primary"><PlusCircle size={14} /> Inviter un café</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Café / Enseigne</th>
              <th>Plan Actif</th>
              <th>Statut</th>
              <th>Prochain Renouvellement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#EEF2FF',color:'#4F46E5',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'13px'}}>{m.name.charAt(0)}</div>
                    <div>
                      <div style={{fontWeight:700}}>{m.name}</div>
                      <div style={{fontSize:'12px',color:'#94A3B8'}}>{m.owners[0]?.email || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${m.subscription ? 'blue' : 'gray'}`}>{m.subscription?.plan?.name || 'Aucun'}</span></td>
                <td>
                  <span className={`badge ${m.subscription?.status === 'ACTIVE' ? 'green' : 'orange'}`}>
                    {m.subscription?.status === 'ACTIVE' ? '✓ Actif' : '⚠ Essai/Inactif'}
                  </span>
                </td>
                <td style={{color:'#64748B',fontSize:'13px'}}>
                  {m.subscription?.expiresAt ? new Date(m.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <PlanMerchantActions storeId={m.id} storeName={m.name} plans={plans} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
