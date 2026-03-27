import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const store = await prisma.store.findFirst();
  const express = await prisma.product.findFirst({ where: { name: 'Express' } });
  
  if (!store || !express) return console.error('Data not found');

  console.log(`Making a sale request for 5x Express at ${store.name}`);

  const expressPrice = Number(express.price);
  
  const payload = {
    storeId: store.id,
    total: expressPrice * 5,
    items: [
      {
        productId: express.id,
        quantity: 5,
        price: expressPrice
      }
    ]
  };

  const res = await fetch('http://localhost:3001/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const body = await res.json();
  console.log('Sale Response:', body);

  // Check stock afterwards
  const grains = await prisma.stockItem.findFirst({ where: { name: 'Grains de Café Arabica' }});
  const gobelets = await prisma.stockItem.findFirst({ where: { name: 'Gobelets 8oz' }});
  
  console.log('--- Stock update ---');
  console.log(`Grains de café: ${grains?.quantity} kg (Started with 10)`);
  console.log(`Gobelets: ${gobelets?.quantity} pcs (Started with 500)`);
}

test().catch(console.error).finally(() => prisma.$disconnect());
