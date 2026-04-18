import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function auditFiscal() {
  console.log('🚀 Démarrage de l\'audit fiscal NACEF...\n');

  try {
    const stores = await prisma.store.findMany({
      where: { isFiscalEnabled: true }
    });

    if (stores.length === 0) {
      console.log('ℹ️ Aucune boutique avec le mode fiscal activé.');
      return;
    }

    for (const store of stores) {
      console.log(`--- Boutique : ${store.name} (${store.id}) ---`);

      // 1. Audit des Ventes (Sales)
      const sales = await prisma.sale.findMany({
        where: { storeId: store.id, isFiscal: true },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`📊 Vérification de ${sales.length} ventes...`);
      let previousHash = '0'.repeat(64);
      let errors = 0;

      for (const sale of sales) {
        // Re-calcul du Hash
        // Si hashInput est stocké, on l'utilise directement (méthode robuste)
        // Sinon, on tente une reconstruction (legacy)
        const hashInputToVerify = sale.hashInput || `${sale.fiscalNumber}|${Number(sale.total).toFixed(3).replace('.000', '')}|${sale.createdAt.toISOString()}|${sale.previousHash}`;
        
        const calculatedHash = crypto.createHash('sha256').update(hashInputToVerify).digest('hex');

        if (calculatedHash !== sale.hash) {
          console.error(`❌ CORRUPTION DETECTED: Sale ${sale.id} (Fact: ${sale.fiscalNumber})`);
          console.error(`   Stored Hash:     ${sale.hash}`);
          console.error(`   Calculated Hash: ${calculatedHash}`);
          errors++;
        }

        if (sale.previousHash !== previousHash) {
          console.error(`❌ CHAIN BREAK: Sale ${sale.id} expects previous hash ${sale.previousHash} but got ${previousHash}`);
          errors++;
        }

        previousHash = sale.hash || '';
      }

      // 2. Audit des Rapports Z
      const zReports = await prisma.zReport.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`📊 Vérification de ${zReports.length} rapports Z...`);
      let previousZHash = '0'.repeat(64);

      for (const z of zReports) {
        const calculatedZHash = crypto.createHash('sha256').update(z.hashInput || '').digest('hex');

        if (calculatedZHash !== z.hash) {
          console.error(`❌ CORRUPTION DETECTED: Z-Report ${z.id} (Day: ${z.reportDay})`);
          errors++;
        }

        if (z.previousZHash !== previousZHash) {
          console.error(`❌ Z-CHAIN BREAK: Z-Report ${z.id} expects previous Z-hash ${z.previousZHash} but got ${previousZHash}`);
          errors++;
        }

        previousZHash = z.hash || '';
      }

      if (errors === 0) {
        console.log('✅ Intégrité vérifiée : AUCUNE corruption détectée.\n');
      } else {
        console.error(`⚠️ Audit terminé avec ${errors} erreurs d'intégrité.\n`);
      }
    }
  } catch (error) {
    console.error('💥 Erreur fatale lors de l\'audit :', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditFiscal();
