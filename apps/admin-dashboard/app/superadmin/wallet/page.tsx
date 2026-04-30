import React from 'react';
import { getAllWalletRequestsAction, getGlobalWalletTransactionsAction, getAllVendors } from '../../actions';
import AdminWalletClient from './AdminWalletClient';

export const dynamic = 'force-dynamic';

export default async function AdminWalletPage() {
  const [requestsRaw, transactionsRaw, vendorsRaw] = await Promise.all([
    getAllWalletRequestsAction(),
    getGlobalWalletTransactionsAction(),
    getAllVendors()
  ]);

  // Serialize Prisma Decimals for Client Components
  const requests = requestsRaw.map((r: any) => ({
    ...r,
    amount: r.amount.toString(),
  }));

  const transactions = transactionsRaw.map((t: any) => ({
    ...t,
    amount: t.amount.toString(),
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <AdminWalletClient initialRequests={requests} initialTransactions={transactions} vendors={vendorsRaw} />
    </div>
  );
}
