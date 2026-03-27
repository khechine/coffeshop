import { getVendorPortalData, getMarketplaceData } from '../../../actions';
import { prisma } from '@coffeeshop/database';
import VendorCatalogClient from './VendorCatalogClient';

export const dynamic = 'force-dynamic';

export default async function VendorCatalogPage() {
  const portalData = await getVendorPortalData();
  const { categories } = await getMarketplaceData();
  const globalUnits = await prisma.globalUnit.findMany({ orderBy: { name: 'asc' } });

  return (
    <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Mon Catalogue Produits</h1>
            <p style={{ margin: '4px 0 0', color: '#64748B' }}>Ajoutez et gérez vos produits sur le Marketplace</p>
          </div>
        </div>

        <VendorCatalogClient initialProducts={portalData?.products || []} categories={categories} globalUnits={globalUnits} />
      </div>
    </div>
  );
}
