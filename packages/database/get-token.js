const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/coffeeshop?schema=public";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log("USER_RECORD:", JSON.stringify(user));
}

main().catch(console.error).finally(() => prisma.$disconnect());
