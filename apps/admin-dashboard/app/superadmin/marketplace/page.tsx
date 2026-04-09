import { prisma } from '@coffeeshop/database';
import SuperAdminMarketplaceClient from './SuperAdminMarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminMarketplacePage() {
  const products = await prisma.vendorProduct.findMany({
    include: { vendor: true },
    orderBy: { createdAt: 'desc' }
  }).then(p => p.map((pr: any) => ({
    ...pr,
    price: Number(pr.price),
    discount: pr.discountPrice ? Number(pr.discountPrice) : null
  })));

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
