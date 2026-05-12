import React from 'react';
import { getMarketplaceProductAction, getMarketplaceBundleAction, getRelatedProductsAction, getUser } from '../../../actions';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ isBundle?: string }>;
}) {
  const { id } = await params;
  const { isBundle } = await searchParams;

  let product: any = null;
  if (isBundle === 'true') {
    product = await getMarketplaceBundleAction(id);
    if (product) {
       // Adapt bundle structure to match product detail expectations
       product.isBundle = true;
       // Bundles don't have a categoryId directly in schema usually, or it's shared
       // We can use a default or first item's category
       product.categoryId = product.items?.[0]?.product?.categoryId;
    }
  } else {
    product = await getMarketplaceProductAction(id);
  }

  const user = await getUser();
  const isVendor = user?.role === 'VENDOR';

  if (!product) {
    notFound();
  }

  // Fetch related products
  const related = await getRelatedProductsAction(product.categoryId || 'unknown', product.id);

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
