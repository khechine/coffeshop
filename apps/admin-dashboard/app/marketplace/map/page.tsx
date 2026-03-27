import { prisma } from '@coffeeshop/database';
import MarketplaceMapClient from './MarketplaceMapClient';

export const dynamic = 'force-dynamic';

export default async function MarketplaceMapPage() {
  const store = await prisma.store.findFirst();
  const vendors = await prisma.vendorProfile.findMany({
     where: { status: 'ACTIVE' },
     include: { categories: true }
  });

  const categories = await prisma.marketplaceCategory.findMany();

  const mapData = {
    store: {
      id: store?.id,
      name: store?.name,
      lat: store?.lat || 36.83,
      lng: store?.lng || 10.22
    },
    vendors: vendors.map(v => ({
      id: v.id,
      name: v.companyName,
      lat: Number(v.lat) || 36.80,
      lng: Number(v.lng) || 10.18,
      categories: v.categories.map(c => c.name)
    })),
    categories: categories.map(c => ({ id: c.id, name: c.name }))
  };

  return (
    <div style={{ height: 'calc(100vh - 73px)', display: 'flex', flexDirection: 'column' }}>
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
        crossOrigin="" 
      />
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>Logistique Marketplace</h1>
          <p style={{ margin: '4px 0 0', color: '#64748B' }}>Position géographique des fournisseurs et de votre café</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4F46E5' }}></div>
             <span style={{ fontSize: '14px', fontWeight: 600 }}>Votre Café</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }}></div>
             <span style={{ fontSize: '14px', fontWeight: 600 }}>Fournisseurs</span>
          </div>
        </div>
      </div>
      
      <MarketplaceMapClient data={mapData} />
    </div>
  );
}
