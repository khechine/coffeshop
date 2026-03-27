import { getVendorPortalData } from '../../../actions';
import { prisma } from '@coffeeshop/database';
import VendorSettingsClient from './VendorSettingsClient';

export const dynamic = 'force-dynamic';

export default async function VendorSettingsPage() {
  const portalData = await getVendorPortalData();
  const [activityPoles, globalUnits] = await Promise.all([
    prisma.activityPole.findMany({ orderBy: { name: 'asc' } }),
    prisma.globalUnit.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement ou profil non trouvé...</div>;

  return <VendorSettingsClient portalData={portalData} activityPoles={activityPoles} globalUnits={globalUnits} />;
}
