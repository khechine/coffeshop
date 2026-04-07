const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  let updatedCount = 0;

  for (const user of users) {
    // If the password doesn't start with $2 (bcrypt identifier), we should hash it
    if (user.password && !user.password.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log(`Updated password for user: ${user.email}`);
      updatedCount++;
    }
  }

  console.log(`Finished updating. Total users fixed: ${updatedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
