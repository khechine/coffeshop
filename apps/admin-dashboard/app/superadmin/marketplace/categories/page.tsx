import { prisma } from '@coffeeshop/database';
import MktCategoriesClient from './MktCategoriesClient';

export const dynamic = 'force-dynamic';

export default async function MktCategoriesPage() {
  const [categories, pendingSubcategories] = await Promise.all([
    prisma.mktCategory.findMany({
      include: { subcategories: true },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.mktSubcategory.findMany({
      where: { status: 'PENDING' },
      include: { category: true }
    })
  ]);

  return (
    <MktCategoriesClient 
      categories={categories} 
      pendingSubcategories={pendingSubcategories} 
    />
  );
}
