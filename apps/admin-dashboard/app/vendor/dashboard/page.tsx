import { prisma } from '@coffeeshop/database';
import { Truck, Clock, CheckCircle, Package, TrendingUp, Store, Lock } from 'lucide-react';
import VendorClient from './VendorClient';
import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function VendorDashboard() {
  const store = await getStore();
  if (!store) return null;

  const hasMarketplace = (store as any)?.subscription?.plan?.hasMarketplace === true;

  if (!hasMarketplace) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card" style={{ maxWidth: 500, padding: '48px', textAlign: 'center', borderRadius: '24px' }}>
           <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
              <Lock size={32} />
           </div>
           <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '16px' }}>Accès Restreint</h1>
           <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              La gestion des fournisseurs B2B et l'accès au catalogue partenaire ne sont pas inclus dans votre forfait actuel.
           </p>
           <a href="/" className="btn btn-primary">Retour au Dashboard</a>
        </div>
      </div>
    );
  }

  const suppliersRaw = await prisma.supplier.findMany({
    where: {
      OR: [
        { orders: { some: { storeId: store.id } } },
        { stockItems: { some: { storeId: store.id } } }
      ]
    },
    orderBy: { name: 'asc' },
    include: { orders: { where: { storeId: store.id } } }
  });

  const allOrdersRaw = await prisma.supplierOrder.findMany({
    where: { storeId: store.id },
    include: { 
      store: true, 
      items: { include: { stockItem: true } },
      supplier: true,
      vendor: true
    },
    orderBy: { createdAt: 'desc' },
  });

  // Re-map suppliers to include orders that might only be linked via vendorId (for proxy-suppliers)
  const suppliers = suppliersRaw.map(s => {
    if (s.name.startsWith('[Marketplace]')) {
      const vendorName = s.name.replace('[Marketplace] ', '');
      const vendorOrders = allOrdersRaw.filter(o => o.vendor?.companyName === vendorName);
      // Combine and remove duplicates (by ID)
      const combinedOrders = [...s.orders, ...vendorOrders];
      const uniqueOrders = Array.from(new Map(combinedOrders.map(o => [o.id, o])).values());
      return { ...s, orders: uniqueOrders };
    }
    return s;
  });

  const allOrders = allOrdersRaw.map(o => ({
    ...o,
    total: Number(o.total),
    items: o.items.map((it: any) => ({ 
      ...it, 
      quantity: Number(it.quantity), 
      price: Number(it.price) 
    })),
    // Resolve supplier/vendor name
    supplier: o.supplier 
      ? { id: o.supplier.id, name: o.supplier.name }
      : o.vendor 
        ? { id: o.vendor.id, name: `[Marketplace] ${o.vendor.companyName}` }
        : { id: 'unknown', name: 'Inconnu' }
  }));

  const stockItems = await prisma.stockItem.findMany({ where: { storeId: store.id }, orderBy: { name: 'asc' } });

  const pendingCount = allOrders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const deliveredCount = allOrders.filter(o => o.status === 'DELIVERED').length;
  const totalRevenue = allOrders.reduce((acc, o) => acc + Number(o.total), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={22} color="#fff" />
          </div>
          <div>
            <h1>Fournisseurs &amp; Commandes B2B</h1>
            <p>Gérez vos fournisseurs et les commandes de réapprovisionnement.</p>
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '24px' }}>
        <div className="kpi-card orange">
          <div className="kpi-icon orange"><Clock size={22} /></div>
          <div><div className="kpi-label">À Livrer</div><div className="kpi-value">{pendingCount}</div></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><CheckCircle size={22} /></div>
          <div><div className="kpi-label">Livrées</div><div className="kpi-value">{deliveredCount}</div></div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Store size={22} /></div>
          <div><div className="kpi-label">Fournisseurs</div><div className="kpi-value">{suppliers.length}</div></div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple"><TrendingUp size={22} /></div>
          <div>
            <div className="kpi-label">Volume B2B</div>
            <div className="kpi-value">{totalRevenue.toFixed(0)}<span style={{fontSize:'13px',color:'#94A3B8'}}> DT</span></div>
          </div>
        </div>
      </div>

      <VendorClient suppliers={suppliers as any} allOrders={allOrders as any} stockItems={stockItems as any} />
    </div>
  );
}
