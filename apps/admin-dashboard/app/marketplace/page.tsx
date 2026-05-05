import React from 'react';
import MarketplaceClient from './MarketplaceClient';
import { getMarketplaceData, getStore } from '../actions';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage({ searchParams }: { searchParams: any }) {
  const sParams = await searchParams;
  
  // Safely parse radius
  let radius: number | undefined = undefined;
  if (sParams.radius && sParams.radius !== 'all') {
    const parsed = parseInt(sParams.radius);
    if (!isNaN(parsed)) {
      radius = parsed;
    }
  }
  
  const store = await getStore();
  
  const data = await getMarketplaceData(
    store?.lat ? Number(store.lat) : undefined,
    store?.lng ? Number(store.lng) : undefined,
    radius
  );
  
  return (
    <MarketplaceClient initialData={data} store={store} />
  );
}
