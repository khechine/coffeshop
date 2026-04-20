import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding MASSIVE Marketplace Database (150+ Products) for Demo...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. CLEANUP (Safety first)
  console.log('🧹 Cleaning existing marketplace data...');
  const safeDelete = async (model: string) => {
    try {
      if ((prisma as any)[model]) {
        await (prisma as any)[model].deleteMany();
      }
    } catch (e) {}
  };

  await safeDelete('mktBundleItem');
  await safeDelete('mktBundle');
  await safeDelete('vendorProduct');
  await safeDelete('walletTransaction');
  await safeDelete('vendorWallet');
  await safeDelete('walletDepositRequest');
  await safeDelete('vendorProfile');
  await safeDelete('productStandard');
  await safeDelete('activityPole');
  await safeDelete('globalUnit');
  await safeDelete('mktSubcategory');
  await safeDelete('mktCategory');

  // 2. UNITS OF MEASURE
  console.log('📏 Seeding Units of Measure...');
  const units = ['kg', 'g', 'L', 'ml', 'unité', 'pack', 'boite', 'pièce', 'carton', 'sac'];
  const unitMap: Record<string, any> = {};
  for (const u of units) {
    const created = await (prisma as any).globalUnit.create({
      data: { name: u }
    });
    unitMap[u] = created;
  }

  // 3. ACTIVITY POLES
  console.log('🏗️ Seeding Activity Poles...');
  const poles = [
    { name: 'Coffee Shop', icon: '☕' },
    { name: 'Restaurant', icon: '🍽️' },
    { name: 'Lounge & Bar', icon: '🍸' },
    { name: 'Boulangerie & Pâtisserie', icon: '🥐' },
    { name: 'Fast Food', icon: '🍔' },
    { name: 'Épicerie Fine', icon: '🧀' }
  ];
  const poleIds: string[] = [];
  for (const p of poles) {
    const created = await (prisma as any).activityPole.create({
      data: p
    });
    poleIds.push(created.id);
  }

  // 4. CATEGORIES & SUBCATEGORIES
  console.log('📁 Seeding Marketplace Categories...');
  const categories = [
    { name: 'Café & Boissons', slug: 'cafe', icon: '☕', subs: ['Grains', 'Moulu', 'Capsules', 'Sirops', 'Thé & Infusions'] },
    { name: 'Pâtisserie & Boulangerie', slug: 'patisseries', icon: '🥐', subs: ['Farines', 'Chocolats', 'Beurres', 'Fourrages', 'Décorations'] },
    { name: 'Accessoires Barista', slug: 'barista', icon: '🛠️', subs: ['Tampers', 'Pichets', 'Balances', 'Outils Nettoyage', 'Pièces Détachées'] },
    { name: 'Nettoyage & Hygiène', slug: 'nettoyage', icon: '🧼', subs: ['Machines', 'Sols', 'Vaisselle', 'Désinfectants', 'Papier'] },
    { name: 'Tabac & Chicha', slug: 'tabac', icon: '💨', subs: ['Tabac', 'Charbons', 'Huiles', 'Accessoires', 'Pipes'] },
    { name: 'Laitier & Crémerie', slug: 'dairy', icon: '🥛', subs: ['Lait', 'Crèmes', 'Fromages', 'Lait Végétal', 'Beurres'] },
    { name: 'Emballages & Jetables', slug: 'packaging', icon: '📦', subs: ['Gobelets', 'Couvercles', 'Sacs', 'Boites Pâtisserie', 'Pailles'] }
  ];

  const catMap: Record<string, any> = {};
  for (const c of categories) {
    const created = await (prisma as any).mktCategory.create({
      data: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: `Solutions professionnelles pour ${c.name}`,
        status: 'ACTIVE',
        isGlobal: true,
        subcategories: {
          create: c.subs.map(s => ({
            name: s,
            slug: `${c.slug}-${s.toLowerCase().replace(/ /g, '-')}`,
            description: `Tous les articles ${s}`
          }))
        }
      },
      include: { subcategories: true }
    });
    catMap[c.slug] = created;
  }

  // 5. VENDORS & WALLETS
  console.log('🏪 Seeding Vendors & Wallets...');
  const vendors = [
    { email: 'elite@vendeur.tn', company: 'Elite Roasters', city: 'Tunis', poles: [poleIds[0], poleIds[2]] },
    { email: 'bakery@vendeur.tn', company: 'Pâtissier Pro', city: 'Sfax', poles: [poleIds[3]] },
    { email: 'barista@vendeur.tn', company: 'Barista Tools', city: 'Sousse', poles: [poleIds[0], poleIds[1]] },
    { email: 'clean@vendeur.tn', company: 'Hygiène Clean', city: 'Tunis', poles: [poleIds[4], poleIds[5]] },
    { email: 'chicha@vendeur.tn', company: 'Chicha Palace', city: 'Nabeul', poles: [poleIds[2]] },
    { email: 'dairy@vendeur.tn', company: 'Laitier du Nord', city: 'Bizerte', poles: [poleIds[3], poleIds[1]] },
    { email: 'pack@vendeur.tn', company: 'Tunis Emballage', city: 'Tunis', poles: [poleIds[0], poleIds[4], poleIds[5]] }
  ];

  const vendorProfiles: any[] = [];
  for (const v of vendors) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: { password: passwordHash },
      create: { email: v.email, password: passwordHash, name: v.company, role: 'VENDOR' },
    });
    const profile = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: { 
        companyName: v.company, 
        city: v.city,
        activityPoles: { set: v.poles.map(id => ({ id })) }
      },
      create: { 
        userId: user.id, 
        companyName: v.company, 
        status: 'ACTIVE', 
        city: v.city, 
        phone: '+216 22 111 222',
        activityPoles: { connect: v.poles.map(id => ({ id })) },
        wallet: { create: { balance: 100.000 } } // Give them some starting credit for demo
      },
    });
    vendorProfiles.push(profile);
  }

  // 6. PRODUCT GENERATION
  console.log('📦 Generating 150+ Marketplace Products...');
  const createdVPs: any[] = [];

  const productData: Record<string, string[]> = {
    cafe: ['Café Grains Brésil 1kg', 'Café Grains Éthiopie 1kg', 'Capsules Espresso x50', 'Sirop Vanille 1L', 'Thé Menthe Pro 500g', 'Café Moulu Robusta 1kg', 'Sirop Caramel 1L'],
    patisseries: ['Farine T45 25kg', 'Chocolat Noir 1kg', 'Beurre Pâtissier 2kg', 'Mix Muffin 5kg', 'Sucre Glace 10kg', 'Levure Sèche 500g'],
    barista: ['Tamper 58mm', 'Pichet Lait 600ml', 'Balance Précision', 'Brosse à Groupe', 'Knock Box Inox', 'Thermomètre Digital'],
    nettoyage: ['Poudre Cafiza 900g', 'Liquide vaisselle 5L', 'Essuie-tout x6', 'Désinfectant CHR 5L', 'Éponge Pro x10'],
    tabac: ['Tabs Double Pomme 500g', 'Charbon Naturel 1kg', 'Tuyau Silicone', 'Foyer Classic', 'Pince à Charbon'],
    dairy: ['Lait Entier 1L x12', 'Crème Liquide 1L', 'Lait Amande 1L', 'Lait Avoine Barista', 'Fromage Râpé Mozza 2kg'],
    packaging: ['Gobelet 8oz x100', 'Couvercle Noir x100', 'Sac Kraft x500', 'Paille Papier x200', 'Porte Gobelet x50']
  };

  for (const [slug, titles] of Object.entries(productData)) {
    const cat = catMap[slug];
    const vendorIdx = categories.findIndex(c => c.slug === slug);
    const vendor = vendorProfiles[vendorIdx % vendorProfiles.length];
    
    for (let i = 0; i < 22; i++) { // ~22 products per category = 154 products
      const title = titles[i % titles.length] + (i >= titles.length ? ` #${Math.floor(i/titles.length)}` : '');
      const price = slug === 'barista' ? 50 + Math.random() * 200 : 5 + Math.random() * 50;
      
      const std = await prisma.productStandard.create({
        data: {
          name: title,
          sku: `${slug}-${i}-${Math.random().toString(36).substring(7)}`,
          categoryId: cat.id,
          unit: unitMap['unité']?.name || 'unité',
          defaultPrice: price,
          isStandard: true
        }
      });

      const vp = await prisma.vendorProduct.create({
        data: {
          productStandardId: std.id,
          vendorId: vendor.id,
          price: price,
          minOrderQty: i % 10 === 0 ? 10 : 1,
          stockStatus: 'IN_STOCK',
          image: `https://images.unsplash.com/photo-${1500000000000 + (i * 1000)}?q=80&w=600&auto=format&fit=crop`,
          description: `Qualité professionnelle pour ${cat.name}. Idéal pour usage intensif.`
        }
      });
      createdVPs.push(vp);
    }
  }

  // 7. PACKS & BUNDLES
  console.log('🎁 Creating Premium Packs...');
  const bundleTemplates = [
    { name: 'Pack Ouverture Coffee Shop', v: 0, items: 6, price: 450 },
    { name: 'Kit Barista Expert', v: 2, items: 4, price: 180 },
    { name: 'Pack Hygiène Mensuel', v: 3, items: 5, price: 95 },
    { name: 'Pack Summer Chicha', v: 4, items: 4, price: 120 },
    { name: 'Pack Lait Alternatif Mix', v: 5, items: 4, price: 55 },
    { name: 'Pack Gobelets All Sizes', v: 6, items: 3, price: 85 }
  ];

  for (const bt of bundleTemplates) {
    const vendor = vendorProfiles[bt.v];
    const vendorProducts = createdVPs.filter(vp => vp.vendorId === vendor.id).slice(0, bt.items);
    
    if (vendorProducts.length > 0) {
      await (prisma as any).mktBundle.create({
        data: {
          name: bt.name,
          description: `Solution optimisée pour votre activité. Inclus ${bt.items} produits essentiels avec une remise exclusive.`,
          price: bt.price,
          discountPercent: 15,
          vendorId: vendor.id,
          image: vendorProducts[0].image,
          isActive: true,
          items: {
            create: vendorProducts.map(vp => ({
              vendorProductId: vp.id,
              quantity: 1
            }))
          }
        }
      });
    }
  }

  console.log('✨ DONE! Database successfully seeded with massive data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
