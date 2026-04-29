import { getStore } from '../../actions';
import { prisma } from '@coffeeshop/database';
import MetricsClient from './MetricsClient';

export const dynamic = 'force-dynamic';

export default async function MetricsPage({ searchParams }: { searchParams: { period?: string } }) {
  const store = await getStore();
  if (!store) return <div>Veuillez vous connecter</div>;

  const storeId = store.id;
  const period = searchParams.period || 'week';

  // Get date ranges
  const now = new Date();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    // today - already set to 00:00:00
  }

  const timeFilter = { storeId, createdAt: { gte: startDate } };

  // Core metrics
  const salesCount = await prisma.sale.count({ where: timeFilter });
  const salesAgg = await prisma.sale.aggregate({ where: timeFilter, _sum: { total: true } });
  const revenue = Number(salesAgg._sum.total || 0);
  const avgOrderValue = salesCount > 0 ? revenue / salesCount : 0;

  const productsCount = await prisma.product.count({ where: { storeId } });
  const stockItems = await prisma.stockItem.findMany({ where: { storeId } });
  const stockItemsCount = stockItems.length;
  const lowStockCount = stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length;
  const inventoryValue = stockItems.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.cost || 0)), 0);

  const staffCount = await prisma.user.count({ where: { storeId } });

  let expenses = 0;
  try {
    const expAgg = await (prisma.expense as any).aggregate({ 
      where: { storeId, createdAt: { gte: startDate } }, 
      _sum: { amount: true } 
    });
    expenses = Number(expAgg._sum.amount || 0);
  } catch (e) { expenses = 0; }
  const profit = revenue - expenses;

  // Recent sales (within period)
  const recentSales = await prisma.sale.findMany({
    where: timeFilter,
    include: { barista: true, takenBy: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }).then(sales => sales.map(s => ({ ...s, total: Number(s.total) })));

  // Sales by day
  const salesRaw: any[] = await prisma.$queryRawUnsafe(
    `SELECT DATE("createdAt") as date, SUM(total) as total FROM "Sale" WHERE "storeId" = $1 AND "createdAt" >= $2 GROUP BY DATE("createdAt") ORDER BY date`,
    storeId, startDate
  );
  const salesByDay = salesRaw.map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' }),
    total: Number(r.total || 0),
  }));

  // Top products (within period)
  const saleItems = await prisma.saleItem.findMany({
    where: { sale: timeFilter },
    include: { product: { include: { category: true } } }
  });

  const productStats: Record<string, { qty: number; revenue: number; category: string }> = {};
  saleItems.forEach(item => {
    const name = item.product?.name || 'Inconnu';
    if (!productStats[name]) {
      productStats[name] = { qty: 0, revenue: 0, category: item.product?.category?.name || 'Non catégorisé' };
    }
    productStats[name].qty += Number(item.quantity);
    productStats[name].revenue += Number(item.quantity) * Number(item.price);
  });

  const topProducts = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Sales by category (within period)
  const categoryStats: Record<string, number> = {};
  saleItems.forEach(item => {
    const cat = item.product?.category?.name || 'Non catégorisé';
    categoryStats[cat] = (categoryStats[cat] || 0) + (Number(item.quantity) * Number(item.price));
  });
  const salesByCategory = Object.entries(categoryStats)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // Sales by payment method (within period)
  const paymentStats: Record<string, number> = {};
  recentSales.forEach(sale => {
    const method = sale.paymentMethod || 'Espèces';
    paymentStats[method] = (paymentStats[method] || 0) + 1;
  });
  const salesByPayment = Object.entries(paymentStats)
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);

  const data = {
    salesCount,
    revenue,
    avgOrderValue,
    productsCount,
    stockItemsCount,
    lowStockCount,
    inventoryValue,
    staffCount,
    expenses,
    profit,
    recentSales,
    topProducts,
    salesByDay,
    salesByCategory,
    salesByPayment,
  };

  return <MetricsClient data={data} storeName={store.name} initialPeriod={period as any} />;
}
