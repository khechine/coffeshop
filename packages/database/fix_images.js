const { PrismaClient } = require('./generated-client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RE-SEEDING IMAGES ONLY ---');

  // We'll update all existing products with solid, working images
  const products = await prisma.marketplaceProduct.findMany({});
  
  const safeImages = [
    '/images/elkassa-logo.png', // Coffee brew
    '/images/elkassa-logo.png', // Latte
    '/images/elkassa-logo.png', // Beans
    '/images/elkassa-logo.png', // Equipment
    '/images/elkassa-logo.png', // Pastry
    '/images/elkassa-logo.png', // Milk/Cream
    '/images/elkassa-logo.png'  // Coffee cup
  ];

  for (let i = 0; i < products.length; i++) {
    await prisma.marketplaceProduct.update({
      where: { id: products[i].id },
      data: {
        image: safeImages[i % safeImages.length]
      }
    });
  }

  console.log('--- IMAGES UPDATED ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
