# 10 — Schéma de Base de Données (Prisma / PostgreSQL)

## 10.1 Vue d'Ensemble

La base de données PostgreSQL gérée par **Prisma ORM** (`packages/database/prisma/schema.prisma`) comprend plus de 50 modèles interconnectés, couvrant à la fois les flux POS temps réel et la logique marketplace transactionnelle.

---

## 10.2 Cartographie des Modèles par Domaine

### 1. Utilisateurs, Sécurité & Sessions
- `User` : Comptes centraux (propriétaires, gérants, caissiers, baristas, vendeurs, administrateurs).
- `StaffSessionLog` : Enregistrement des connexions/déconnexions caissières.
- `UserLoginLog` : Empreinte IP/User-Agent pour la détection d'intrusions.
- `Attendance` : Pointage horaire des employés (clockIn/clockOut) depuis le POS.
- `SystemSettings` : Configuration SMTP, passerelle WhatsApp et paramètres généraux.
- `WhatsAppLog` & `EmailLog` : Journalisation d'envois de notifications externes.

### 2. Établissement & Équipements Caisses
- `Store` : Informations de l'établissement (adresse, géolocalisation, statut d'homologation, clés fiscales).
- `StoreZone` : Découpage de l'espace client (Terrasse, Salle, Étage).
- `StoreTable` : Tables physiques positionnées sur le plan 2D (`posX`, `posY`, `shape`).
- `PosTerminal` : Terminaux de caisse autorisés (tablettes, smartphones, caisses tactiles).
- `Plan` & `Subscription` : Abonnements SaaS de l'établissement.
- `ErpIntegration` : Passerelle de synchronisation avec un ERP tiers (ERPNext, Odoo).

### 3. Catalogue Produits POS & Stock
- `Category` : Arborescence de catégories de vente (avec code couleur pour l'affichage POS).
- `Product` : Articles finis vendus en caisse avec taux de TVA (`taxRate`).
- `RecipeItem` : Nomenclature technique (ingrédients et conditionnements par produit).
- `StockItem` : Matières premières en réserve avec seuil d'alerte et coût unitaire.
- `GlobalUnit` : Référentiel des unités (kg, g, L, cl, pièce, portion).
- `StockReport` & `StockReportDetail` : Inventaires physiques périodiques et fiches de perte.

### 4. Ventes & Conformité Fiscale NACEF
- `Sale` : Transactions enregistrées avec totaux HT/TVA/TTC, empreinte cryptographique SHA-256 (`hash`), chaînage (`previousHash`) et signature NACEF.
- `SaleItem` : Détail des lignes d'articles vendus avec recalcul unitaire HT et TVA.
- `ZReport` : Rapport fiscal journalier de clôture avec ventilation par taux de taxe et chaînage de Z-Reports.
- `FiscalLog` : Journal légal d'audit des actions sur les ventes.
- `NacefSyncLog` : Journal de communication avec le boîtier matériel ou l'agent S-MDF.
- `Customer` : Fichier clients fidélité rattaché aux tickets.

### 5. Marketplace B2B & Produits Fournisseurs
- `VendorProfile` : Profil légal et commercial du fournisseur (éco-responsabilité, rayon, adresse).
- `VendorProduct` : Références d'articles proposées à la vente B2B.
- `ProductStandard` : Référentiel unifié évitant les doublons de catalogage.
- `MktCategory` & `MktSubcategory` : Taxonomie de la marketplace.
- `MktBundle` & `MktBundleItem` : Packages promotionnels multi-produits.
- `VendorProductUpsell` : Suggestions de ventes croisées sur panier.
- `Supplier` : Fiches fournisseurs directes créées par les cafés.
- `SupplierOrder` & `SupplierOrderItem` : Bons de commande B2B.

### 6. Finances, Monétisation & Portefeuilles
- `VendorWallet` : Portefeuille prépayé du fournisseur pour prélèvement des commissions.
- `WalletTransaction` : Écritures comptables sur portefeuille (crédits, commissions, pénalités).
- `MarketplaceSettlement` : Bordereaux d'arbitrage liant une commande à son montant de commission prélevé.
- `WalletDepositRequest` : Demandes de rechargement par virement avec preuve bancaire.
- `CommissionRule` : Règles et grilles tarifaires de commissionnement par palier.
- `StoreWallet` & `StoreWalletTransaction` : Portefeuille de l'établissement (gestion des abonnements).

### 7. Anti-Désintermédiation & Négociations
- `StoreVendorRelationship` : Graphe relationnel acheteur-fournisseur avec date de découverte (`discoveredAt`) et indice de risque (`leakageRiskScore`).
- `VendorInteraction` : Trace exhaustive des événements de consultation et d'intérêt.
- `TradeMessage` : Messagerie interne acheteur-fournisseur.
- `MarketplaceRFQ` : Appels d'offres / demandes de cotation des acheteurs.
- `MarketplaceQuote` : Devis transmis par les fournisseurs en réponse aux RFQ.

---

## 10.3 Énumérations Clés (Enums)

```prisma
enum UserRole {
  SUPERADMIN
  STORE_OWNER
  CASHIER
  VENDOR
  COURIER
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
  PAID
  STOCKED
}

enum StockStatus {
  IN_STOCK
  LOW_STOCK
  OUT_OF_STOCK
  DISCONTINUED
}

enum IndustryType {
  COFFEE_SHOP
  BAKERY
  PASTRY_SHOP
  PASTRY_PRO
}
```

---

## 10.4 Indexations Stratégiques pour la Haute Performance

- `Sale` : index unique sur `[storeId, sequenceNumber]` assurant l'absence totale de doublon de numérotation séquentielle ; index sur `[fiscalDay]` pour l'extraction rapide du Z-Report.
- `VendorProduct` : index sur `[vendorId]`, `[stockStatus]`, `[categoryId]`.
- `StoreVendorRelationship` : index sur `[leakageRiskScore]`, index unique composite sur `[storeId, vendorId]`.
- `VendorInteraction` : index sur `[storeId, vendorId]`, `[type]`, `[createdAt]`.
