import React from 'react';
import { getMarketplaceData } from '../../actions';
import MobileMarketplaceClient from './MobileMarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function MobileMarketplacePage() {
  const initialData = await getMarketplaceData();

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
      <MobileMarketplaceClient initialData={initialData} />
    </div>
  );
}
