/**
 * Tests unitaires du domaine FISCAL — chaînage HMAC et numérotation.
 *
 * Couvre la construction des métadonnées fiscales (numéro, séquence,
 * hash), le cas "genesis" (premier ticket), la dérivabilité déterministe
 * du hash, le chaînage avec le hash précédent et le hash d'annulation.
 */
import { describe, it, expect } from 'vitest';
import {
  buildNextFiscalMetadata,
  buildVoidHash,
  GENESIS_HASH,
} from './fiscal-chain';

const FIXED_DATE = new Date('2026-09-01T12:00:00.000Z');

describe('buildNextFiscalMetadata', () => {
  it('builds_fiscal_number_sequence_and_hash_for_next_sale', () => {
    const meta = buildNextFiscalMetadata({
      storeId: 'store1',
      fiscalSecret: 'secret',
      currentFiscalSequence: 5,
      previousHash: 'abc123',
      totalTtc: 19.9,
      now: FIXED_DATE,
    });

    expect(meta.sequenceNumber).toBe(6);
    expect(meta.fiscalNumber).toBe('FAC-2026-000006');
    expect(meta.fiscalDay).toBe('2026-09-01');
    expect(meta.previousHash).toBe('abc123');
    expect(meta.hashInput).toBe(`store1|FAC-2026-000006|19.9|${FIXED_DATE.toISOString()}|abc123`);
    // HMAC-SHA256 produit 64 chars hex
    expect(meta.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('uses_genesis_hash_and_sequence_1_for_first_sale', () => {
    const meta = buildNextFiscalMetadata({
      storeId: 'store1',
      fiscalSecret: 'secret',
      currentFiscalSequence: 0,
      previousHash: undefined,
      totalTtc: 5,
      now: FIXED_DATE,
    });

    expect(meta.sequenceNumber).toBe(1);
    expect(meta.fiscalNumber).toBe('FAC-2026-000001');
    expect(meta.previousHash).toBe(GENESIS_HASH);
    expect(meta.hashInput).toContain('|GENESIS_HASH');
  });

  it('is_deterministic_for_same_inputs', () => {
    const params = {
      storeId: 'store1',
      fiscalSecret: 'secret',
      currentFiscalSequence: 3,
      previousHash: 'xyz',
      totalTtc: 12.5,
      now: FIXED_DATE,
    };
    expect(buildNextFiscalMetadata(params).hash).toBe(buildNextFiscalMetadata(params).hash);
  });

  it('produces_different_hash_when_chained_hash_changes', () => {
    const base = {
      storeId: 'store1',
      fiscalSecret: 'secret',
      currentFiscalSequence: 3,
      totalTtc: 10,
      now: FIXED_DATE,
    };
    const withPrevA = buildNextFiscalMetadata({ ...base, previousHash: 'AAAA' });
    const withPrevB = buildNextFiscalMetadata({ ...base, previousHash: 'BBBB' });
    expect(withPrevA.hash).not.toBe(withPrevB.hash);
  });

  it('produces_different_hash_for_different_secret', () => {
    const base = {
      storeId: 'store1',
      currentFiscalSequence: 1,
      previousHash: 'abc',
      totalTtc: 10,
      now: FIXED_DATE,
    };
    const secretA = buildNextFiscalMetadata({ ...base, fiscalSecret: 'A' });
    const secretB = buildNextFiscalMetadata({ ...base, fiscalSecret: 'B' });
    expect(secretA.hash).not.toBe(secretB.hash);
  });
});

describe('buildVoidHash', () => {
  it('chains_void_hash_with_previous_hash', () => {
    const voidResult = buildVoidHash({
      fiscalNumber: 'FAC-2026-000006',
      previousHash: 'prevhash',
      fiscalSecret: 'secret',
      now: FIXED_DATE,
    });

    expect(voidResult.hashInput).toContain('VOID|FAC-2026-000006');
    expect(voidResult.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('uses_genesis_when_no_previous_hash', () => {
    const voidResult = buildVoidHash({
      fiscalNumber: 'FAC-2026-000001',
      previousHash: null,
      fiscalSecret: 'secret',
      now: FIXED_DATE,
    });
    expect(voidResult.hashInput).toContain(`|${GENESIS_HASH}`);
  });
});
