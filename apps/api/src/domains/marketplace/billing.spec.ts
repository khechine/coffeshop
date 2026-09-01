/**
 * Tests unitaires du domaine MARKETPLACE — facturation / grâce.
 *
 * Couvre les cas nominaux (init de grâce, restauration, suspension),
 * les cas limites (jalons 7/5/3 jours, échéance exacte, solde zéro) et
 * les cas d'erreur d'alignement des dates.
 */
import { describe, it, expect } from 'vitest';
import { decideBillingAction, BILLING_CONFIG } from './billing';

// Date de référence fixe (lundi 2026-09-01 12:00 UTC)
const NOW = new Date('2026-09-01T12:00:00.000Z');

/** Renvoie une date à J jours relatifs de NOW. */
const inDays = (days: number) => {
  const d = new Date(NOW.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

describe('decideBillingAction', () => {
  it('initiates_grace_period_of_10_days_on_negative_balance', () => {
    const res = decideBillingAction({
      balance: -100,
      gracePeriodEndsAt: null,
      status: 'ACTIVE',
      now: NOW,
    });
    expect(res.type).toBe('INIT_GRACE');
    if (res.type === 'INIT_GRACE') {
      expect(res.gracePeriodEndsAt).toEqual(inDays(BILLING_CONFIG.GRACE_DAYS));
    }
  });

  it('sends_alert_at_7_days_left', () => {
    const res = decideBillingAction({
      balance: -50,
      gracePeriodEndsAt: inDays(7),
      status: 'ACTIVE',
      now: NOW,
    });
    expect(res.type).toBe('ALERT');
    if (res.type === 'ALERT') expect(res.daysLeft).toBe(7);
  });

  it('sends_alert_at_5_and_3_days_left', () => {
    expect(decideBillingAction({ balance: -50, gracePeriodEndsAt: inDays(5), status: 'ACTIVE', now: NOW }).type).toBe('ALERT');
    expect(decideBillingAction({ balance: -50, gracePeriodEndsAt: inDays(3), status: 'ACTIVE', now: NOW }).type).toBe('ALERT');
  });

  it('suspends_when_grace_expired', () => {
    const res = decideBillingAction({
      balance: -50,
      gracePeriodEndsAt: inDays(-1),
      status: 'ACTIVE',
      now: NOW,
    });
    expect(res.type).toBe('SUSPEND');
  });

  it('does_not_resuspend_already_suspended_vendor', () => {
    const res = decideBillingAction({
      balance: -50,
      gracePeriodEndsAt: inDays(-1),
      status: 'SUSPENDED',
      now: NOW,
    });
    expect(res.type).toBe('NONE');
  });

  it('restores_vendor_with_recovered_positive_balance', () => {
    const res = decideBillingAction({
      balance: +10,
      gracePeriodEndsAt: inDays(5),
      status: 'SUSPENDED',
      now: NOW,
    });
    expect(res.type).toBe('RESTORE');
  });

  it('restores_when_grace_flag_stale_but_positive_balance', () => {
    const res = decideBillingAction({
      balance: +10,
      gracePeriodEndsAt: inDays(2),
      status: 'ACTIVE',
      now: NOW,
    });
    expect(res.type).toBe('RESTORE');
  });

  it('does_nothing_on_zero_balance', () => {
    const res = decideBillingAction({ balance: 0, gracePeriodEndsAt: null, status: 'ACTIVE', now: NOW });
    expect(res.type).toBe('NONE');
  });

  it('does_nothing_on_healthy_positive_balance_no_grace', () => {
    const res = decideBillingAction({ balance: 100, gracePeriodEndsAt: null, status: 'ACTIVE', now: NOW });
    expect(res.type).toBe('NONE');
  });

  it('awaits_in_check_not_an_alert_on_6_days_left', () => {
    // 6 jours n'est pas un jalon → aucune action d'alerte
    const res = decideBillingAction({
      balance: -50,
      gracePeriodEndsAt: inDays(6),
      status: 'ACTIVE',
      now: NOW,
    });
    expect(res.type).toBe('NONE');
  });
});
