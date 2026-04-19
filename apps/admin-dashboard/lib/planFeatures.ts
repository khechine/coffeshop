// Centralized plan features definition
// Used on: Home page, SuperAdmin Plans, and Admin Settings

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PlanDefinition {
  color: string;
  icon: string; // emoji
  tagline: string;
  features: PlanFeature[];
}

export const PLAN_FEATURES: Record<string, PlanDefinition> = {
  RACHMA: {
    color: '#10B981',
    icon: '🧾',
    tagline: 'Comptage rapide pour les petits commerces',
    features: [
      { label: 'Mode Caisse Rachma (comptage rapide)', included: true },
      { label: 'Gestion des produits & catégories', included: true },
      { label: 'Gestion du stock matières premières', included: true },
      { label: 'Historique des ventes (simple)', included: true },
      { label: 'Données démo (import / reset)', included: true },
      { label: 'Équipe & gestion du personnel', included: true },
      { label: 'Mode POS Premium (tables & panier)', included: false },
      { label: 'Conformité fiscale NACEF', included: false },
      { label: 'Rapports Z & clôtures fiscales', included: false },
      { label: 'Terminaux POS multi-caisses', included: false },
      { label: 'Programme de fidélité client', included: false },
      { label: 'Accès Marketplace B2B', included: false },
    ]
  },
  STARTER: {
    color: '#3B82F6',
    icon: '☕',
    tagline: 'L\'essentiel pour démarrer votre activité',
    features: [
      { label: 'Mode Caisse Rachma (comptage rapide)', included: true },
      { label: 'Gestion des produits & catégories', included: true },
      { label: 'Gestion du stock matières premières', included: true },
      { label: 'Historique des ventes (simple)', included: true },
      { label: 'Données démo (import / reset)', included: true },
      { label: 'Équipe & gestion du personnel', included: true },
      { label: 'Mode POS Premium (tables & panier)', included: true },
      { label: 'Conformité fiscale NACEF', included: true },
      { label: 'Rapports Z & clôtures fiscales', included: true },
      { label: 'Terminaux POS multi-caisses', included: false },
      { label: 'Programme de fidélité client', included: false },
      { label: 'Accès Marketplace B2B', included: false },
    ]
  },
  PRO: {
    color: '#8B5CF6',
    icon: '🚀',
    tagline: 'Tout inclus pour les pros de la restauration',
    features: [
      { label: 'Mode Caisse Rachma (comptage rapide)', included: true },
      { label: 'Gestion des produits & catégories', included: true },
      { label: 'Gestion du stock matières premières', included: true },
      { label: 'Historique des ventes (avancé)', included: true },
      { label: 'Données démo (import / reset)', included: true },
      { label: 'Équipe & gestion du personnel', included: true },
      { label: 'Mode POS Premium (tables & panier)', included: true },
      { label: 'Conformité fiscale NACEF', included: true },
      { label: 'Rapports Z & clôtures fiscales', included: true },
      { label: 'Terminaux POS multi-caisses', included: true },
      { label: 'Programme de fidélité client', included: true },
      { label: 'Accès Marketplace B2B', included: true },
    ]
  },
  ENTERPRISE: {
    color: '#F59E0B',
    icon: '🏢',
    tagline: 'Solution sur mesure pour les chaînes',
    features: [
      { label: 'Tout du plan PRO', included: true },
      { label: 'Multi-boutiques illimité', included: true },
      { label: 'API & intégrations personnalisées', included: true },
      { label: 'Support prioritaire', included: true },
      { label: 'Accès Marketplace B2B', included: true },
    ]
  }
};

export function getPlanFeatures(planName: string): PlanDefinition {
  const key = planName?.toUpperCase() || 'RACHMA';
  return PLAN_FEATURES[key] || PLAN_FEATURES['RACHMA'];
}
