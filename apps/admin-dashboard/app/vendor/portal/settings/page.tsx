import { getVendorPortalData } from '../../../actions';
import { prisma } from '@coffeeshop/database';
import VendorSettingsClient from './VendorSettingsClient';

export const dynamic = 'force-dynamic';

export default async function VendorSettingsPage() {
  const portalData = await getVendorPortalData();
  const [mktCategories, globalUnits] = await Promise.all([
    (prisma as any).mktCategory.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
    prisma.globalUnit.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement ou profil non trouvé...</div>;

  return <VendorSettingsClient 
    portalData={JSON.parse(JSON.stringify(portalData))} 
    mktCategories={JSON.parse(JSON.stringify(mktCategories))} 
    globalUnits={JSON.parse(JSON.stringify(globalUnits))} 
  />;
}
