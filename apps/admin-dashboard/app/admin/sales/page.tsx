import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import SalesClient from './SalesClient';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const store = await getStore();
  if (!store) return <div className="page-content">Aucun store configuré.</div>;

  const sales = await prisma.sale.findMany({
    where: { storeId: store.id },
    include: { barista: true, takenBy: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const serializedSales = sales.map((s: any) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    total: Number(s.total),
    totalHt: Number(s.total) / 1.19, // Approximation d'affichage HT
    totalTax: Number(s.total) - (Number(s.total) / 1.19),
    tableName: s.tableName || 'Directe',
    isFiscal: s.isFiscal || false,
    fiscalNumber: s.fiscalNumber || null,
    isVoid: s.isVoid || false,
    terminalId: s.terminalId || null,
    hash: s.hash || null,
    consumeType: s.consumeType || 'DINE_IN',
    barista: { name: s.barista?.name || 'Inconnu' },
    takenBy: { name: s.takenBy?.name || 'Inconnu' },
    items: s.items.map((i: any) => ({ 
      productId: i.productId,
      product: { name: i.product?.name || 'Produit Inconnu' },
      quantity: Number(i.quantity), 
      price: Number(i.price),
      taxRate: Number(i.product?.taxRate || 0.19)
    }))
  }));

  return <SalesClient initialSales={serializedSales} storeName={store.name} />;
}
