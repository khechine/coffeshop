/**
 * Tests unitaires du domaine NACEF — helpers de conversion et
 * de conformité (dtToMillimes, mapPaymentMethod, mapOperationType,
 * taxRateToCode, generateTransactionId, truncateNacef).
 */
import { describe, it, expect } from 'vitest';
import {
  dtToMillimes,
  millimesToDt,
  mapPaymentMethod,
  mapOperationType,
  taxRateToCode,
  generateTransactionId,
  truncateNacef,
} from '../../nacef/nacef.helpers';

describe('dtToMillimes / millimesToDt', () => {
  it('converts_dinars_to_integer_millimes', () => {
    expect(dtToMillimes(15.5)).toBe(15500);
    expect(dtToMillimes(0)).toBe(0);
    expect(dtToMillimes(1)).toBe(1000);
  });

  it('converts_millimes_back_to_dinars', () => {
    expect(millimesToDt(15500)).toBe(15.5);
    expect(millimesToDt(0)).toBe(0);
  });

  it('rounds_negative_or_fractional_values', () => {
    expect(dtToMillimes(-0.5)).toBe(-500);
  });
});

describe('mapPaymentMethod', () => {
  it('maps_known_methods_to_nacef_codes', () => {
    expect(mapPaymentMethod('CASH')).toBe('cash');
    expect(mapPaymentMethod('CARD')).toBe('bank_card');
    expect(mapPaymentMethod('CHECK')).toBe('check');
    expect(mapPaymentMethod('MOBILE')).toBe('mobile_payment');
    expect(mapPaymentMethod('LOYALTY')).toBe('contre_bon');
  });

  it('maps_meal_vouchers_and_pluxee_to_restaurant_ticket', () => {
    expect(mapPaymentMethod('SODEXO')).toBe('restaurant_ticket');
    expect(mapPaymentMethod('PLUXEE')).toBe('restaurant_ticket');
    expect(mapPaymentMethod('RESTAURANT_TICKET')).toBe('restaurant_ticket');
  });

  it('is_case_insensitive_and_defaults_to_cash', () => {
    expect(mapPaymentMethod('cash')).toBe('cash');
    expect(mapPaymentMethod('UNKNOWN_METHOD')).toBe('cash');
    expect(mapPaymentMethod('')).toBe('cash');
  });
});

describe('mapOperationType', () => {
  it('prioritizes_duplicate_then_proforma_then_refund', () => {
    expect(mapOperationType(false)).toBe('TICKET');
    expect(mapOperationType(true)).toBe('REFUND');
    // Duplicate passe devant void/proforma
    expect(mapOperationType(true, true)).toBe('DUPLICATE');
    expect(mapOperationType(false, false, true)).toBe('PROFORMA');
  });
});

describe('taxRateToCode', () => {
  it('returns_existing_code_when_provided', () => {
    expect(taxRateToCode(0.19, 'A')).toBe('A');
  });

  it('maps_tax_rates_to_codes', () => {
    expect(taxRateToCode(0)).toBe('EXONERE');
    expect(taxRateToCode(0.07)).toBe('TVA7');
    expect(taxRateToCode(0.13)).toBe('TVA13');
    expect(taxRateToCode(0.19)).toBe('TVA19');
    expect(taxRateToCode(0.3)).toBe('TVA30');
  });
});

describe('generateTransactionId', () => {
  it('parses_fiscal_number_formats', () => {
    // F-2026-000123 → "26" + "000123"
    expect(generateTransactionId('F-2026-000123')).toBe('26000123');
    expect(generateTransactionId('FAC-2026-000123')).toBe('26000123');
  });

  it('padding_shorter_sequences_to_six_digits', () => {
    expect(generateTransactionId('F-2026-1')).toBe('26000001');
  });

  it('falls_back_to_timestamp_based_id_for_unrecognized_input', () => {
    const id = generateTransactionId('');
    expect(id.length).toBeGreaterThanOrEqual(8);
    expect(id.length).toBeLessThanOrEqual(48);
  });
});

describe('truncateNacef', () => {
  it('truncates_long_strings_and_keeps_short', () => {
    expect(truncateNacef('abcdefghij', 5)).toBe('abcde');
    expect(truncateNacef('abc', 5)).toBe('abc');
  });

  it('returns_empty_for_nullish', () => {
    expect(truncateNacef(undefined, 5)).toBe('');
    expect(truncateNacef(null as any, 5)).toBe('');
  });
});
