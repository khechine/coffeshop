# 08 — Module SuperAdmin & Détection de Fuite (Anti-Leakage)

## 8.1 Périmètre Fonctionnel

Le module SuperAdmin est la tour de contrôle de la plateforme ElKassa. Il permet aux administrateurs de superviser l'ensemble des établissements abonnés, d'homologuer les vendeurs tiers, de configurer les barèmes de commissionnement et de protéger le modèle économique de la marketplace grâce à un algorithme avancé de détection de désintermédiation (**Anti-Leakage Tracking**).

### Fonctionnalités Clés
1. **Gouvernance des Établissements & Fournisseurs** :
   - Validation des pièces justificatives légales (`officialDocs` : Registre de Commerce, RNE, patente).
   - Activation, suspension ou restriction d'accès aux boutiques et aux vendeurs.
   - Validation manuelle des demandes de rechargement de compte (`WalletDepositRequest`).
2. **Gestion des Grilles de Commissionnement (`CommissionRule`)** :
   - Création de barèmes globaux ou personnalisés avec taux de base et tranches de volume.
   - Assignation de règles spécifiques par profil fournisseur.
3. **Moteur Anti-Fuite & Détection de Contournement (Anti-Leakage Engine)** :
   - Journalisation passive de chaque point de contact (`VendorInteraction`) : consultations de catalogue, clics profils, messages échangés, devis demandés.
   - Suivi du cycle de vie de la relation (`StoreVendorRelationship`) : `DISCOVERED` ➔ `CONTACTED` ➔ `ORDERED` ➔ `ACTIVE`.
   - Preuve juridique d'antériorité : enregistrement inaltérable de `discoveredAt`.
4. **Scoring Comportemental & Alertes de Risque (`BehaviorScoring`)** :
   - Calcul dynamique d'un score de risque de 0 à 100 (`leakageRiskScore`).
   - Détection des pics anormaux d'interaction (`detectSpikes`) : plus de 5 consultations en 7 jours sans aucune commande passée.
   - Rapport de risque consolidé classé par sévérité (`CRITIQUE` >= 85, `ÉLEVÉ` >= 70).
   - Signalement manuel (`flagRelationship`) avec motif pour audit juridique.

---

## 8.2 Fichiers Sources & Responsabilités

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **Contrôleur SuperAdmin** | `apps/api/src/marketplace/marketplace.controller.ts` | Endpoints d'audit (`/marketplace/admin/*`) protégés par `SuperAdminGuard` |
| **Service d'Alerte** | `apps/api/src/marketplace/alert.service.ts` | Algorithme de scan de fuite, détection de pics et KPIs de santé plateforme |
| **Service Contrats & Preuves** | `apps/api/src/marketplace/contract.service.ts` | Certificats de relation contractuelle et éligibilité BNPL |
| **Contrôleur Règles** | `apps/api/src/management.controller.ts` | CRUD règles de commissions (`/management/admin/commission-rules/*`) |
| **Interface Web SuperAdmin** | `apps/admin-dashboard/app/superadmin/` | Dashboard central avec navigation multi-modules |
| **Interface Anti-Leakage** | `apps/admin-dashboard/app/superadmin/marketplace/` | Visualisation du graphe des relations, scores de risque et signalements |

---

## 8.3 Spécification des Algorithmes Anti-Leakage

### 1. Journalisation des Interactions (`InteractionService.log`)
Chaque interaction est consignée en base :
```typescript
await prisma.vendorInteraction.create({
  data: { storeId, vendorId, type, metadata }
});
```
Simultanément, la relation `StoreVendorRelationship` est créée ou incrémentée :
- `totalInteractions` s'incrémente de 1.
- `lastActivityAt` est horodaté.
- Si le statut était `DISCOVERED` et que le type d'interaction est `SEND_MESSAGE` ou `REQUEST_QUOTE`, le statut évolue vers `CONTACTED`.

### 2. Détection des Pics sans Commande (`AlertService.detectSpikes`)
- **Critère** : Relations présentant un nombre d'interactions récent >= 5 sur les 7 derniers jours mais un nombre de commandes passées égal à 0.
- **Interprétation** : L'acheteur utilise la marketplace comme annuaire pour ensuite commander par téléphone ou hors plateforme.
- **Action** : Le score de risque est immédiatement rehaussé (`leakageRiskScore += 30`), et la relation apparaît dans la file d'investigation SuperAdmin.

### 3. Calcul du Score de Risque Global (`leakageRiskScore`)
Le score est une combinaison pondérée :
- Fréquence des échanges de messages sans concrétisation de commande (+25 pts).
- Durée écoulée depuis la première prise de contact sans conversion (+20 pts).
- Chute brutale de récurrence de commande après une période active (+40 pts — suspicion de bascule en direct).

---

## 8.4 Modèles Prisma Impliqués

- `StoreVendorRelationship` (`id`, `storeId`, `vendorId`, `status`, `discoveredAt`, `firstOrderAt`, `totalInteractions`, `totalOrders`, `totalRevenue`, `leakageRiskScore`, `isFlagged`, `flagReason`)
- `VendorInteraction` (`id`, `storeId`, `vendorId`, `type`, `metadata`, `createdAt`)
- `CommissionRule` (`id`, `name`, `baseRate`, `tiers`, `isDefault`)
- `WalletDepositRequest` (`id`, `vendorId`, `amount`, `proofImage`, `status`, `adminNotes`)
- `Store` (validation et restrictions)
- `VendorProfile` (statut partenaire)

---

## 8.5 Dépendances & Sécurité

- `SuperAdminGuard` : Validation stricte du rôle administrateur système sur le token d'appel.
- Immutabilité des horodatages de découverte (`discoveredAt`) servant de preuve contractuelle d'apport d'affaires.
