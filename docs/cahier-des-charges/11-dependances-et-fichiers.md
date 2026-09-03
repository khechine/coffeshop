# 11 — Matrice Complète Fichiers, Fonctions & Dépendances

## 11.1 Application API Backend (`apps/api/`)

### Contrôleurs

#### 📄 `apps/api/src/auth.controller.ts`
- **Dépendances** : `@nestjs/common`, `@coffeeshop/database` (Prisma), `bcrypt`, `NacefService`
- **Méthodes / Fonctions** :
  - `health()` : Test de liveness du service.
  - `verifyStaffPin(pin, storeId)` : Authentification caissier par PIN, déclenchement log audit NACEF `USER_LOGIN`.
  - `activateTerminal(code, storeId)` : Validation code 6 chiffres et activation du terminal.
  - `login(body)` : Vérification email/mot de passe, extraction vendorId si rôle VENDOR, émission token.
  - `register(body)` : Création conjointe Store/User ou VendorProfile/VendorWallet.
  - `updateProfile(body)` : Mise à jour nom, email, pinCode.

#### 📄 `apps/api/src/sales/sales.controller.ts`
- **Dépendances** : `SalesService`, `@coffeeshop/database` (Prisma), `CreateSaleDto`
- **Méthodes / Fonctions** :
  - `verifyStaffPin(pin, storeId)` : Alternative pour la connexion caisse avec journalisation `StaffSessionLog`.
  - `createSale(createSaleDto)` : Point d'entrée de création de vente POS.
  - `getSalesByStore(storeId)` : Liste des ventes.
  - `getHistory(storeId, filters)` : Historique filtré (barista, dates, mode).
  - `updatePreparation(id, body)` : Changement statut de préparation (KDS).
  - `cancelSale(id, body)` : Annulation de ticket et déclenchement réapprovisionnement stock.
  - `getStock(storeId)` : Lecture du stock pour le POS mobile.
  - `getStaff(storeId)` / `updateStaff(id, body)` / `updateStaffPin(id, body)` : Gestion des employés.
  - `getSessions(storeId)` : Consultation des sessions de caisse.

#### 📄 `apps/api/src/management.controller.ts`
- **Dépendances** : `@nestjs/common`, `@coffeeshop/database`, `bcrypt`, `multer`, `InteractionService`, `MarketplaceAuthGuard`, `StoreStatusGuard`
- **Méthodes / Fonctions Clés** :
  - `seedTunisia(storeId)` : Initialisation de catalogue tunisien prêt à l'emploi.
  - `getProducts(storeId)` / `createProduct(body)` / `updateProduct(id, body)` / `deleteProduct(id)` : CRUD produits & recettes.
  - `updateRecipe(id, body)` : Configuration de la nomenclature technique des ingrédients.
  - `getStock(storeId)` / `createStockItem(body)` / `updateStockItem(id, body)` / `deleteStockItem(id)` : CRUD matières premières.
  - `getSuppliers(storeId)` / `createSupplier(body)` / `updateSupplier(id, body)` / `deleteSupplier(id)` : Carnet fournisseurs directs.
  - `getOrders(storeId)` / `createOrder(body)` / `updateOrderStatus(id, body)` / `receiveOrder(id)` : Bons de commande d'achat et réception en stock.
  - `getNotifications(storeId)` : Synthèse des alertes stock bas et commandes en attente.
  - `getMarketplaceProducts(query)` : Moteur de recherche marketplace avec calcul géodésique Haversine.
  - `createMarketplaceProduct(body)` / `updateMarketplaceProduct(id, body)` / `deleteMarketplaceProduct(id)` : Gestion catalogue vendeur.
  - `getVendorSummary(vendorId)` : Indicateurs dashboard vendeur.
  - `getVendorOrders(vendorId)` / `updateVendorOrderStatus(id, body)` : Suivi commandes vendeur et calcul/prélèvement de commission.
  - `getOrderClientInfo(req, orderId)` : Déblocage sécurisé des coordonnées client post-acceptation.
  - `getVendorWallet(vendorId)` / `createDepositRequest(body)` : Portefeuille fournisseur.
  - `getVendorMessages(req, otherUserId)` / `sendVendorMessage(req, body)` : Messagerie instantanée.
  - `getVendorRFQs(req, type)` / `submitRFQQuote(req, body)` : Appels d'offres et devis.
  - `analyzeInvoice(body)` : OCR et extraction de facture via Google Gemini Vision.
  - `importInvoiceItems(body)` : Ingestion comptable d'articles et génération d'écriture de dépense.
  - `getReportSummary(storeId)` : Moteur décisionnel analytique.

#### 📄 `apps/api/src/marketplace/marketplace.controller.ts`
- **Dépendances** : `InteractionService`, `ContractService`, `AlertService`, `MarketplaceAuthGuard`, `SuperAdminGuard`, `SubscriptionGuard`
- **Méthodes / Fonctions** :
  - `logInteraction(body)` : Consignation des interactions d'utilisateurs sur la marketplace.
  - `getPlatformHealth()` : Indicateurs de santé de la marketplace pour le SuperAdmin.
  - `getRiskReport()` : Liste des relations suspectes de désintermédiation (score >= 50).
  - `runLeakageScan()` : Exécution du scan de détection automatique des fuites.
  - `detectSpikes()` : Détection des anomalies d'intérêt sans commande.
  - `flagRelationship(storeId, vendorId, body)` / `unflagRelationship(...)` : Marquage d'investigation.

