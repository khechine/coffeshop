import { getMarketplaceData, getStore, getUser } from '../../../actions';
import CategoryViewClient from './CategoryViewClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const store = await getStore();
  const user = await getUser();
  const isVendor = user?.role === 'VENDOR';
  const data = await getMarketplaceData();
  
  const category = data.categories.find((c: any) => c.id === id || c.slug === id);
  if (!category) return notFound();

  const products = data.products.filter((p: any) => p.categoryId === category.id);

  // Robust serialization for Prisma types (Decimal, Date, etc)
  const serializedData = JSON.parse(JSON.stringify({ category, products, allCategories: data.categories }, (key, value) => 
    typeof value === 'object' && value !== null && value.constructor.name === 'Decimal' 
      ? Number(value) 
      : value
  ));

  return (
    <CategoryViewClient 
      category={serializedData.category} 
      products={serializedData.products}
      allCategories={serializedData.allCategories}
      isVendor={isVendor}
    />
  );
}
