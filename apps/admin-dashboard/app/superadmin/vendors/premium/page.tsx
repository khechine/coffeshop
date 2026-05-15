import { prisma } from '@coffeeshop/database';
import PremiumRequestsClient from './PremiumRequestsClient';

export const dynamic = 'force-dynamic';

export default async function PremiumRequestsPage() {
  const requests = await (prisma as any).vendorPremiumRequest.findMany({
    include: {
      vendor: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return <PremiumRequestsClient initialRequests={requests} />;
}
