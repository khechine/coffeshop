import React from 'react';
import MarketplaceClient from './MarketplaceClient';
import { getMarketplaceData, getStore } from '../actions';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const [data, store] = await Promise.all([
    getMarketplaceData(),
    getStore()
  ]);
  
  return (
    <MarketplaceClient initialData={data} store={store} />
  );
}
