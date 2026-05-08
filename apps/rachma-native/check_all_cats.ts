import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking all categories tables ---');
  
  const tables = ['marketplaceCategory', 'mktCategory', 'category'];
  for (const table of tables) {
    console.log(`Table: ${table}`);
    try {
      const data = await (prisma as any)[table].findMany({ take: 20 });
      console.log(data.map((i: any) => i.name));
    } catch (e) {
      console.log(`Table ${table} error or missing`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
