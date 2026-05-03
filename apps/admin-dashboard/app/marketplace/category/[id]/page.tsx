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
  
  // 1. Find category or subcategory
  let category = data.categories.find((c: any) => c.id === id || c.slug === id);
  let isChild = false;

  if (!category) {
    for (const root of data.categories) {
      const child = (root.children || []).find((s: any) => s.id === id || s.slug === id);
      if (child) {
        category = child;
        isChild = true;
        break;
      }
    }
  }

  if (!category) return notFound();

  // 2. Filter products
  const products = data.products.filter((p: any) => 
    isChild ? p.mktCategoryId === category.id : (p.mktCategoryId === category.id || category.children?.some((c: any) => c.id === p.mktCategoryId))
  );

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
