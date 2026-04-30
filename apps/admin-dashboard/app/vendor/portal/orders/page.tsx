import { getVendorOrdersWithAlertsAction } from '../../../actions';
import VendorOrdersClient from './VendorOrdersClient';

export const dynamic = 'force-dynamic';

export default async function VendorOrdersPage() {
  const { orders, alerts } = await getVendorOrdersWithAlertsAction();

  return (
    <VendorOrdersClient 
      initialOrders={orders} 
      initialAlerts={alerts} 
    />
  );
}
