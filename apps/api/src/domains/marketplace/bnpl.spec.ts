/**
 * Tests unitaires du domaine MARKETPLACE — éligibilité BNPL.
 *
 * Couvre les cas nominaux (éligible avec limite plafonnée), les cas
 * limites (0 commande, 1-2 commandes, limites exactes) et les cas
 * d'arrondi/formatage.
 */
import { describe, it, expect } from 'vitest';
import { evaluateBnplEligibility, BNPL_CONFIG } from './bnpl';

const order = (total: number) => ({ total, createdAt: new Date() });

describe('evaluateBnplEligibility', () => {
  it('rejects_with_reason_when_no_orders', () => {
    const res = evaluateBnplEligibility([]);
    expect(res.eligible).toBe(false);
    if (res.eligible === false) {
      expect(res.currentOrders).toBe(0);
      expect(res.minimumOrders).toBe(3);
      expect(res.reason).toContain('Historique requis');
    }
  });

  it('rejects_mentioning_remaining_orders_below_minimum', () => {
    const res = evaluateBnplEligibility([order(100), order(200)]);
    expect(res.eligible).toBe(false);
    if (res.eligible === false) {
      expect(res.currentOrders).toBe(2);
      expect(res.reason).toContain('1 commande(s) supplémentaire(s)');
      expect(res.totalSpent).toBe('300.000 DT');
    }
  });

  it('approves_with_limit_2x_average_order', () => {
    // 3 commandes de 100 => panier moyen 100 => limite 200
    const res = evaluateBnplEligibility([order(100), order(100), order(100)]);
    expect(res.eligible).toBe(true);
    if (res.eligible === true) {
      expect(res.limit).toBe('200.000 DT');
      expect(res.terms).toBe(BNPL_CONFIG.TERMS);
      expect(res.totalHistoryOnPlatform).toBe('300.000 DT');
    }
  });

  it('caps_limit_at_5000_DT', () => {
    // panier moyen très élevé => limite plafonnée à 5000
    const res = evaluateBnplEligibility([order(5000), order(5000), order(5000)]);
    expect(res.eligible).toBe(true);
    if (res.eligible === true) {
      expect(res.limit).toBe(`${BNPL_CONFIG.MAX_LIMIT_DT.toFixed(3)} DT`);
    }
  });

  it('handles_decimal_amounts_with_3_decimal_format', () => {
    const res = evaluateBnplEligibility([order(99.999), order(1.001), order(50.5)]);
    expect(res.eligible).toBe(true);
    if (res.eligible === true) {
      // total = 151.500, moyen = 50.50 => limite 101.000
      expect(res.limit).toBe('101.000 DT');
      expect(res.totalHistoryOnPlatform).toBe('151.500 DT');
    }
  });
});