#### 📄 `apps/api/src/nacef/nacef.controller.ts`
- **Dépendances** : `NacefService`, `NacefAuthGuard`
- **Méthodes / Fonctions** :
  - `initialize(storeId, body)` : Initialisation de l'environnement fiscal pour une boutique.
  - `signTicket(saleId)` : Envoi du ticket pour signature numérique fiscale.
  - `getManifest(storeId)` : Extraction du manifeste S-MDF.
  - `sync(storeId, body)` : Synchronisation des données fiscales.
  - `isReady(storeId)` : Vérification de conformité fiscale du magasin.
  - `configure(storeId, body)` : Enregistrement de l'URL du boîtier S-MDF et du Matricule Fiscal.

---

### Services & Logique Métier

#### 📄 `apps/api/src/sales/sales.service.ts`
- **Dépendances** : `InventoryService`, `SalesGateway`, `NacefService`, `calculateTaxTotals`, `buildNextFiscalMetadata`
- **Rôle** : Cœur transactionnel de vente : validation du droit de vente, calcul fiscal, enregistrement, déstockage des recettes, émission temps réel et signature NACEF.

#### 📄 `apps/api/src/sales/fiscal.service.ts`
- **Dépendances** : `crypto`
- **Rôle** : Numérotation séquentielle des factures (`generateNextFiscalNumber`), calcul d'empreinte SHA-256 et création de logs d'audit fiscaux inaltérables.

#### 📄 `apps/api/src/nacef/nacef.service.ts`
- **Dépendances** : `NacefClient`, `NacefTicketBuilder`, `@coffeeshop/database`
- **Rôle** : Interfaçage avec l'agent local S-MDF, transmission des tickets et journalisation dans `NacefSyncLog`.

#### 📄 `apps/api/src/marketplace/interaction.service.ts`
- **Dépendances** : `@coffeeshop/database`
- **Rôle** : Suivi des points de contact boutique-fournisseur et maintien à jour de `StoreVendorRelationship`.

#### 📄 `apps/api/src/marketplace/alert.service.ts`
- **Dépendances** : `@coffeeshop/database`
- **Rôle** : Algorithme de détection des risques de désintermédiation et consolidation des statistiques globales.

---

## 11.2 Frontend Web Admin & POS (`apps/admin-dashboard/`)

### Pages & Composants Majeurs

#### 📄 `apps/admin-dashboard/app/pos/POSClient.tsx`
- **Dépendances** : `react`, `lucide-react`, `recordSale`, `logStaffSessionAction`, `PrintService`
- **Rôle** : Interface de caisse complète : sélection de mode (normal, tables, rachma), pavé numérique, sélection d'articles, gestion des emballages à emporter, validation d'encaissement et impression ticket.

#### 📄 `apps/admin-dashboard/app/pos/PrintService.ts`
- **Dépendances** : DOM API (`window.open`, `window.print`)
- **Rôle** : Rendu HTML/CSS d'un ticket thermique 80mm/58mm avec en-tête magasin, détail des articles, ventilation TVA, hash fiscal et QR code.

#### 📄 `apps/admin-dashboard/app/marketplace/MarketplaceClient.tsx`
- **Dépendances** : `CartContext`, `react`, `lucide-react`
- **Rôle** : Interface e-commerce B2B pour les cafés : filtres par catégories, tri par distance, commande de bundles, consultation fiches fournisseurs.

#### 📄 `apps/admin-dashboard/app/vendor/portal/page.tsx`
- **Dépendances** : Composants Next.js
- **Rôle** : Console fournisseur pour la gestion du catalogue, l'approbation des commandes reçues et le suivi des règlements.

#### 📄 `apps/admin-dashboard/app/actions.ts`
- **Dépendances** : `@coffeeshop/database` (Prisma direct sur Next.js Server Actions)
- **Rôle** : Fournit les Server Actions pour les opérations de mise à jour directes depuis le front-end Next.js (ventes, clôtures, sessions).

---

## 11.3 Application Mobile Caisse (`apps/pos-mobile/`)

#### 📄 `apps/pos-mobile/App.tsx`
- **Dépendances** : `react-native`, `expo-status-bar`, `AsyncStorage`, `PrintService`
- **Rôle** : Application mobile monolithique haute performance :
  - Écran de déverrouillage PIN caissier.
  - Écran d'appairage de terminal (code 6 chiffres).
  - Catalogue produits avec panier tactile.
  - Calculateur de monnaie en dinars tunisiens.
  - Appel direct de l'API `POST /sales`.
  - Pilote d'impression Bluetooth thermique pour tickets clients.

#### 📄 `apps/pos-mobile/src/services/PrintService.ts`
- **Dépendances** : `react-native-bluetooth-escpos-printer` ou équivalent
- **Rôle** : Traduction des données de vente en commandes binaires ESC/POS (police, alignement, saut de ligne, massicot).

---

## 11.4 Package Partagé Base de Données (`packages/database/`)

#### 📄 `packages/database/src/index.ts`
- **Exports** :
  - `prisma` : Instance singleton du client Prisma configurée avec les extensions de logging.
  - `seedTunisianStarterPack(prisma, storeId)` : Script d'ensemencement créant automatiquement les catégories et produits typiques tunisiens (Café Direct, Capucin, Express, Thé Menthe, Citronnade, Croissant, etc.).

---

## 11.5 Récapitulatif des Dépendances Externes (npm)

| Package | Contexte d'usage |
|---------|------------------|
| `@prisma/client` | ORM base de données (partout) |
| `@nestjs/core`, `@nestjs/common` | Framework API backend |
| `@nestjs/platform-socket.io` | WebSocket temps réel |
| `bcrypt` | Chiffrement sécurisé des mots de passe |
| `next` (v14) | Framework React Fullstack pour le dashboard |
| `expo` (v51+) | Framework React Native pour l'application mobile |
| `lucide-react` | Bibliothèque d'icônes UI |
| `tailwindcss` | Moteur de styles CSS utilitaire |
