/**
 * Tests unitaires du domaine FISCAL — calculateTaxTotals.
 *
 * Couvre les cas nominaux (TVA 19 %), les cas limites (taux inconnu,
 * quantité nulle, arrondis) et les cas d'erreur (aucune ligne).
 */
import { describe, it, expect } from 'vitest';
import { calculateTaxTotals } from './fiscal-calculator';

describe('calculateTaxTotals', () => {
  it('calculates_HT_TVA_TTC_and_breakdown_for_19_percent_tax', () => {
    // Prix TTC unitaire 1.190 DT => HT = 1.000, TVA = 0.190
    const result = calculateTaxTotals(
      [{ productId: 'p1', quantity: 1, price: 1.19 }],
      { p1: 0.19 },
    );

    expect(result.totalHt).toBeCloseTo(1, 3);
    expect(result.totalTax).toBeCloseTo(0.19, 3);
    expect(result.totalTtc).toBeCloseTo(1.19, 3);
    expect(result.items[0].unitPriceHt).toBeCloseTo(1, 3);
    expect(result.items[0].totalTtc).toBeCloseTo(1.19, 3);
    expect(result.taxBreakdown['19.00%']).toBeCloseTo(0.19, 3);
    expect(result.missingTaxRates).toEqual([]);
  });

  it('uses_default_19_percent_and_flags_missing_tax_rate', () => {
    const result = calculateTaxTotals([{ productId: 'unknown', quantity: 2, price: 10 }]);

    // taxRate par défaut 0.19 -> HT = 10/1.19 = 8.403361..., TVA = 1.596638...
    expect(result.items[0].taxRate).toBe(0.19);
    expect(result.missingTaxRates).toEqual(['unknown']);
    expect(result.totalTtc).toBeCloseTo(20, 3);
  });

  it('aggregates_tax_breakdown_per_rate_with_mixed_tax_rates', () => {
    const result = calculateTaxTotals(
      [
        { productId: 'p1', quantity: 1, price: 1.19 },
        { productId: 'p2', quantity: 2, price: 1.07 },
      ],
      { p1: 0.19, p2: 0.07 },
    );

    // p2: HT = 1.07/1.07 = 1.00, TVA = 0.07 * 2 = 0.14
    expect(result.totalHt).toBeCloseTo(3, 3);
    expect(result.totalTax).toBeCloseTo(0.33, 3);
    expect(result.totalTtc).toBeCloseTo(3.33, 3);
    expect(result.taxBreakdown['19.00%']).toBeCloseTo(0.19, 3);
    expect(result.taxBreakdown['7.00%']).toBeCloseTo(0.14, 3);
  });

  it('returns_zero_totals_for_empty_items', () => {
    const result = calculateTaxTotals([]);
    expect(result.items).toEqual([]);
    expect(result.totalHt).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.totalTtc).toBe(0);
    expect(result.taxBreakdown).toEqual({});
    expect(result.missingTaxRates).toEqual([]);
  });

  it('handles_zero_quantity_gracefully', () => {
    const result = calculateTaxTotals([{ productId: 'p1', quantity: 0, price: 1.19 }], { p1: 0.19 });
    expect(result.totalHt).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.totalTtc).toBe(0);
    expect(result.items[0].quantity).toBe(0);
  });

  it('rounds_amounts_to_3_decimals', () => {
    // HT = 33.333... conservé à 3 déc. (333/1000 par arrondi)
    const result = calculateTaxTotals([{ productId: 'p1', quantity: 3, price: 1.19 }], { p1: 0.19 });
    expect(result.items[0].unitPriceHt).toBe(1);
    expect(result.items[0].totalHt).toBe(3);
    // Taxe = 3 * 0.19 = 0.57 exact
    expect(result.items[0].taxAmount).toBe(0.57);
  });

  it('treats_zero_rate_as_exempt', () => {
    const result = calculateTaxTotals([{ productId: 'p1', quantity: 2, price: 5 }], { p1: 0 });
    expect(result.totalHt).toBeCloseTo(10, 3);
    expect(result.totalTax).toBe(0);
    expect(result.totalTtc).toBeCloseTo(10, 3);
    expect(result.taxBreakdown['0.00%']).toBe(0);
  });
});
