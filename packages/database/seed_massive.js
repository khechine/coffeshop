const { PrismaClient } = require('./generated-client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- TUNISIA WIDE SEEDING START ---');

  // 1. CLEAR
  await prisma.marketplaceProduct.deleteMany({});
  await prisma.vendorProfile.deleteMany({});
  
  // 2. SEED CATEGORIES IF EMPTY
  let cats = await prisma.marketplaceCategory.findMany({});
  if (cats.length === 0) {
    const names = ['Café Grain', 'Lait & Crèmerie', 'Sirops & Arômes', 'Accessoires Barista', 'Snacks & Biscuits', 'Entretien Machine'];
    for (const name of names) {
      await prisma.marketplaceCategory.create({ data: { name } });
    }
    cats = await prisma.marketplaceCategory.findMany({});
  }

  const govCoords = [
    { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
    { name: 'Ariana', lat: 36.8665, lng: 10.1647 },
    { name: 'Ben Arous', lat: 36.7531, lng: 10.2222 },
    { name: 'Manouba', lat: 36.8080, lng: 10.0863 },
    { name: 'Bizerte', lat: 37.2744, lng: 9.8739 },
    { name: 'Nabeul', lat: 36.4561, lng: 10.7376 },
    { name: 'Zaghouan', lat: 36.4029, lng: 10.1429 },
    { name: 'Béja', lat: 36.7256, lng: 9.1817 },
    { name: 'Jendouba', lat: 36.5011, lng: 8.7767 },
    { name: 'Le Kef', lat: 36.1742, lng: 8.7049 },
    { name: 'Siliana', lat: 36.0844, lng: 9.3708 },
    { name: 'Sousse', lat: 35.8256, lng: 10.6369 },
    { name: 'Monastir', lat: 35.7780, lng: 10.8261 },
    { name: 'Mahdia', lat: 35.5039, lng: 11.0450 },
    { name: 'Sfax', lat: 34.7400, lng: 10.7600 },
    { name: 'Kairouan', lat: 35.6781, lng: 10.0963 },
    { name: 'Kasserine', lat: 35.1675, lng: 8.8365 },
    { name: 'Sidi Bouzid', lat: 35.0382, lng: 9.4849 },
    { name: 'Gabès', lat: 33.8814, lng: 10.0982 },
    { name: 'Medenine', lat: 33.3549, lng: 10.4920 },
    { name: 'Tataouine', lat: 32.9297, lng: 10.4518 },
    { name: 'Gafsa', lat: 34.4250, lng: 8.7842 },
    { name: 'Tozeur', lat: 33.9197, lng: 8.1336 },
    { name: 'Kebili', lat: 33.7050, lng: 8.9690 }
  ];

  const vendorNames = [
    'El Mazraa B2B', 'Grains du Nord', 'Sirops de Cap Bon', 'Distrib Sousse', 'Dairy Sfax',
    'Bio Tozeur', 'Import Gabes', 'Kairouan Logistics', 'Bizerte Coffee Co', 'Nabeul Flowers',
    'Zaghouan Water', 'Beja Bakery', 'Jendouba Mills', 'Kef Artisans', 'Siliana Fruits',
    'Monistat Pro', 'Mahdia Fish B2B', 'Kasserine Paper', 'Sidi Bouzid Veg', 'Medenine Olive Oil',
    'Tataouine Sands', 'Gafsa Mines Tech', 'Kebili Oasis', 'Tunis Elite Coffee'
  ];

  const safeImages = [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600'
  ];

  // 3. SEED VENDORS
  for (let i = 0; i < govCoords.length; i++) {
    const gov = govCoords[i];
    const email = `vendor_${gov.name.toLowerCase().replace(' ', '_')}@example.com`;
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'VENDOR' },
      create: {
        email,
        password: 'password123',
        name: `Manager ${gov.name}`,
        role: 'VENDOR'
      }
    });

    const vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        companyName: vendorNames[i] || `Vendor ${gov.name}`,
        city: gov.name,
        lat: gov.lat,
        lng: gov.lng,
        phone: `70${Math.floor(Math.random()*899999 + 100000)}`,
        status: 'ACTIVE',
        categories: { connect: [{ id: cats[i % cats.length].id }] }
      }
    });

    for (let j = 0; j < 3; j++) {
      await prisma.marketplaceProduct.create({
        data: {
          name: `${cats[(i + j) % cats.length].name} - ${gov.name}`,
          price: 10 + Math.random() * 50,
          unit: 'unit',
          image: safeImages[j % 2],
          vendorId: vendorProfile.id,
          categoryId: cats[(i + j) % cats.length].id
        }
      });
    }
  }

  // 4. SEED STORE
  await prisma.store.upsert({
    where: { id: 'default_store' },
    update: {},
    create: {
        id: 'default_store',
        name: 'Central Perk Tunis',
        city: 'Tunis',
        lat: 36.83,
        lng: 10.22,
        address: 'Berges du Lac'
    }
  });

  // 5. SEED MOCK COURIERS
  for (let i = 1; i <= 5; i++) {
    const email = `courier${i}@example.com`;
    const u = await prisma.user.upsert({
      where: { email },
      update: { role: 'COURIER' },
      create: { email, password: 'password123', name: `Livreur 0${i}`, role: 'COURIER' }
    });
    await prisma.courierProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        vehicleType: i % 2 === 0 ? 'Moto' : 'Voiture',
        status: 'AVAILABLE',
        currentLat: 36.80 + (Math.random() - 0.5) * 0.1,
        currentLng: 10.18 + (Math.random() - 0.5) * 0.1
      }
    });
  }

  // 6. SEED SUPERADMIN
  await prisma.user.upsert({
    where: { email: 'superadmin@coffeeshop.tn' },
    update: { role: 'SUPERADMIN' },
    create: { email: 'superadmin@coffeeshop.tn', password: 'superpassword123', name: 'Super Admin', role: 'SUPERADMIN' }
  });

  console.log('--- TUNIS TUNISIA WIDE SEEDING COMPLETED ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
