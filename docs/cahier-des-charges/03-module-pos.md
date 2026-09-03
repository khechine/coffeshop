# 03 — Module Point de Vente (POS Caisse Web & Mobile)

## 3.1 Périmètre Fonctionnel

Le module POS (Point de Vente) constitue le cœur opérationnel des établissements de restauration (cafés, salons de thé, pâtisseries, boulangeries). Il permet aux équipes au comptoir et en salle de saisir des commandes rapidement, d'encaisser, d'imprimer des tickets et d'interagir en temps réel avec la cuisine / le bar.

### Fonctionnalités Clés
1. **Encaissement Rapide & Panier** :
   - Sélection tactile des articles groupés par catégories avec repères visuels/couleurs.
   - Calcul dynamique des totaux HT, ventilation TVA (7%, 19%) et TTC.
   - Multiples modes de règlement (Espèces, Carte Bancaire, Points Fidélité, Mixte).
   - Calcul de la monnaie à rendre (`change`).
2. **Modes de Vente Spécifiques** :
   - **Mode Sur Place / Tables** : Affectation des commandes à un plan de table zoné (`StoreZone`, `StoreTable`).
   - **Mode À Emporter (Takeaway)** : Détection et décompte automatique des emballages associés (gobelets, boîtes, sacs).
   - **Mode Simplifié / Rachma** : Grille condensée ultra-rapide pour forte affluence (ex: comptoir café express).
3. **KDS & Affichage Cuisine/Bar (Préparation)** :
   - Suivi du statut de préparation : `PENDING` ➔ `IN_PROGRESS` ➔ `READY` ➔ `SERVED`.
   - Dispatch par poste (`bar`, `cuisine`, `chicha`).
4. **Annulation Sécurisée & Retours** :
   - Annulation de vente (`cancelSale`) soumise à autorisation avec remise en stock automatique des matières premières consommées.
5. **Impression des Tickets (ESC/POS & Thermal)** :
   - Génération de tickets clients avec mentions légales et QR Code fiscal NACEF.
   - Prise en charge des imprimantes Bluetooth et réseau local.
6. **Synchronisation Temps Réel (WebSockets)** :
   - Diffusion instantanée des ventes créées/annulées via `SalesGateway` pour mise à jour des écrans connectés (KDS, dashboard).

---

## 3.2 Fichiers Sources & Responsabilités

| Rôle | Fichier | Description |
|------|---------|-------------|
| **Contrôleur API** | `apps/api/src/sales/sales.controller.ts` | Endpoints REST de vente (`POST /sales`, `GET /sales/:storeId`, etc.) |
| **Service Ventes** | `apps/api/src/sales/sales.service.ts` | Logique métier transactionnelle de vente, calculs de TVA, déstockage et chaînage fiscal |
| **Passerelle WebSockets** | `apps/api/src/websockets/sales.gateway.ts` | Émission d'événements `new_sale` et `sale_updated` via Socket.io |
| **Calcul Fiscal & Hash** | `apps/api/src/domains/fiscal/tax.utils.ts` | Calcul précis HT/TVA/TTC et ventilation des taux |
| **Contrôleur Produits** | `apps/api/src/products/products.controller.ts` | Formattage des produits avec couleur et packagings pour le POS |
| **Interface POS Web** | `apps/admin-dashboard/app/pos/POSClient.tsx` | Composant client Next.js gérant le panier, le plan de table, l'encaissement |
| **Impression Web** | `apps/admin-dashboard/app/pos/PrintService.ts` | Service de rendu et d'impression thermique du ticket |
| **Interface POS Mobile** | `apps/pos-mobile/App.tsx` | Application Expo complète : grille produits, panier, calcul monnaie, impression Bluetooth |
| **Impression Mobile** | `apps/pos-mobile/src/services/PrintService.ts` | Pilote Bluetooth thermique ESC/POS mobile |

---

## 3.3 Spécification des Fonctions Majeures

### Backend (`apps/api/src/sales/sales.service.ts`)

