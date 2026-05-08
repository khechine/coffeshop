import { prisma } from '@coffeeshop/database';
import StoreWalletHistoryClient from './StoreWalletHistoryClient';

export const dynamic = 'force-dynamic';

export default async function StoreWalletHistoryPage() {
  const transactions = await (prisma as any).storeWalletTransaction.findMany({
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

  return <StoreWalletHistoryClient initialTransactions={transactions} />;
}
