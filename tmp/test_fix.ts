import { prisma } from '../packages/database/src/client';

async function test() {
  try {
    const store = await prisma.store.findFirst();
    if (!store) {
      console.log('No store found to test');
      return;
    }
    
    console.log('Testing update on store:', store.id);
    await prisma.store.update({
      where: { id: store.id },
      data: { forceMarketplaceAccess: !store.forceMarketplaceAccess }
    });
    console.log('Update successful!');
    
    // Revert
    await prisma.store.update({
      where: { id: store.id },
      data: { forceMarketplaceAccess: store.forceMarketplaceAccess }
    });
    console.log('Revert successful!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