#### `createSale(dto: CreateSaleDto)`
- **Route** : `POST /sales`
- **Entrées** : `storeId`, `baristaId`, `takenById`, `mode` (`NORMAL` | `TAKEAWAY` | `TABLE`), `sessionId`, `terminalId`, tableau `items` (`productId`, `quantity`, `price`).
- **Logique Transactionnelle** :
  1. **Vérification de restriction** : Vérifie si le magasin a `isRestricted: true` (compte bloqué suite à impayé/solde négatif). Rejette si bloqué.
  2. **Calcul de taxes** : Charge les taux de TVA de chaque produit (`Product.taxRate`) et délègue à `calculateTaxTotals()`.
  3. **Chaînage fiscal NACEF** :
     - Récupère ou initialise le `fiscalSecret` du store.
     - Lit le `previousHash` du dernier ticket fiscal émis par ce magasin.
     - Exécute `buildNextFiscalMetadata()` pour générer le hash SHA-256 chaîné, le numéro fiscal séquentiel et incrémenter `Store.currentFiscalSequence`.
  4. **Enregistrement de la vente** : Crée la `Sale` et les `SaleItem` avec totaux HT, montant TVA et ventilation JSON.
  5. **Déstockage des matières premières** :
     - Pour chaque produit vendu, recherche la recette associée (`RecipeItem`).
     - Filtre les composants selon `consumeType` (ex: gobelet pris en compte uniquement si `TAKEAWAY` ou `BOTH`).
     - Décrémente la quantité dans `StockItem.quantity`.
  6. **Diffusion WebSocket** : Émet la vente via `SalesGateway.notifyNewSale(sale)`.
  7. **Signature fiscale asynchrone** : Déclenche `NacefService.signTicket(sale.id)` si le store est homologué NACEF.
- **Sortie** : Entité `Sale` complète avec hash et numéro fiscal.

#### `cancelSale(id: string, canceledById: string)`
- **Route** : `POST /sales/:id/cancel`
- **Entrées** : `id` (ID vente), `canceledById` (ID utilisateur annulant)
- **Logique** :
  1. Vérifie que la vente n'est pas déjà annulée (`isVoid: false`).
  2. Passe `isVoid = true`, statut de paiement `CANCELLED`.
  3. Récupère la recette de chaque article vendu et réincrémente le stock (`StockItem.quantity`).
  4. Crée un log d'audit immuable `FiscalLog` portant l'action `CANCEL` et le hash de l'annulation.
  5. Notifie les clients WebSocket via `salesGateway.notifySaleUpdated(sale)`.

#### `updatePreparationStatus(id, status, preparedById, station)`
- **Route** : `POST /sales/:id/preparation`
- **Entrées** : Statut cible (`PENDING`, `IN_PROGRESS`, `READY`, `SERVED`), ID préparateur, station optionnelle.
- **Logique** : Met à jour la vente et horodate `preparedAt`. Notifie la passerelle WebSocket.

---

## 3.4 Modèles Prisma Impliqués

- `Sale` (`id`, `total`, `totalHt`, `totalTax`, `taxBreakdown`, `mode`, `isVoid`, `fiscalNumber`, `sequenceNumber`, `hash`, `previousHash`, `signature`, `paymentMethod`, `paymentStatus`, `preparationStatus`)
- `SaleItem` (`id`, `saleId`, `productId`, `quantity`, `price`, `unitPriceHt`, `taxRate`, `taxAmount`, `totalHt`, `totalTtc`)
- `Product` & `RecipeItem` (définition des ingrédients et emballages)
- `StockItem` (stock décrémenté/réincrémenté)
- `StoreTable` & `StoreZone` (gestion de table)
- `PosTerminal` (traçabilité du périphérique caisse)
- `FiscalLog` (traçabilité inviolable)

---

## 3.5 Dépendances Internes & Externes

- `crypto` : Calcul des empreintes cryptographiques SHA-256 pour le chaînage fiscal.
- `Socket.io` : Notification bi-directionnelle temps réel.
- `ESC/POS protocol` : Pilotage direct d'imprimantes thermiques 58mm/80mm.
- `@coffeeshop/database` : Couche d'accès aux données transactionnelle.
