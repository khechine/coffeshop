const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.category.findMany({ select: { id: true, name: true, storeId: true, parentId: true } });
  console.log(cats);
}
main().catch(console.error).finally(() => prisma.$disconnect());
