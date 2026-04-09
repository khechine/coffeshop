import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create SUPERADMIN
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@coffeeshop.tn' },
    update: { password: passwordHash },
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
    update: { password: passwordHash },
    create: {
      email: 'admin@coffeeshop.tn',
      password: passwordHash,
      name: 'Amine - Manager',
      role: 'STORE_OWNER',
    },
  });

  const store = await prisma.store.upsert({
    where: { id: 'clv_store_01' },
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
    update: { password: passwordHash },
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

  // ============================================
  // 4. MARKETPLACE CATEGORIES & SUB-CATEGORIES
  // ============================================

  const categories = [
    { name: 'Café', slug: 'cafe', icon: '☕', description: 'Café en grains, moulu, capsules' },
    { name: 'Lait & Crèmerie', slug: 'lait-cremerie', icon: '🥛', description: 'Lait, crème, boissons végétales' },
    { name: 'Thé & Infusions', slug: 'the-infusions', icon: '🍵', description: 'Thé, tisanes, infusions' },
    { name: 'Chocolat & Boissons', slug: 'chocolat-boissons', icon: '🍫', description: 'Chocolat, cacao, beverages chaudes' },
    { name: 'Sucre & Edulcorants', slug: 'sucre-edulcorants', icon: '🍚', description: 'Sucre, miel, édulcorants' },
    { name: 'Sirops & Arômes', slug: 'sirop-aromes', icon: '🍯', description: 'Sirops, extraits, colorants' },
    { name: 'Gobelets', slug: 'gobelets', icon: '🥤', description: 'Gobelets carton et plastique' },
    { name: 'Couvercles & Pailles', slug: 'couvercles-pailles', icon: '🥤', description: 'Couvercles, pailles, agitateurs' },
    { name: 'Emballages', slug: 'emballages', icon: '📦', description: 'Boites, sacs, барquette' },
    { name: 'Serviettes & Napperons', slug: 'serviettes-napperons', icon: '🧻', description: 'Serviettes, napperons,-set de table' },
    { name: 'Tabac Chicha', slug: 'tabac-chicha', icon: '🌿', description: 'Tabacs pour chicha' },
    { name: 'Charbon Chicha', slug: 'charbon-chicha', icon: '🔥', description: 'Charbons naturels et compressés' },
    { name: 'Accessoires Chicha', slug: 'accessoires-chicha', icon: '💨', description: 'Tuyaux, heads, hoses' },
    { name: 'Pâtisseries', slug: 'patisseries', icon: '🥐', description: 'Viennoiseries, gateaux, pastries' },
    { name: 'Sandwichs & Baguettes', slug: 'sandwichs-baguettes', icon: '🥖', description: 'Sandwichs, baguettes, snacks salés' },
    { name: 'Snacks Emballés', slug: 'snacks-empact', icon: '🍟', description: 'Chips, biscuits, snack apéritifs' },
    { name: 'Jus', slug: 'jus', icon: '🧃', description: 'Jus de fruits, nectars' },
    { name: 'Soda', slug: 'soda', icon: '🥤', description: 'Boissons gazeuses' },
    { name: 'Eau', slug: 'eau', icon: '💧', description: 'Eau plate et gazeuse' },
    { name: 'Machines Café', slug: 'machines-cafe', icon: '🖥️', description: 'Machines espresso, automatiques' },
    { name: 'Moulins', slug: 'moulins', icon: '⚙️', description: 'Broyeurs, moulins à café' },
    { name: 'Réfrigération', slug: 'refrigeration', icon: '🧊', description: 'Vitrines, chambres froides' },
    { name: 'Accessoires Barista', slug: 'accessoires-barista', icon: '🛠️', description: 'Tampar, pichet, outils' },
    { name: 'Nettoyage', slug: 'nettoyage', icon: '🧹', description: 'Produits nettoyants' },
    { name: 'Désinfection', slug: 'desinfection', icon: '🧴', description: 'Antibactériens, gels' },
    { name: 'Services', slug: 'services', icon: '🔧', description: 'Maintenance, formation' },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categories) {
    const created = await prisma.mktCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description },
    });
    createdCategories[cat.slug] = created.id;
  }
  console.log(`✅ Created ${categories.length} Marketplace Categories`);

  // Sub-categories
  const subcategories = [
    // Café
    { name: 'Grains', categorySlug: 'cafe', slug: 'cafe-grains' },
    { name: 'Moulu', categorySlug: 'cafe', slug: 'cafe-moulu' },
    { name: 'Capsules', categorySlug: 'cafe', slug: 'cafe-capsules' },
    { name: 'Instant', categorySlug: 'cafe', slug: 'cafe-instant' },
    { name: 'Premium', categorySlug: 'cafe', slug: 'cafe-premium' },
    // Gobelets
    { name: 'Carton', categorySlug: 'gobelets', slug: 'gobelets-carton' },
    { name: 'Plastique', categorySlug: 'gobelets', slug: 'gobelets-plastique' },
    { name: 'Taille 25cl', categorySlug: 'gobelets', slug: 'gobelets-25cl' },
    { name: 'Taille 33cl', categorySlug: 'gobelets', slug: 'gobelets-33cl' },
    // Tabac Chicha
    { name: 'Classique', categorySlug: 'tabac-chicha', slug: 'tabac-classique' },
    { name: 'Premium', categorySlug: 'tabac-chicha', slug: 'tabac-premium' },
    { name: 'Sans Tabac', categorySlug: 'tabac-chicha', slug: 'tabac-sans-tabac' },
  ];

  for (const sub of subcategories) {
    await prisma.mktSubcategory.upsert({
      where: { slug: sub.slug },
      update: {},
      create: { name: sub.name, slug: sub.slug, categoryId: createdCategories[sub.categorySlug] },
    });
  }
  console.log(`✅ Created ${subcategories.length} Sub-categories`);

  // Tags
  const tags = [
    { name: 'bio', type: 'DIET' as const },
    { name: 'premium', type: 'GENERAL' as const },
    { name: 'tunisien', type: 'ORIGIN' as const },
    { name: 'importé', type: 'ORIGIN' as const },
    { name: 'vegan', type: 'DIET' as const },
    { name: 'promotion', type: 'GENERAL' as const },
    { name: 'nouveau', type: 'GENERAL' as const },
    { name: 'best-seller', type: 'GENERAL' as const },
    { name: 'recyclable', type: 'GENERAL' as const },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: { name: tag.name, type: tag.type },
    });
  }
  console.log(`✅ Created ${tags.length} Tags`);

  // Product Standards
  const products = [
    { name: 'Café grain 1kg', categorySlug: 'cafe', unit: 'kg', defaultPrice: 32.5 },
    { name: 'Café grain 250g', categorySlug: 'cafe', unit: 'g', defaultPrice: 12 },
    { name: 'Café moulu 1kg', categorySlug: 'cafe', unit: 'kg', defaultPrice: 28 },
    { name: 'Capsules Nespresso x50', categorySlug: 'cafe', unit: 'pack', defaultPrice: 45 },
    { name: 'Lait entier 1L', categorySlug: 'lait-cremerie', unit: 'L', defaultPrice: 2.5 },
    { name: 'Crème liquide 1L', categorySlug: 'lait-cremerie', unit: 'L', defaultPrice: 4 },
    { name: 'Gobelet carton 25cl x100', categorySlug: 'gobelets', unit: 'pack', defaultPrice: 15 },
    { name: 'Gobelet carton 33cl x100', categorySlug: 'gobelets', unit: 'pack', defaultPrice: 18 },
    { name: 'Tabac chicha 50g', categorySlug: 'tabac-chicha', unit: 'g', defaultPrice: 12 },
    { name: 'Charcoal naturel 1kg', categorySlug: 'charbon-chicha', unit: 'kg', defaultPrice: 8 },
  ];

  for (const prod of products) {
    await prisma.productStandard.upsert({
      where: { sku: prod.name.toLowerCase().replace(/ /g, '-') },
      update: {},
      create: {
        name: prod.name,
        sku: prod.name.toLowerCase().replace(/ /g, '-'),
        categoryId: createdCategories[prod.categorySlug],
        unit: prod.unit,
        defaultPrice: prod.defaultPrice,
        isStandard: true,
      },
    });
  }
  console.log(`✅ Created ${products.length} Product Standards`);

  // Vendor Products (exemple de catalogue vendeur)
  const stdProduct = await prisma.productStandard.findUnique({ where: { sku: 'cafe-grain-1kg' } });
  if (stdProduct) {
    await prisma.vendorProduct.create({
      data: {
        productStandardId: stdProduct.id,
        vendorId: vendorProfile.id,
        price: 32.5,
        minOrderQty: 5,
        stockStatus: 'IN_STOCK',
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=200&auto=format&fit=crop',
      },
    });
    console.log('✅ Created Vendor Product sample');
  }

  // ============================================
  // 5. POS CATEGORIES & PRODUCTS (legacy)
  // ============================================

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
