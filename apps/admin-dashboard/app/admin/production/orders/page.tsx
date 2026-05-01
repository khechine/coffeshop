import { getSpecialOrders } from '../../../../app/actions';
import ProductionOrdersClient from './ProductionOrdersClient';

export const dynamic = 'force-dynamic';

export default async function ProductionOrdersPage() {
  const orders = await getSpecialOrders();

  return (
    <div className="page-content">
      <ProductionOrdersClient initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}
