import React from 'react';
import { getMarketplaceData, getUserContext } from '../../actions';
import MobileMarketplaceClient from './MobileMarketplaceClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MobileMarketplacePage() {
  const user = await getUserContext();
  if (!user) {
    redirect('/login');
  }
  if (user.role === 'STORE_OWNER' && !user.hasMarketplace) {
    redirect('/admin/subscription?blocked=trial_expired');
  }

  const initialData = await getMarketplaceData();

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
      <MobileMarketplaceClient initialData={initialData} />
    </div>
  );
}
