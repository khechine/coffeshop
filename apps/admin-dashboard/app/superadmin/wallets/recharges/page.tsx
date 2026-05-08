import { prisma } from '@coffeeshop/database';
import RechargeRequestsClient from './RechargeRequestsClient';

export const dynamic = 'force-dynamic';

export default async function RechargeRequestsPage() {
  const requests = await (prisma as any).storeWalletRechargeRequest.findMany({
    include: {
      store: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return <RechargeRequestsClient initialRequests={requests} />;
}
