import React from 'react';
import MyMessagesClient from './MyMessagesClient';
import { getUserContext } from '../../actions';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Mes Messages - Marketplace CoffeeShop',
  description: 'Gérez vos discussions avec les fournisseurs et finalisez vos achats en toute sécurité.',
};

export default async function MyMessagesPage() {
  const user = await getUserContext();
  if (!user) redirect('/login');

  return (
    <React.Suspense fallback={<div className="h-screen bg-slate-50" />}>
      <MyMessagesClient store={user.store} />
    </React.Suspense>
  );
}
