const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TARGET = 'cmn8ppakp000170hvqsgatjfi'; // store 2: Café Zohra

async function main() {
  const store = await prisma.store.findUnique({ where: { id: TARGET } });
  if (!store) { console.log('Store introuvable'); return; }
  console.log('--- Ajout d\'ingrédients et recettes pour:', store.name, '---');

  // 1. Unités (GlobalUnit)
  const unitKg = await prisma.globalUnit.upsert({ where: { name: 'KG' }, update: {}, create: { name: 'KG' }});
  const unitG = await prisma.globalUnit.upsert({ where: { name: 'G' }, update: {}, create: { name: 'G' }});
  const unitL = await prisma.globalUnit.upsert({ where: { name: 'L' }, update: {}, create: { name: 'L' }});
  const unitU = await prisma.globalUnit.upsert({ where: { name: 'U' }, update: {}, create: { name: 'U' }});


  // 2. Fournisseurs
  const suppChicha = await prisma.supplier.create({ data: { name: 'La Maison de la Chicha', phone: '21 000 111', storeId: TARGET } });
  const suppEpicerie = await prisma.supplier.create({ data: { name: 'Grossiste Alimentaire Ben Ali', phone: '22 000 222', storeId: TARGET } });

  // 3. Stock Items (Matière première)
  const stockData = [
    // Chicha
    { name: 'Jurac (Tabac)', unitId: unitKg.id, cost: 25.0, supplierId: suppChicha.id, qty: 10 },
    { name: 'Tabac Fraise', unitId: unitKg.id, cost: 35.0, supplierId: suppChicha.id, qty: 5 },
    { name: 'Tabac Menthe', unitId: unitKg.id, cost: 35.0, supplierId: suppChicha.id, qty: 5 },
    { name: 'Tabac Pomme', unitId: unitKg.id, cost: 35.0, supplierId: suppChicha.id, qty: 5 },
    { name: 'Tabac Fekher', unitId: unitKg.id, cost: 50.0, supplierId: suppChicha.id, qty: 3 },
    { name: 'Charbon Actif', unitId: unitKg.id, cost: 5.0, supplierId: suppChicha.id, qty: 100 },
    { name: 'Aluminium Chicha', unitId: unitU.id, cost: 0.1, supplierId: suppChicha.id, qty: 500 },
    // Boissons
    { name: 'Café en Grains', unitId: unitKg.id, cost: 30.0, supplierId: suppEpicerie.id, qty: 20 },
    { name: 'Lait', unitId: unitL.id, cost: 1.5, supplierId: suppEpicerie.id, qty: 50 },
    { name: 'Sucre en morceaux', unitId: unitKg.id, cost: 2.0, supplierId: suppEpicerie.id, qty: 10 },
    { name: 'Thé Vert (Vrac)', unitId: unitKg.id, cost: 15.0, supplierId: suppEpicerie.id, qty: 5 },
    { name: 'Thé Rouge (Vrac)', unitId: unitKg.id, cost: 18.0, supplierId: suppEpicerie.id, qty: 5 },
    { name: 'Citrons Frais', unitId: unitKg.id, cost: 3.5, supplierId: suppEpicerie.id, qty: 15 },
    { name: 'Oranges Fraiches', unitId: unitKg.id, cost: 2.5, supplierId: suppEpicerie.id, qty: 20 },
  ];

  const stockMap = {};
  for (const s of stockData) {
    const item = await prisma.stockItem.create({
      data: {
        name: s.name, unitId: s.unitId, cost: s.cost, quantity: s.qty, minThreshold: 5,
        storeId: TARGET, preferredSupplierId: s.supplierId
      }
    });
    stockMap[s.name] = item;
    console.log(`Stock créé: ${item.name}`);
  }

  // 4. Recettes (Liaison Produits -> Ingredients)
  const products = await prisma.product.findMany({ where: { storeId: TARGET } });
  
  const recMap = {
    'Chicha Jirac': [ { stock: 'Jurac (Tabac)', qty: 0.05 }, { stock: 'Charbon Actif', qty: 0.1 }, { stock: 'Aluminium Chicha', qty: 1 } ],
    'Chicha Fraise': [ { stock: 'Tabac Fraise', qty: 0.05 }, { stock: 'Charbon Actif', qty: 0.1 }, { stock: 'Aluminium Chicha', qty: 1 } ],
    'Chicha Menthe': [ { stock: 'Tabac Menthe', qty: 0.05 }, { stock: 'Charbon Actif', qty: 0.1 }, { stock: 'Aluminium Chicha', qty: 1 } ],
    'Chicha Pomme': [ { stock: 'Tabac Pomme', qty: 0.05 }, { stock: 'Charbon Actif', qty: 0.1 }, { stock: 'Aluminium Chicha', qty: 1 } ],
    'Chicha Fekher': [ { stock: 'Tabac Fekher', qty: 0.08 }, { stock: 'Charbon Actif', qty: 0.1 }, { stock: 'Aluminium Chicha', qty: 2 } ],
    'Espresso': [ { stock: 'Café en Grains', qty: 0.014 }, { stock: 'Sucre en morceaux', qty: 0.005 } ],
    'Cappuccino': [ { stock: 'Café en Grains', qty: 0.014 }, { stock: 'Lait', qty: 0.15 }, { stock: 'Sucre en morceaux', qty: 0.010 } ],
    'Latte': [ { stock: 'Café en Grains', qty: 0.014 }, { stock: 'Lait', qty: 0.25 }, { stock: 'Sucre en morceaux', qty: 0.010 } ],
    'Thé Vert': [ { stock: 'Thé Vert (Vrac)', qty: 0.005 }, { stock: 'Sucre en morceaux', qty: 0.010 } ],
    'Thé Rouge': [ { stock: 'Thé Rouge (Vrac)', qty: 0.005 }, { stock: 'Sucre en morceaux', qty: 0.010 } ],
    'Citronnade': [ { stock: 'Citrons Frais', qty: 0.2 }, { stock: 'Sucre en morceaux', qty: 0.050 } ],
    'Jus d\'Orange': [ { stock: 'Oranges Fraiches', qty: 0.3 } ],
  };

  for (const p of products) {
    const ingredients = recMap[p.name];
    if (ingredients) {
      // Effacer l'ancienne recette si besoin
      await prisma.recipeItem.deleteMany({ where: { productId: p.id } });
      for (const ing of ingredients) {
        if (!stockMap[ing.stock]) continue;
        await prisma.recipeItem.create({
          data: {
            productId: p.id,
            stockItemId: stockMap[ing.stock].id,
            quantity: ing.qty
          }
        });
      }
      console.log(`Recette définie pour le produit: ${p.name}`);
    }
  }

  // 5. Créer une commande fournisseur (SupplierOrder)
  const orderChicha = await prisma.supplierOrder.create({
    data: {
      status: 'DELIVERED',
      total: 755.0,
      storeId: TARGET,
      supplierId: suppChicha.id,
      items: {
        create: [
          { stockItemId: stockMap['Jurac (Tabac)'].id, name: 'Jurac (Tabac)', quantity: 10, price: 25.0 },
          { stockItemId: stockMap['Tabac Fraise'].id, name: 'Tabac Fraise', quantity: 5, price: 35.0 },
          { stockItemId: stockMap['Charbon Actif'].id, name: 'Charbon Actif', quantity: 100, price: 5.0 },
        ]
      }
    }
  });

  const orderEpicerie = await prisma.supplierOrder.create({
    data: {
      status: 'DELIVERED',
      total: 825.0,
      storeId: TARGET,
      supplierId: suppEpicerie.id,
      items: {
        create: [
          { stockItemId: stockMap['Café en Grains'].id, name: 'Café en Grains', quantity: 20, price: 30.0 },
          { stockItemId: stockMap['Lait'].id, name: 'Lait', quantity: 50, price: 1.5 },
          { stockItemId: stockMap['Oranges Fraiches'].id, name: 'Oranges Fraiches', quantity: 20, price: 2.5 },
          { stockItemId: stockMap['Citrons Frais'].id, name: 'Citrons Frais', quantity: 15, price: 3.5 },
        ]
      }
    }
  });

  console.log(`Commandes créées! ID: ${orderChicha.id}, ${orderEpicerie.id}`);
  console.log('--- Terminé ! ---');
}

main().then(() => prisma.$disconnect()).catch(console.error);
