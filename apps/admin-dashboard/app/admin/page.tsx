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
  const revenue = Number(salesAgg?._sum?.total || 0);

  const stockItems = (await prisma.stockItem.findMany({ where: { storeId: store.id } })) || [];
  const criticalStockCount = stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length;
  const inventoryValue = stockItems.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.cost || 0)), 0);

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

  const baristaIds = salesByBarista.map(s => s.baristaId).filter(Boolean) as string[];
  const baristas = await prisma.user.findMany({
     where: { id: { in: baristaIds } },
     select: { id: true, name: true }
  });

  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { storeId: store.id } },
    include: { product: true }
  });

  const productStats = saleItems.reduce((acc: any, item) => {
    if (!item.product) return acc;
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
  const bestBaristaName = bestBaristaData ? (baristas.find(u => u.id === bestBaristaData.baristaId)?.name || 'N/A') : 'N/A';
  const bestBaristaRev = Number(bestBaristaData?._sum.total || 0);

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px' }}>Bonjour, {store.name} 👋</h1>
          <p style={{ fontSize: '15px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>Voici l'état de performance de votre établissement aujourd'hui.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/metrics" className="btn" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 700 }}>
             <TrendingUp size={16} /> Analyser
          </Link>
          <Link href="/pos" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '14px', fontSize: '14px' }}>
            <Coffee size={18} />
            Accès Caisse
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {/* REVENU CARD - PREMIUM GRADIENT */}
        <div className="kpi-card" style={{ 
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', 
          color: '#fff', 
          border: 'none',
          padding: '28px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(79, 70, 229, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#fff" />
            </div>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '3px 10px', 
              borderRadius: '20px', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Aujourd'hui</span>
          </div>
          <div style={{ marginTop: '24px' }}>
            <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Chiffre d'Affaires</div>
            <div className="kpi-value" style={{ color: '#fff', fontSize: '32px', fontWeight: 900 }}>{revenue.toFixed(3)} <span style={{ fontSize: '16px', opacity: 0.8 }}>DT</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
              <div style={{ padding: '2px 8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#34D399' }}>+12%</div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>vs hier</span>
            </div>
          </div>
        </div>

        {/* TICKETS CARD */}
        <div className="kpi-card" style={{ 
          background: '#fff', 
          padding: '28px',
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: '#F0F9FF', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={20} color="#0EA5E9" />
            </div>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              color: '#64748B', 
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '3px 10px', 
              borderRadius: '20px', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Volume</span>
          </div>
          <div style={{ marginTop: '24px' }}>
            <div className="kpi-label" style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Tickets Encaissés</div>
            <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B' }}>{salesCount} <span style={{ fontSize: '16px', color: '#94A3B8' }}>cmd.</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Moyenne: {(revenue/salesCount || 0).toFixed(3)} DT</span>
            </div>
          </div>
        </div>

        {/* STAFF CARD */}
        <div className="kpi-card" style={{ 
          background: '#fff', 
          padding: '28px',
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: '#F5F3FF', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#8B5CF6" />
            </div>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              color: '#64748B', 
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '3px 10px', 
              borderRadius: '20px', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Équipe</span>
          </div>
          <div style={{ marginTop: '24px' }}>
            <div className="kpi-label" style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Top Vendeur</div>
            <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{bestBaristaName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
              <span style={{ fontSize: '14px', color: '#10B981', fontWeight: 800 }}>{bestBaristaRev.toFixed(3)} DT</span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>réalisés</span>
            </div>
          </div>
        </div>

        {/* PROFIT / MARGE CARD */}
        <div className="kpi-card" style={{ 
          background: netProfit >= 0 ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', 
          color: '#fff',
          border: 'none',
          padding: '28px',
          borderRadius: '24px',
          boxShadow: netProfit >= 0 ? '0 20px 40px rgba(16, 185, 129, 0.15)' : '0 20px 40px rgba(239, 68, 68, 0.15)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} color="#fff" />
            </div>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '3px 10px', 
              borderRadius: '20px', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Estimation</span>
          </div>
          <div style={{ marginTop: '24px' }}>
            <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Profit Net (Journalier)</div>
            <div className="kpi-value" style={{ color: '#fff', fontSize: '32px', fontWeight: 900 }}>{netProfit.toFixed(3)} <span style={{ fontSize: '16px', opacity: 0.8 }}>DT</span></div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '12px' }}>Dépenses: {totalExpenses.toFixed(3)} DT</div>
          </div>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '30px', marginTop: '40px' }}>
        {/* PRODUCT ANALYTICS */}
        <div className="card" style={{ borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
           <div style={{ padding: '24px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Zap size={18} color="#F59E0B" /> Meilleurs Produits
             </h3>
             <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Volume Ventes</span>
           </div>
           <div style={{ padding: '24px' }}>
              {topProducts.map((p: any, idx) => (
                <div key={idx} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#64748B' }}>{idx+1}</div>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{p.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{p.quantity} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>u.</span></span>
                  </div>
                  <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${(p.revenue / revenue) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: '100px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>CA: {p.revenue.toFixed(3)} DT</span>
                    <span style={{ fontSize: '11px', color: '#6366F1', fontWeight: 700 }}>{((p.revenue/revenue)*100).toFixed(1)}% du total</span>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* STAFF PERFORMANCE */}
        <div className="card" style={{ borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
           <div style={{ padding: '24px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Users size={18} color="#6366F1" /> Performance Staff
             </h3>
             <Link href="/admin/staff" style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1' }}>Gérer l'Équipe</Link>
           </div>
           <div style={{ padding: '24px' }}>
              {salesByBarista.map((b, idx) => {
                const name = baristas.find(u => u.id === b.baristaId)?.name || 'Inconnu';
                const rev = Number(b._sum.total || 0);
                return (
                  <div key={idx} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 800 }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#334155', fontSize: '14px' }}>{name}</span>
                        <span style={{ fontWeight: 800, color: '#10B981', fontSize: '14px' }}>{rev.toFixed(3)} DT</span>
                      </div>
                      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: `${(rev/revenue)*100}%`, height: '100%', background: '#10B981', borderRadius: '100px' }} />
                      </div>
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
