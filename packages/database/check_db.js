const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.supplierOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { store: true }
  });
  console.log("Last 5 orders:");
  orders.forEach(o => {
    console.log(`- ${o.id} | Status: ${o.status} | Store: ${o.store?.name} | Total: ${o.total}`);
  });

  const settlements = await prisma.marketplaceSettlement.findMany({
    orderBy: { processedAt: 'desc' },
    take: 5
  });
  console.log("\nLast 5 settlements:");
  console.log(settlements);

  const wallets = await prisma.vendorWallet.findMany({
    take: 5
  });
  console.log("\nWallets:");
  console.log(wallets);
}

main().catch(console.error).finally(() => prisma.$disconnect());
