import { prisma } from '@coffeeshop/database';
import { getStore } from '../../../actions';
import { redirect, notFound } from 'next/navigation';
import ProductForm from '../ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const store = await getStore();
  if (!store) redirect('/login');

  const categories = await prisma.category.findMany({ 
    where: { storeId: store.id },
    orderBy: { name: 'asc' } 
  });
  const stockItems = await prisma.stockItem.findMany({
    where: { storeId: store.id },
    orderBy: { name: 'asc' },
  });
  const globalUnits = await prisma.globalUnit.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="page-content">
      <ProductForm 
        categories={categories}
        stockItems={JSON.parse(JSON.stringify(stockItems))}
        globalUnits={JSON.parse(JSON.stringify(globalUnits))}
      />
    </div>
  );
}
