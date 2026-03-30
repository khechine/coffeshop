const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TARGET = 'cmn8ppakp000170hvqsgatjfi'; // store 2

async function main() {
  const store = await prisma.store.findUnique({ where: { id: TARGET } });
  if (!store) {
    console.log('Store introuvable:', TARGET);
    return;
  }
  console.log('Seed pour store:', store.name);

  const categories = ['Chicha', 'Jeux', 'Boissons', 'Cafés', 'Cafes', 'Jus', 'Pizzas', 'Gâteaux', 'Gateaux'];
  const catIds = {};
  for (const name of categories) {
    let c = await prisma.category.findFirst({ where: { name } });
    if (!c) c = await prisma.category.create({ data: { name } });
    catIds[name] = c.id;
  }

  const products = [
    { name: 'Chicha Jirac',  price: 8.0,  cat: 'Chicha' },
    { name: 'Chicha Fraise', price: 10.0, cat: 'Chicha' },
    { name: 'Chicha Menthe', price: 10.0, cat: 'Chicha' },
    { name: 'Chicha Pomme',  price: 10.0, cat: 'Chicha' },
    { name: 'Chicha Fekher', price: 12.0, cat: 'Chicha' },
    { name: 'Rami',          price: 5.0,  cat: 'Jeux' },
    { name: 'Chkobba',       price: 3.0,  cat: 'Jeux' },
    { name: 'Belote',        price: 5.0,  cat: 'Jeux' },
    { name: 'Thé Vert',      price: 2.5,  cat: 'Boissons' },
    { name: 'Thé Rouge',     price: 2.5,  cat: 'Boissons' },
    { name: 'Citronnade',    price: 4.5,  cat: 'Boissons' },
    { name: 'Jus d\'Orange', price: 5.5,  cat: 'Boissons' },
    { name: 'Espresso',      price: 1.5,  cat: 'Cafes' },
    { name: 'Cappuccino',    price: 3.0,  cat: 'Cafes' },
    { name: 'Latte',         price: 3.5,  cat: 'Cafes' },
    { name: 'Jus Pomme',     price: 4.0,  cat: 'Jus' },
    { name: 'Jus Fraise',    price: 4.5,  cat: 'Jus' },
    { name: 'Pizza Margherita', price: 12.0, cat: 'Pizzas' },
    { name: 'Croissant',     price: 2.5,  cat: 'Gateaux' },
    { name: 'Cheesecake',    price: 5.0,  cat: 'Gateaux' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, storeId: TARGET } });
    if (!existing) {
      await prisma.product.create({ data: { name: p.name, price: p.price, storeId: TARGET, categoryId: catIds[p.cat] } });
      console.log('CRÉÉ:', p.name);
    } else {
      console.log('DÉJÀ FAIT:', p.name);
    }
  }
}

main().then(() => prisma.$disconnect()).catch(console.error);
