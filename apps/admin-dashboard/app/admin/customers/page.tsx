import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import CustomersClient from './CustomersClient';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const store = await getStore();
  if (!store) return <div className="page-content">Aucun store configuré.</div>;

  const customers = await prisma.customer.findMany({
    where: { storeId: store.id },
    orderBy: { name: 'asc' },
    include: { loyaltyTx: true } // to potentially deduce last interaction or max history
  });

  const serializedCustomers = customers.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    loyaltyPoints: Number(c.loyaltyPoints),
    totalSpent: Number(c.totalSpent),
    createdAt: new Date(c.createdAt).toLocaleDateString('fr-FR'),
  }));

  return <CustomersClient initialCustomers={serializedCustomers} storeId={store.id} />;
}
