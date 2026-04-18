import { prisma } from '@coffeeshop/database';
import { getStore } from '../actions';
import PremiumPOSClient from './PremiumPOSClient';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const store = await getStore();
  if (!store) return <div>Boutique non trouvée</div>;
  
  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: { category: true }
  });

  const categories = await prisma.category.findMany({
    where: { 
      OR: [
        { storeId: store.id },
        { storeId: null } // Global categories
      ]
    }
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

  const terminals = await prisma.posTerminal.findMany({
    where: { storeId: store.id, status: 'ACTIVE' }
  });

  // Transform Decimals to numbers for client-side use & Inject Premium Demo Images
  const serializedProducts = (products as any[]).map((p: any) => {
    let img = p.image;
    const name = p.name.toLowerCase();
    
    // Demo Image Injection Logic
    if (!img) {
      if (name.includes('café') || name.includes('expresso') || name.includes('cappuccino')) img = '/pos/cappuccino.png';
      else if (name.includes('croissant') || name.includes('pain')) img = '/pos/croissant.png';
      else if (name.includes('toast') || name.includes('avocat')) img = '/pos/toast.png';
    }

    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category?.name || 'Divers',
      image: img
    };
  });

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
    <PremiumPOSClient 
      storeId={store.id}
      storeName={store?.name || 'CoffeeSaaS POS'} 
      planName={store?.plan?.name || 'STARTER'}
      isFiscalEnabled={store.isFiscalEnabled}
      initialProducts={serializedProducts} 
      initialCategories={categories}
      initialBaristas={baristas as any} 
      initialSales={serializedSales}
      initialTables={tables}
      terminals={terminals}
      loyaltyEarnRate={Number(store.loyaltyEarnRate || 1)}
      loyaltyRedeemRate={Number(store.loyaltyRedeemRate || 100)}
    />
  );
}
