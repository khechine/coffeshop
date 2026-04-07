const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'haythem@coffeeshop.tn';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`User ${email} not found.`);
  } else {
    console.log(`Found user: ${user.email}`);
    const isPass123 = await bcrypt.compare('password123', user.password);
    const isChangeMe = await bcrypt.compare('changeme123', user.password);
    console.log(`Password is password123: ${isPass123}`);
    console.log(`Password is changeme123: ${isChangeMe}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
