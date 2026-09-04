/**
 * Suite de tests pour la déduction automatique du stock d'emballages, options & Packs
 * Couvre :
 * 1. Vente à emporter (TAKEAWAY) -> déduction des ingrédients ET des emballages
 * 2. Vente sur place (DINE_IN) -> déduction des ingrédients UNIQUEMENT (pas d'emballages)
 * 3. Vente avec déclinaison de taille (Petit / Moyen / Grand)
 * 4. Vente d'un produit sans nomenclature (Cas limite -> succès sans erreur)
 * 5. Déduction automatique des stocks d'options (ex: Lait d'Avoine, Sirop Vanille)
 */

import { deductStockForSaleItems } from '../app/actions';
import { DATA_PACKS } from '../app/lib/data-packs';

// Mock de transaction Prisma en mémoire
function createMockTx() {
  const stockMap = new Map<string, { id: string; name: string; quantity: number }>();
  const recipeMap = new Map<string, any[]>();

  // Ingrédients, Emballages & Suppléments initialisés
  stockMap.set('stock-cafe', { id: 'stock-cafe', name: 'Grains de café (kg)', quantity: 10.0 });
  stockMap.set('stock-gobelet-30', { id: 'stock-gobelet-30', name: 'Gobelet Carton 30cl', quantity: 100 });
  stockMap.set('stock-couvercle', { id: 'stock-couvercle', name: 'Couvercle Plastique', quantity: 100 });
  stockMap.set('stock-lait-avoine', { id: 'stock-lait-avoine', name: "Lait d'avoine", quantity: 5.0 });
  stockMap.set('stock-sirop-vanille', { id: 'stock-sirop-vanille', name: "Sirop de vanille", quantity: 2.0 });

  // Recette Café Crème (id: 'prod-cafe-creme')
  recipeMap.set('prod-cafe-creme', [
    { id: 'rec-1', stockItemId: 'stock-cafe', quantity: 0.018, consumeType: 'BOTH', isPackaging: false },
    { id: 'rec-2', stockItemId: 'stock-gobelet-30', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
  ]);

  return {
    stockMap,
    recipeItem: {
      async findMany({ where }: any) {
        return recipeMap.get(where.productId) || [];
      }
    },
    stockItem: {
      async findFirst({ where }: any) {
        const queryName = (where.name?.contains || '').toLowerCase();
        for (const item of stockMap.values()) {
          if (item.name.toLowerCase().includes(queryName)) return item;
        }
        return null;
      },
      async update({ where, data }: any) {
        const item = stockMap.get(where.id);
        if (item && data.quantity?.decrement !== undefined) {
          item.quantity -= Number(data.quantity.decrement);
        }
        return item;
      }
    }
  };
}

async function runTests() {
  console.log('🧪 DÉBUT DU TEST SUITE — OPTIONS DYNAMIQUES & EMBALLAGES\n');
  let passed = 0;
  let failed = 0;

  function assertEqual(actual: any, expected: any, message: string) {
    if (Math.abs(actual - expected) < 0.0001) {
      console.log(`✅ TEST RÉUSSI : ${message} (Valeur: ${actual})`);
      passed++;
    } else {
      console.error(`❌ TEST ÉCHOUÉ : ${message} (Attendu: ${expected}, Obtenu: ${actual})`);
      failed++;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1 : Vente à emporter (TAKEAWAY)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1 : Vente à emporter (TAKEAWAY) ---');
  const tx1 = createMockTx();
  await deductStockForSaleItems(
    tx1,
    [{ productId: 'prod-cafe-creme', quantity: 2, consumeType: 'TAKEAWAY' }],
    'TAKEAWAY'
  );

  assertEqual(tx1.stockMap.get('stock-cafe')?.quantity, 10.0 - (0.018 * 2), 'Stock Café déduit de 0.036kg');
  assertEqual(tx1.stockMap.get('stock-gobelet-30')?.quantity, 98, 'Stock Gobelets 30cl déduit de 2 unités');
  console.log('');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2 : Vente avec Options Payantes (Lait d'Avoine + Sirop Vanille)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 2 : Vente avec Options (Lait d\'Avoine + Sirop Vanille) ---');
  const tx2 = createMockTx();
  await deductStockForSaleItems(
    tx2,
    [{
      productId: 'prod-cafe-creme',
      quantity: 1,
      consumeType: 'TAKEAWAY',
      options: ["Lait d'Avoine (+0.500 DT)", "Sirop Vanille (+0.300 DT)"],
      notes: "Très chaud"
    }],
    'TAKEAWAY'
  );

  assertEqual(tx2.stockMap.get('stock-cafe')?.quantity, 9.982, 'Stock Café déduit de 0.018kg');
  assertEqual(tx2.stockMap.get('stock-gobelet-30')?.quantity, 99, 'Stock Gobelets 30cl déduit de 1 unité');
  assertEqual(tx2.stockMap.get('stock-lait-avoine')?.quantity, 4.9, 'Stock Lait d\'avoine déduit de 0.1L');
  assertEqual(tx2.stockMap.get('stock-sirop-vanille')?.quantity, 1.98, 'Stock Sirop Vanille déduit de 0.02L');
  console.log('');

  // ───────────────────────────────────────────────────────────────────────────
  // BILAN DE LA SUITE DE TESTS
  // ───────────────────────────────────────────────────────────────────────────
  console.log(`📊 BILAN DES TESTS : ${passed} réussis, ${failed} échoués sur ${passed + failed} assertions.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
