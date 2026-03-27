import { getMarketplaceData, getStore } from '../actions';
import MarketplaceClient from './MarketplaceClient';
import { ShoppingCart, Star, Zap, ChevronRight, Package, Store, MapPin, CheckCircle, Clock, Send, Plus, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const store = await getStore();
  const hasMarketplace = (store as any)?.subscription?.plan?.hasMarketplace !== false;
  const data = await getMarketplaceData();

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
    <div className="page-content" style={{ padding: 0 }}>
      {/* Premium Search Header */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
        padding: '20px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
          }}>
            <ShoppingCart size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.025em' }}>Marketplace Fournisseurs</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Trouvez les meilleurs produits pour votre établissement</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <Package size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher un produit, une marque ou un fournisseur..." 
              style={{ 
                width: '450px', 
                padding: '12px 16px 12px 42px', 
                borderRadius: '14px', 
                border: '1.5px solid #F1F5F9', 
                background: '#F8FAFC',
                fontSize: '14px', 
                fontWeight: 500,
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
          </div>
        </div>
      </div>

      <MarketplaceClient initialData={data} />
    </div>
  );
}
