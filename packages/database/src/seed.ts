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
  // 5. POS CATEGORIES, RAW MATERIALS & PRODUCTS
  // ============================================

  // 5.0 Units
  const unitsData = ['kg', 'litre', 'pièce', 'pack', 'g'];
  const unitsMap: Record<string, string> = {};
  for (const u of unitsData) {
    const created = await prisma.globalUnit.upsert({ where: { name: u }, update: {}, create: { name: u } });
    unitsMap[u] = created.id;
  }

  // 5.1 Raw Material Categories (Hierarchical POS Categories)
  const rawMaterialCategories = [
    { parent: 'Boissons chaudes', child: 'Café' },
    { parent: 'Boissons chaudes', child: 'Thé & Infusions' },
    { parent: 'Boissons chaudes', child: 'Chocolat' },
    { parent: 'Produits laitiers', child: 'Lait' },
    { parent: 'Produits laitiers', child: 'Crème' },
    { parent: 'Produits laitiers', child: 'Fromage' },
    { parent: 'Sucrants', child: 'Sucre' },
    { parent: 'Sucrants', child: 'Édulcorants' },
    { parent: 'Sucrants', child: 'Arômes' },
    { parent: 'Fruits & Jus', child: 'Fruits frais' },
    { parent: 'Fruits & Jus', child: 'Jus & concentrés' },
    { parent: 'Boissons froides', child: 'Eau' },
    { parent: 'Boissons froides', child: 'Sodas' },
    { parent: 'Boissons froides', child: 'Énergétiques' },
    { parent: 'Pâtisserie', child: 'Ingrédients de base' },
    { parent: 'Pâtisserie', child: 'Chocolat & toppings' },
    { parent: 'Pâtisserie', child: 'Produits semi-finis' },
    { parent: 'Snack salé', child: 'Viandes' },
    { parent: 'Snack salé', child: 'Légumes' },
    { parent: 'Snack salé', child: 'Sauces' },
    { parent: 'Snack salé', child: 'Pain & pâte' },
    { parent: 'Chicha', child: 'Tabac' },
    { parent: 'Chicha', child: 'Charbon' },
    { parent: 'Chicha', child: 'Accessoires' },
    { parent: 'Nettoyage', child: 'Cuisine' },
    { parent: 'Nettoyage', child: 'Salle' },
    { parent: 'Nettoyage', child: 'Hygiène' },
    { parent: 'Consommables', child: 'Service' },
    { parent: 'Consommables', child: 'Emballage' },
  ];

  const posCategoriesMap: Record<string, string> = {};

  for (const rel of rawMaterialCategories) {
    if (!posCategoriesMap[rel.parent]) {
      const p = await prisma.category.create({
        data: { name: rel.parent, storeId: store.id }
      });
      posCategoriesMap[rel.parent] = p.id;
    }
    const childKey = `${rel.parent} > ${rel.child}`;
    if (!posCategoriesMap[childKey]) {
      const c = await prisma.category.create({
        data: { name: rel.child, storeId: store.id, parentId: posCategoriesMap[rel.parent] }
      });
      posCategoriesMap[childKey] = c.id;
    }
  }
  console.log(`✅ Created ${rawMaterialCategories.length} Material Categories Groups`);

  // 5.2 Stock Items (Matières premières)
  const rawMaterials = [
    { name: 'Café grain', cat: 'Boissons chaudes > Café', unit: 'kg' },
    { name: 'Café moulu', cat: 'Boissons chaudes > Café', unit: 'kg' },
    { name: 'Capsules café', cat: 'Boissons chaudes > Café', unit: 'pièce' },
    { name: 'Thé vrac', cat: 'Boissons chaudes > Thé & Infusions', unit: 'kg' },
    { name: 'Sachet thé', cat: 'Boissons chaudes > Thé & Infusions', unit: 'pièce' },
    { name: 'Menthe', cat: 'Boissons chaudes > Thé & Infusions', unit: 'kg' },
    { name: 'Chocolat poudre', cat: 'Boissons chaudes > Chocolat', unit: 'kg' },
    { name: 'Sirop chocolat', cat: 'Boissons chaudes > Chocolat', unit: 'litre' },
    { name: 'Lait frais', cat: 'Produits laitiers > Lait', unit: 'litre' },
    { name: 'Lait UHT', cat: 'Produits laitiers > Lait', unit: 'litre' },
    { name: 'Lait concentré', cat: 'Produits laitiers > Lait', unit: 'litre' },
    { name: 'Crème liquide', cat: 'Produits laitiers > Crème', unit: 'litre' },
    { name: 'Chantilly', cat: 'Produits laitiers > Crème', unit: 'litre' },
    { name: 'Fromage râpé', cat: 'Produits laitiers > Fromage', unit: 'kg' },
    { name: 'Fromage tranche', cat: 'Produits laitiers > Fromage', unit: 'pièce' },
    { name: 'Sucre blanc', cat: 'Sucrants > Sucre', unit: 'kg' },
    { name: 'Sucre roux', cat: 'Sucrants > Sucre', unit: 'kg' },
    { name: 'Sucre sachet', cat: 'Sucrants > Sucre', unit: 'pièce' },
    { name: 'Édulcorant', cat: 'Sucrants > Édulcorants', unit: 'pièce' },
    { name: 'Sirop vanille', cat: 'Sucrants > Arômes', unit: 'litre' },
    { name: 'Sirop caramel', cat: 'Sucrants > Arômes', unit: 'litre' },
    { name: 'Sirop noisette', cat: 'Sucrants > Arômes', unit: 'litre' },
    { name: 'Orange', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Fraise', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Banane', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Citron', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Jus concentré', cat: 'Fruits & Jus > Jus & concentrés', unit: 'litre' },
    { name: 'Sirop fruits', cat: 'Fruits & Jus > Jus & concentrés', unit: 'litre' },
    { name: 'Eau minérale', cat: 'Boissons froides > Eau', unit: 'litre' },
    { name: 'Eau gazeuse', cat: 'Boissons froides > Eau', unit: 'litre' },
    { name: 'Soda cola', cat: 'Boissons froides > Sodas', unit: 'litre' },
    { name: 'Soda orange', cat: 'Boissons froides > Sodas', unit: 'litre' },
    { name: 'Boisson énergétique', cat: 'Boissons froides > Énergétiques', unit: 'litre' },
    { name: 'Farine', cat: 'Pâtisserie > Ingrédients de base', unit: 'kg' },
    { name: 'Œufs', cat: 'Pâtisserie > Ingrédients de base', unit: 'pièce' },
    { name: 'Beurre', cat: 'Pâtisserie > Ingrédients de base', unit: 'kg' },
    { name: 'Chocolat noir', cat: 'Pâtisserie > Chocolat & toppings', unit: 'kg' },
    { name: 'Nutella', cat: 'Pâtisserie > Chocolat & toppings', unit: 'kg' },
    { name: 'Génoise', cat: 'Pâtisserie > Produits semi-finis', unit: 'pièce' },
    { name: 'Crème pâtissière', cat: 'Pâtisserie > Produits semi-finis', unit: 'kg' },
    { name: 'Viande poulet', cat: 'Snack salé > Viandes', unit: 'kg' },
    { name: 'Viande thon', cat: 'Snack salé > Viandes', unit: 'kg' },
    { name: 'Tomate', cat: 'Snack salé > Légumes', unit: 'kg' },
    { name: 'Salade', cat: 'Snack salé > Légumes', unit: 'kg' },
    { name: 'Mayonnaise', cat: 'Snack salé > Sauces', unit: 'litre' },
    { name: 'Ketchup', cat: 'Snack salé > Sauces', unit: 'litre' },
    { name: 'Pain sandwich', cat: 'Snack salé > Pain & pâte', unit: 'pièce' },
    { name: 'Pâte pizza', cat: 'Snack salé > Pain & pâte', unit: 'kg' },
    { name: 'Tabac chicha', cat: 'Chicha > Tabac', unit: 'kg' },
    { name: 'Charbon chicha', cat: 'Chicha > Charbon', unit: 'kg' },
    { name: 'Aluminium chicha', cat: 'Chicha > Accessoires', unit: 'pièce' },
    { name: 'Liquide vaisselle', cat: 'Nettoyage > Cuisine', unit: 'litre' },
    { name: 'Dégraissant', cat: 'Nettoyage > Cuisine', unit: 'litre' },
    { name: 'Produit sol', cat: 'Nettoyage > Salle', unit: 'litre' },
    { name: 'Désinfectant', cat: 'Nettoyage > Salle', unit: 'litre' },
    { name: 'Savon main', cat: 'Nettoyage > Hygiène', unit: 'litre' },
    { name: 'Papier toilette', cat: 'Nettoyage > Hygiène', unit: 'pièce' },
    { name: 'Gobelet', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Verre jetable', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Paille', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Serviette', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Sac emballage', cat: 'Consommables > Emballage', unit: 'pièce' },
    { name: 'Boite gâteau', cat: 'Consommables > Emballage', unit: 'pièce' },
  ];

  for (const mat of rawMaterials) {
    await prisma.stockItem.create({
      data: {
        name: mat.name,
        unitId: unitsMap[mat.unit],
        quantity: 100, // mock quantity
        storeId: store.id
      }
    });
  }
  console.log(`✅ Created ${rawMaterials.length} Raw Materials (Stock Items)`);

  // 5.3 Finished Products Categories
  const finishedProductCategoriesDef = [
    { name: 'Cafés', color: '#8B5CF6', icon: 'Coffee' },
    { name: 'Thés', color: '#10B981', icon: 'Coffee' },
    { name: 'Boissons chaudes', color: '#F59E0B', icon: 'Coffee' },
    { name: 'Boissons froides', color: '#3B82F6', icon: 'Coffee' },
    { name: 'Jus', color: '#F97316', icon: 'Coffee' },
    { name: 'Milkshake', color: '#EC4899', icon: 'Coffee' },
    { name: 'Pâtisserie', color: '#D946EF', icon: 'Cake' },
    { name: 'Snack', color: '#EF4444', icon: 'Pizza' },
    { name: 'Crêpes', color: '#EAB308', icon: 'Utensils' },
    { name: 'Chicha', color: '#64748B', icon: 'Box' },
    { name: 'Extras', color: '#94A3B8', icon: 'Tag' }
  ];

  for (const c of finishedProductCategoriesDef) {
    const cat = await prisma.category.create({
      data: { name: c.name, color: c.color, icon: c.icon, storeId: store.id }
    });
    posCategoriesMap[c.name] = cat.id; // register generic category mapping
  }
  
  // 5.4 Finished Products (Menu Import)
  const finishedProductsData = [
    { name: 'Café express', cat: 'Cafés', price: 1.2 },
    { name: 'Café direct', cat: 'Cafés', price: 1.5 },
    { name: 'Capucin', cat: 'Cafés', price: 2.0 },
    { name: 'Cappuccino', cat: 'Cafés', price: 3.5 },
    { name: 'Café crème', cat: 'Cafés', price: 3.0 },
    
    { name: 'Thé nature', cat: 'Thés', price: 1.0 },
    { name: 'Thé menthe', cat: 'Thés', price: 1.2 },
    { name: 'Thé amande', cat: 'Thés', price: 2.5 },
    
    { name: 'Chocolat chaud', cat: 'Boissons chaudes', price: 3.0 },
    { name: 'Latte', cat: 'Boissons chaudes', price: 3.5 },
    { name: 'Mokaccino', cat: 'Boissons chaudes', price: 4.0 },
    
    { name: 'Eau 0.5L', cat: 'Boissons froides', price: 1.0 },
    { name: 'Eau gazeuse', cat: 'Boissons froides', price: 1.5 },
    { name: 'Soda', cat: 'Boissons froides', price: 2.0 },
    
    { name: 'Jus orange', cat: 'Jus', price: 4.0 },
    { name: 'Jus citron', cat: 'Jus', price: 3.5 },
    { name: 'Jus fraise', cat: 'Jus', price: 5.0 },
    { name: 'Cocktail fruits', cat: 'Jus', price: 6.0 },
    
    { name: 'Milkshake fraise', cat: 'Milkshake', price: 6.0 },
    { name: 'Milkshake chocolat', cat: 'Milkshake', price: 6.0 },
    { name: 'Milkshake banane', cat: 'Milkshake', price: 5.5 },
    
    { name: 'Gâteau chocolat', cat: 'Pâtisserie', price: 4.5 },
    { name: 'Tarte', cat: 'Pâtisserie', price: 4.0 },
    { name: 'Millefeuille', cat: 'Pâtisserie', price: 3.5 },
    { name: 'Cheesecake', cat: 'Pâtisserie', price: 5.0 },
    { name: 'Croissant', cat: 'Pâtisserie', price: 1.5 },
    
    { name: 'Sandwich thon', cat: 'Snack', price: 4.0 },
    { name: 'Sandwich poulet', cat: 'Snack', price: 5.0 },
    { name: 'Panini', cat: 'Snack', price: 5.5 },
    { name: 'Pizza', cat: 'Snack', price: 8.0 },
    
    { name: 'Crêpe chocolat', cat: 'Crêpes', price: 3.5 },
    { name: 'Crêpe nutella', cat: 'Crêpes', price: 4.0 },
    { name: 'Gaufre', cat: 'Crêpes', price: 4.0 },
    
    { name: 'Chicha simple', cat: 'Chicha', price: 10.0 },
    { name: 'Chicha premium', cat: 'Chicha', price: 15.0 },
    
    { name: 'Supplément lait', cat: 'Extras', price: 0.5 },
    { name: 'Supplément chocolat', cat: 'Extras', price: 0.5 },
    { name: 'Supplément fruit', cat: 'Extras', price: 1.0 },
  ];

  for (const fp of finishedProductsData) {
    if (posCategoriesMap[fp.cat]) {
      await prisma.product.create({
        data: {
          name: fp.name,
          price: fp.price,
          categoryId: posCategoriesMap[fp.cat],
          storeId: store.id
        }
      });
    }
  }
  console.log(`✅ Created ${finishedProductsData.length} POS Products from Demo Data`);

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
