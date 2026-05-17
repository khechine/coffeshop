import React from 'react';
import { getVendorPortalData } from '../../../actions';
import VendorProductsClient from './VendorProductsClient';

export const dynamic = 'force-dynamic';

export default async function MobileVendorProductsPage() {
  let vendorData = null;
  try {
    vendorData = await getVendorPortalData();
  } catch (error) {}

  if (!vendorData) return null;

  const products = vendorData.vendor?.products || [];

  return <VendorProductsClient initialProducts={products} />;
}
