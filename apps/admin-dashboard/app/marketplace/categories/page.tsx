import React from 'react';
import { getMarketplaceData, getUserContext } from '../../actions';
import CategoriesListClient from './CategoriesListClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const user = await getUserContext();
  if (!user) {
    redirect('/login');
  }

  const data = await getMarketplaceData();
  
  return (
    <CategoriesListClient 
      categories={data.categories} 
      user={user} 
    />
  );
}
