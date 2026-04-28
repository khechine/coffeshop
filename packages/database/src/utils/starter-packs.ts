import { PrismaClient } from '@prisma/client';

export async function seedTunisianStarterPack(prisma: PrismaClient, storeId: string) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');

  // 1. Initialiser les Unités
  const unitsMap: Record<string, string> = {};
  const units = ['kg', 'g', 'ml', 'litre', 'pièce'];
  for (const u of units) {
    const unit = await prisma.globalUnit.upsert({ where: { name: u }, update: {}, create: { name: u } });
    unitsMap[u] = unit.id;
  }

  // 2. Créer les Catégories
  const categories = [
    { name: 'CAFÉS & CHAUD', color: '#6366F1', icon: 'Coffee' },
    { name: 'THÉS & TISANES', color: '#10B981', icon: 'Coffee' },
    { name: 'VIENNOISERIES', color: '#F59E0B', icon: 'Croissant' },
    { name: 'EAUX & SODAS', color: '#3B82F6', icon: 'CupSoda' },
    { name: 'JUS & CITRONNADE', color: '#F97316', icon: 'Zap' },
    { name: 'CHICHA (NARGUILÉ)', color: '#64748B', icon: 'Ghost' },
  ];

  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.create({
      data: { name: c.name, color: c.color, icon: c.icon, storeId: store.id }
    });
    catIds[c.name] = cat.id;
  }

  // 3. Créer les Matières Premières & Emballages
  const rawMaterials = [
    { name: 'Café Grain (Mélange)', unit: 'kg', qty: 5, cost: 35 },
    { name: 'Lait Entier', unit: 'ml', qty: 12000, cost: 1.5 },
    { name: 'Sucre Blanc (Sachets)', unit: 'g', qty: 5000, cost: 2.5 },
    { name: 'Thé Vert (Moyen)', unit: 'g', qty: 1000, cost: 15 },
    { name: 'Menthe Fraîche', unit: 'g', qty: 2000, cost: 5 },
    { name: 'Citrons Frais', unit: 'kg', qty: 10, cost: 3 },
    { name: 'Tabac Pomme (Al-Fakher)', unit: 'g', qty: 1000, cost: 80 },
    { name: 'Charbon Chicha', unit: 'kg', qty: 10, cost: 12 },
    { name: 'Gobelet Carton 7oz', unit: 'pièce', qty: 1000, cost: 0.08, isPackaging: true },
    { name: 'Gobelet Carton 12oz', unit: 'pièce', qty: 500, cost: 0.12, isPackaging: true },
    { name: 'Papier Kraft (Petit)', unit: 'pièce', qty: 1000, cost: 0.05, isPackaging: true },
  ];

  const stockIds: Record<string, string> = {};
  for (const rm of rawMaterials) {
    const item = await prisma.stockItem.create({
      data: { 
        name: rm.name, 
        unitId: unitsMap[rm.unit], 
        quantity: rm.qty, 
        cost: rm.cost, 
        storeId: store.id 
      }
    });
    stockIds[rm.name] = item.id;
  }

  // 4. Créer les Produits & Recettes
  const tunisianProducts = [
    { name: 'Café Direct (Expresso)', price: 1.5, cat: 'CAFÉS & CHAUD', recipe: [
      { item: 'Café Grain (Mélange)', qty: 0.007, unit: 'kg' },
      { item: 'Sucre Blanc (Sachets)', qty: 7, unit: 'g' },
      { item: 'Gobelet Carton 7oz', qty: 1, unit: 'pièce', isPkg: true }
    ]},
    { name: 'Capucin (Petit)', price: 2.2, cat: 'CAFÉS & CHAUD', recipe: [
      { item: 'Café Grain (Mélange)', qty: 0.007, unit: 'kg' },
      { item: 'Lait Entier', qty: 40, unit: 'ml' },
      { item: 'Sucre Blanc (Sachets)', qty: 7, unit: 'g' },
      { item: 'Gobelet Carton 7oz', qty: 1, unit: 'pièce', isPkg: true }
    ]},
    { name: 'Café Crème', price: 3.5, cat: 'CAFÉS & CHAUD', recipe: [
      { item: 'Café Grain (Mélange)', qty: 0.014, unit: 'kg' },
      { item: 'Lait Entier', qty: 150, unit: 'ml' },
      { item: 'Gobelet Carton 12oz', qty: 1, unit: 'pièce', isPkg: true }
    ]},
    { name: 'Thé Vert Menthe', price: 1.8, cat: 'THÉS & TISANES', recipe: [
      { item: 'Thé Vert (Moyen)', qty: 5, unit: 'g' },
      { item: 'Menthe Fraîche', qty: 10, unit: 'g' },
      { item: 'Sucre Blanc (Sachets)', qty: 15, unit: 'g' },
      { item: 'Gobelet Carton 7oz', qty: 1, unit: 'pièce', isPkg: true }
    ]},
    { name: 'Citronnade Tunisienne', price: 4.5, cat: 'JUS & CITRONNADE', recipe: [
      { item: 'Citrons Frais', qty: 0.15, unit: 'kg' },
      { item: 'Sucre Blanc (Sachets)', qty: 50, unit: 'g' },
      { item: 'Gobelet Carton 12oz', qty: 1, unit: 'pièce', isPkg: true }
    ]},
    { name: 'Croissant Nature', price: 1.2, cat: 'VIENNOISERIES', recipe: [
      { item: 'Papier Kraft (Petit)', qty: 1, unit: 'pièce', isPkg: true }
    ]},
    { name: 'Chicha Pomme', price: 8.5, cat: 'CHICHA (NARGUILÉ)', recipe: [
      { item: 'Tabac Pomme (Al-Fakher)', qty: 25, unit: 'g' },
      { item: 'Charbon Chicha', qty: 0.3, unit: 'kg' }
    ]},
    { name: 'Eau Minérale 0.5L', price: 1.0, cat: 'EAUX & SODAS', recipe: [] },
    { name: 'Coca-Cola 0.33L', price: 2.8, cat: 'EAUX & SODAS', recipe: [] },
  ];

  for (const p of tunisianProducts) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        categoryId: catIds[p.cat],
        storeId: store.id,
        canBeTakeaway: true
      }
    });

    for (const r of p.recipe) {
      if (stockIds[r.item]) {
        await prisma.recipeItem.create({
          data: {
            productId: product.id,
            stockItemId: stockIds[r.item],
            quantity: r.qty,
            isPackaging: r.isPkg || false,
            consumeType: r.isPkg ? 'TAKEAWAY' : 'BOTH'
          }
        });
      }
    }
  }

  return { success: true, message: 'Pack Initial Tunisie installé avec succès !' };
}
