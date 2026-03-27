import { prisma } from '@coffeeshop/database';
import SuperAdminMarketplaceClient from './SuperAdminMarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminMarketplacePage() {
  const products = await prisma.marketplaceProduct.findMany({
    include: { vendor: true, category: true },
    orderBy: { createdAt: 'desc' }
  });

  const orders = await prisma.supplierOrder.findMany({
    where: { vendorId: { not: null } },
    include: { vendor: true, store: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return (
    <SuperAdminMarketplaceClient products={products} orders={orders} />
  );
}
