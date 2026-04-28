import { prisma } from '@coffeeshop/database';
import VendorsListClient from './VendorsListClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminVendorsPage() {
  const vendorsRaw = await (prisma as any).vendorProfile.findMany({
    include: { 
      user: true, 
      vendorProducts: true,
      wallet: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Convert Decimal fields to numbers
  const vendors = vendorsRaw.map((v: any) => ({
    ...v,
    vendorProducts: (v.vendorProducts || []).map((p: any) => ({
      ...p,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    }))
  }));

  return (
    <div className="flex flex-col gap-10 p-6 max-w-8xl mx-auto">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Vendeurs Marketplace</h1>
        <p className="mt-2 text-slate-500 font-medium tracking-tight">Validation des inscriptions et gestion des comptes fournisseurs certifiés.</p>
      </div>

      <VendorsListClient initialVendors={vendors as any} />
    </div>
  );
}
