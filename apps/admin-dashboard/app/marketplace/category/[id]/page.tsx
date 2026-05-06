import { getMarketplaceData, getStore, getUser } from '../../../actions';
import CategoryViewClient from './CategoryViewClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params, searchParams }: { params: { id: string }, searchParams: any }) {
  const { id } = params;
  const sParams = await searchParams;
  const radius = sParams.radius && sParams.radius !== 'all' ? parseInt(sParams.radius) : undefined;
  const store = await getStore();
  const user = await getUser();
  const isVendor = user?.role === 'VENDOR';
  
  const data = await getMarketplaceData(
    store?.lat ? Number(store.lat) : undefined,
    store?.lng ? Number(store.lng) : undefined,
    radius
  );
  
  // 1. Find category or subcategory recursively
  let category = null;
  let isChild = false;
  let isVirtual = false;

  const findCategory = (cats: any[], depth: number = 0): any => {
    for (const c of cats) {
      if (c.id === id || c.slug === id) {
        if (depth > 0) isChild = true;
        return c;
      }
      if (c.children && c.children.length > 0) {
        const found = findCategory(c.children, depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  category = findCategory(data.categories);

  // Fallback: Virtual Category (Keyword based)
  if (!category) {
    isVirtual = true;
    category = {
      id: 'virtual-' + id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
      slug: id,
      description: `Résultats pour la recherche : ${id}`,
      isVirtual: true
    };
  }

  // 2. Filter products
  let products = [];
  if (isVirtual) {
    const q = id.toLowerCase();
    products = data.products.filter((p: any) => 
      p.name.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q)
    );
  } else {
    products = data.products.filter((p: any) => 
      isChild ? p.mktCategoryId === category.id : (p.mktCategoryId === category.id || category.children?.some((c: any) => c.id === p.mktCategoryId))
    );
  }

  // Robust serialization for Prisma types (Decimal, Date, etc)
  const serializedData = JSON.parse(JSON.stringify({ 
    category, 
    products, 
    allCategories: data.categories,
    allProducts: data.products,
    banners: data.banners
  }, (key, value) => 
    typeof value === 'object' && value !== null && value?.constructor?.name === 'Decimal' 
      ? Number(value) 
      : value
  ));

  return (
    <CategoryViewClient 
      category={serializedData.category} 
      products={serializedData.products}
      allCategories={serializedData.allCategories}
      allProducts={serializedData.allProducts}
      banners={serializedData.banners || []}
      isVendor={isVendor}
      store={store}
    />
  );
}
