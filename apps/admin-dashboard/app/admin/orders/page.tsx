import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import OrdersClient from './OrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const store = await getStore();
  if (!store) return null;

  const orders = await prisma.supplierOrder.findMany({
    where: { storeId: store.id },
    include: { 
      vendor: true, 
      items: true,
      rating: true
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="page-content">
      <OrdersClient initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}
