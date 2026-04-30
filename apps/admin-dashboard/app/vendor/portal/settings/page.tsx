import { getVendorPortalData } from '../../../actions';
import { prisma } from '@coffeeshop/database';
import VendorSettingsClient from './VendorSettingsClient';
import { AlertCircle } from 'lucide-react';

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
    console.error("CRITICAL ERROR IN VENDOR SETTINGS PAGE:", error);
    // Log the actual stack trace to the console (accessible in terminal)
    if (error.stack) console.error(error.stack);
    
    return (
      <div className="p-10 bg-rose-50 border border-rose-200 rounded-[40px] max-w-2xl mx-auto mt-20 shadow-2xl">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
           <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Erreur système inattendue</h1>
        <p className="text-slate-500 mb-6 font-medium">Une erreur est survenue lors de la préparation de votre profil. Nos équipes ont été notifiées.</p>
        <div className="bg-white p-6 rounded-2xl border border-rose-100 mb-8">
          <code className="text-[10px] text-rose-500 font-mono break-all whitespace-pre-wrap">{error.message}</code>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-600/20">Réessayer</button>
          <a href="/vendor/portal" className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm">Retour au portail</a>
        </div>
      </div>
    );
  }
}
