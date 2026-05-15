import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- marketplaceCategory ---');
  try {
    const cats1 = await (prisma as any).marketplaceCategory.findMany({
      where: { parentId: null },
      include: { children: true }
    });
    console.log(JSON.stringify(cats1.map((c: any) => c.name), null, 2));
  } catch (e) { console.log('Error cat1'); }

  console.log('--- mktCategory ---');
  try {
    const cats2 = await (prisma as any).mktCategory.findMany({
      where: { status: 'ACTIVE' }
    });
    console.log(JSON.stringify(cats2.map((c: any) => c.name), null, 2));
  } catch (e) { console.log('Error cat2'); }
}

main().catch(console.error).finally(() => prisma.$disconnect());
