# 06 — Module Marketplace B2B (Catalogue, Commandes, Bundles & Devis)

## 6.1 Périmètre Fonctionnel

La Marketplace B2B connecte les établissements CHR (Cafés, Hôtels, Restaurants, Pâtisseries) aux producteurs, importateurs et distributeurs spécialisés (café vert/torréfié, laits végétaux, farines de spécialité, emballages écologiques, sirops, équipements).

### Fonctionnalités Clés
1. **Catalogue Produits Fournisseurs (`VendorProduct`)** :
   - Fiches produits B2B avec conditionnement unitaire, quantité minimale de commande (MOQ), prix HT/TTC, remises sur volume et promotions ventes flash (`isFlashSale`).
   - Badges et filtres d'éco-responsabilité (`BIO`) et production locale (`Tunisie`).
2. **Recherche Géolocalisée & Rayon de Livraison** :
   - Moteur de calcul de distance basé sur la formule Haversine pour trier les fournisseurs les plus proches du café.
   - Filtrage selon le rayon configuré (`radius` en km, par défaut 50 km).
3. **Packs & Bundles Promotionnels (`MktBundle`)** :
   - Création d'offres combinées multi-produits par les vendeurs à prix remisé (ex: "Pack Barista Starter : 10kg Café + 24 Briques Lait Avoine + 500 Gobelets").
4. **Appels d'Offres & Demandes de Devis (`MarketplaceRFQ`)** :
   - Les cafés publient un besoin spécifique (volume élevé, commande récurrente, produit sur mesure).
   - Les vendeurs éligibles reçoivent une notification et soumettent leur proposition tarifaire (`MarketplaceQuote`).
5. **Circuit de Commande B2B & Anti-Désintermédiation** :
   - Passation de commande par la boutique depuis son interface.
   - **Protection Anti-Fuite (Anti-Leakage)** : L'identité, le numéro de téléphone et l'adresse exacte de la boutique acheteuse restent masqués sous le libellé `"Client Masqué"` tant que le vendeur n'a pas accepté officiellement la commande sur la plateforme.

---

## 6.2 Fichiers Sources & Responsabilités

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **Contrôleur API** | `apps/api/src/management.controller.ts` | Catalogue (`/management/marketplace/products`), Bundles (`/management/marketplace/bundles`), RFQ (`/management/vendor/rfq`) |
| **Tracking Interaction** | `apps/api/src/marketplace/interaction.service.ts` | Journalisation des consultations pour le calcul du risque de fuite |
| **Contrôleur Marketplace** | `apps/api/src/marketplace/marketplace.controller.ts` | Endpoints d'interactions et de monitoring de flux |
| **Client Web Marketplace** | `apps/admin-dashboard/app/marketplace/MarketplaceClient.tsx` | Vitrine B2B pour les cafés (navigation catalogue, filtres, recherche) |
| **Panier B2B** | `apps/admin-dashboard/app/marketplace/CartContext.tsx` | Gestion du panier multi-vendeurs avec seuils MOQ |
| **Page RFQ** | `apps/admin-dashboard/app/marketplace/my-requests/` | Interface café de publication des demandes de devis |

---

## 6.3 Spécification des Fonctions Majeures

### Backend (`apps/api/src/management.controller.ts`)

#### `getMarketplaceProducts(query: { vendorId, lat, lng, radius, skip, take, eco, tunisia })`
- **Route** : `GET /management/marketplace/products`
- **Logique** :
  1. Filtre les produits appartenant à des vendeurs actifs (non suspendus).
  2. **Contrôle de solvabilité vendeur** : Si le vendeur a un solde de wallet négatif sans période de grâce active (`gracePeriodEndsAt`), ou s'il a dépassé son quota de commandes en grâce (>= 2), ses produits sont automatiquement masqués du catalogue.
  3. **Calcul Haversine** : Si les coordonnées `lat` et `lng` de l'acheteur sont fournies, calcule la distance kilométrique :
     ```typescript
     const haversine = (lat1, lng1, lat2, lng2) => {
       const R = 6371;
       const dLat = (lat2 - lat1) * Math.PI / 180;
       const dLng = (lng2 - lng1) * Math.PI / 180;
       const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
       return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     };
     ```
  4. Filtre les produits dans le rayon défini et les classe par ordre de proximité croissante.

#### `createOrder(body: { storeId, vendorId, total, items, needsDelivery })`
- **Route** : `POST /management/orders`
- **Logique** :
  1. Crée une commande `SupplierOrder` de statut initial `PENDING`.
  2. Crée les lignes de commande `SupplierOrderItem`.
  3. Déclenche de manière asynchrone l'enregistrement de l'interaction anti-leakage via `interactionService.logOrder(storeId, vendorId, total)`.
  4. Le vendeur reçoit une notification de nouvelle commande.

#### `submitRFQQuote(body: { rfqId, price, notes })`
- **Route** : `POST /management/vendor/rfq`
- **Logique** :
  1. Vérifie que le vendeur n'a pas déjà soumis d'offre pour cette demande.
  2. Enregistre l'offre `MarketplaceQuote`.
  3. Envoie une notification interne `TradeNotification` au propriétaire de la boutique émettrice.

---

## 6.4 Modèles Prisma Impliqués

- `VendorProduct` (`id`, `name`, `price`, `minOrderQty`, `unit`, `isFeatured`, `isFlashSale`, `discountPrice`, `tags`, `deliveryAreas`, `vendorId`)
- `ProductStandard` (référentiel de produits standardisés)
- `MktBundle` & `MktBundleItem` (packs composés)
- `MarketplaceRFQ` (`id`, `title`, `description`, `category`, `quantity`, `budget`, `expiresAt`, `status`, `storeId`)
- `MarketplaceQuote` (`id`, `rfqId`, `vendorId`, `price`, `notes`, `status`)
- `SupplierOrder` (`id`, `total`, `status`, `storeId`, `vendorId`, `needsDelivery`)
- `TradeNotification` (alertes temps réel sur devis et commandes)

---

## 6.5 Dépendances & Algorithmes

- **Formule Haversine** : Algorithme trigonométrique pour le calcul de distance orthodromique.
- `InteractionService` : Analyse prédictive des risques de fuite transactionnelle.
