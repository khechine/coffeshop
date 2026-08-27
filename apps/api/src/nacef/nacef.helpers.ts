/**
 * NACEF Helper utilities
 */

/**
 * Convert Dinars (DT) to integer millimes
 * e.g., 15.500 DT → 15500 millimes
 */
export function dtToMillimes(dt: number): number {
  return Math.round(dt * 1000);
}

/**
 * Convert millimes to Dinars (DT)
 * e.g., 15500 millimes → 15.500 DT
 */
export function millimesToDt(millimes: number): number {
  return millimes / 1000;
}

/**
 * Map internal payment method to NACEF payment method
 */
export function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    'CASH': 'cash',
    'CARD': 'bank_card',
    'CHECK': 'check',
    'MOBILE': 'mobile_payment',
    'LOYALTY': 'contre_bon',
    'RESTAURANT_TICKET': 'restaurant_ticket',
    'WIRE_TRANSFER': 'wire_transfer',
  };
  return mapping[method?.toUpperCase()] || 'cash';
}

/**
 * Map internal operation type to NACEF operation type
 */
export function mapOperationType(isVoid: boolean, isDuplicate?: boolean, isProforma?: boolean): string {
  if (isDuplicate) return 'DUPLICATE';
  if (isProforma) return 'PROFORMA';
  if (isVoid) return 'REFUND';
  return 'TICKET';
}

/**
 * Map tax rate percentage to NACEF tax code
 */
export function taxRateToCode(taxRate: number, existingCode?: string): string {
  if (existingCode) return existingCode;
  if (taxRate === 0) return 'EXONERE';
  if (taxRate <= 0.07) return 'TVA7';
  if (taxRate <= 0.13) return 'TVA13';
  if (taxRate <= 0.19) return 'TVA19';
  return `TVA${Math.round(taxRate * 100)}`;
}

/**
 * Generate a NACEF-compliant transaction ID
 * Format: YYXXXXXX (8 chars minimum, 48 max)
 *
 * Supports fiscal number formats:
 *  - F-YYYY-XXXXXX  (ex: F-2026-000123   → 26000123)
 *  - FAC-YYYY-XXXXXX (ex: FAC-2026-000123 → 26000123)
 *  - Fallback horodaté si format non reconnu
 */
export function generateTransactionId(fiscalNumber: string): string {
  if (fiscalNumber) {
    // Gère F-YYYY-SEQ et FAC-YYYY-SEQ
    const match = fiscalNumber.match(/-?(\d{4})-(\d+)$/);
    if (match) {
      const yearShort = match[1].slice(-2); // 2026 → "26"
      const seq = match[2].padStart(6, '0'); // "123" → "000123"
      const id = `${yearShort}${seq}`;
      // Vérifier contrainte longueur 8-48
      if (id.length >= 8 && id.length <= 48) return id;
    }
  }

  // Fallback robuste : YY + timestamp partiel (garantit l'unicité)
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const ts = String(now.getTime()).slice(-10); // 10 derniers chiffres
  const fallback = `${yy}${ts}`.slice(0, 48);
  return fallback.length >= 8 ? fallback : fallback.padEnd(8, '0');
}

/**
 * Tronque une chaîne à une longueur maximale NACEF
 * Évite les violations de maxLength sur les champs originator
 */
export function truncateNacef(value: string | undefined | null, maxLen: number): string {
  if (!value) return '';
  return value.slice(0, maxLen);
}
