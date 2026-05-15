
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Vault Test Data...');

  // 1. Find or Create Categories
  const cat1 = await prisma.marketplaceCategory.upsert({
    where: { slug: 'equipements-cafe' },
    update: {},
    create: { 
      name: 'Équipements Café', 
      slug: 'equipements-cafe',
      icon: 'Coffee', 
      color: '#E31E24' 
    }
  });

  const cat2 = await prisma.marketplaceCategory.upsert({
    where: { slug: 'consommables' },
    update: {},
    create: { 
      name: 'Consommables', 
      slug: 'consommables',
      icon: 'Package', 
      color: '#2563EB' 
    }
  });

  // 2. Find Users
  const userStd = await prisma.user.findUnique({ 
    where: { email: 'vendor_tunis@example.com' },
    select: { id: true, email: true }
  });
  const userPrem = await prisma.user.findUnique({ 
    where: { email: 'vendor_ariana@example.com' },
    select: { id: true, email: true }
  });

  if (!userStd || !userPrem) {
    console.error('Test users not found.');
    return;
  }

  // 3. Update/Create Vendor Profiles
  const vendorStd = await prisma.vendorProfile.upsert({
    where: { userId: userStd.id },
    update: { isPremium: false, companyName: 'Grossiste Alpha (Standard)' },
    create: {
      userId: userStd.id,
      companyName: 'Grossiste Alpha (Standard)',
      description: 'Spécialiste du packaging et consommables.',
      city: 'Tunis',
      phone: '22111222',
      address: 'Avenue de la Liberté, Tunis',
      isPremium: false,
      status: 'APPROVED'
    }
  });

  const vendorPrem = await prisma.vendorProfile.upsert({
    where: { userId: userPrem.id },
    update: { isPremium: true, companyName: 'Torréfaction Royale (Premium)' },
    create: {
      userId: userPrem.id,
      companyName: 'Torréfaction Royale (Premium)',
      description: 'L\'excellence du café tunisien depuis 1990.',
      city: 'Ariana',
      phone: '55888999',
      address: 'Route de la Soukra, Ariana',
      isPremium: true,
      status: 'APPROVED'
    }
  });

  // 4. Add Products
  await prisma.vendorProduct.deleteMany({
    where: { vendorId: { in: [vendorStd.id, vendorPrem.id] } }
  });

  await prisma.vendorProduct.createMany({
    data: [
      {
        name: 'Gobelets Kraft 8oz x1000',
        price: 85.00,
        minOrderQty: 5,
        vendorId: vendorStd.id,
        categoryId: cat2.id,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',
        stockStatus: 'IN_STOCK'
      },
      {
        name: 'Café Grain Arabica 1kg',
        price: 45.00,
        minOrderQty: 10,
        vendorId: vendorPrem.id,
        categoryId: cat1.id,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
        stockStatus: 'IN_STOCK'
      }
    ]
  });

  console.log('✅ Test data seeded successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
