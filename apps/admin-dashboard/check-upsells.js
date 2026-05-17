const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const upsells = await prisma.vendorProductUpsell.findMany({
      include: {
        targetProduct: true
      }
    });
    console.log("Upsells count:", upsells.length);
    console.log("Upsells:", JSON.stringify(upsells, null, 2));
    
    const products = await prisma.vendorProduct.findMany({
      select: { id: true, name: true }
    });
    console.log("Products count:", products.length);
    console.log("Products:", JSON.stringify(products, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
