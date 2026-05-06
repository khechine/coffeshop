import React from 'react';
import MarketplaceClient from './MarketplaceClient';
import { getMarketplaceData, getBlogPosts, getUserContext } from '../actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage({ searchParams }: { searchParams: any }) {
  const sParams = await searchParams;
  
  let radius: number | undefined = undefined;
  if (sParams.radius && sParams.radius !== 'all') {
    const parsed = parseInt(sParams.radius);
    if (!isNaN(parsed)) radius = parsed;
  }
  
  const user = await getUserContext();
  if (!user) {
    redirect('/login');
  }

  const lat = user.store?.lat || user.vendorProfile?.lat;
  const lng = user.store?.lng || user.vendorProfile?.lng;
  
  const [data, blogPosts] = await Promise.all([
    getMarketplaceData(
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
      radius
    ),
    getBlogPosts(true),
  ]);
  
  return (
    <MarketplaceClient 
      initialData={data} 
      store={user.store} 
      blogPosts={blogPosts} 
      user={user}
    />
  );
}
