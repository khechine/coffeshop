import { prisma } from '@coffeeshop/database';
import { getStore } from '../../../actions';
import { redirect, notFound } from 'next/navigation';
import ProductForm from '../ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const store = await getStore();
  if (!store) redirect('/login');

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, recipe: { include: { stockItem: true } } },
  });

  if (!product || product.storeId !== store.id) {
    notFound();
  }

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
        initialData={JSON.parse(JSON.stringify(product))}
        categories={categories}
        stockItems={JSON.parse(JSON.stringify(stockItems))}
        globalUnits={JSON.parse(JSON.stringify(globalUnits))}
      />
    </div>
  );
}
