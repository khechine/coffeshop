import { prisma } from '@coffeeshop/database';
import MetricsClient from '@/app/admin/metrics/MetricsClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StoreMetricsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) notFound();

  const salesCount = await prisma.sale.count({ where: { storeId: id } });
  const salesAgg = await prisma.sale.aggregate({ where: { storeId: id }, _sum: { total: true } });
  const revenue = Number(salesAgg._sum.total || 0);
  const avgOrderValue = salesCount > 0 ? revenue / salesCount : 0;

  const productsCount = await prisma.product.count({ where: { storeId: id } });
  const stockItems = await prisma.stockItem.findMany({ where: { storeId: id } });
  const lowStockCount = stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length;
  const inventoryValue = stockItems.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.cost || 0)), 0);

  const staffCount = await prisma.user.count({ where: { storeId: id } });

  let expenses = 0;
  try {
    const expAgg = await (prisma.expense as any).aggregate({ where: { storeId: id }, _sum: { amount: true } });
    expenses = Number(expAgg._sum.amount || 0);
  } catch (e) { expenses = 0; }
  const profit = revenue - expenses;

  // Recent sales
  const recentSales = await prisma.sale.findMany({
    where: { storeId: id },
    include: { barista: true, takenBy: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).then(sales => sales.map(s => ({ ...s, total: Number(s.total) })));

  // Sales by day
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const salesRaw: any[] = await prisma.$queryRawUnsafe(
    `SELECT DATE("createdAt") as date, SUM(total) as total FROM "Sale" WHERE "storeId" = $1 AND "createdAt" >= $2 GROUP BY DATE("createdAt") ORDER BY date`,
    id, thirtyDaysAgo
  );
  const salesByDay = salesRaw.map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' }),
    total: Number(r.total || 0),
  }));

  // Top products
  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { storeId: id } },
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

  // Sales by category
  const categoryStats: Record<string, number> = {};
  saleItems.forEach(item => {
    const cat = item.product?.category?.name || 'Non catégorisé';
    categoryStats[cat] = (categoryStats[cat] || 0) + (Number(item.quantity) * Number(item.price));
  });
  const salesByCategory = Object.entries(categoryStats)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const data = {
    salesCount,
    revenue,
    avgOrderValue,
    productsCount,
    stockItemsCount: stockItems.length,
    lowStockCount,
    inventoryValue,
    staffCount,
    expenses,
    profit,
    recentSales,
    topProducts,
    salesByDay,
    salesByCategory,
    salesByPayment: [{ method: 'Espèces', count: salesCount }],
  };

  return <MetricsClient data={data} storeName={store.name} />;
}
