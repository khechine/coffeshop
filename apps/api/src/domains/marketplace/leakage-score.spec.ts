/**
 * Tests unitaires du domaine MARKETPLACE — score de fuite (leakage).
 *
 * Couvre les cas nominaux (conversion saine = score faible), les cas
 * limites (zéro interaction, découverte ancienne sans commande) et les
 * seuils de décision (warning, auto-flag, critique).
 */
import { describe, it, expect } from 'vitest';
import {
  computeLeakageScore,
  LEAKAGE_THRESHOLDS,
} from './leakage-score';

const NOW = new Date('2026-09-01T12:00:00.000Z');
const discoveredRecently = new Date('2026-08-27T12:00:00.000Z'); // 5 jours avant
const discoveredLongAgo = new Date('2026-07-20T12:00:00.000Z'); // > 30 jours avant

describe('computeLeakageScore', () => {
  it('returns_zero_score_with_no_interactions', () => {
    const res = computeLeakageScore({
      interactions30d: 0,
      orders30d: 0,
      totalOrders: 0,
      discoveredAt: discoveredRecently,
      now: NOW,
    });
    expect(res.score).toBe(0);
    expect(res.isWarning).toBe(false);
  });

  it('gives_low_score_when_high_conversion_healthy', () => {
    // 10 interactions, 10 commandes => conversion 100% => score 0
    const res = computeLeakageScore({
      interactions30d: 10,
      orders30d: 10,
      totalOrders: 10,
      discoveredAt: discoveredRecently,
      now: NOW,
    });
    expect(res.score).toBe(0);
  });

  it('gives_high_score_when_many_views_no_conversion', () => {
    // 10 vues, 0 commande => conversion 0 => score 80
    const res = computeLeakageScore({
      interactions30d: 10,
      orders30d: 0,
      totalOrders: 0,
      discoveredAt: discoveredRecently,
      now: NOW,
    });
    expect(res.score).toBe(80);
    expect(res.shouldAutoFlag).toBe(true);
  });

  it('adds_bonus_for_long_unordered_relationship', () => {
    // 0 interaction récente mais découverte > 30j sans commande => bonus +20
    const res = computeLeakageScore({
      interactions30d: 0,
      orders30d: 0,
      totalOrders: 0,
      discoveredAt: discoveredLongAgo,
      now: NOW,
    });
    expect(res.score).toBe(20);
  });

  it('caps_score_at_100', () => {
    const res = computeLeakageScore({
      interactions30d: 100,
      orders30d: 0,
      totalOrders: 0,
      discoveredAt: discoveredLongAgo,
      now: NOW,
    });
    expect(res.score).toBe(100);
    expect(res.isCritical).toBe(true);
  });

  it('flags_critical_at_85', () => {
    // conversion ~10% sur 10 => score ~72 + bonus 20 => 92 critique
    const res = computeLeakageScore({
      interactions30d: 10,
      orders30d: 1,
      totalOrders: 0,
      discoveredAt: discoveredLongAgo,
      now: NOW,
    });
    expect(res.score).toBe(92);
    expect(res.isCritical).toBe(true);
    expect(res.isWarning).toBe(true);
  });

  it('does_not_apply_bonus_when_total_orders_exist', () => {
    // Des commandes existent (totalOrders > 0) => aucun bonus même découverte ancienne
    const res = computeLeakageScore({
      interactions30d: 10,
      orders30d: 0,
      totalOrders: 2,
      discoveredAt: discoveredLongAgo,
      now: NOW,
    });
    expect(res.score).toBe(80); // sans bonus
    expect(res.shouldAutoFlag).toBe(true);
  });

  it('exposes_correct_thresholds_constants', () => {
    expect(LEAKAGE_THRESHOLDS.WARNING).toBe(70);
    expect(LEAKAGE_THRESHOLDS.AUTO_FLAG).toBe(80);
    expect(LEAKAGE_THRESHOLDS.CRITICAL).toBe(85);
  });
});
