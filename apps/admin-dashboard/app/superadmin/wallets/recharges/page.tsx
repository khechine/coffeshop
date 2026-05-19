import { prisma } from '@coffeeshop/database';
import RechargeRequestsClient from './RechargeRequestsClient';

export const dynamic = 'force-dynamic';

export default async function RechargeRequestsPage() {
  let clientRequests = [];
  try {
    clientRequests = await (prisma as any).storeWalletRechargeRequest.findMany({
      include: {
        store: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    console.error("storeWalletRechargeRequest fetch error:", e);
  }

  let vendorRequests = [];
  try {
    vendorRequests = await (prisma as any).walletDepositRequest.findMany({
      include: {
        vendor: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    console.error("walletDepositRequest fetch error:", e);
  }

  return (
    <RechargeRequestsClient 
      initialClientRequests={clientRequests} 
      initialVendorRequests={vendorRequests} 
    />
  );
}
