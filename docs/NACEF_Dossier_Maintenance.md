# Dossier de maintenance
**Référence NACEF :** [E0202], [E0206]
**Produit :** CoffeeShop B2B / ElKassa POS
**Version :** 1.0.0
**Date :** 2026-08-27

## Historique des versions
| Version | Date | Motif de la mise à jour |
|---------|------|--------------------------|
| 1.0.0 | 27/08/2026 | Création initiale pour l'homologation NACEF. |

---

## 1. Suivi des évolutions et corrections
- L'éditeur (ElKassa) maintient un registre précis (Changelog) des modifications apportées au logiciel.
- Toute correction d'anomalie fiscale ou ajout fonctionnel est testé dans un environnement "Staging" avant son déploiement.

## 2. Gestion des vulnérabilités
- Veille de sécurité active sur les dépendances (Node.js, React).
- En cas de découverte d'une faille critique (CVE), un correctif (patch) est développé, validé et déployé sous 48h.

## 3. Gestion des licences
- Chaque instance de caisse est identifiée par un Matricule Fiscal, un identifiant de point de vente et l'IMDF du module fiscal.
- Le backend valide la licence logicielle du client pour autoriser l'accès au système.

## 4. Politique de versioning
Le logiciel respecte les principes de Semantic Versioning (SemVer : Majeure.Mineure.Corrective) :
- **Version Majeure (X.0.0)** : Modifications de la chaîne de hachage fiscale, de l'intégration S-MDF, ou du format de ticket (nécessite une ré-homologation CIMF).
- **Version Mineure (1.X.0)** : Nouvelles fonctionnalités (ex: nouveau rapport) n'affectant pas les obligations fiscales.
- **Patch Correctif (1.0.X)** : Résolution de bugs UI ou d'anomalies mineures.

## 5. Méthode de déploiement chez le client
- **Mise à jour Cloud (API)** : Les mises à jour serveur (API/Back-end) sont gérées de manière centralisée (SaaS).
- **Mise à jour Locale (POS)** : Les postes clients se mettent à jour automatiquement via OTA (Over-The-Air) ou le gestionnaire de paquets (App Store / Google Play / Installateur Windows) de manière silencieuse pour garantir une flotte homogène.
