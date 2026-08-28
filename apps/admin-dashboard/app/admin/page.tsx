import { prisma } from '@coffeeshop/database';
import { getStore } from '../actions';
import Link from 'next/link';
import { 
  ShoppingCart, ShoppingBag, TrendingUp, AlertTriangle, Coffee, ArrowRight, Package, 
  Layers, Users, Zap, ArrowUpRight, User, Wallet, Truck, Boxes, FileText, 
  Settings, Activity, LayoutGrid, Star, ShieldCheck, CheckCircle2, Clock, DollarSign, Award, RefreshCw
} from 'lucide-react';

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const store = await getStore();
  if (!store) {
    redirect('/login');
  }

  const hasMarketplace = (store as any)?.subscription?.plan?.hasMarketplace === true;

  // Calculate live metrics
  const salesCount = await prisma.sale.count({ where: { storeId: store.id, isVoid: false } });
  const salesAgg = await prisma.sale.aggregate({ where: { storeId: store.id, isVoid: false }, _sum: { total: true, subtotal: true, totalTax: true, discount: true } });
  const revenue = Number(salesAgg?._sum?.total || 0);
  const revenueHt = Number(salesAgg?._sum?.subtotal || revenue);
  const totalTax = Number(salesAgg?._sum?.totalTax || 0);
  const totalDiscounts = Number(salesAgg?._sum?.discount || 0);

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

  // NACEF Status
  const fiscalSalesCount = await prisma.sale.count({ where: { storeId: store.id, isFiscal: true, isVoid: false } });

  // Payment Breakdown
  const salesByPayment = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where: { storeId: store.id, isVoid: false },
    _sum: { total: true }
  });

  const draftOrders = await prisma.supplierOrder.findMany({
    where: { storeId: store.id, status: 'PENDING' },
    include: { vendor: true, supplier: true, items: { include: { stockItem: true } } },
    take: 4,
  });

  const recentSales = await prisma.sale.findMany({
    where: { storeId: store.id },
    select: {
      id: true,
      total: true,
      createdAt: true,
      paymentMethod: true,
      fiscalNumber: true,
      isFiscal: true,
      barista: { select: { id: true, name: true } },
      takenBy: { select: { id: true, name: true } },
      items: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const salesByBarista = await prisma.sale.groupBy({
    by: ['baristaId'],
    where: { storeId: store.id, baristaId: { not: null }, isVoid: false },
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
    where: { sale: { storeId: store.id, isVoid: false } },
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
    <div className="page-content" style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100vh' }}>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HEADER SECTION */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.8px', margin: 0 }}>
              Bonjour, {store.name} 👋
            </h1>
            {store.isFiscalEnabled && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                <ShieldCheck size={14} /> NACEF CONFORME
              </span>
            )}
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px', fontWeight: 600 }}>
            Tableau de bord de pilotage exécutif & performances en temps réel.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/marketplace" style={{ 
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
            color: '#fff', padding: '12px 20px', borderRadius: '14px', textDecoration: 'none',
            fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
          }}>
            <ShoppingCart size={18} /> Marketplace B2B
          </Link>
          <Link href="/pos" style={{ 
            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', 
            color: '#fff', padding: '12px 22px', borderRadius: '14px', textDecoration: 'none',
            fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)'
          }}>
            <Coffee size={18} /> Accès Caisse POS <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* KPI CARDS (4 EXECUTIVE METRICS) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* REVENU TTC */}
        <div style={{ 
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', 
          color: '#fff', padding: '24px', borderRadius: '24px',
          boxShadow: '0 12px 30px rgba(79, 70, 229, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chiffre d'Affaires TTC</span>
            <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '10px' }}>EN DIRECT</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, marginBottom: '6px' }}>
            {revenue.toFixed(3)} <span style={{ fontSize: '16px', opacity: 0.85 }}>DT</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, fontWeight: 600 }}>
            HT: {revenueHt.toFixed(3)} DT • TVA: {totalTax.toFixed(3)} DT
          </div>
        </div>

        {/* TICKETS & PANIER MOYEN */}
        <div style={{ 
          background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets & Ventes</span>
            <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '10px' }}><ShoppingCart size={18} color="#3B82F6" /></div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#0F172A', marginBottom: '6px' }}>
            {salesCount} <span style={{ fontSize: '16px', color: '#64748B', fontWeight: 600 }}>cmd.</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
            Panier Moyen: <strong style={{ color: '#3B82F6' }}>{salesCount > 0 ? (revenue / salesCount).toFixed(3) : '0.000'} DT</strong>
          </div>
        </div>

        {/* MARGE & PROFIT EST. */}
        <div style={{ 
          background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit Net Est.</span>
            <div style={{ background: netProfit >= 0 ? '#ECFDF5' : '#FEF2F2', padding: '6px', borderRadius: '10px' }}>
              <Wallet size={18} color={netProfit >= 0 ? '#10B981' : '#EF4444'} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: netProfit >= 0 ? '#10B981' : '#EF4444', marginBottom: '6px' }}>
            {netProfit.toFixed(3)} <span style={{ fontSize: '16px', opacity: 0.8 }}>DT</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
            Dépenses enregistrées: <strong>{totalExpenses.toFixed(3)} DT</strong>
          </div>
        </div>

        {/* NACEF & CONFORMITÉ FISCALE */}
        <div style={{ 
          background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conformité NACEF</span>
            <div style={{ background: '#F0FDF4', padding: '6px', borderRadius: '10px' }}><ShieldCheck size={18} color="#166534" /></div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#166534', marginBottom: '6px' }}>
            {fiscalSalesCount} <span style={{ fontSize: '15px', color: '#64748B', fontWeight: 600 }}>fac. NACEF</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
            {store.isFiscalEnabled ? 'Securité fiscale NACEF active' : 'Mode Proforma (Formation)'}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ACTIONS REQUISE & ALERTS BANNER */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {(criticalStockCount > 0 || draftOrders.length > 0) && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#F59E0B" /> Actions Requises & Alertes Boutique
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {criticalStockCount > 0 && (
              <Link href="/admin/stock" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '18px', textDecoration: 'none' }}>
                <div style={{ width: '44px', height: '44px', background: '#F97316', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#9A3412' }}>{criticalStockCount} Articles en Rupture ou Stock Bas</div>
                  <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: 600, marginTop: '2px' }}>Ajustez les niveaux de réserve ou commandez auprès des grossistes B2B.</div>
                </div>
              </Link>
            )}
            {draftOrders.length > 0 && (
              <Link href="/admin/orders" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '18px', textDecoration: 'none' }}>
                <div style={{ width: '44px', height: '44px', background: '#3B82F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E40AF' }}>{draftOrders.length} Commandes B2B en Attente</div>
                  <div style={{ fontSize: '12px', color: '#1D4ED8', fontWeight: 600, marginTop: '2px' }}>Suivez la livraison de vos matières premières avec les fournisseurs.</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODULES REORGANIZED BY DOMAIN */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginBottom: '20px' }}>
          Pilotage Exécutif par Domaine
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          {[
            { label: 'Caisse POS', sub: 'Terminal de vente tactile', icon: Coffee, color: '#4F46E5', href: '/pos', bg: '#EEF2FF' },
            { label: 'Marketplace B2B', sub: 'Grossistes & Achats direct', icon: ShoppingCart, color: '#10B981', href: '/marketplace', bg: '#ECFDF5' },
            { label: 'Stock & Ingrédients', sub: 'Suivi réserves & ruptures', icon: Boxes, color: '#F59E0B', href: '/admin/stock', bg: '#FFFBEB' },
            { label: 'Mes Achats B2B', sub: 'Commandes fournisseurs', icon: Truck, color: '#6366F1', href: '/admin/orders', bg: '#EEF2FF' },
            { label: 'Clients & Fidélité', sub: 'Base clients & points', icon: Users, color: '#06B6D4', href: '/admin/customers', bg: '#ECFEFF' },
            { label: 'Équipe & Pointage', sub: 'Présence staff & plannings', icon: User, color: '#8B5CF6', href: '/admin/pointage', bg: '#F5F3FF' },
            { label: 'Rapports & Clôtures Z', sub: 'Fichiers Z & NACEF', icon: FileText, color: '#EC4899', href: '/admin/reports', bg: '#FDF2F8' },
            { label: 'Dépenses & Marges', sub: 'Rentabilité par recette', icon: TrendingUp, color: '#10B981', href: '/admin/expenses', bg: '#ECFDF5' },
            { label: 'Direct Live Tracker', sub: 'Ventes caisse en temps réel', icon: Activity, color: '#EF4444', href: '/admin/live', bg: '#FEF2F2' },
            { label: 'Abonnement & Wallet', sub: 'Plan & Solde B2B', icon: Wallet, color: '#6366F1', href: '/admin/subscription', bg: '#EEF2FF' },
            { label: 'Terminaux POS', sub: 'Gestion des caisses', icon: LayoutGrid, color: '#3B82F6', href: '/admin/terminals', bg: '#EFF6FF' },
            { label: 'Configuration', sub: 'Paramètres du magasin', icon: Settings, color: '#64748B', href: '/admin/configuration', bg: '#F8FAFC' },
          ].map((mod, i) => (
            <Link key={i} href={mod.href} style={{ 
              display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', 
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: '20px', 
              textDecoration: 'none', transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '48px', height: '48px', background: mod.bg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <mod.icon size={22} color={mod.color} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>{mod.label}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>{mod.sub}</div>
              </div>
              <ArrowRight size={16} color="#94A3B8" />
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DETAILED ANALYTICS GRID */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* TOP PRODUCTS */}
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#F59E0B" /> Top Produits Vendus
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Volume & CA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {topProducts.map((p: any, idx: number) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 900, color: '#4F46E5', fontSize: 12 }}>#{idx + 1}</span>
                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{p.name}</span>
                  </div>
                  <span style={{ fontWeight: 900, color: '#0F172A' }}>{p.quantity} <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>unités</span></span>
                </div>
                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ width: `${revenue > 0 ? (p.revenue / revenue) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', borderRadius: '100px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                  <span>CA: {p.revenue.toFixed(3)} DT</span>
                  <span style={{ color: '#4F46E5', fontWeight: 800 }}>{revenue > 0 ? ((p.revenue / revenue) * 100).toFixed(1) : '0'}% du total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STAFF PERFORMANCE */}
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#4F46E5" /> Performance Équipe Staff
            </h3>
            <Link href="/admin/staff" style={{ fontSize: '12px', fontWeight: 800, color: '#4F46E5', textDecoration: 'none' }}>Gérer l'Équipe</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {salesByBarista.map((b, idx) => {
              const name = baristas.find(u => u.id === b.baristaId)?.name || 'Vendeur POS';
              const rev = Number(b._sum.total || 0);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 900, fontSize: '14px' }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>{name}</span>
                      <span style={{ fontWeight: 900, color: '#10B981', fontSize: '14px' }}>{rev.toFixed(3)} DT</span>
                    </div>
                    <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: `${revenue > 0 ? (rev / revenue) * 100 : 0}%`, height: '100%', background: '#10B981', borderRadius: '100px' }} />
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
