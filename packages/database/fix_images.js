const { PrismaClient } = require('./generated-client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RE-SEEDING IMAGES ONLY ---');

  // We'll update all existing products with solid, working images
  const products = await prisma.marketplaceProduct.findMany({});
  
  const safeImages = [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600', // Coffee brew
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600', // Latte
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=600', // Beans
    'https://images.unsplash.com/photo-1550989460-0adf5088913?q=80&w=600', // Equipment
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600', // Pastry
    'https://images.unsplash.com/photo-1544145945-f904253db0ad?q=80&w=600', // Milk/Cream
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600'  // Coffee cup
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
