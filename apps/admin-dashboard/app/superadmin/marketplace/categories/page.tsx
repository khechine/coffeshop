import { prisma } from '@coffeeshop/database';
import CategoryManagementClient from './CategoryManagementClient';

export const dynamic = 'force-dynamic';

export default async function MktCategoriesPage() {
  const [categoryTree, pendingProposals] = await Promise.all([
    (prisma as any).marketplaceCategory.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' }
    }),
    (prisma as any).marketplaceCategory.findMany({
      where: { parentId: { not: null } },
      include: { parent: true }
    })
  ]);

  return (
    <CategoryManagementClient 
      categoryTree={categoryTree as any} 
    />
  );
}
