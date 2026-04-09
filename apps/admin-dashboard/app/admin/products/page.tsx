import { prisma } from '@coffeeshop/database';
import { Package, Plus, BookOpen, Tag } from 'lucide-react';
import ProductsClient from './ProductsClient';

import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function ProductsManagement() {
  const store = await getStore();
  const products = await prisma.product.findMany({
    where: { storeId: store?.id },
    include: { category: true, recipe: { include: { stockItem: true } } },
    orderBy: { name: 'asc' },
  });

  const categories = await prisma.category.findMany({ 
    where: { storeId: store?.id },
    orderBy: { name: 'asc' } 
  });
  const stockItems = await prisma.stockItem.findMany({
    where: { storeId: store?.id },
    orderBy: { name: 'asc' },
  });
  const globalUnits = await prisma.globalUnit.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Catalogue &amp; Recettes</h1>
          <p>Gérez vos produits POS. Les matières premières sont déduites automatiquement à chaque vente.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '24px' }}>
        <div className="kpi-card orange">
          <div className="kpi-icon orange"><Package size={22} /></div>
          <div>
            <div className="kpi-label">Produits</div>
            <div className="kpi-value">{products.length}</div>
          </div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Tag size={22} /></div>
          <div>
            <div className="kpi-label">Catégories</div>
            <div className="kpi-value">{categories.length}</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><BookOpen size={22} /></div>
          <div>
            <div className="kpi-label">Avec Recette</div>
            <div className="kpi-value">{products.filter(p => p.recipe.length > 0).length}</div>
          </div>
        </div>
      </div>

      <ProductsClient
        products={JSON.parse(JSON.stringify(products))}
        categories={categories}
        stockItems={JSON.parse(JSON.stringify(stockItems))}
        globalUnits={JSON.parse(JSON.stringify(globalUnits))}
      />
    </div>
  );
}
