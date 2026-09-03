# 07 — Module Espace Vendeur, Commissions & Portefeuille

## 7.1 Périmètre Fonctionnel

L'Espace Vendeur (Fournisseur) est l'environnement dédié aux partenaires commerciaux B2B. Il leur permet de piloter leurs ventes, de gérer leur catalogue et leurs stocks, de communiquer avec les acheteurs et d'assurer le suivi financier de leurs commissions via un portefeuille virtuel (`VendorWallet`).

### Fonctionnalités Clés
1. **Pilotage de l'Activité (Dashboard Vendeur)** :
   - Indicateurs en temps réel : Chiffre d'Affaires global, volume de commandes en attente, produits actifs, solde du wallet.
   - Classement des meilleurs clients (Top boutiques acheteuses).
   - Indicateur de visibilité catalogue : alerte si le compte risque la suspension pour solde négatif.
2. **Gestion du Cycle de Vie des Commandes & Déblocage des Coordonnées** :
   - Consultation des commandes entrantes avec masquage préventif (`Client Masqué`).
   - Acceptation de commande (`CONFIRMED`) : déclenche simultanément le calcul/prélèvement de la commission et déverrouille l'accès aux coordonnées complètes du client (téléphone, adresse exacte de livraison).
   - États d'avancement : `CONFIRMED` ➔ `SHIPPED` ➔ `DELIVERED`.
3. **Moteur Financier & Prélèvement Automatique des Commissions** :
   - Application des règles de commissionnement (`CommissionRule`) : taux de base ou grille par paliers de volume d'affaires (`tiers`).
   - Déduction atomique de la commission sur le `VendorWallet` et création d'un bordereau de règlement (`MarketplaceSettlement`).
   - Suivi du grand livre des transactions de portefeuille (`WalletTransaction`).
4. **Rechargement de Wallet & Gestion des Impayés** :
   - Dépôt de fonds par virement avec soumission de justificatif (`WalletDepositRequest`).
   - Politique de grâce : 2 commandes tolérées en solde négatif avant occultation automatique des produits sur la marketplace.
5. **Messagerie Instantanée B2B (`TradeMessage`)** :
   - Fil de discussion direct entre acheteur et vendeur, contextuel au produit ou à la commande.
   - Notification par email et alerte visuelle des messages non lus.
6. **Ventes Croisées & Upsells B2B (`VendorProductUpsell`)** :
   - Configuration de suggestions promotionnelles sur panier (ex: "Ajoutez 5 briques de sirop noisette à -15%").

---

## 7.2 Fichiers Sources & Responsabilités

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **Contrôleur API** | `apps/api/src/management.controller.ts` | Espace vendeur (`/management/vendor/*`), Wallet (`/management/vendor/wallet/*`), Messagerie (`/management/vendor/messages/*`) |
| **Garde Vendeur** | `apps/api/src/auth/marketplace.guard.ts` | Protection et extraction du contexte vendeur connecté |
| **Portail Vendeur Web** | `apps/admin-dashboard/app/vendor/portal/` | Interface web complète pour les fournisseurs (Next.js) |
| **Dashboard Vendeur Web** | `apps/admin-dashboard/app/vendor/dashboard/` | Métriques, graphiques et suivi des commandes |
| **Messagerie Web** | `apps/admin-dashboard/app/marketplace/messages/` | Interface de messagerie temps réel |

---

## 7.3 Spécification du Moteur Financier

### Algorithme de Calcul de Commission (`updateVendorOrderStatus`)

Lorsqu'un vendeur passe une commande de `PENDING` à `CONFIRMED` :
1. **Sélection de la règle de commissionnement applicable** :
   - *Priorité 1* : Règle personnalisée assignée au profil vendeur (`vendor.commissionRule`).
   - *Priorité 2* : Règle globale par défaut de la plateforme (`CommissionRule` avec `isDefault: true`).
   - *Priorité 3* : Taux fixe historique négocié avec le vendeur (`vendor.commissionRate`).
2. **Évaluation des paliers de volume (`tiers`)** :
   - Si la règle contient une grille de paliers, le système recherche le palier le plus avantageux selon le montant total de la commande :
     ```typescript
     let finalRate = baseRate;
     const sortedTiers = tiers.sort((a, b) => b.minAmount - a.minAmount);
     for (const tier of sortedTiers) {
       if (totalOrder >= tier.minAmount) {
         finalRate = tier.rate;
         break;
       }
     }
     ```
3. **Exécution de la transaction financière** :
   - Montant de commission : `commissionAmount = totalOrder * finalRate`.
   - Création de l'enregistrement immuable `MarketplaceSettlement` avec `orderId` unique (garantie d'idempotence contre tout double prélèvement).
   - Débit du solde du portefeuille vendeur : `VendorWallet.balance.decrement(commissionAmount)`.
   - Écriture au journal d'audit `WalletTransaction` de type `COMMISSION`.

---

## 7.4 Modèles Prisma Impliqués

- `VendorProfile` (`id`, `companyName`, `status`, `commissionRate`, `gracePeriodEndsAt`, `lastBillingAlertAt`, `userId`)
- `VendorWallet` (`id`, `vendorId`, `balance`, `currency`, `status`)
- `WalletTransaction` (`id`, `walletId`, `amount`, `type`, `description`, `settlementId`, `createdAt`)
- `MarketplaceSettlement` (`id`, `orderId`, `commissionAmount`, `isProcessed`, `processedAt`)
- `CommissionRule` (`id`, `name`, `baseRate`, `tiers`, `isDefault`)
- `WalletDepositRequest` (`id`, `vendorId`, `amount`, `proofImage`, `status`, `adminNotes`)
- `TradeMessage` (`id`, `senderId`, `receiverId`, `content`, `productId`, `isRead`, `createdAt`)
- `VendorProductUpsell` (`id`, `sourceProductId`, `targetProductId`, `quantity`, `discountPercent`, `text`, `isActive`)

---

## 7.5 Dépendances & Sécurité

- Transactions Prisma (`prisma.$transaction`) assurant la consistance parfaite entre statut de commande, écriture de règlement et solde du portefeuille.
- Contrôle strict de propriété : un vendeur ne peut pas modifier un produit ou accepter une commande qui ne lui appartient pas.
