import { getStoreMarketplaceOrders, getStore } from '../../actions';
import OrdersClient from './OrdersClient';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  const store = await getStore();
  if (!store) {
    redirect('/login');
  }
  
  const orders = await getStoreMarketplaceOrders();

  return (
    <OrdersClient orders={orders} store={store} />
  );
}
