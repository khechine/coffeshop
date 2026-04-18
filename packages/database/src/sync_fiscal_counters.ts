import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncCounters() {
  console.log('🔄 Initialisation des compteurs de séquence fiscale...');

  try {
    const stores = await prisma.store.findMany();

    for (const store of stores) {
      // Trouver le max sequenceNumber actuel pour ce store
      const lastSale = await prisma.sale.findFirst({
        where: { storeId: store.id, isFiscal: true },
        orderBy: { sequenceNumber: 'desc' }
      });

      const maxSeq = lastSale?.sequenceNumber || 0;

      await prisma.store.update({
        where: { id: store.id },
        data: { currentFiscalSequence: maxSeq }
      });

      console.log(`✅ Store "${store.name}" : Compteur initialisé à ${maxSeq}`);
    }

    console.log('✨ Synchronisation terminée.');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation :', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncCounters();
