const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STORE_ID = 'store_rachma_demo';
const STORE_NAME = 'Café Rachma Demo';

async function main() {
  console.log(`--- SEEDING RACHMA MODE FOR: ${STORE_NAME} ---`);

  // 1. Create or Find Plan RACHMA
  let rachmaPlan = await prisma.plan.findUnique({ where: { id: 'plan_rachma' } });
  if (!rachmaPlan) {
    rachmaPlan = await prisma.plan.create({
      data: { id: 'plan_rachma', name: 'Rachma', price: 29.99, maxStores: 1, maxProducts: 100 }
    });
  }

  // 2. Create Store
  const store = await prisma.store.upsert({
    where: { id: STORE_ID },
    update: { planId: 'plan_rachma' },
    create: {
      id: STORE_ID,
      name: STORE_NAME,
      address: 'Route de Tunis',
      city: 'Tunis',
      phone: '71000222',
      planId: 'plan_rachma'
    }
  });

  // 3. Define Categories & Products based on User mapping
  const inventory = [
    {
      category: '1. CAFÉS',
      items: [
        { name: 'Café express', price: 1.5 },
        { name: 'Café direct', price: 1.5 },
        { name: 'Café allongé', price: 1.8 },
        { name: 'Capucin', price: 2.0 },
      ]
    },
    {
      category: '2. THÉS',
      items: [
        { name: 'Thé nature', price: 1.2 },
        { name: 'Thé à la menthe', price: 1.5 },
        { name: 'Thé amande', price: 2.5 },
      ]
    },
    {
      category: '3. EAUX',
      items: [
        { name: 'Eau minérale 0.5L', price: 1.0 },
        { name: 'Eau minérale 1L', price: 1.5 },
        { name: 'Eau gazeuse', price: 1.8 },
      ]
    },
    {
      category: '4. BOISSONS FROIDES SIMPLES',
      items: [
        { name: 'Soda', price: 3.0 },
        { name: 'Jus industriel', price: 3.5 },
      ]
    },
    {
      category: '5. BIÈRE',
      items: [
        { name: 'Bière locale', price: 4.5 },
        { name: 'Bière sans alcool', price: 3.5 },
      ]
    },
    {
      category: '6. TABAC',
      items: [
        { name: 'Cigarettes', price: 10.0 },
        { name: 'Briquet', price: 2.0 },
      ]
    },
    {
      category: '7. PETITS ACCOMPAGNEMENTS',
      items: [
        { name: 'Croissant', price: 1.5 },
        { name: 'Biscuit', price: 1.0 },
        { name: 'Cake simple', price: 2.0 },
      ]
    },
    {
      category: '8. PRODUITS INVISIBLES',
      items: [
        { name: 'Café + sucre', price: 0.0 },
        { name: 'Verre d\'eau', price: 0.0 },
        { name: 'Service table', price: 0.0 },
      ]
    }
  ];

  // 4. Upsert Categories and Products
  const createdProducts = {};

  for (const catData of inventory) {
    let category = await prisma.category.findFirst({
      where: { name: catData.category, storeId: STORE_ID }
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: { name: catData.category, storeId: STORE_ID }
      });
      console.log(`+ Created Category: ${category.name}`);
    }

    for (const item of catData.items) {
      let product = await prisma.product.findFirst({
        where: { name: item.name, storeId: STORE_ID }
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: item.name,
            price: item.price,
            categoryId: category.id,
            storeId: STORE_ID
          }
        });
        console.log(`  -> Added Product: ${item.name} (${item.price} TND)`);
      } else {
        product = await prisma.product.update({
          where: { id: product.id },
          data: { price: item.price, categoryId: category.id }
        });
      }
      createdProducts[item.name] = product.id;
    }
  }

  // 4.5 SEED STOCK & RECIPES (Cups)
  console.log('🥤 Seeding Cups Stock & Recipes...');
  const smallCup = await prisma.stockItem.upsert({
    where: { id: 'stock_cup_small', storeId: STORE_ID },
    update: { quantity: 1000 },
    create: { id: 'stock_cup_small', name: 'Petit Gobelet', quantity: 1000, storeId: STORE_ID }
  });

  const largeCup = await prisma.stockItem.upsert({
    where: { id: 'stock_cup_large', storeId: STORE_ID },
    update: { quantity: 1000 },
    create: { id: 'stock_cup_large', name: 'Grand Gobelet', quantity: 1000, storeId: STORE_ID }
  });

  // Link products to recipes (Automatic deduction)
  const coffeeProducts = ['Café express', 'Café direct', 'Café allongé', 'Capucin', 'Thé nature', 'Thé à la menthe', 'Thé amande'];
  for (const prodName of coffeeProducts) {
    const productId = createdProducts[prodName];
    if (productId) {
      // Small Cup Recipe
      await prisma.recipeItem.upsert({
        where: { id: `recipe_small_${productId}` },
        update: {},
        create: {
          id: `recipe_small_${productId}`,
          productId,
          stockItemId: smallCup.id,
          quantity: 1,
          consumeType: 'TAKEAWAY_SMALL'
        }
      });
      // Large Cup Recipe
      await prisma.recipeItem.upsert({
        where: { id: `recipe_large_${productId}` },
        update: {},
        create: {
          id: `recipe_large_${productId}`,
          productId,
          stockItemId: largeCup.id,
          quantity: 1,
          consumeType: 'TAKEAWAY_LARGE'
        }
      });
    }
  }

  const bcrypt = require('bcryptjs');
  const ownerPassword = await bcrypt.hash('rachma123', 10);

  // 5. Create Owner
  const ownerEmail = 'patron@rachma.tn';
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      password: ownerPassword,
      name: 'Patron Rachma',
      role: 'STORE_OWNER',
      storeId: STORE_ID
    }
  });

  // 6. Set a password manually or verify
  // NOTE: Password must be hashed in a full system, but here we just assign storeId
  
  // 7. Create Baristas
  await prisma.barista.upsert({
    where: { pinCode: '1111' },
    update: { storeId: STORE_ID },
    create: {
      name: 'Serveur 1',
      pinCode: '1111',
      storeId: STORE_ID,
      defaultPosMode: 'simplistic'
    }
  });

  await prisma.barista.upsert({
    where: { pinCode: '2222' },
    update: { storeId: STORE_ID },
    create: {
      name: 'Serveur 2',
      pinCode: '2222',
      storeId: STORE_ID,
      defaultPosMode: 'simplistic'
    }
  });

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  console.log(`Store created/updated: ${store.name} (${store.id})`);
  console.log(`Barista PIN codes for this store: 1111, 2222`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
