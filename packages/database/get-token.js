const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/coffeeshop?schema=public";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'b2bclient-test1@elkassa.com' }
  });
  console.log("USER_RECORD:", JSON.stringify(user));
}

main().catch(console.error).finally(() => prisma.$disconnect());
