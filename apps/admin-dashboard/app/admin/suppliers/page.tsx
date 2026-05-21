import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import SuppliersClient from './SuppliersClient';

export const dynamic = 'force-dynamic';

export default async function AdminSuppliersPage() {
  const store = await getStore();
  if (!store) return null;

  // Fetch local suppliers
  const suppliers = await prisma.supplier.findMany({
    where: { storeId: store.id },
    include: { 
      orders: {
        include: {
          items: {
            include: {
              stockItem: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="page-content">
      <SuppliersClient initialSuppliers={JSON.parse(JSON.stringify(suppliers))} />
    </div>
  );
}
