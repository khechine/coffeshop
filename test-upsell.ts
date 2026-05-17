import { prisma } from './packages/database/src/index.ts';
async function main() {
  const count = await prisma.vendorProductUpsell.count();
  console.log("Upsell count:", count);
  const all = await prisma.vendorProductUpsell.findMany();
  console.log("Upsells:", all);
}
main().catch(console.error).finally(() => prisma.$disconnect());
