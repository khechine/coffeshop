/**
 * Domaine : MARKETPLACE — Anti-fuite (leakage)
 * ─────────────────────────────────────────────────────────────
 * Rôle métier :
 *   Calcul du score de risque de "fuite" d'une relation
 *   CoffeeShop ↔ Vendeur. Un score élevé (≥ 80) signale une
 *   forte probabilité de bypass (beaucoup de consultations, peu
 *   ou pas de commande), incitant à garder la transaction en
 *   circuit fermé sur la plateforme.
 *
 * Fonctions pures : aucune dépendance I/O.
 *
 * Hypothèses métier tranchées :
 *  - Score de base : 80 × (1 − min(tauxConversion, 1)).
 *  - Bonus +20 (plafonné à 100) si la relation est découverte
 *    depuis > 30 jours sans aucune commande ; le bonus s'applique
 *    même si la conversion de la fenêtre récente était bonne, car
 *    on récompense la persistance du risque (comportement historique).
 *  - Seuils : ≥ 70 warning, ≥ 80 auto-flag, ≥ 85 critique.
 */

export const LEAKAGE_THRESHOLDS = {
  WARNING: 70,
  AUTO_FLAG: 80,
  CRITICAL: 85,
} as const;

export interface LeakageScoreInput {
  /** Nombre d'interactions sur les 30 derniers jours */
  interactions30d: number;
  /** Nombre de commandes sur les 30 derniers jours */
  orders30d: number;
  /** Nombre total de commandes de la relation (toute la vie) */
  totalOrders: number;
  /** Date de découverte de la relation */
  discoveredAt: Date;
  /** Horodatage de référence (testabilité) */
  now?: Date;
}

/**
 * Calcule le score de fuite (0 → 100) et renvoie les décisions de
 * seuil associées (warning / auto-flag / critique).
 */
export function computeLeakageScore(input: LeakageScoreInput): {
  score: number;
  isWarning: boolean;
  isCritical: boolean;
  shouldAutoFlag: boolean;
} {
  const now = input.now ?? new Date();
  let score = 0;

  if (input.interactions30d > 0) {
    const conversionRate = input.orders30d / input.interactions30d;
    score = Math.round((1 - Math.min(conversionRate, 1)) * 80);
  }

  if (input.totalOrders === 0) {
    const daysSinceDiscovery = Math.floor(
      (now.getTime() - new Date(input.discoveredAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSinceDiscovery > 30) score = Math.min(100, score + 20);
  }

  return {
    score,
    isWarning: score >= LEAKAGE_THRESHOLDS.WARNING,
    isCritical: score >= LEAKAGE_THRESHOLDS.CRITICAL,
    shouldAutoFlag: score >= LEAKAGE_THRESHOLDS.AUTO_FLAG,
  };
}
