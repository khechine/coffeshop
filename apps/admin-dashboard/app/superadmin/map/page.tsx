import { prisma } from '@coffeeshop/database';
import MarketplaceMapClient from '../../marketplace/map/MarketplaceMapClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminMapPage() {
  const stores = await prisma.store.findMany();
  const vendors = await prisma.vendorProfile.findMany({ include: { vendorProducts: true } });
  const couriers = await prisma.courierProfile.findMany();
  const categories = await prisma.mktCategory.findMany({ where: { status: 'ACTIVE' } });

  const vendorProducts = await prisma.vendorProduct.findMany({
    include: { vendor: true, productStandard: true }
  });

  const mapData = {
    categories: categories.map((c: any) => ({ id: c.id, name: c.name })),
    store: {
      id: stores[0]?.id,
      name: stores[0]?.name || 'Siège',
      lat: stores[0]?.lat || 36.83,
      lng: stores[0]?.lng || 10.22
    },
    vendors: vendors.map(v => ({
      id: v.id,
      name: v.companyName,
      lat: v.lat || 36.80,
      lng: v.lng || 10.18,
      categories: [] as string[],
      type: 'VENDOR'
    })),
    extraPoints: [
      ...stores.map(s => ({
        id: s.id,
        name: s.name,
        lat: s.lat || 36.83,
        lng: s.lng || 10.22,
        type: 'STORE'
      })),
      ...couriers.map(c => ({
        id: c.id,
        name: `Livreur ${c.vehicleType}`,
        lat: c.currentLat || 36.81,
        lng: c.currentLng || 10.19,
        type: 'COURIER'
      }))
    ]
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
       <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Super-Carte Logistique</h1>
          <p style={{ margin: '6px 0 0', color: '#64748B' }}>Surveillance globale de tous les acteurs : Cafés, Vendeurs et Livreurs.</p>
        </div>
      </div>
      <MarketplaceMapClient data={mapData} />
    </div>
  );
}
