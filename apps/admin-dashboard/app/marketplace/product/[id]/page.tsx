import React from 'react';
import { getMarketplaceProductAction } from '../../../actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getMarketplaceProductAction(params.id);

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
      <ProductDetailClient product={serializedProduct} />
    </div>
  );
}
