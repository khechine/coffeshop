/**
 * Domaine : FISCAL
 * ─────────────────────────────────────────────────────────────
 * Rôle métier :
 *   Extraction des calculs de TVA (HT / TTC / taxe) hors de la
 *   persistance. C'est le cœur de la matière fiscale du POS.
 *
 * Cette couche est volontairement dépourvue de toute dépendance
 * à la base de données ou à NestJS : elle reçoit des données
 * brutes et renvoie des résultats purs, ce qui la rend
 * trivialement testable.
 *
 * Hypothèses métier tranchées :
 *  - Si un taux de TVA n'est pas retrouvé pour un produit, on
 *    applique le taux par défaut TUNISIE (19 % = 0.19) — conformément
 *    au comportement historique (`?? 0.19`). Une défaillance silencieuse
 *    est conservée pour ne pas casser le flux, mais exposée via les
 *    `missingTaxRates` renvoyés.
 *  - Arrondis : tous les montants sont arrondis à 3 décimales
 *    (millimes) comme dans le code d'origine.
 */

export interface TaxCalculationInput {
  productId: string;
  quantity: number;
  /** Prix TTC unitaire tel que vendu */
  price: number;
}

export interface TaxCalculatedItem {
  productId: string;
  quantity: number;
  price: number;
  /** Prix unitaire HT = price / (1 + taxRate), arrondi à 3 déc. */
  unitPriceHt: number;
  taxRate: number;
  taxAmount: number;
  totalHt: number;
  totalTtc: number;
}

export interface TaxCalculationResult {
  items: TaxCalculatedItem[];
  /** Somme des HT (arrondie à 3 déc.) */
  totalHt: number;
  /** Somme des taxes (arrondie à 3 déc.) */
  totalTax: number;
  /** Total TTC = totalHt + totalTax (arrondi à 3 déc.) */
  totalTtc: number;
  /**
   * Ventilation de la TVA par taux, indexée par libellé
   * ex : { "19.00%": 1.9, "7.00%": 0.42 }
   */
  taxBreakdown: Record<string, number>;
  /** Liste des produits dont le taux n'était pas disponible */
  missingTaxRates: string[];
}

const DEFAULT_TAX_RATE = 0.19;
const ROUND = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Calcule les totaux fiscaux (HT, TVA, TTC) d'une vente à partir
 * des lignes brutes et d'un mapping produit → taux de TVA.
 *
 * @param items Les lignes de vente avec prix TTC unitaire
 * @param productTaxRates Mapping `productId → taxRate` (optionnel)
 */
export function calculateTaxTotals(
  items: TaxCalculationInput[],
  productTaxRates: Record<string, number> = {},
): TaxCalculationResult {
  let totalHtGlobal = 0;
  let totalTaxGlobal = 0;
  const taxBreakdown: Record<string, number> = {};
  const missingTaxRates: string[] = [];

  const calculated = items.map((item) => {
    const taxRate = productTaxRates[item.productId] ?? DEFAULT_TAX_RATE;

    if (!(item.productId in productTaxRates)) {
      missingTaxRates.push(item.productId);
    }

    const unitPriceHt = item.price / (1 + taxRate);
    const itemTotalHt = unitPriceHt * item.quantity;
    const itemTaxAmount = itemTotalHt * taxRate;

    totalHtGlobal += itemTotalHt;
    totalTaxGlobal += itemTaxAmount;

    const rateLabel = `${(taxRate * 100).toFixed(2)}%`;
    taxBreakdown[rateLabel] = (taxBreakdown[rateLabel] || 0) + itemTaxAmount;

    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      unitPriceHt: ROUND(unitPriceHt),
      taxRate,
      taxAmount: ROUND(itemTaxAmount),
      totalHt: ROUND(itemTotalHt),
      totalTtc: ROUND(itemTotalHt + itemTaxAmount),
    };
  });

  const totalHt = ROUND(totalHtGlobal);
  const totalTax = ROUND(totalTaxGlobal);

  return {
    items: calculated,
    totalHt,
    totalTax,
    totalTtc: ROUND(totalHt + totalTax),
    taxBreakdown,
    missingTaxRates,
  };
}
