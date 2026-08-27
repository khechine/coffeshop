# Dossier de conception générale
**Référence NACEF :** [E0202], [E0203]
**Produit :** CoffeeShop B2B / ElKassa POS
**Version :** 1.0.0
**Date :** 2026-08-27

## Historique des versions
| Version | Date | Motif de la mise à jour |
|---------|------|--------------------------|
| 1.0.0 | 27/08/2026 | Création initiale pour l'homologation NACEF. |

---

## 1. Description générale du système
Le système **CoffeeShop B2B (ElKassa POS)** est une solution d'encaissement et de gestion de point de vente multi-plateformes. Il permet de gérer les ventes, d'émettre des tickets de caisse, et d'assurer la conformité fiscale via une intégration avec le système NACEF (S-MDF).

### Principes de fonctionnement
Le système fonctionne selon une architecture Client-Serveur :
- **Terminaux (POS)** : Enregistrent les commandes et calculent les totaux.
- **API Centrale** : Gère la logique métier et la communication sécurisée avec l'agent S-MDF.
- **Agent S-MDF** : Composant de l'administration fiscale qui signe électroniquement les transactions.

## 2. Matériel associé
- PC/Mac, Tablettes Android/iOS
- Imprimantes thermiques ESC/POS (58/80mm)
- Tiroirs-caisses et scanners 1D/2D

## 3. Cartographie des modules
1. **Module d'Encaissement (Front-end)** : Interface utilisateur (POS).
2. **Module Fiscal (API)** : Gestion de la piste d'audit, clôtures Z, et formatage JSON NACEF.
3. **Module S-MDF** : Communication HTTP (port 10006) avec l'agent de scellement.

## 4. Technologies, Réseaux et Base de Données
- **Système d'exploitation** : Multiplateforme (Windows, macOS, Android, iOS).
- **Langages** : TypeScript (Node.js/NestJS, React/React Native).
- **Réseau** : LAN/WLAN.
- **Base de données** : PostgreSQL avec ORM Prisma garantissant l'intégrité transactionnelle.
