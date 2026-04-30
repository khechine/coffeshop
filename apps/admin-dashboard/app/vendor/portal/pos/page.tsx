import React from 'react';
import { getVendorPortalData } from '../../../actions';
import { redirect } from 'next/navigation';
import VendorPosClient from './VendorPosClient';

export const dynamic = 'force-dynamic';

export default async function VendorPosPage() {
  const portalData = await getVendorPortalData();

  if (!portalData || !portalData.isPremium) {
    redirect('/vendor/portal');
  }

  // Serialize complex objects before passing to client component
  const serializedPosList = portalData.posList?.map((pos: any) => ({
    ...pos,
    createdAt: pos.createdAt?.toISOString()
  })) || [];

  const serializedProducts = portalData.products?.map((p: any) => ({
    ...p,
    createdAt: p.createdAt?.toISOString()
  })) || [];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mes Points de Vente</h1>
        <p className="text-slate-500 font-medium mt-1">Gérez vos différentes branches et succursales physiques.</p>
      </div>
      
      <VendorPosClient initialPosList={serializedPosList} products={serializedProducts} />
    </div>
  );
}
