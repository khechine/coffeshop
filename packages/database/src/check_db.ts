import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  try {
    const storeCount = await prisma.store.count();
    console.log(`Connection successful! Total stores: ${storeCount}`);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
