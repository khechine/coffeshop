const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.findFirst();
  if (!store) { console.log('Aucun store trouvé'); return; }
  const storeId = store.id;
  console.log('Store:', store.name, '-', storeId);

  // Catégories
  const catNames = ['Chicha', 'Jeux', 'Boissons'];
  const catIds = {};
  for (const name of catNames) {
    let c = await prisma.category.findFirst({ where: { name } });
    if (!c) c = await prisma.category.create({ data: { name } });
    catIds[name] = c.id;
    console.log('Catégorie OK:', name);
  }

  // Produits
  const products = [
    { name: 'Chicha Jirac',  price: 8.0,  color: '#9d174d', cat: 'Chicha' },
    { name: 'Chicha Fraise', price: 10.0, color: '#be123c', cat: 'Chicha' },
    { name: 'Chicha Menthe', price: 10.0, color: '#15803d', cat: 'Chicha' },
    { name: 'Chicha Pomme',  price: 10.0, color: '#84cc16', cat: 'Chicha' },
    { name: 'Chicha Fekher', price: 12.0, color: '#b91c1c', cat: 'Chicha' },
    { name: 'Rami',          price: 5.0,  color: '#1e3a8a', cat: 'Jeux' },
    { name: 'Chkobba',       price: 3.0,  color: '#b45309', cat: 'Jeux' },
    { name: 'Belote',        price: 5.0,  color: '#0f766e', cat: 'Jeux' },
    { name: 'The Vert',      price: 2.5,  color: '#22c55e', cat: 'Boissons' },
    { name: 'The Rouge',     price: 2.5,  color: '#dc2626', cat: 'Boissons' },
    { name: 'Citronnade',    price: 4.5,  color: '#eab308', cat: 'Boissons' },
    { name: 'Jus Orange',    price: 5.5,  color: '#f97316', cat: 'Boissons' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, storeId } });
    if (existing) {
      console.log('  Existe déjà:', p.name);
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          storeId,
          categoryId: catIds[p.cat]
        }
      });
      console.log('  Créé:', p.name);
    }
  }

  console.log('\nSeed terminé avec succès !');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
