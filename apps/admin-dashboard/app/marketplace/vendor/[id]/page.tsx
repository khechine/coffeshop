import { prisma } from '@coffeeshop/database';
import { getUser } from '../../../actions';
import VendorStorefrontClient from './VendorStorefrontClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function VendorStorefrontPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const user = await getUser();
  const isVendor = user?.role === 'VENDOR';

  const vendor = await (prisma as any).vendorProfile.findUnique({
    where: { id },
    include: {
      customization: true,
      ratings: true,
      vendorProducts: {
        include: { productStandard: true }
      }
    }
  });

  if (!vendor) return notFound();

  // Fetch specialized ratings manually since include might not work for aggregate/groupby results
  const ratingsAgg = await (prisma as any).vendorRating.aggregate({
    where: { vendorId: id },
    _avg: {
      speedScore: true,
      qualityScore: true,
      reliabilityScore: true,
      deliveryScore: true
    },
    _count: { _all: true }
  });

  const ratings = {
    avgSpeed: ratingsAgg._avg.speedScore || 0,
    avgQuality: ratingsAgg._avg.qualityScore || 0,
    avgReliability: ratingsAgg._avg.reliabilityScore || 0,
    avgDelivery: ratingsAgg._avg.deliveryScore || 0,
    totalReviews: ratingsAgg._count._all,
    overallAvg: (
      (ratingsAgg._avg.speedScore || 0) + 
      (ratingsAgg._avg.qualityScore || 0) + 
      (ratingsAgg._avg.reliabilityScore || 0) + 
      (ratingsAgg._avg.deliveryScore || 0)
    ) / 4
  };

  return (
    <VendorStorefrontClient 
      vendor={JSON.parse(JSON.stringify(vendor))} 
      ratings={ratings}
      isVendor={isVendor}
    />
  );
}
