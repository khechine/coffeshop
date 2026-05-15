import React from 'react';
import { Package, Search } from 'lucide-react';
import { getVendorPortalData } from '../../../actions';
import { sanitizeUrl } from '../../../lib/imageUtils';

export const dynamic = 'force-dynamic';

export default async function MobileVendorProductsPage() {
  let vendorData = null;
  try {
    vendorData = await getVendorPortalData();
  } catch (error) {}

  if (!vendorData) return null;

  const products = vendorData.vendor?.products || [];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>Catalogue</h1>
         <span style={{ fontSize: '12px', fontWeight: 800, color: '#6B7280', background: '#F3F4F6', padding: '4px 10px', borderRadius: '100px' }}>
            {products.length} articles
         </span>
      </div>
      
      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un produit..." 
          style={{ 
            width: '100%', padding: '16px 16px 16px 52px', 
            borderRadius: '16px', border: '1px solid #E5E7EB', 
            fontSize: '16px', outline: 'none', background: '#fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
          }}
        />
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontWeight: 700 }}>Votre catalogue est vide.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {products.map((p: any) => (
            <div key={p.id} style={{ background: '#fff', borderRadius: '20px', padding: '12px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#F3F4F6', overflow: 'hidden', flexShrink: 0 }}>
                {p.image ? (
                  <img src={sanitizeUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} />
                ) : (
                  <Package size={24} style={{ margin: '18px auto', color: '#9CA3AF' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>{p.name}</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                   <span style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{Number(p.price).toFixed(2)} DT</span>
                   <span style={{ fontSize: '12px', color: '#6B7280' }}>/ {p.unit}</span>
                </div>
              </div>
              <div>
                 {/* Stock Toggle Placeholder */}
                 <div style={{ width: '40px', height: '24px', background: p.isOutOfStock ? '#E5E7EB' : '#10B981', borderRadius: '12px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '2px', left: p.isOutOfStock ? '2px' : '18px', width: '20px', height: '20px', background: '#fff', borderRadius: '10px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
