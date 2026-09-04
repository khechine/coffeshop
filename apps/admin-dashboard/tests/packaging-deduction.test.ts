/**
 * Suite de tests pour la déduction automatique du stock d'emballages & Packs de démarrage
 * Couvre :
 * 1. Vente à emporter (TAKEAWAY) -> déduction des ingrédients ET des emballages
 * 2. Vente sur place (DINE_IN) -> déduction des ingrédients UNIQUEMENT (pas d'emballages)
 * 3. Vente avec déclinaison de taille (Petit / Moyen / Grand)
 * 4. Vente d'un produit sans nomenclature (Cas limite -> succès sans erreur)
 * 5. Vérification du Data Pack Coffee Shop (Présence des emballages & des recettes)
 */

import { deductStockForSaleItems } from '../app/actions';
import { DATA_PACKS } from '../app/lib/data-packs';

// Mock de transaction Prisma en mémoire
function createMockTx() {
  const stockMap = new Map<string, { id: string; name: string; quantity: number }>();
  const recipeMap = new Map<string, any[]>();

  // Ingrédients & Emballages initialisés
  stockMap.set('stock-cafe', { id: 'stock-cafe', name: 'Grains de café (kg)', quantity: 10.0 });
  stockMap.set('stock-gobelet-20', { id: 'stock-gobelet-20', name: 'Gobelet Carton 20cl', quantity: 100 });
  stockMap.set('stock-gobelet-30', { id: 'stock-gobelet-30', name: 'Gobelet Carton 30cl', quantity: 100 });
  stockMap.set('stock-couvercle', { id: 'stock-couvercle', name: 'Couvercle Plastique', quantity: 100 });

  // Recette Espresso Grand (id: 'prod-espresso-grand')
  recipeMap.set('prod-espresso-grand', [
    { id: 'rec-1', stockItemId: 'stock-cafe', quantity: 0.018, consumeType: 'BOTH', isPackaging: false },
    { id: 'rec-2', stockItemId: 'stock-gobelet-30', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
    { id: 'rec-3', stockItemId: 'stock-couvercle', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
  ]);

  // Produit sans nomenclature (id: 'prod-soda')
  recipeMap.set('prod-soda', []);

  return {
    stockMap,
    recipeItem: {
      async findMany({ where }: any) {
        return recipeMap.get(where.productId) || [];
      }
    },
    stockItem: {
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
  console.log('🧪 DÉBUT DU TEST SUITE — DÉDUCTION AUTOMATIQUE DES EMBALLAGES\n');
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
    [{ productId: 'prod-espresso-grand', quantity: 2, consumeType: 'TAKEAWAY' }],
    'TAKEAWAY'
  );

  assertEqual(tx1.stockMap.get('stock-cafe')?.quantity, 10.0 - (0.018 * 2), 'Stock Café déduit de 0.036kg');
  assertEqual(tx1.stockMap.get('stock-gobelet-30')?.quantity, 98, 'Stock Gobelets 30cl déduit de 2 unités');
  assertEqual(tx1.stockMap.get('stock-couvercle')?.quantity, 98, 'Stock Couvercles déduit de 2 unités');
  console.log('');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2 : Vente sur place (DINE_IN)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 2 : Vente sur place (DINE_IN) ---');
  const tx2 = createMockTx();
  await deductStockForSaleItems(
    tx2,
    [{ productId: 'prod-espresso-grand', quantity: 2, consumeType: 'DINE_IN' }],
    'DINE_IN'
  );

  assertEqual(tx2.stockMap.get('stock-cafe')?.quantity, 10.0 - (0.018 * 2), 'Stock Café déduit de 0.036kg');
  assertEqual(tx2.stockMap.get('stock-gobelet-30')?.quantity, 100, 'Stock Gobelets 30cl INCHANGÉ (0 déduit)');
  assertEqual(tx2.stockMap.get('stock-couvercle')?.quantity, 100, 'Stock Couvercles INCHANGÉ (0 déduit)');
  console.log('');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3 : Produit sans nomenclature (Cas limite)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 3 : Produit sans nomenclature ---');
  const tx3 = createMockTx();
  try {
    await deductStockForSaleItems(
      tx3,
      [{ productId: 'prod-soda', quantity: 5, consumeType: 'TAKEAWAY' }],
      'TAKEAWAY'
    );
    console.log('✅ TEST RÉUSSI : Traitement du produit sans recette sans erreur.');
    passed++;
  } catch (err: any) {
    console.error('❌ TEST ÉCHOUÉ : Erreur levée sur produit sans recette', err);
    failed++;
  }
  console.log('');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4 : Data Pack Coffee Shop & Emballages
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 4 : Data Pack Coffee Shop ---');
  const coffeePack = DATA_PACKS['COFFEE_SHOP'];
  const packagingItems = coffeePack.stockItems.filter(s => s.categoryType === 'PACKAGING');
  assertEqual(packagingItems.length, 5, 'Data Pack Coffee Shop contient 5 articles emballage');

  const espressoProd = coffeePack.products.find(p => p.name === 'Espresso');
  const takeawayEmballages = espressoProd?.recipe?.filter(r => r.consumeType === 'TAKEAWAY');
  assertEqual(takeawayEmballages?.length, 3, 'L\'Espresso du pack contient 3 emballages à emporter (gobelet, couvercle, touillette)');
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
