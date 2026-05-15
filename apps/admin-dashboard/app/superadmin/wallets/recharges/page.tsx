import { prisma } from '@coffeeshop/database';
import RechargeRequestsClient from './RechargeRequestsClient';

export const dynamic = 'force-dynamic';

export default async function RechargeRequestsPage() {
  let requests = [];
  try {
    requests = await (prisma as any).storeWalletRechargeRequest.findMany({
      include: {
        store: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    console.error("RechargeRequest table missing:", e);
  }

  return <RechargeRequestsClient initialRequests={requests} />;
}
