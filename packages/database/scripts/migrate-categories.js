const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting Category Migration...');

  // 1. Get all stores
  const stores = await prisma.store.findMany();
  console.log(`Found ${stores.length} stores.`);

  // 2. Get global categories (no storeId)
  const globalCategories = await prisma.category.findMany({
    where: { storeId: null }
  });
  console.log(`Found ${globalCategories.length} global categories to migrate.`);

  if (globalCategories.length === 0) {
    console.log('No global categories found. Migration skipped.');
    return;
  }

  // 3. For each store, clone the categories and re-link products
  for (const store of stores) {
    console.log(`\n📦 Migrating categories for store: ${store.name} (${store.id})`);
    
    const categoryMapping = new Map(); // oldId -> newId

    for (const cat of globalCategories) {
      const newCat = await prisma.category.create({
        data: {
          name: cat.name,
          storeId: store.id
        }
      });
      categoryMapping.set(cat.id, newCat.id);
      console.log(`  - Cloned "${cat.name}" -> ${newCat.id}`);
    }

    // 4. Update products for this store
    const products = await prisma.product.findMany({
      where: { storeId: store.id }
    });
    console.log(`  Found ${products.length} products to re-link.`);

    for (const prod of products) {
      const newCategoryId = categoryMapping.get(prod.categoryId);
      if (newCategoryId) {
        await prisma.product.update({
          where: { id: prod.id },
          data: { categoryId: newCategoryId }
        });
        console.log(`    Linked product "${prod.name}" to its new local category.`);
      } else {
        console.warn(`    ⚠️ Product "${prod.name}" uses a category not found in globals: ${prod.categoryId}`);
      }
    }
  }

  // 5. Cleanup: Delete global categories
  console.log('\n🧹 Cleaning up global categories...');
  const deleteResult = await prisma.category.deleteMany({
    where: { storeId: null }
  });
  console.log(`Deleted ${deleteResult.count} legacy global categories.`);

  console.log('\n✅ Migration completed successfully!');
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
