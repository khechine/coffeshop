const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('--- SEEDING ROBUST CATEGORIES ---');
  
  const tree = [
    { name: 'Café & Boissons', icon: '☕', color: '#451a03', image: '/images/elkassa-logo.png', children: ['Café Grain', 'Café Moulu', 'Capsules', 'Thé & Tisanes', 'Sirops'] },
    { name: 'Laiterie & Frais', icon: '🥛', color: '#0ea5e9', image: '/images/elkassa-logo.png', children: ['Lait Barista', 'Lait Végétal', 'Crème Liquide', 'Beurre'] },
    { name: 'Pâtisserie & Boulangerie', icon: '🥐', color: '#f59e0b', image: '/images/elkassa-logo.png', children: ['Viennoiseries', 'Pâtisseries Fines', 'Pains Spéciaux', 'Mix Pâtissiers'] },
    { name: 'Matières Premières', icon: '🌾', color: '#84cc16', image: '/images/elkassa-logo.png', children: ['Sucre', 'Farine Pro', 'Chocolat Couverture', 'Fruits Secs'] },
    { name: 'Emballages B2B', icon: '📦', color: '#f97316', image: '/images/elkassa-logo.png', children: ['Gobelets Kraft', 'Pailles Papier', 'Sacs Delivery', 'Serviettes'] },
    { name: 'Matériel & Hygiène', icon: '🛠️', color: '#64748b', image: '/images/elkassa-logo.png', children: ['Détergents Machines', 'Entretien Barista', 'Petit Matériel'] }
  ];

  for (const root of tree) {
    const slug = root.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = await prisma.marketplaceCategory.upsert({
      where: { slug },
      update: { icon: root.icon, color: root.color, image: root.image },
      create: { name: root.name, slug, icon: root.icon, color: root.color, image: root.image }
    });
    console.log('Root:', cat.name);

    for (const childName of root.children) {
      const childSlug = childName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.marketplaceCategory.upsert({
        where: { slug: childSlug },
        update: { parentId: cat.id },
        create: { name: childName, slug: childSlug, parentId: cat.id }
      });
      console.log('  Child:', childName);
    }
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect());
