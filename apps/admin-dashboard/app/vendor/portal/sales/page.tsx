import { getVendorPortalData } from '../../../actions';
import SalesDashboardClient from './SalesDashboardClient';

export const dynamic = 'force-dynamic';

export default async function VendorSalesPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) return <div className="p-10 text-slate-500">Chargement des données analytiques...</div>;

  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Tableau de Bord des Ventes</h1>
          <p className="text-slate-500 font-medium mt-2">Analysez vos performances et optimisez votre catalogue Marketplace</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mise à jour en temps réel</span>
        </div>
      </div>

      <SalesDashboardClient 
        orders={JSON.parse(JSON.stringify(portalData.orders || []))} 
        products={JSON.parse(JSON.stringify(portalData.products || []))}
        bundles={JSON.parse(JSON.stringify(portalData.bundles || []))}
      />
    </div>
  );
}
