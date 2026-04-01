const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING SYSTEM ---');

  // 1. Create Plans
  const freePlan = await prisma.plan.upsert({
    where: { id: 'plan_free' },
    update: {},
    create: { id: 'plan_free', name: 'Starting', price: 0, maxStores: 1, maxProducts: 20 }
  });

  // 2. Create Store
  const store = await prisma.store.upsert({
    where: { id: 'store_central_perk' },
    update: {},
    create: {
      id: 'store_central_perk',
      name: 'Central Perk Tunis',
      address: 'Lac 2, Tunis',
      city: 'Tunis',
      phone: '71000123'
    }
  });

  // 3. Create Owner
  const owner = await prisma.user.upsert({
    where: { email: 'gunther@centralperk.com' },
    update: {},
    create: {
      email: 'gunther@centralperk.com',
      password: 'password123',
      name: 'Gunther',
      role: 'STORE_OWNER',
      storeId: store.id
    }
  });

  // 4. Create Marketplace Categories
  const catCafe = await prisma.marketplaceCategory.upsert({
    where: { id: 'cat_cafe' },
    update: {},
    create: { id: 'cat_cafe', name: 'Café en Grains', icon: 'Coffee' }
  });

  const catLait = await prisma.marketplaceCategory.upsert({
    where: { id: 'cat_lait' },
    update: {},
    create: { id: 'cat_lait', name: 'Produits Laitiers', icon: 'Milk' }
  });

  // 5. Create Vendor
  const vendorUser = await prisma.user.upsert({
    where: { email: 'contact@benyaghlane.tn' },
    update: {},
    create: {
      email: 'contact@benyaghlane.tn',
      password: 'password123',
      name: 'Ahmed Ben Yaghlane',
      role: 'VENDOR'
    }
  });

  const vendorProfile = await prisma.vendorProfile.upsert({
    where: { userId: vendorUser.id },
    update: { status: 'ACTIVE' },
    create: {
      userId: vendorUser.id,
      companyName: 'Ben Yaghlane Distribution',
      address: 'Avenue Hedi Nouira',
      city: 'Ariana',
      phone: '71222333',
      status: 'ACTIVE',
      categories: { connect: [{ id: 'cat_cafe' }] }
    }
  });

  // 6. Create Vendor Products
  await prisma.marketplaceProduct.upsert({
    where: { id: 'prod_cafe_premium' },
    update: {},
    create: {
      id: 'prod_cafe_premium',
      name: 'Café Premium Robusta 1kg',
      price: 28.500,
      unit: 'kg',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400',
      vendorId: vendorProfile.id,
      categoryId: catCafe.id,
      isFeatured: true
    }
  });

  await prisma.marketplaceProduct.upsert({
    where: { id: 'prod_lait_1l' },
    update: {},
    create: {
      id: 'prod_lait_1l',
      name: 'Lait Entier Professionnel 1L',
      price: 1.450,
      unit: 'L',
      image: 'https://images.unsplash.com/photo-1563636619-e9108b4af196?q=80&w=400',
      vendorId: vendorProfile.id,
      categoryId: catLait.id
    }
  });

  console.log('--- SEEDING COMPLETED ---');
  console.log('Owner: gunther@centralperk.com / password123');
  console.log('Vendor: contact@benyaghlane.tn / password123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
