import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const storeId = 'clv_store_01';
  const terminals = await prisma.posTerminal.findMany({
    where: { storeId }
  });
  console.log('TERMINALS for', storeId, ':', JSON.stringify(terminals, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
