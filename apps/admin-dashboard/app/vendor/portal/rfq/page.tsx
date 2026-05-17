import { getMarketplaceRFQs, getVendorProfile, getVendorInquiriesAction } from '../../../actions';
import VendorRfqClient from './VendorRfqClient';
import { redirect } from 'next/navigation';

export default async function VendorRfqPage() {
  const vendor = await getVendorProfile();
  if (!vendor) {
    redirect('/login');
  }

  const [rfqs, inquiries] = await Promise.all([
    getMarketplaceRFQs(vendor.id),
    getVendorInquiriesAction()
  ]);

  return (
    <VendorRfqClient rfqs={rfqs} inquiries={inquiries} vendorId={vendor.id} />
  );
}
