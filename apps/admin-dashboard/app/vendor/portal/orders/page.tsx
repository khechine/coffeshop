import { getVendorPortalData } from '../../../actions';
import VendorOrderListClient from './VendorOrderListClient';

export const dynamic = 'force-dynamic';

export default async function VendorOrdersPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement...</div>;

  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Commandes Marketplace Reçues</h1>
          <p className="text-slate-500 font-medium mt-2">Suivez et gérez les livraisons pour les cafés partenaires</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-none">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{portalData.orders.length} commandes au total</span>
        </div>
      </div>

      <VendorOrderListClient orders={JSON.parse(JSON.stringify(portalData.orders))} />
    </div>
  );
}
