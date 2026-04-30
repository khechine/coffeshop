import { getMarketplaceData, getStore } from '../actions';
import { ShoppingCart, Package, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

import MarketplaceClient from './MarketplaceClient';

export default async function MarketplacePage() {
  const store = await getStore();
  const hasMarketplace = store && (store as any)?.hasMarketplace === true;
  const data = await getMarketplaceData(
    store?.lat ? Number(store.lat) : undefined,
    store?.lng ? Number(store.lng) : undefined
  );

  if (!hasMarketplace) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card" style={{ maxWidth: 500, padding: '48px', textAlign: 'center', borderRadius: '24px' }}>
           <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
              <Lock size={32} />
           </div>
           <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '16px' }}>Accès Restreint</h1>
           <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              Votre forfait actuel n'inclut pas l'accès au <strong>Marketplace B2B</strong>. 
              Veuillez contacter l'administrateur de la plateforme pour mettre à jour votre offre.
           </p>
           <a href="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              Retour au Dashboard
           </a>
        </div>
      </div>
    );
  }

  return (
    <MarketplaceClient 
      initialData={data} 
      storeCoords={store?.lat && store?.lng ? { lat: Number(store.lat), lng: Number(store.lng) } : undefined} 
    />
  );
}
