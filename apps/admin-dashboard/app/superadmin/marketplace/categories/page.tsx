import { prisma } from '@coffeeshop/database';
import CategoryManagementClient from './CategoryManagementClient';
import { getMarketplaceToken } from '../../../actions';

export const dynamic = 'force-dynamic';

export default async function MktCategoriesPage() {
  const [categoryTree, pendingProposals, token] = await Promise.all([
    (prisma as any).marketplaceCategory.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' }
    }),
    (prisma as any).marketplaceCategory.findMany({
      where: { parentId: { not: null } },
      include: { parent: true }
    }),
    getMarketplaceToken(),
  ]);

  return (
    <CategoryManagementClient 
      categoryTree={categoryTree as any} 
      token={token}
    />
  );
}
