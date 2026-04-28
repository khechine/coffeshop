import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import { redirect } from 'next/navigation';
import ConfigurationClient from './ConfigurationClient';

export const dynamic = 'force-dynamic';

export default async function ConfigurationPage() {
  const store = await getStore();
  if (!store) redirect('/login');

  // Fetch staff
  const staff = await prisma.user.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch tables
  const tables = await prisma.storeTable.findMany({
    where: { storeId: store.id },
    orderBy: { label: 'asc' },
  });

  // Fetch terminals
  const terminals = await (prisma as any).posTerminal.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  // Fetch expenses summary
  let totalExpenses = 0;
  try {
    const expAgg = await (prisma.expense as any).aggregate({
      where: { storeId: store.id },
      _sum: { amount: true },
    });
    totalExpenses = Number(expAgg._sum.amount || 0);
  } catch {
    const raw: any[] = await prisma.$queryRawUnsafe(
      `SELECT SUM(amount) as total FROM "Expense" WHERE "storeId" = $1`,
      store.id
    );
    totalExpenses = Number(raw[0]?.total || 0);
  }

  // Fetch recent expenses
  const recentExpenses = await (prisma.expense as any).findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).catch(() => []);

  // Sales summary
  const salesCount = await prisma.sale.count({ where: { storeId: store.id } });
  const salesAgg = await prisma.sale.aggregate({ where: { storeId: store.id }, _sum: { total: true } });
  const revenue = Number(salesAgg?._sum?.total || 0);

  const isFiscalEnabled = (store as any)?.isFiscalEnabled === true;

  return (
    <ConfigurationClient
      store={store as any}
      staff={staff as any}
      tables={tables as any}
      terminals={terminals}
      totalExpenses={totalExpenses}
      recentExpenses={recentExpenses}
      salesCount={salesCount}
      revenue={revenue}
      isFiscalEnabled={isFiscalEnabled}
    />
  );
}
