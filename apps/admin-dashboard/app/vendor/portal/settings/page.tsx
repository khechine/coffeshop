import { getVendorPortalData } from '../../../actions';
import { prisma } from '@coffeeshop/database';
import VendorSettingsClient from './VendorSettingsClient';

export const dynamic = 'force-dynamic';

export default async function VendorSettingsPage() {
  try {
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
  } catch (error: any) {
    console.error("ERROR IN VENDOR SETTINGS PAGE:", error);
    return (
      <div className="p-10 bg-rose-50 border border-rose-200 rounded-3xl">
        <h1 className="text-xl font-black text-rose-600 mb-4">Erreur de chargement</h1>
        <pre className="text-xs text-rose-500 overflow-auto">{error.message}</pre>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold">Réessayer</button>
      </div>
    );
  }
}
