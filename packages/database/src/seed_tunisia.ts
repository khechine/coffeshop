import { PrismaClient, StockStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🕌 Seeding Tunisian Market Data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Tunisian Wholesalers (Vendors)
  const vendorsData = [
    { name: 'Ben Yedder Wholesaler', email: 'b2b@benyedder.tn', company: 'Ben Yedder Professionnel', city: 'Tunis' },
    { name: 'Masmoudi Business', email: 'contact@masmoudib2b.tn', company: 'Patisserie Masmoudi S.A.', city: 'Sfax' },
    { name: 'SOTUDEV Distrib', email: 'sales@sotudev.tn', company: 'SOTUDEV Distribution', city: 'Sousse' },
  ];

  const vendorProfiles = [];

  for (const v of vendorsData) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: {
        email: v.email,
        password: passwordHash,
        name: v.name,
        role: 'VENDOR',
      },
    });

    const profile = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: v.company,
        city: v.city,
        status: 'ACTIVE',
        description: `Fournisseur majeur à ${v.city} pour le secteur CHR.`,
      },
    });
    vendorProfiles.push(profile);
  }

  // 2. Tunisian Specific Categories
  const categories = [
    { name: 'Chicha & Accessoires', slug: 'chicha', icon: '💨' },
    { name: 'Jeux de Société', slug: 'jeux', icon: '🃏' },
    { name: 'Pâtisserie Tunisienne', slug: 'patisserie-tn', icon: '🍯' },
    { name: 'Boissons Locales', slug: 'boissons-locales', icon: '🥤' },
    { name: 'Matières Premières', slug: 'matieres-premieres', icon: '🌾' },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.mktCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    catMap[c.slug] = created.id;
  }

  // 3. Sub-categories
  const subCategories = [
    { name: 'Tabac Classic', slug: 'tabac-classic', cat: 'chicha' },
    { name: 'Tabac Premium', slug: 'tabac-premium', cat: 'chicha' },
    { name: 'Charbon & Foyers', slug: 'charbon', cat: 'chicha' },
    { name: 'Chkobba & Scopa', slug: 'chkobba', cat: 'jeux' },
    { name: 'Rami & Poker', slug: 'rami', cat: 'jeux' },
    { name: 'Dominos & Echecs', slug: 'dominos', cat: 'jeux' },
    { name: 'Baklawa & Mignardises', slug: 'baklawa', cat: 'patisserie-tn' },
    { name: 'Gateaux Classiques', slug: 'gateaux', cat: 'patisserie-tn' },
    { name: 'Zgougou & Crèmes', slug: 'zgougou', cat: 'patisserie-tn' },
    { name: 'Jus Frais Seaux', slug: 'jus-frais', cat: 'boissons-locales' },
    { name: 'Citronnade Tunisienne', slug: 'citronnade', cat: 'boissons-locales' },
    { name: 'Gazouse & Soda', slug: 'soda-tn', cat: 'boissons-locales' },
  ];

  for (const s of subCategories) {
    await prisma.mktSubcategory.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        slug: s.slug,
        categoryId: catMap[s.cat],
      },
    });
  }

  // 4. Tunisian Marketplace Products
  const tunisianProducts = [
    { name: 'Tabac Pomme Fakher 1kg', cat: 'chicha', sub: 'tabac-premium', price: 85, unit: 'kg' },
    { name: 'Charbon Coco Briquet 10kg', cat: 'chicha', sub: 'charbon', price: 45, unit: 'box' },
    { name: 'Jeu de Chkobba Lion Pro', cat: 'jeux', sub: 'chkobba', price: 4.5, unit: 'piece' },
    { name: 'Dominos en Bois Artisanal', cat: 'jeux', sub: 'dominos', price: 15, unit: 'set' },
    { name: 'Baklawa Amande Boîte 2kg', cat: 'patisserie-tn', sub: 'baklawa', price: 120, unit: 'box' },
    { name: 'Plateau Mignardises (50 pcs)', cat: 'patisserie-tn', sub: 'baklawa', price: 65, unit: 'plate' },
    { name: 'Pâte de Zgougou Pure 1kg', cat: 'patisserie-tn', sub: 'zgougou', price: 38, unit: 'kg' },
    { name: 'Citronnade Maison Seau 5L', cat: 'boissons-locales', sub: 'citronnade', price: 25, unit: 'bucket' },
    { name: 'Jus de Fraise Naturel 5L', cat: 'boissons-locales', sub: 'jus-frais', price: 35, unit: 'bucket' },
    { name: 'Café Ben Yedder Selection 1kg', cat: 'matieres-premieres', sub: 'cafe-grains', price: 34, unit: 'kg' },
    { name: 'Sucre Blanc Sac 50kg', cat: 'matieres-premieres', sub: 'sucre-edulcorants', price: 75, unit: 'bag' },
  ];

  for (const p of tunisianProducts) {
    // Standard
    const standard = await prisma.productStandard.upsert({
      where: { sku: p.name.toLowerCase().replace(/ /g, '-') },
      update: {},
      create: {
        name: p.name,
        sku: p.name.toLowerCase().replace(/ /g, '-'),
        categoryId: catMap[p.cat],
        unit: p.unit,
        defaultPrice: p.price,
        isStandard: true,
      },
    });

    // Assign to a random vendor
    const vendorIdx = Math.floor(Math.random() * vendorProfiles.length);
    await prisma.vendorProduct.create({
      data: {
        productStandardId: standard.id,
        vendorId: vendorProfiles[vendorIdx].id,
        price: p.price,
        minOrderQty: 1,
        stockStatus: 'IN_STOCK',
        isFeatured: Math.random() > 0.7,
        description: `Produit authentique de qualité supérieure pour cafés et salons de thé.`,
      },
    });
  }

  // 5. Couriers
  const couriersCities = ['Tunis', 'Sfax', 'Sousse'];
  for (let i = 0; i < 6; i++) {
    const email = `courier${i}@delivery.tn`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: passwordHash,
        name: `Livreur ${i}`,
        role: 'COURIER',
      },
    });

    await prisma.courierProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        vehicleType: i % 2 === 0 ? 'MOTO' : 'VAN',
        status: 'AVAILABLE',
      },
    });
  }

  console.log('✅ Seeding Completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
