import { prisma } from '@coffeeshop/database';
import SuperAdminMarketplaceClient from './SuperAdminMarketplaceClient';
import { getMarketplaceConfig } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function SuperAdminMarketplacePage() {
  const [products, orders, config] = await Promise.all([
    prisma.vendorProduct.findMany({
      include: { vendor: true },
      orderBy: { createdAt: 'desc' }
    }).then(p => p.map((pr: any) => ({
      ...pr,
      price: Number(pr.price),
      discount: pr.discountPrice ? Number(pr.discountPrice) : null
    }))),
    prisma.supplierOrder.findMany({
      where: { vendorId: { not: null } },
      include: { vendor: true, store: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    getMarketplaceConfig()
  ]);

  return (
    <SuperAdminMarketplaceClient 
      products={products} 
      orders={orders} 
      config={config} 
    />
  );
}
