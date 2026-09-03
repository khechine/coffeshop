# 09 — Module Rapports, Statistiques & Décisionnel

## 9.1 Périmètre Fonctionnel

Le module de reporting consolide les données de vente, d'exploitation et de stock pour fournir aux gérants de boutique et directeurs de réseau une vision analytique complète de leur rentabilité et de leurs performances opérationnelles.

### Fonctionnalités Clés
1. **Tableau de Bord KPIs Temps Réel** :
   - Chiffre d'Affaires brut et net : Aujourd'hui, Hier, Semaine en cours, Mois en cours, et Cumul historique.
   - Nombre total de transactions (tickets émis).
   - Panier moyen par client.
2. **Marge & Rentabilité d'Exploitation** :
   - Déduction en direct des charges et achats du jour (`Expense`).
   - Calcul de la marge commerciale (%) et du bénéfice net journalier (`netProfit = totalSales - totalExpenses`).
3. **Analyse des Ventes Produits (Mix Produit)** :
   - Top 10 des produits les plus vendus par volume de pièces et par contribution au chiffre d'affaires.
4. **Productivité de l'Équipe (Classement Staff)** :
   - Classement des serveurs / baristas selon le nombre de commandes prises et le montant total encaissé.
   - Suivi par rapport aux objectifs quotidiens individuels (`dailyTarget`).
5. **Rendement des Emplacements & Tables** :
   - Chiffre d'affaires généré par table physique (`tableName`) pour optimiser la disposition de la salle.
6. **Historique Graphique des Tendances** :
   - Évolution quotidienne du CA sur une fenêtre glissante de 7 jours.

---

## 9.2 Fichiers Sources & Responsabilités

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **Contrôleur API** | `apps/api/src/management.controller.ts` (lignes 1525-1690) | Endpoint consolidé `GET /management/reports/summary/:storeId` |
| **Interface Rapports Web** | `apps/admin-dashboard/app/admin/reports/` | Page de statistiques avec graphiques interactifs |
| **Widget Dashboard Mobile** | `apps/pos-mobile/src/screens/management/ManagementScreens.tsx` | Vue condensée des métriques clés pour smartphone/tablette |

---

## 9.3 Spécification de la Fonction de Synthèse

### Backend (`getReportSummary`)
- **Route** : `GET /management/reports/summary/:storeId`
- **Sécurité** : `MarketplaceAuthGuard` (protégé par token Bearer)
- **Traitement & Requêtes Parallèles** :
  1. **Agrégations temporelles `Prisma.sale.aggregate`** :
     - Ventes du jour (`createdAt >= today at 00:00:00`, `isVoid: false`).
     - Ventes d'hier (`createdAt between yesterday and endOfYesterday`).
     - Ventes des 7 derniers jours et du mois en cours.
  2. **Calcul des dépenses du jour `Prisma.expense.aggregate`** :
     - Somme des montants sur la journée en cours.
  3. **Articles en alerte stock** :
     - Requête SQL brute comparant la quantité au seuil minimal :
       ```sql
       SELECT COUNT(*) as count FROM "StockItem"
       WHERE "storeId" = $storeId AND "quantity" < "minThreshold" AND "minThreshold" > 0;
       ```
  4. **Génération de la série temporelle (7 jours)** :
     - Boucle d'agrégation jour par jour pour alimenter le graphique.
  5. **Requêtes SQL de classement analytique (Top Items)** :
     - **Top Produits** :
       ```sql
       SELECT p.name, SUM(si.quantity) as qty, SUM(si.quantity * si.price) as revenue
       FROM "SaleItem" si
       JOIN "Sale" s ON si."saleId" = s.id
       JOIN "Product" p ON si."productId" = p.id
       WHERE s."storeId" = $storeId AND s."isVoid" = false AND s."createdAt" >= $today
       GROUP BY p.name ORDER BY qty DESC LIMIT 10;
       ```
     - **Top Staff** :
       ```sql
       SELECT u.name, SUM(s.total) as revenue, COUNT(s.id) as count
       FROM "Sale" s
       JOIN "User" u ON s."takenById" = u.id
       WHERE s."storeId" = $storeId AND s."isVoid" = false AND s."createdAt" >= $today
       GROUP BY u.name ORDER BY revenue DESC LIMIT 5;
       ```
     - **Top Tables** :
       ```sql
       SELECT "tableName", SUM(total) as revenue
       FROM "Sale"
       WHERE "storeId" = $storeId AND "isVoid" = false AND "tableName" IS NOT NULL AND "createdAt" >= $today
       GROUP BY "tableName" ORDER BY revenue DESC LIMIT 5;
       ```

---

## 9.4 Modèles Prisma Impliqués

- `Sale` & `SaleItem` (agrégations des encaissements)
- `Expense` (agrégations des coûts)
- `StockItem` (inventaire d'alerte)
- `User` (identification des performances baristas)
- `Product` (classement des articles vedettes)

---

## 9.5 Optimisation & Performance

- Requêtes d'agrégation exécutées en parallèle via `Promise.all` pour un temps de réponse inférieur à 100ms.
- Requêtes complexes compilées en requêtes SQL natives (`$queryRaw`) évitant le transfert inutile d'enregistrements en mémoire Node.js.
