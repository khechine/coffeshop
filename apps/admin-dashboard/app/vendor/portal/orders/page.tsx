import { getVendorOrdersWithAlertsAction } from '../../../actions';
import VendorOrdersClient from './VendorOrdersClient';

export const dynamic = 'force-dynamic';

export default async function VendorOrdersPage() {
  const { orders, alerts } = await getVendorOrdersWithAlertsAction();
 
  // Serialize complex objects (Decimals, Dates) for Client Component
  const serializedOrders = orders.map((o: any) => ({
    ...o,
    total: Number(o.total),
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    items: (o.items || []).map((it: any) => ({
      ...it,
      price: Number(it.price),
      quantity: Number(it.quantity)
    })),
    store: o.store ? {
      ...o.store,
      vendorCustomers: o.store.vendorCustomers?.map((vc: any) => ({
        ...vc,
        totalSpent: Number(vc.totalSpent),
        lastOrderAt: typeof vc.lastOrderAt?.toISOString === 'function' ? vc.lastOrderAt.toISOString() : vc.lastOrderAt,
        createdAt: typeof vc.createdAt?.toISOString === 'function' ? vc.createdAt.toISOString() : vc.createdAt
      }))
    } : null
  }));

  return (
    <VendorOrdersClient 
      initialOrders={serializedOrders} 
      initialAlerts={alerts} 
    />
  );
}
