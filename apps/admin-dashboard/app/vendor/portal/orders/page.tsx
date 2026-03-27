import { getVendorPortalData } from '../../../actions';
import VendorOrderListClient from './VendorOrderListClient';

export const dynamic = 'force-dynamic';

export default async function VendorOrdersPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Commandes Marketplace Reçues</h1>
        <p style={{ margin: '4px 0 0', color: '#64748B' }}>Suivez et gérez les livraisons pour les cafés</p>
      </div>

      <VendorOrderListClient orders={portalData.orders} />
    </div>
  );
}
