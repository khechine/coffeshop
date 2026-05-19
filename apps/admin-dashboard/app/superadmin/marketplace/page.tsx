import { prisma } from '@coffeeshop/database';
import SuperAdminMarketplaceClient from './SuperAdminMarketplaceClient';
import { getMarketplaceConfig, superadminGetAllBundlesAction, superadminGetAllVendorsAction } from '../../actions';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SuperAdminMarketplacePage() {
  const superadminUserId = cookies().get('userId')?.value || '';

  const [products, orders, config, bundles, vendors] = await Promise.all([
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
    getMarketplaceConfig(),
    superadminGetAllBundlesAction(),
    superadminGetAllVendorsAction(),
  ]);

  return (
    <SuperAdminMarketplaceClient 
      products={products} 
      orders={orders} 
      config={config}
      bundles={bundles}
      vendors={vendors}
      superadminUserId={superadminUserId}
    />
  );
}
