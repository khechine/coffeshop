import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const storeId = 'cmneqjtdn00038lbjjm3xv9pa';
  console.log(`Seeding Tables and Baristas for store: ${storeId}`);

  // Check if store exists
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    console.error(`Store with ID ${storeId} not found!`);
    process.exit(1);
  }

  // 1. Create Tables
  const tableData = [];
  for (let i = 1; i <= 10; i++) {
    tableData.push({
      label: `Table ${i}`,
      capacity: i <= 4 ? 2 : 4,
      storeId: storeId,
    });
  }

  // Create many tables
  for (const t of tableData) {
    await prisma.storeTable.upsert({
      where: { id: `table-${storeId}-${t.label}` }, // We can use a custom ID or just use create
      update: {},
      create: {
        label: t.label,
        capacity: t.capacity,
        storeId: t.storeId,
      }
    });
  }
  console.log('10 Tables created/updated.');

  // 2. Create Baristas
  const passwordHash = await bcrypt.hash('barista123', 10);
  const baristas = [
    { name: 'Barista Ahmed', email: `ahmed@${storeId}.com`, pin: '1111' },
    { name: 'Barista Sarah', email: `sarah@${storeId}.com`, pin: '2222' },
    { name: 'Barista Karim', email: `karim@${storeId}.com`, pin: '3333' },
  ];

  for (const b of baristas) {
    await prisma.user.upsert({
      where: { email: b.email },
      update: {
        pinCode: b.pin,
        role: 'CASHIER',
        storeId: storeId,
      },
      create: {
        name: b.name,
        email: b.email,
        password: passwordHash,
        pinCode: b.pin,
        role: 'CASHIER',
        storeId: storeId,
        permissions: ['POS'],
      }
    });
  }
  console.log('3 Baristas created/updated (Ahmed: 1111, Sarah: 2222, Karim: 3333).');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
