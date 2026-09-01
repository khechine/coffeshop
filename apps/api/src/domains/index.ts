/**
 * Domaine : point d'entrée partagé de la couche métier.
 *
 * Expose les fonctions/libellés métier purs des différents domaines
 * (fiscal, marketplace) sans dépendance I/O, afin qu'ils puissent
 * être testés unitairement et réutilisés par les services NestJS.
 */
export * from './fiscal/fiscal-calculator';
export * from './fiscal/fiscal-chain';
export * from './marketplace/leakage-score';
export * from './marketplace/bnpl';
export * from './marketplace/billing';
