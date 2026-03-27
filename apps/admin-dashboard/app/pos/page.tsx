import { prisma } from '@coffeeshop/database';
import { getStore } from '../actions';
import POSClient from './POSClient';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const store = await getStore();
  if (!store) return <div>Boutique non trouvée</div>;
  
  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: { category: true }
  });

  const baristas = await prisma.user.findMany({
    where: { 
      storeId: store.id,
      role: { in: ['CASHIER', 'STORE_OWNER'] }
    },
    select: { id: true, name: true, role: true, pinCode: true, defaultPosMode: true }
  });

  const dailySales = await prisma.sale.findMany({
    where: { 
      storeId: store.id,
      createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
    },
    include: { items: true, barista: true, takenBy: true },
    orderBy: { createdAt: 'desc' }
  });

  const tables = await prisma.storeTable.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'asc' }
  });

  // Transform Decimals to numbers for client-side use
  const serializedProducts = (products as any[]).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    category: p.category.name
  }));

  const serializedSales = (dailySales as any[]).map((s: any) => ({
    id: s.id,
    total: Number(s.total),
    table: s.tableName || 'Directe',
    cashier: s.barista?.name || 'Inconnu',
    takenBy: (s as any).takenBy?.name || s.barista?.name || 'Inconnu',
    takenById: (s as any).takenById || s.baristaId,
    cashierId: s.baristaId,
    time: new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    items: s.items.map((i: any) => ({ name: i.name, quantity: Number(i.quantity), price: Number(i.price) }))
  }));
  
  return (
    <POSClient 
      storeId={store.id}
      storeName={store?.name || 'CoffeeSaaS POS'} 
      initialProducts={serializedProducts} 
      initialBaristas={baristas as any} 
      initialSales={serializedSales}
      initialTables={tables}
    />
  );
}
