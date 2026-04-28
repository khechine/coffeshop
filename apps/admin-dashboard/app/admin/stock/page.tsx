import { prisma } from '@coffeeshop/database';
import StockClient from './StockClient';
import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function StockManagement() {
  const store = await getStore();
  if (!store) return null;

  const stockItems = await prisma.stockItem.findMany({
    where: { storeId: store.id },
    include: { preferredVendor: true, unit: true },
    orderBy: { quantity: 'asc' },
  });
  const customSuppliers = await prisma.supplier.findMany({ 
    where: { 
      OR: [
        { orders: { some: { storeId: store.id } } },
        { stockItems: { some: { storeId: store.id } } }
      ]
    },
    orderBy: { name: 'asc' } 
  });
  const marketplaceVendors: any[] = [];
  const globalUnits = await prisma.globalUnit.findMany({ orderBy: { name: 'asc' } });
  const critical = stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold));
  const inventoryValue = stockItems.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.cost || 0)), 0);

  return (
    <div className="page-content">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0F172A' }}>
          Matières Premières &amp; Stock
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
          Gérez vos stocks. Les déductions sont automatiques à chaque vente de la caisse POS.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '22px', borderRadius: '20px', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', boxShadow: '0 8px 20px rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Articles OK</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{stockItems.length - critical.length}</div>
        </div>
        <div style={{ padding: '22px', borderRadius: '20px', background: critical.length > 0 ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', boxShadow: `0 8px 20px ${critical.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En Alerte</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{critical.length}</div>
        </div>
        <div style={{ padding: '22px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', boxShadow: '0 8px 20px rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Articles</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{stockItems.length}</div>
        </div>
        <div style={{ padding: '22px', borderRadius: '20px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valeur Stock</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{inventoryValue.toFixed(3)} <span style={{ fontSize: '14px', opacity: 0.8 }}>DT</span></div>
        </div>
      </div>

      <StockClient 
        stockItems={stockItems as any} 
        vendors={marketplaceVendors as any} 
        suppliers={customSuppliers as any}
        globalUnits={globalUnits as any}
      />
    </div>
  );
}
