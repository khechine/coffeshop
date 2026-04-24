
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
    console.log('Latest Categories:', JSON.stringify(cats, null, 2));
    
    const prods = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
    console.log('Latest Products:', JSON.stringify(prods, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
