import { prisma } from '@coffeeshop/database';
import { Layers, CheckCircle, AlertTriangle, Package } from 'lucide-react';
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

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Matières Premières &amp; Stock</h1>
          <p>Gérez vos stocks. Les déductions sont automatiques à chaque vente de la caisse POS.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '24px' }}>
        <div className="kpi-card green">
          <div className="kpi-icon green"><CheckCircle size={22} /></div>
          <div><div className="kpi-label">Articles OK</div><div className="kpi-value">{stockItems.length - critical.length}</div></div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-icon red"><AlertTriangle size={22} /></div>
          <div><div className="kpi-label">En Alerte</div><div className="kpi-value">{critical.length}</div></div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Layers size={22} /></div>
          <div><div className="kpi-label">Total Articles</div><div className="kpi-value">{stockItems.length}</div></div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon orange"><Package size={22} /></div>
          <div><div className="kpi-label">Fournisseurs</div><div className="kpi-value">{marketplaceVendors.length + customSuppliers.length}</div></div>
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
