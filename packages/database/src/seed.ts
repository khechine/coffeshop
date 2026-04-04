import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create SUPERADMIN
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@coffeeshop.tn' },
    update: {},
    create: {
      email: 'superadmin@coffeeshop.tn',
      password: passwordHash,
      name: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ Created Super Admin');

  // 2. Create STORE_OWNER & Store
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

  const store = await prisma.store.upsert({
    where: { id: 'clv_store_01' }, // Fixed ID for stability
    update: {},
    create: {
      id: 'clv_store_01',
      name: 'Central Perk Tunis',
      address: 'Lac 2, Tunis',
      owners: { connect: { id: owner.id } },
      status: 'ACTIVE',
      isVerified: true,
    },
  });
  console.log(`✅ Created Store: ${store.name}`);

  // 3. Create VENDOR & VendorProfile
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@distributeur.tn' },
    update: {},
    create: {
      email: 'vendor@distributeur.tn',
      password: passwordHash,
      name: 'Ahmed Grossiste',
      role: 'VENDOR',
    },
  });

  const vendorProfile = await prisma.vendorProfile.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      companyName: 'Distributeur Prime',
      description: 'Spécialiste du café et des équipements pour CHR.',
      status: 'ACTIVE',
      city: 'Tunis',
      phone: '+216 22 333 444',
    },
  });
  console.log(`✅ Created Vendor: ${vendorProfile.companyName}`);

  // 4. Marketplace Categories & Products
  const mktCatCoffee = await prisma.marketplaceCategory.upsert({
    where: { slug: 'cafe-grains' },
    update: {},
    create: {
      name: 'Café en Grains',
      slug: 'cafe-grains',
    },
  });

  const mktProduct = await prisma.marketplaceProduct.create({
    data: {
      name: 'Bresil Santos 1kg',
      price: 32.500,
      unit: 'kg',
      categoryId: mktCatCoffee.id,
      vendorId: vendorProfile.id,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=200&auto=format&fit=crop',
    },
  });
  console.log(`✅ Created Marketplace Product: ${mktProduct.name}`);

  // 5. POS Categories & Products
  const catCoffee = await prisma.category.create({ 
    data: { name: 'Café Chaud', storeId: store.id } 
  });

  const unitKg = await prisma.globalUnit.upsert({ where: { name: 'kg' }, update: {}, create: { name: 'kg' } });
  const unitPcs = await prisma.globalUnit.upsert({ where: { name: 'pcs' }, update: {}, create: { name: 'pcs' } });

  const stockGrains = await prisma.stockItem.create({
    data: {
      name: 'Grains Arabica Reserve',
      unitId: unitKg.id,
      quantity: 15,
      storeId: store.id,
    },
  });

  await prisma.product.create({
    data: {
      name: 'Express Double',
      price: 2.8,
      categoryId: catCoffee.id,
      storeId: store.id,
      recipe: {
        create: [
          { stockItemId: stockGrains.id, quantity: 0.018 },
        ],
      },
    },
  });

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
