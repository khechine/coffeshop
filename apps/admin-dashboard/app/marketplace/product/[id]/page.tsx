import React from 'react';
import { getMarketplaceProductAction, getRelatedProductsAction, getUser } from '../../../actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const product = await getMarketplaceProductAction(id);
   const user = await getUser();
   const isVendor = user?.role === 'VENDOR';

  if (!product) {
    notFound();
  }

  // Fetch related products
  const related = await getRelatedProductsAction(product.categoryId, product.id);

  // Robust serialization for Prisma types (Decimal, Date, etc)
  const serialize = (obj: any) => JSON.parse(JSON.stringify(obj, (key, value) => 
    typeof value === 'object' && value !== null && value.constructor.name === 'Decimal' 
      ? Number(value) 
      : value
  ));

  const serializedProduct = serialize(product);
  const serializedRelated = serialize(related);

  return (
    <div className="min-h-screen bg-slate-50">
      <ProductDetailClient 
        product={serializedProduct} 
        isVendor={isVendor} 
        relatedProducts={serializedRelated}
      />
    </div>
  );
}
