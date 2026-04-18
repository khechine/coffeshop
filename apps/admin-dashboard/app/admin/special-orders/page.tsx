import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import CommandsClient from './CommandsClient';

export const dynamic = 'force-dynamic';

export default async function SpecialOrdersPage() {
  const store = await getStore();
  if (!store) return <div className="page-content">Aucun store configuré.</div>;

  const orders = await prisma.specialOrder.findMany({
    where: { storeId: store.id },
    orderBy: { deliveryDate: 'asc' },
  });

  const serializedOrders = orders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    productName: o.productName,
    clientName: o.clientName || 'Inconnu',
    clientPhone: o.clientPhone || '',
    totalPrice: Number(o.totalPrice),
    depositAmount: Number(o.depositAmount),
    deliveryDate: new Date(o.deliveryDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    deliveryTime: o.deliveryTime,
    isDelivery: o.isDelivery,
    address: o.deliveryAddress,
    status: o.status,
    notes: o.notes,
    customFields: o.customFields // Contains models, flavor, message, etc.
  }));

  return <CommandsClient initialOrders={serializedOrders} storeId={store.id} />;
}
