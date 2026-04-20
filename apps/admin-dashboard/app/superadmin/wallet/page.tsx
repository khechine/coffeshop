import React from 'react';
import { getPendingDepositsAction } from '../../actions';
import AdminWalletClient from './AdminWalletClient';

export const dynamic = 'force-dynamic';

export default async function AdminWalletPage() {
  const requests = await getPendingDepositsAction();

  return (
    <div className="max-w-7xl mx-auto">
      <AdminWalletClient initialRequests={requests} />
    </div>
  );
}
