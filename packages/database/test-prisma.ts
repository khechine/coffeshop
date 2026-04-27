import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const order = await prisma.supplierOrder.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log("Latest Order:", order);
  const st = await prisma.marketplaceSettlement.findMany({ orderBy: { processedAt: 'desc' }, take: 2 });
  console.log("Settlements:", st);
  const wt = await prisma.walletTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
  console.log("Wallet Tx:", wt);
}
run().finally(() => prisma.$disconnect());
