import { prisma } from '@coffeeshop/database';
import { ShoppingCart, Users, Store, ShieldCheck, MapPin, Package, CreditCard, TrendingUp, AlertCircle, Clock, Truck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard() {
  const vendorsCount = await (prisma as any).vendorProfile?.count() || 0;
  const storesCount = await (prisma as any).store?.count() || 0;
  const productsCount = await (prisma as any).marketplaceProduct?.count() || 0;
  const couriersCount = await (prisma as any).courierProfile?.count() || 0;
  const ordersCount = await (prisma as any).supplierOrder?.count({ where: { vendorId: { not: null } } }) || 0;
  const ordersAgg = await prisma.supplierOrder.aggregate({
    where: { vendorId: { not: null } },
    _sum: { total: true }
  });
  const totalGMV = Number(ordersAgg._sum.total || 0);
  
  const pendingVendors = await prisma.vendorProfile.findMany({ 
    where: { status: 'PENDING' },
    include: { user: true }
  });

  const recentOrders = await prisma.supplierOrder.findMany({
    where: { vendorId: { not: null } },
    include: { vendor: true, store: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const stats = [
    { label: 'Vendeurs Marketplace', value: vendorsCount, icon: ShieldCheck, color: '#4F46E5', trend: 'Global' },
    { label: 'Coffee Shops / Cafés', value: storesCount, icon: Store, color: '#10B981', trend: 'Actifs' },
    { label: 'Volume Marketplace', value: `${totalGMV.toFixed(2)} DT`, icon: TrendingUp, color: '#7C3AED', trend: 'GMV Total' },
    { label: 'Réseau de Livreurs', value: couriersCount, icon: Truck, color: '#EF4444', trend: 'Partenaires' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Super-Administration</h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Contrôle global de l'écosystème Marketplace Tunisia</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <Link href="/superadmin/vendors" className="btn btn-primary" style={{ background: '#1E293B', border: 'none' }}>Valider les Inscriptions</Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {stats.map((s, idx) => (
          <div key={idx} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ width: 48, height: 48, background: `${s.color}10`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={24} color={s.color} />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>{s.trend}</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B' }}>{s.value}</div>
            <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        {/* Pending Validations */}
        <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px' }}>
           <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Clock size={20} color="#F59E0B" /> En attente de validation ({pendingVendors.length})
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingVendors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#F8FAFC', borderRadius: '20px', color: '#94A3B8' }}>Aucune inscription en attente</div>
              ) : (
                pendingVendors.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                       <div style={{ width: 44, height: 44, background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', fontWeight: 900, color: '#4F46E5' }}>
                         {v.companyName.charAt(0)}
                       </div>
                       <div>
                         <div style={{ fontWeight: 800, color: '#1E293B' }}>{v.companyName}</div>
                         <div style={{ fontSize: '12px', color: '#64748B' }}>{v.user.email} • {v.city}</div>
                       </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                       <button className="btn btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>Approuver</button>
                       <button className="btn btn-outline" style={{ fontSize: '12px', padding: '8px 16px', color: '#EF4444' }}>Rejeter</button>
                    </div>
                  </div>
                ))
              )}
           </div>
           <Link href="/superadmin/vendors" style={{ display: 'block', marginTop: '24px', textAlign: 'center', color: '#4F46E5', fontWeight: 800, fontSize: '14px', textDecoration: 'none' }}>Voir toutes les demandes →</Link>
        </div>

        {/* Global Orders Feed */}
        <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px' }}>
           <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
             <TrendingUp size={20} color="#10B981" /> Flux des Commandes Global
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {recentOrders.map(o => (
                <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #E2E8F0', paddingLeft: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontWeight: 800, fontSize: '14px' }}>{o.store.name}</span>
                     <span style={{ fontSize: '14px', fontWeight: 900, color: '#4F46E5' }}>{Number(o.total).toFixed(3)} DT</span>
                   </div>
                   <div style={{ fontSize: '12px', color: '#64748B' }}>Chez <strong>{o.vendor?.companyName}</strong> • {new Date(o.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
           </div>
           <Link href="/superadmin/marketplace" style={{ display: 'block', marginTop: '24px', textAlign: 'center', color: '#4F46E5', fontWeight: 800, fontSize: '14px', textDecoration: 'none' }}>Historique complet →</Link>
        </div>
      </div>

    </div>
  );
}
