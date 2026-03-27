import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Create a User & Store
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const owner = await prisma.user.upsert({
    where: { email: 'admin@coffeeshop.tn' },
    update: {},
    create: {
      email: 'admin@coffeeshop.tn',
      password: passwordHash,
      name: 'Amine - Manager',
      role: 'STORE_OWNER',
    },
  });

  const store = await prisma.store.create({
    data: {
      name: 'Central Perk Tunis',
      address: 'Lac 2, Tunis',
      owners: { connect: { id: owner.id } },
    },
  });

  console.log(`Created Store: ${store.name}`);

  // 2. Categories
  const catCoffee = await prisma.category.create({ data: { name: 'Café Chaud' } });
  const catCold = await prisma.category.create({ data: { name: 'Boissons Fraîches' } });

  // 2.5 Global Units
  const unitKg = await prisma.globalUnit.create({ data: { name: 'kg' } });
  const unitL = await prisma.globalUnit.create({ data: { name: 'L' } });
  const unitPcs = await prisma.globalUnit.create({ data: { name: 'pcs' } });

  // 3. Stock Items (Raw Materials)
  const stockGrains = await prisma.stockItem.create({
    data: {
      name: 'Grains de Café Arabica',
      unitId: unitKg.id,
      quantity: 10, // 10 kg en stock
      minThreshold: 2, // Alerte si < 2 kg
      storeId: store.id,
    },
  });

  const stockLait = await prisma.stockItem.create({
    data: {
      name: 'Lait Délice',
      unitId: unitL.id,
      quantity: 20,
      minThreshold: 5,
      storeId: store.id,
    },
  });

  const stockGobelets = await prisma.stockItem.create({
    data: {
      name: 'Gobelets 8oz',
      unitId: unitPcs.id,
      quantity: 500,
      minThreshold: 100,
      storeId: store.id,
    },
  });

  // 4. Products (What the POS sells) & Recipes
  const prodExpress = await prisma.product.create({
    data: {
      name: 'Express',
      price: 1.5,
      categoryId: catCoffee.id,
      storeId: store.id,
      recipe: {
        create: [
          { stockItemId: stockGrains.id, quantity: 0.018 }, // 18g
          { stockItemId: stockGobelets.id, quantity: 1 },    // 1 gobelet
        ],
      },
    },
  });

  const prodCapucin = await prisma.product.create({
    data: {
      name: 'Capucin',
      price: 1.8,
      categoryId: catCoffee.id,
      storeId: store.id,
      recipe: {
        create: [
          { stockItemId: stockGrains.id, quantity: 0.014 }, // 14g
          { stockItemId: stockLait.id, quantity: 0.05 },    // 50ml de lait
          { stockItemId: stockGobelets.id, quantity: 1 },    // 1 gobelet
        ],
      },
    },
  });

  const prodEau = await prisma.product.create({
    data: {
      name: 'Eau Minérale 0.5L',
      price: 0.9,
      categoryId: catCold.id,
      storeId: store.id,
      // Vente directe sans recette complexe, déduit directement du stock
      // mais on peut le faire via RECIPE de 1 = 1 pour uniformiser.
    },
  });

  // Pour l'eau, il faut une correspondance
  const stockEau = await prisma.stockItem.create({
    data: {
      name: 'Bouteille Eau 0.5L',
      unitId: unitPcs.id,
      quantity: 120,
      minThreshold: 24,
      storeId: store.id,
    },
  });

  await prisma.recipeItem.create({
    data: {
      productId: prodEau.id,
      stockItemId: stockEau.id,
      quantity: 1,
    },
  });

  // 5. Add a Supplier for B2B Sourcing
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Grossiste Laitier & Café Ben Yedder',
      contact: 'Sami Ben Ahmed',
      phone: '+216 99 123 456',
    }
  });

  console.log(`Products & Recipes created: ${prodExpress.name}, ${prodCapucin.name}`);
  console.log(`Created Supplier: ${supplier1.name}`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
