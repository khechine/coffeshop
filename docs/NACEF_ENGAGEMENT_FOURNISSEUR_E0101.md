# Engagement et Charte de Responsabilité du Fournisseur
**Référence Exigence NACEF :** `[E0101]` à `[E0103]` — Cahier des Charges NACEF v1.2  
**Éditeur / Fournisseur du Logiciel :** CoffeeShop B2B / ElKassa Software  
**Produit Homologué :** CoffeeShop B2B / ElKassa POS (Web & Mobile)  
**Version Initiale Certifiée :** v1.0.0  
**Date :** 2026-08-27  

---

## 1. Engagement Général de Responsabilité [E0101]

En tant que fournisseur et éditeur du logiciel de caisse **CoffeeShop B2B / ElKassa POS**, la société s'engage solennellement à assumer l'entière responsabilité de la conformité du produit aux exigences d'homologation NACEF édictées par le Ministère des Finances tunisien (CIMF). 

Les contrôles effectués par l'Unité d'Homologation ne se substituent à aucun moment à la responsabilité légale et technique du fournisseur.

---

## 2. Charte des Engagements du Fournisseur

### 2.1. Maintien de la Conformité Continue et Veille Réglementaire
- **Conformité permanente** : S'assurer que toutes les instances de **CoffeeShop B2B / ElKassa POS** déployées chez les contribuables répondent continuellement aux exigences techniques, fonctionnelles et sécuritaires d'homologation NACEF.
- **Évolution réglementaire** : Implémenter et déployer dans les délais impartis les ajustements logiciels requis en cas d'évolution du cahier des charges NACEF ou des spécifications de la CIMF.
- **Évaluations de surveillance** : Prendre toutes les dispositions techniques et organisationnelles nécessaires pour faciliter les évaluations initiales et les audits de surveillance de l'Unité d'Homologation.
- **Transparence et sincérité** : Ne communiquer à l'administration fiscale et aux contribuables que des informations loyales, exactes et vérifiables.
- **Notification d'impact** : Informer sans délai l'Unité d'Homologation de tout changement technique, architectural ou sécuritaire susceptible d'impacter la conformité du produit ou la validité du certificat d'homologation.

---

### 2.2. Gestion du Versioning, Traçabilité et Registre des Clients [E0601 - E0604]
- **Identifiant unique de version** : Chaque version du logiciel se voit attribuer un numéro de version unique (ex: `v1.0.0`) encodé dans les métadonnées des transactions (`transaction.originator.cash_register_software`).
- **Classification des versions** :
  - **Version Majeure** : Toute modification touchant à la chaîne fiscale, au hachage SHA-256, à la signature NACEF ou au schéma JSON des tickets. Soumise obligatoirement à ré-homologation.
  - **Version Mineure** : Corrections d'anomalies d'interface ou améliorations ergonomiques non fiscales.
- **Registre des versions et déploiements** : Mettre à jour continuellement un registre centralisé des versions déployées identifiant pour chaque client :
  - Nom commercial & Matricule Fiscal du contribuable
  - Identifiant unique du Module de Données Fiscales (IMDF)
  - Version du logiciel installée et date de mise en service

---

### 2.3. Archivage Légitime, Conservation et Cession d'Activité [E1301 - E1304]
- **Conservation des archives** : Assurer la production et l'export d'archives au format ASCII/JSON autonome, garantissant la lisibilité des données d'encaissement et de la piste d'audit sans dépendance vis-à-vis du logiciel de caisse.
- **Accès durant la période légale (6 ans)** : Fournir aux clients et à l'administration fiscale les données d'archivage complètes, y compris si le client cesse d'utiliser le logiciel de caisse ou résilie son abonnement.
- **Garantie d'intégrité** : Conserver les preuves cryptographiques (hashes chaînés SHA-256, signatures HMAC et QR codes) associées aux archives pour tout contrôle fiscal ultérieur.

---

### 2.4. Déclaration Anti-Fraude et Intégrité Logicielle (Décret 2019-1126, Art. 11)
- **Tolérance zéro anti-fraude** : Garantir que le logiciel ne contient aucun dispositif dissimulé, module caché ou fonction de type *Phantomware* ou *Zapper* permettant d'altérer, supprimer ou dissimuler des données d'encaissement.
- **Obligation de signalement** : Signalement immédiat auprès des services compétents du Ministère des Finances de toute manœuvre frauduleuse ou tentative de contournement constatée sur un équipement ou une caisse enregistreuse d'un client, conformément à l'article 11 du décret gouvernemental n° 2019-1126 du 26 novembre 2019.

---

### 2.5. Documentation et Documents remis au Contribuables [E1702]
À chaque client contribuable équipé, le fournisseur remet obligatoirement un **Pack de Conformité NACEF** comprenant :
1. **Manuel Utilisateur et Guide d'Audit Fiscal** (en français) détaillant le fonctionnement de la caisse et la procédure de contrôle.
2. **Guide des Prérequis Matériels et Réseau** (spécifications de l'agent S-MDF, connectivité ports 10006/HTTP).
3. **Copie du Certificat d'Homologation Officiel** NACEF portant le cachet et la signature de l'éditeur.
4. **Procédures de support, d'assistance et de formation**.

---

### 2.6. Assistance Technique, SLA et Contrat de Maintenance
- **Service d'Assistance dédié** : Mettre à disposition un support technique joignable pendant les heures ouvrables (support téléphonique et ticketing en ligne).
- **Contrat de Maintenance Fiscal** : Conclure un contrat de maintenance avec chaque client garantissant une intervention d'urgence en cas d'incident bloquant sur le S-MDF ou le processus de signature NACEF.
- **Distribution des mises à jour certifiées** : Proposer aux clients un canal sécurisé de mise à jour permettant de maintenir le logiciel dans un état strictement conforme à la version certifiée par la CIMF.

---

## 3. Registre des Références et Documents Associés

| Document | Description | Emplacement |
|----------|-------------|-------------|
| **Document de Conformité NACEF** | Matrice de conformité des exigences [E0101 - E1702] | [`docs/NACEF_CONFORMITE_EXIGENCES.md`](file:///Users/mehdikhechine/devs/coffeeshop-b2B/docs/NACEF_CONFORMITE_EXIGENCES.md) |
| **Guide d'Intégration & Audit** | Architecture technique, API NACEF et piste d'audit | [`docs/NACEF_INTEGRATION.md`](file:///Users/mehdikhechine/devs/coffeeshop-b2B/docs/NACEF_INTEGRATION.md) |
| **Guide d'Installation S-MDF** | Manuel de déploiement multi-postes de l'agent S-MDF | [`docs/SMDF_INSTALLATION_GUIDE.md`](file:///Users/mehdikhechine/devs/coffeeshop-b2B/docs/SMDF_INSTALLATION_GUIDE.md) |

---

## 4. Signatures d'Engagement du Fournisseur

Fait à Tunis, le 27 Août 2026.

**Pour le Fournisseur / Éditeur :**  
CoffeeShop B2B / ElKassa Software  
*Représentant Légal & Direction Technique*  

*(Cachet et Signature)*
