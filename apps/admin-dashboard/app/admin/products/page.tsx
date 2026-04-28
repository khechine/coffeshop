import { prisma } from '@coffeeshop/database';
import { Package, Tag, BookOpen, TrendingUp } from 'lucide-react';
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

  const withRecipe = products.filter(p => p.recipe.length > 0).length;
  const avgPrice = products.length > 0
    ? products.reduce((s, p) => s + Number(p.price), 0) / products.length
    : 0;

  return (
    <div className="page-content">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0F172A' }}>
          Catalogue & Recettes
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
          Gérez vos produits POS. Les matières premières sont déduites automatiquement à chaque vente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '22px', borderRadius: '20px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produits</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{products.length}</div>
        </div>
        <div style={{ padding: '22px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', boxShadow: '0 8px 20px rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catégories</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{categories.length}</div>
        </div>
        <div style={{ padding: '22px', borderRadius: '20px', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', boxShadow: '0 8px 20px rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avec Recette</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{withRecipe}</div>
        </div>
        <div style={{ padding: '22px', borderRadius: '20px', background: 'linear-gradient(135deg, #EC4899, #DB2777)', color: '#fff', boxShadow: '0 8px 20px rgba(236,72,153,0.2)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prix Moyen</div>
          <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>{avgPrice.toFixed(3)} <span style={{ fontSize: '14px', opacity: 0.8 }}>DT</span></div>
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
