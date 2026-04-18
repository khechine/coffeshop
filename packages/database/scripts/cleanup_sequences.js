const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany();
  for (const store of stores) {
    const sales = await prisma.sale.findMany({
      where: { storeId: store.id, sequenceNumber: null },
      orderBy: { createdAt: 'asc' }
    });
    
    if (sales.length > 0) {
      console.log(`Setting sequences for ${sales.length} sales in store ${store.name}`);
      let currentMax = await prisma.sale.aggregate({
        where: { storeId: store.id },
        _max: { sequenceNumber: true }
      });
      let seq = (currentMax._max.sequenceNumber || 0) + 1;
      
      for (const sale of sales) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { sequenceNumber: seq++ }
        });
      }
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
