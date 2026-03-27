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
    total: Number(s.total),
    table: s.tableName || 'Directe',
    cashier: s.barista?.name || 'Inconnu',
    takenBy: s.takenBy?.name || 'Inconnu',
    date: new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    items: s.items.map((i: any) => ({ 
      name: i.product?.name || 'Produit Inconnu', 
      quantity: Number(i.quantity), 
      price: Number(i.price) 
    }))
  }));

  return <SalesClient initialSales={serializedSales} storeName={store.name} />;
}
