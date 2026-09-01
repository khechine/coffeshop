/**
 * Domaine : MARKETPLACE — BNPL (Buy Now, Pay Later)
 * ─────────────────────────────────────────────────────────────
 * Rôle métier :
 *   Détermine l'éligibilité d'une boutique au service exclusif
 *   "Payer plus tard" auprès d'un vendeur, sur la base de son
 *   historique de commandes livrées sur la plateforme.
 *
 * Règles :
 *  - Zéro commande livrée  → non éligible (historique requis).
 *  - < 3 commandes livrées → non éligible, message précisant
 *    combien il en manque.
 *  - ≥ 3 commandes        → éligible, limite = min(2× panier moyen,
 *    5000 DT), payée net à 30 jours.
 *
 * Fonction pure : reçoit la liste des commandes livrées et renvoie
 * la décision formatée.
 */

export const BNPL_CONFIG = {
  MIN_DELIVERED_ORDERS: 3,
  MAX_LIMIT_DT: 5000,
  MULTIPLIER: 2,
  TERMS: '30 jours net sans intérêt',
} as const;

export interface BnplDeliveredOrder {
  /** Montant total de la commande livrée */
  total: number;
  createdAt?: Date;
}

export type BnplDecision =
  | {
      eligible: false;
      reason: string;
      minimumOrders: number;
      currentOrders: number;
      totalSpent?: string;
    }
  | {
      eligible: true;
      limit: string;
      terms: string;
      basedOn: string;
      totalHistoryOnPlatform: string;
      note: string;
    };

/**
 * Calcule la décision d'éligibilité BNPL.
 *
 * @param orders Commandes livrées (déjà filtrées, triées du plus
 *   récent au plus ancien, limitées à 10 par l'appelant).
 */
export function evaluateBnplEligibility(orders: BnplDeliveredOrder[]): BnplDecision {
  const minimumOrders = BNPL_CONFIG.MIN_DELIVERED_ORDERS;

  if (orders.length === 0) {
    return {
      eligible: false,
      reason: 'Aucune commande complète sur la plateforme. Historique requis pour BNPL.',
      minimumOrders,
      currentOrders: 0,
    };
  }

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);

  if (orders.length < minimumOrders) {
    return {
      eligible: false,
      reason: `${minimumOrders - orders.length} commande(s) supplémentaire(s) nécessaire(s) avant éligibilité BNPL.`,
      minimumOrders,
      currentOrders: orders.length,
      totalSpent: totalSpent.toFixed(3) + ' DT',
    };
  }

  const avgOrder = totalSpent / orders.length;
  const limit = Math.min(avgOrder * BNPL_CONFIG.MULTIPLIER, BNPL_CONFIG.MAX_LIMIT_DT);

  return {
    eligible: true,
    limit: limit.toFixed(3) + ' DT',
    terms: BNPL_CONFIG.TERMS,
    basedOn: `${orders.length} commandes sur la plateforme`,
    totalHistoryOnPlatform: totalSpent.toFixed(3) + ' DT',
    note: 'Ce service est exclusivement disponible pour les partenaires de la marketplace.',
  };
}
