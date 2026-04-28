import React from 'react';
import { getAllWalletRequestsAction, getGlobalWalletTransactionsAction } from '../../actions';
import AdminWalletClient from './AdminWalletClient';

export const dynamic = 'force-dynamic';

export default async function AdminWalletPage() {
  const [requests, transactions] = await Promise.all([
    getAllWalletRequestsAction(),
    getGlobalWalletTransactionsAction()
  ]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <AdminWalletClient initialRequests={requests} initialTransactions={transactions} />
    </div>
  );
}
