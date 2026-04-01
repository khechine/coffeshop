import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const storeId = 'cmneqjtdn00038lbjjm3xv9pa';
    const pin = '1111';
    
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        owners: true,
      }
    });

    if (!store) {
      console.log(`Store ${storeId} not found.`);
      return;
    }

    console.log(`Store: ${store.name}`);
    
    const users = await prisma.user.findMany({
      where: { storeId: storeId }
    });

    console.log(`Users in store ${storeId}:`);
    users.forEach(u => {
      console.log(`- ${u.name} (Role: ${u.role}, PIN: ${u.pinCode})`);
    });

    const matchingPin = users.find(u => u.pinCode === pin);
    if (matchingPin) {
      console.log(`MATCH FOUND: User ${matchingPin.name} has PIN ${pin}`);
    } else {
      console.log(`NO MATCH: No user in this store has PIN ${pin}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
