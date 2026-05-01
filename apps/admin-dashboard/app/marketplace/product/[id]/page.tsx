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

  // Serialize product for client component
  const serializedProduct = {
    ...product,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    vendor: {
      ...product.vendor,
      customization: { ...product.vendor.customization }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ProductDetailClient product={serializedProduct} />
    </div>
  );
}
