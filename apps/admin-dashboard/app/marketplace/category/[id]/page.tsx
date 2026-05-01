import { getMarketplaceData, getStore } from '../../../actions';
import CategoryViewClient from './CategoryViewClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const store = await getStore();
  const data = await getMarketplaceData();
  
  const category = data.categories.find((c: any) => c.id === id || c.slug === id);
  if (!category) return notFound();

  // Filter products for this category
  const products = data.products.filter((p: any) => p.categoryId === category.id);

  return (
    <CategoryViewClient 
      category={category} 
      products={products}
      allCategories={data.categories}
    />
  );
}
