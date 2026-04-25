import { prisma } from '@coffeeshop/database';
import { notFound } from 'next/navigation';
import VendorDetailClient from './VendorDetailClient';

export const dynamic = 'force-dynamic';

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const vendor = await (prisma as any).vendorProfile.findUnique({
    where: { id },
    include: {
      user: true,
      vendorProducts: true,
      orders: {
        include: { 
          store: true,
          items: true,
          settlement: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!vendor) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-8xl mx-auto">
      <VendorDetailClient vendor={vendor} />
    </div>
  );
}
