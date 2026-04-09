import { getVendorPortalData, getMarketplaceBenchmarkData, getMarketplaceCategoryTree } from '../../../actions';
import { prisma } from '@coffeeshop/database';
import VendorCatalogClient from './VendorCatalogClient';

export const dynamic = 'force-dynamic';

export default async function VendorCatalogPage() {
  const portalData = await getVendorPortalData();
  const [globalUnits, categoryTree, benchmarkData] = await Promise.all([
    prisma.globalUnit.findMany({ orderBy: { name: 'asc' } }),
    getMarketplaceCategoryTree(),
    portalData ? getMarketplaceBenchmarkData(portalData.id) : Promise.resolve([]),
  ]);

  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Catalogue Marketplace</h1>
          <p className="text-slate-500 font-medium mt-2">Ajoutez et gérez vos produits visibles par les cafés</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-none">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{portalData?.products.length || 0} produits publiés</span>
        </div>
      </div>

      <VendorCatalogClient
        initialProducts={JSON.parse(JSON.stringify(portalData?.products || []))}
        categoryTree={JSON.parse(JSON.stringify(categoryTree))}
        globalUnits={JSON.parse(JSON.stringify(globalUnits))}
        benchmarkData={JSON.parse(JSON.stringify(benchmarkData))}
        vendorId={portalData?.id || ''}
        mktSectors={JSON.parse(JSON.stringify(portalData?.mktSectors || []))}
      />
    </div>
  );
}
