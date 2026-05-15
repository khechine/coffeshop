
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Vault Test Data...');

  // 1. Create or Find Categories
  const cat1 = await (prisma as any).marketplaceCategory.upsert({
    where: { name: 'Équipements Café' },
    update: {},
    create: { name: 'Équipements Café', icon: 'Coffee', color: '#E31E24' }
  });

  const cat2 = await (prisma as any).marketplaceCategory.upsert({
    where: { name: 'Consommables' },
    update: {},
    create: { name: 'Consommables', icon: 'Package', color: '#2563EB' }
  });

  // 2. Find a Store (Client)
  const store = await (prisma as any).store.findFirst();
  if (!store) throw new Error('No store found. Please create one first.');

  // 3. Create Standard Vendor
  const vendorStd = await (prisma as any).vendorProfile.upsert({
    where: { userId: 'test-user-std' }, // Mapping dummy ID
    update: { companyName: 'Grossiste Alpha (Standard)', isPremium: false },
    create: {
      userId: 'test-user-std-uid', // Replace with real UID if needed
      companyName: 'Grossiste Alpha (Standard)',
      description: 'Fournisseur de gobelets et accessoires.',
      city: 'Tunis',
      phone: '22111333',
      isPremium: false,
      status: 'APPROVED'
    }
  });

  // 4. Create Premium Vendor
  const vendorPrem = await (prisma as any).vendorProfile.upsert({
    where: { userId: 'test-user-prem' },
    update: { companyName: 'Torréfaction Royale (Premium)', isPremium: true },
    create: {
      userId: 'test-user-prem-uid',
      companyName: 'Torréfaction Royale (Premium)',
      description: 'Café de spécialité torréfié localement.',
      city: 'Sousse',
      phone: '55444666',
      isPremium: true,
      status: 'APPROVED'
    }
  });

  // 5. Create Products
  await (prisma as any).vendorProduct.create({
    data: {
      name: 'Gobelets Kraft 8oz x1000',
      price: 85.00,
      minOrderQty: 5,
      vendorId: vendorStd.id,
      categoryId: cat2.id,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400'
    }
  });

  await (prisma as any).vendorProduct.create({
    data: {
      name: 'Café Grain Arabica 1kg',
      price: 45.00,
      minOrderQty: 10,
      vendorId: vendorPrem.id,
      categoryId: cat1.id,
      image: '/images/elkassa-logo.png'
    }
  });

  console.log('✅ Test data seeded successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
