# Dossier de spécifications fonctionnelles
**Référence NACEF :** [E0202], [E0204]
**Produit :** CoffeeShop B2B / ElKassa POS
**Version :** 1.0.0
**Date :** 2026-08-27

## Historique des versions
| Version | Date | Motif de la mise à jour |
|---------|------|--------------------------|
| 1.0.0 | 27/08/2026 | Création initiale pour l'homologation NACEF. |

---

## 1. Description des cas d'usage et points d'attention

### Cas d'usage principaux
1. **Ouverture de session (Shift)** : Initialisation de la caisse avec le fond de caisse.
2. **Enregistrement d'une vente (Ticket de caisse)** : Saisie des articles, calcul automatique de la TVA, sélection du mode de paiement, et validation fiscale via le S-MDF.
3. **Remboursement (Avoir)** : Annulation d'une transaction via l'émission d'un ticket de remboursement strict (pas d'effacement).
4. **Clôture journalière (Rapport Z)** : Calcul des cumuls de TVA, de la recette totale, et scellement du rapport de fin de journée.
5. **Mode formation (Training)** : Les transactions sont isolées, imprimées avec la mention "PRO-FORMA" et n'affectent pas les cumuls fiscaux.

### Points d'attention fonctionnels
- **Inaltérabilité** : Toute modification d'un ticket validé est impossible.
- **Continuité de service** : En cas de déconnexion du S-MDF, le POS refuse l'émission de tickets fiscaux.

## 2. Spécifications liées aux exigences du cahier des charges
- **Numérotation séquentielle** : Les identifiants des transactions sont générés de manière unique, strictement croissante, et ininterrompue.
- **Traçabilité des utilisateurs** : Chaque action (connexion, vente, clôture) est liée à l'agent connecté (barista/caissier).
- **Structure du ticket** : Respect strict du schéma JSON v1.1.4 (données du contribuable, taxes, détails des articles).
