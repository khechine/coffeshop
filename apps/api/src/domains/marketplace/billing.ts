/**
 * Domaine : MARKETPLACE — Facturation / Période de grâce
 * ─────────────────────────────────────────────────────────────
 * Rôle métier :
 *   Régule la présence des vendeurs sur la marketplace en fonction
 *   du solde de leur wallet. Un solde négatif déclenche une période
 *   de grâce de 10 jours ; à l'échéance, le vendeur est suspendu.
 *   Une alerte est émise aux jalons 7 / 5 / 3 jours avant l'échéance.
 *
 * Ce module isole la logique décisionnelle pure (quelle action
 * entreprendre pour un vendeur donné) ; la persistance reste dans
 * la couche applicative.
 *
 * Hypothèses métier tranchées :
 *  - La grâce par défaut est de 10 jours (constante `GRACE_DAYS`).
 *  - Jours restants calculés en `Math.ceil` de (fin − aujourd'hui),
 *    en jours calendaires (comportement historique).
 *  - Restauration : un solde positif réactive un vendeur suspendu
 *    et efface ses marqueurs de grâce/alerte.
 */

export const BILLING_CONFIG = {
  GRACE_DAYS: 10,
  ALERT_MILESTONES: [7, 5, 3] as readonly number[],
} as const;

export type BillingAction =
  | { type: 'NONE' }
  | { type: 'INIT_GRACE'; gracePeriodEndsAt: Date }
  | { type: 'ALERT'; daysLeft: number }
  | { type: 'SUSPEND' }
  | { type: 'RESTORE' };

/**
 * Décide de l'action de facturation à appliquer à un vendeur, à
 * partir de son solde et de son état courant.
 *
 * @param balance Solde du wallet (négatif = dette)
 * @param gracePeriodEndsAt Date de fin de grâce (mise en place ou non)
 * @param status Statut courant du profil vendeur
 * @param now Horodatage de référence (testabilité)
 */
export function decideBillingAction(params: {
  balance: number;
  gracePeriodEndsAt?: Date | null;
  status?: string | null;
  now?: Date;
}): BillingAction {
  const now = params.now ?? new Date();
  const balance = Number(params.balance) || 0;
  const status = params.status || '';

  // Solde positif : restauration si nécessaire
  if (balance > 0) {
    if (params.gracePeriodEndsAt || status === 'SUSPENDED') {
      return { type: 'RESTORE' };
    }
    return { type: 'NONE' };
  }

  if (balance < 0) {
    // 1. Initialiser la période de grâce si absente
    if (!params.gracePeriodEndsAt) {
      const end = new Date(now.getTime());
      end.setDate(end.getDate() + BILLING_CONFIG.GRACE_DAYS);
      return { type: 'INIT_GRACE', gracePeriodEndsAt: end };
    }

    // 2. Jours restants jusqu'à l'échéance
    const today = new Date(now.getTime());
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(params.gracePeriodEndsAt.getTime());
    endDate.setHours(0, 0, 0, 0);
    const timeLeftMs = endDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));

    // 3. Alerte aux jalons
    if (BILLING_CONFIG.ALERT_MILESTONES.includes(daysLeft)) {
      return { type: 'ALERT', daysLeft };
    }

    // 4. Suspension à échéance
    if (daysLeft <= 0 && status !== 'SUSPENDED') {
      return { type: 'SUSPEND' };
    }

    return { type: 'NONE' };
  }

  // Solde exactement nul : aucun traitement
  return { type: 'NONE' };
}
