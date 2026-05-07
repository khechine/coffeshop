import React from 'react';
import MyMessagesClient from './MyMessagesClient';
import { getUserContext } from '../../actions';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Mes Messages - Marketplace CoffeeShop',
  description: 'Gérez vos discussions avec les fournisseurs et finalisez vos achats en toute sécurité.',
};

export default async function MyMessagesPage() {
  try {
    const user = await getUserContext();
    if (!user) redirect('/login');

    return (
      <React.Suspense fallback={<div className="h-screen bg-slate-50" />}>
        <MyMessagesClient store={user.store} />
      </React.Suspense>
    );
  } catch (error: any) {
    console.error("MyMessagesPage Error:", error);
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Oups ! Une erreur est survenue.</h1>
        <p className="text-slate-600 mt-2">Nous ne parvenons pas à charger vos messages pour le moment. Veuillez réessayer plus tard.</p>
        <pre className="mt-4 p-4 bg-slate-100 rounded text-xs text-left inline-block max-w-xl overflow-auto">
          {error.message}
        </pre>
      </div>
    );
  }
}
