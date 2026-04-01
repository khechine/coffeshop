import { prisma } from '@coffeeshop/database';
import { getStore } from '../actions';
import Link from 'next/link';
import { ShoppingCart, TrendingUp, AlertTriangle, Coffee, ArrowRight, Package, Layers, Users, Zap, ArrowUpRight, User, Wallet } from 'lucide-react';

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const store = await getStore();
  if (!store) {
    redirect('/login');
  }

  const hasMarketplace = (store as any)?.subscription?.plan?.hasMarketplace === true;

  const salesCount = await prisma.sale.count({ where: { storeId: store.id } });
  const salesAgg = await prisma.sale.aggregate({ where: { storeId: store.id }, _sum: { total: true } });
  const revenue = Number(salesAgg._sum.total || 0);

  const stockItems = await prisma.stockItem.findMany({ where: { storeId: store.id } });
  const criticalStockCount = stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length;
  const inventoryValue = stockItems.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.cost || 0)), 0);

  const productsCount = await prisma.product.count({ where: { storeId: store.id } });
  const staffCount = await prisma.user.count({ where: { storeId: store.id } });

  let totalExpenses = 0;
  try {
    const expensesAgg = await (prisma.expense as any).aggregate({ where: { storeId: store.id }, _sum: { amount: true } });
    totalExpenses = Number(expensesAgg._sum.amount || 0);
  } catch (e) {
    const raw: any[] = await prisma.$queryRawUnsafe(`SELECT SUM(amount) as total FROM "Expense" WHERE "storeId" = $1`, store.id);
    totalExpenses = Number(raw[0]?.total || 0);
  }
  const netProfit = revenue - totalExpenses;

  const draftOrders = await prisma.supplierOrder.findMany({
    where: { storeId: store.id, status: 'PENDING' },
    include: { vendor: true, supplier: true, items: { include: { stockItem: true } } },
    take: 3,
  });

  const recentSales = await prisma.sale.findMany({
    where: { storeId: store.id },
    include: { barista: true, takenBy: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const salesByTable = await prisma.sale.groupBy({
    by: ['tableName'],
    where: { storeId: store.id, tableName: { not: null } },
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5
  });

  const salesByBarista = await prisma.sale.groupBy({
    by: ['baristaId'],
    where: { storeId: store.id, baristaId: { not: null } },
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5
  });

  const baristaIds = salesByBarista.map(s => s.baristaId as string);
  const baristas = await prisma.user.findMany({
     where: { id: { in: baristaIds } },
     select: { id: true, name: true }
  });

  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { storeId: store.id } },
    include: { product: true }
  });

  const productStats = saleItems.reduce((acc: any, item) => {
    const name = item.product.name;
    if (!acc[name]) acc[name] = { name, quantity: 0, revenue: 0 };
    acc[name].quantity += item.quantity;
    acc[name].revenue += Number(item.price) * item.quantity;
    return acc;
  }, {});

  const topProducts = Object.values(productStats)
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5);

  const bestBaristaData = salesByBarista[0];
  const bestBaristaName = baristas.find(u => u.id === bestBaristaData?.baristaId)?.name || 'N/A';
  const bestBaristaRev = Number(bestBaristaData?._sum.total || 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Tableau de Bord</h1>
          <p>Supervision du café, stocks et performance staff</p>
        </div>
        <Link href="/pos" className="btn btn-primary">
          <Coffee size={16} />
          Ouvrir la Caisse
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><ShoppingCart size={22} /></div>
          <div>
            <div className="kpi-label">Ventes Totales</div>
            <div className="kpi-value">{salesCount}</div>
            <div className="kpi-sub kpi-trend-up">↑ tickets encaissés</div>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon green"><TrendingUp size={22} /></div>
          <div>
            <div className="kpi-label">Chiffre d'Affaires</div>
            <div className="kpi-value">{revenue.toFixed(3)} DT</div>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple"><User size={22} /></div>
          <div>
            <div className="kpi-label">Top Vendeur</div>
            <div className="kpi-value" style={{ fontSize: '18px' }}>{bestBaristaName}</div>
            <div className="kpi-sub">{bestBaristaRev.toFixed(3)} DT</div>
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-icon orange"><AlertTriangle size={22} /></div>
          <div>
            <div className="kpi-label">Alerte Stocks</div>
            <div className="kpi-value">{criticalStockCount}</div>
            <div className="kpi-sub" style={{color: criticalStockCount > 0 ? '#EF4444' : '#10B981'}}>
              {criticalStockCount > 0 ? '⚠ Rupture possible' : 'Stocks OK'}
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ background: netProfit >= 0 ? '#F0FDF4' : '#FEF2F2', borderColor: netProfit >= 0 ? '#BBF7D0' : '#FEE2E2' }}>
          <div className="kpi-icon" style={{ background: netProfit >= 0 ? '#DCFCE7' : '#FEE2E2', color: netProfit >= 0 ? '#10B981' : '#EF4444' }}><Wallet size={22} /></div>
          <div>
            <div className="kpi-label">Profit Net Estimé</div>
            <div className="kpi-value" style={{ color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>{netProfit.toFixed(3)} DT</div>
            <div className="kpi-sub" style={{ color: '#64748B' }}>Dépenses: {totalExpenses.toFixed(3)} DT</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px', marginTop: '30px' }}>
        <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)' }}>
           <div className="card-header" style={{ background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
             <span className="card-title" style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}><Zap size={16} /> Meilleurs Produits</span>
           </div>
           <div style={{ padding: '24px' }}>
              {topProducts.map((p: any, idx) => (
                <div key={idx} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: '#475569' }}>{p.name}</span>
                    <span style={{ fontWeight: 800, color: '#64748B' }}>{p.quantity} <span style={{ fontSize: '11px', fontWeight: 500 }}>u.</span></span>
                  </div>
                  <div className="progress-track" style={{ height: '8px', background: '#F1F5F9' }}>
                    <div className="progress-fill" style={{ width: `${(p.revenue / revenue) * 100}%`, background: 'linear-gradient(90deg, #6366F1, #818CF8)', borderRadius: '100px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', fontWeight: 600 }}>CA généré: {p.revenue.toFixed(3)} DT</div>
                </div>
              ))}
           </div>
        </div>

        <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)' }}>
           <div className="card-header" style={{ background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
             <span className="card-title" style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}><User size={16} /> Performance Staff</span>
           </div>
           <div style={{ padding: '24px' }}>
              {salesByBarista.map((b, idx) => {
                const name = baristas.find(u => u.id === b.baristaId)?.name || 'Inconnu';
                const rev = Number(b._sum.total || 0);
                return (
                  <div key={idx} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 700, color: '#475569' }}>{name}</span>
                      <span style={{ fontWeight: 800, color: '#10B981' }}>{rev.toFixed(3)} DT</span>
                    </div>
                    <div className="progress-track" style={{ height: '8px', background: '#F1F5F9' }}>
                      <div className="progress-fill" style={{ width: `${(rev/revenue)*100}%`, background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '100px' }} />
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)' }}>
           <div className="card-header" style={{ background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
             <span className="card-title" style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}><Layers size={16} /> Performance Tables</span>
           </div>
           <div style={{ padding: '24px' }}>
              {salesByTable.map((t, idx) => {
                const total = Number(t._sum.total || 0);
                return (
                  <div key={idx} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 700, color: '#475569' }}>Table: {t.tableName}</span>
                      <span style={{ fontWeight: 800, color: '#6366F1' }}>{total.toFixed(3)} DT</span>
                    </div>
                    <div className="progress-track" style={{ height: '8px', background: '#F1F5F9' }}>
                      <div className="progress-fill" style={{ width: `${(total/revenue)*100}%`, background: 'linear-gradient(90deg, #6366F1, #C084FC)', borderRadius: '100px' }} />
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
}
