import React from 'react';
import { getMarketplaceProductAction, getUser } from '../../../actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
   const product = await getMarketplaceProductAction(params.id);
   const user = await getUser();
   const isVendor = user?.role === 'VENDOR';

  if (!product) {
    notFound();
  }

  // Robust serialization for Prisma types (Decimal, Date, etc)
  const serializedProduct = JSON.parse(JSON.stringify(product, (key, value) => 
    typeof value === 'object' && value !== null && value.constructor.name === 'Decimal' 
      ? Number(value) 
      : value
  ));

  return (
    <div className="min-h-screen bg-slate-50">
      <ProductDetailClient product={serializedProduct} isVendor={isVendor} />
    </div>
  );
}
