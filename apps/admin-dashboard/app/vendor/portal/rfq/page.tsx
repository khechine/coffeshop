import { getMarketplaceRFQs, getVendorProfile } from '../../../actions';
import VendorRfqClient from './VendorRfqClient';
import { redirect } from 'next/navigation';

export default async function VendorRfqPage() {
  const vendor = await getVendorProfile();
  if (!vendor) {
    redirect('/login');
  }

  const rfqs = await getMarketplaceRFQs(vendor.id);

  return (
    <VendorRfqClient rfqs={rfqs} vendorId={vendor.id} />
  );
}
