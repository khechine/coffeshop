/**
 * Domaine : FISCAL
 * ─────────────────────────────────────────────────────────────
 * Rôle métier :
 *   Chaînage fiscal des ventes. Garantit l'intégrité et la
 *   non-répudiation des tickets via un hash HMAC-SHA256 dépendant
 *   du ticket précédent ("GENESIS_HASH" pour le premier).
 *
 * C'est une fonction pure : aucune I/O. Les données critiques de
 * la vente + le hash précédent produisent un hash déterministe à
 * partir d'un secret par boutique.
 *
 * Hypothèses métier tranchées :
 *  - Un `fiscalSecret` manquant est généré aléatoirement (32 bytes,
 *    hex) par l'appelant ; ce service ne le génère pas (responsabilité
 *    de la couche de persistance).
 *  - Format de numéro : `FAC-<année>-<seq à 6 chiffres>`.
 */

import * as crypto from 'crypto';

export const GENESIS_HASH = 'GENESIS_HASH';

/** Meta-données purement calculatoires d'une vente fiscale. */
export interface NextFiscalPayload {
  /** Numéro fiscal complet, ex: FAC-2026-000001 */
  fiscalNumber: string;
  /** Séquence (entier) pour cette vente */
  sequenceNumber: number;
  /** Hash HMAC calculé */
  hash: string;
  /** Entrée brute qui a servi au hash (audit) */
  hashInput: string;
  /** Hash du ticket précédent */
  previousHash: string;
  /** Jour fiscal "YYYY-MM-DD" */
  fiscalDay: string;
}

/**
 * Calcule les métadonnées fiscales de la prochaine vente d'une
 * boutique.
 *
 * @param params
 *   - storeId: boutique
 *   - fiscalSecret: secret de signature (jamais vide)
 *   - currentFiscalSequence: dernière séquence connue (base 0)
 *   - previousHash: hash du dernier ticket fiscal (ou GENESIS_HASH)
 *   - totalTtc: total TTC de la vente
 *   - now: horodatage injectable (testabilité/déterminisme)
 */
export function buildNextFiscalMetadata(params: {
  storeId: string;
  fiscalSecret: string;
  currentFiscalSequence: number;
  previousHash?: string | null;
  totalTtc: number;
  now?: Date;
}): NextFiscalPayload {
  const now = params.now ?? new Date();
  const sequenceNumber = params.currentFiscalSequence + 1;
  const year = now.getFullYear();
  const fiscalNumber = `FAC-${year}-${String(sequenceNumber).padStart(6, '0')}`;
  const fiscalDay = now.toISOString().split('T')[0];
  const timestampIso = now.toISOString();
  const previousHash = params.previousHash || GENESIS_HASH;

  const hashInput = `${params.storeId}|${fiscalNumber}|${params.totalTtc}|${timestampIso}|${previousHash}`;
  const hash = crypto
    .createHmac('sha256', params.fiscalSecret)
    .update(hashInput)
    .digest('hex');

  return {
    fiscalNumber,
    sequenceNumber,
    hash,
    hashInput,
    previousHash,
    fiscalDay,
  };
}

/**
 * Calcule le hash d'annulation (VOID) d'une vente fiscale, pour
 * chaîner l'opération d'annulation dans le registre.
 */
export function buildVoidHash(params: {
  fiscalNumber?: string | null;
  previousHash?: string | null;
  fiscalSecret: string;
  now?: Date;
}): { hash: string; hashInput: string } {
  const now = params.now ?? new Date();
  const previousHash = params.previousHash || GENESIS_HASH;
  const cancelInput = `VOID|${params.fiscalNumber || ''}|${now.toISOString()}|${previousHash}`;
  const hash = crypto
    .createHmac('sha256', params.fiscalSecret)
    .update(cancelInput)
    .digest('hex');

  return { hash, hashInput: cancelInput };
}
