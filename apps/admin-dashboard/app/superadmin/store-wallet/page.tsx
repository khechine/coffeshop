import { prisma } from '@coffeeshop/database';
import StoreWalletHistoryClient from './StoreWalletHistoryClient';

export const dynamic = 'force-dynamic';

export default async function StoreWalletHistoryPage() {
  const storeTransactions = await (prisma as any).storeWalletTransaction.findMany({
    include: {
      wallet: {
        include: {
          store: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  const vendorTransactions = await (prisma as any).walletTransaction.findMany({
    include: {
      wallet: {
        include: {
          vendor: {
            select: { companyName: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  return <StoreWalletHistoryClient initialStoreTransactions={storeTransactions} initialVendorTransactions={vendorTransactions} />;
}
