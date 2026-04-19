import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany();
  console.log('PLANS:', JSON.stringify(plans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
