# 04 — Module Stock, Recettes, Fournisseurs & Factures IA

## 4.1 Périmètre Fonctionnel

Le module de gestion des stocks et approvisionnements assure le suivi des matières premières utilisées pour la fabrication des boissons et pâtisseries, la configuration des fiches techniques (recettes), le suivi des fournisseurs directs et le réapprovisionnement automatisé, complété par un moteur d'OCR/IA pour l'analyse des factures d'achat.

### Fonctionnalités Clés
1. **Gestion des Matières Premières (`StockItem`)** :
   - Fiches articles : nom, quantité disponible, coût unitaire (coût de revient), seuil d'alerte (`minThreshold`), unité de mesure (`GlobalUnit`).
   - Alertes de rupture et notifications automatiques de stock bas.
2. **Fiches Techniques / Recettes (`RecipeItem`)** :
   - Association des matières premières à chaque produit fini (ex: 18g de café en grains + 1 gobelet 20cl pour un espresso à emporter).
   - Prise en charge des emballages conditionnels : l'emballage n'est consommé que lors d'une vente en mode `TAKEAWAY`.
3. **Fournisseurs Locaux & Commandes d'Approvisionnement (`Supplier` / `SupplierOrder`)** :
   - Carnet d'adresses fournisseurs avec numéros de contact et vérification WhatsApp.
   - Création de bons de commande avec articles, quantités, prix d'achat convenus.
   - Réception de commande (`/orders/:id/receive`) : validation en un clic qui incrémente automatiquement les stocks concernés.
4. **Analyse Automatisée de Factures par IA (Gemini Vision)** :
   - Téléversement d'une photo de facture ou ticket d'achat.
   - Extraction optique assistée par IA : nom du fournisseur, liste d'articles avec prix unitaires, quantités et taux de TVA.
5. **Import Comptable & Mise à Jour des Coûts** :
   - Enregistrement des nouveaux articles ou mise à jour des stocks existants.
   - Création automatique de la ligne de dépense (`Expense`) de catégorie `ACHAT` pour le suivi de la rentabilité.

---

## 4.2 Fichiers Sources & Responsabilités

| Rôle | Fichier | Description |
|------|---------|-------------|
| **Contrôleur API** | `apps/api/src/management.controller.ts` | Endpoints stock (`/management/stock/*`), fournisseurs (`/management/suppliers/*`), commandes (`/management/orders/*`), analyse facture (`/management/invoice/*`) |
| **Service Inventaire** | `apps/api/src/inventory/inventory.service.ts` | Décompte du stock lors des ventes et vérification des seuils |
| **Service Recettes** | `apps/api/src/management.controller.ts` (section RECIPES) | CRUD fiches techniques produits |
| **OCR & IA Gemini** | `apps/api/src/management.controller.ts` (lignes 2075-2143) | Intégration de l'API Google Generative Language (`gemini-1.5-flash`) |
| **Écrans Web Stock** | `apps/admin-dashboard/app/admin/inventory/page.tsx` | Interface de consultation et inventaire physique |
| **Écran Web Factures** | `apps/admin-dashboard/app/admin/expenses/page.tsx` | Interface d'import de facture et saisie des dépenses |
| **Écran Mobile Stock** | `apps/pos-mobile/src/screens/management/ManagementScreens.tsx` | Consultation des niveaux de stock et ajustement rapide |

---

## 4.3 Spécification des Fonctions Majeures

### Backend (`apps/api/src/management.controller.ts`)

#### `getStock(storeId: string)`
- **Route** : `GET /management/stock/:storeId`
- **Description** : Renvoie l'intégralité des matières premières d'un établissement avec leur unité de mesure et fournisseur préférentiel.

#### `updateRecipe(productId: string, body: { items: [...] })`
- **Route** : `POST /management/products/:id/recipe`
- **Logique** : Transaction Prisma atomique :
  1. Suppression des anciennes lignes de recettes pour le produit.
  2. Création des nouvelles associations `RecipeItem` avec quantité, flag `isPackaging` et règle de décompte `consumeType` (`DINE_IN`, `TAKEAWAY`, `BOTH`).

#### `receiveOrder(id: string)`
- **Route** : `POST /management/orders/:id/receive`
- **Description** : Marque la commande fournisseur comme `STOCKED`. Pour chaque ligne de la commande liée à un `stockItemId`, incrémente la quantité en stock :
  ```typescript
  await prisma.stockItem.update({
    where: { id: item.stockItemId },
    data: { quantity: { increment: Number(item.quantity) } }
  });
  ```

#### `analyzeInvoice(body: { imageBase64: string })`
- **Route** : `POST /management/invoice/analyze`
- **Entrées** : Image encodée en base64 de la facture d'achat.
- **Logique** :
  1. Récupère la clé API `GEMINI_API_KEY` depuis l'environnement.
  2. Construit le prompt d'extraction structuré demandant `supplierName`, `items` (`name`, `quantity`, `price`, `tva`).
  3. Appelle l'endpoint Google Generative Language (`v1beta/models/gemini-1.5-flash:generateContent`) avec `responseMimeType: "application/json"`.
  4. Valide et renvoie l'objet JSON extrait pour pré-remplissage du formulaire utilisateur.

#### `importInvoiceItems(body: { storeId, supplierName, items: [...] })`
- **Route** : `POST /management/invoice/import`
- **Logique** :
  1. Recherche ou crée à la volée le `Supplier` selon son nom.
  2. Pour chaque article extrait :
     - Si l'article existe déjà : additionne la quantité reçue et actualise le coût d'achat et le fournisseur.
     - S'il s'agit d'un nouvel article : crée un `StockItem` rattaché à la boutique.
  3. Calcule le total TTC d'achat et génère automatiquement une écriture dans `Expense` de catégorie `ACHAT` :
     ```typescript
     await prisma.expense.create({
       data: {
         storeId: body.storeId,
         category: "ACHAT",
         amount: totalTtc,
         description: `Facture Achat - ${supplierName}`
       }
     });
     ```

---

## 4.4 Modèles Prisma Impliqués

- `StockItem` (`id`, `name`, `quantity`, `cost`, `minThreshold`, `taxRate`, `storeId`, `unitId`, `preferredSupplierId`)
- `GlobalUnit` (`id`, `name`, `symbol`)
- `RecipeItem` (`id`, `productId`, `stockItemId`, `quantity`, `isPackaging`, `consumeType`)
- `Supplier` (`id`, `name`, `contact`, `phone`, `storeId`)
- `SupplierOrder` & `SupplierOrderItem` (commandes d'achat et lignes de détail)
- `Expense` (dépenses d'exploitation et d'achats)

---

## 4.5 Dépendances Internes & Externes

- `Google Generative Language API (Gemini)` : Analyse multimodale de documents scannés.
- `@coffeeshop/database` : Transactions Prisma et intégrité référentielle.
