# Architecture Database-per-Tenant avec Prisma (Guide d'Implémentation & Spécifications)

Ce document conserve les spécifications techniques complètes, l'architecture cible et le guide d'exécution pour la migration de la base de données d'ElKassa POS d'un modèle partagé vers une **architecture Database-per-Tenant (une base de données PostgreSQL isolée par boutique/tenant)**.

---

## 📐 1. Vision d'Architecture

```
                                ┌─────────────────────────────────────────┐
                                │      1. MASTER / MANAGEMENT DB          │
                                │   (Users, Stores, Subscriptions, Keys)  │
                                └────────────────────┬────────────────────┘
                                                     │
                                ┌────────────────────┴────────────────────┐
                                │     TenantPrismaManager (Cache/Pool)    │
                                │   Résolution dynamique par storeId      │
                                └─────────┬─────────────────────┬─────────┘
                                          │                     │
                        ┌─────────────────┴─┐                 ┌─┴─────────────────┐
                        │ 2. TENANT DB A    │                 │ 3. TENANT DB B    │
                        │ (elkassa_store_1) │                 │ (elkassa_store_2) │
                        │  - Products       │                 │  - Products       │
                        │  - Sales          │                 │  - Sales          │
                        │  - Stocks         │                 │  - Stocks         │
                        │  - Cash Sessions  │                 │  - Cash Sessions  │
                        │  - Fiscal Logs    │                 │  - Fiscal Logs    │
                        └───────────────────┘                 └───────────────────┘
```

---

## 🗂️ 2. Structure des Schémas Prisma

### A. Base Centrale (Master DB) : `packages/database/prisma/master.prisma`

Contient les données d'administration, d'authentification et de routage des boutiques.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_MASTER")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client-master"
}

model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  name         String?
  role         String      @default("STORE_OWNER")
  stores       UserStore[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Store {
  id                      String        @id @default(cuid())
  name                    String
  code                    String        @unique
  address                 String?
  phone                   String?
  dbName                  String        // Ex: "elkassa_tenant_store123"
  dbConnectionString      String        // Connection URL de la BDD isolée
  isFiscalEnabled         Boolean       @default(false)
  status                  String        @default("ACTIVE")
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt
  userStores              UserStore[]
}

model UserStore {
  userId  String
  storeId String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  store   Store  @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@id([userId, storeId])
}
```

---

### B. Base Métier Boutique (Tenant DB) : `packages/database/prisma/tenant.prisma`

Contient les tables opérationnelles d'une boutique spécifique, étanches à 100%.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_TENANT_TEMPLATE")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client-tenant"
}

model Product {
  id          String   @id @default(cuid())
  name        String
  price       Float
  taxRate     Float    @default(0.19)
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  stockQty    Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  saleItems   SaleItem[]
}

model Category {
  id        String    @id @default(cuid())
  name      String
  products  Product[]
  createdAt DateTime  @default(now())
}

model Sale {
  id                 String     @id @default(cuid())
  fiscalNumber       String?    @unique
  sequenceNumber     Int?
  total              Float
  subtotal           Float
  discount           Float      @default(0)
  paymentMethod      String     @default("CASH")
  isFiscal           Boolean    @default(false)
  isOffline          Boolean    @default(false)
  isVoid             Boolean    @default(false)
  nacefOperationType String     @default("VENTE - NORMALE")
  createdAt          DateTime   @default(now())
  items              SaleItem[]
}

model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  productId String
  quantity  Float
  price     Float
  sale      Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
}

model CashSession {
  id         String   @id @default(cuid())
  status     String   @default("OPEN")
  openedAt   DateTime @default(now())
  closedAt   DateTime?
  totalSales Float    @default(0)
  cashSales  Float    @default(0)
  cardSales  Float    @default(0)
}

model FiscalLog {
  id           String   @id @default(cuid())
  saleId       String
  hash         String
  previousHash String
  signature    String
  createdAt    DateTime @default(now())
}
```

---

## ⚙️ 3. Le Service `TenantPrismaManager`

Fichier : `packages/database/src/tenantManager.ts`

```typescript
import { PrismaClient as MasterPrismaClient } from '@prisma/client-master';
import { PrismaClient as TenantPrismaClient } from '@prisma/client-tenant';

const masterPrisma = new MasterPrismaClient();

// Cache LRU / Map des clients Prisma Tenants par URL
const tenantClientsCache = new Map<string, TenantPrismaClient>();

export class TenantPrismaManager {
  /**
   * Extrait ou instancie le client Prisma dédié à un storeId
   */
  static async getTenantClient(storeId: string): Promise<TenantPrismaClient> {
    // 1. Récupérer la chaîne de connexion de la boutique depuis la Master DB
    const store = await masterPrisma.store.findUnique({
      where: { id: storeId },
      select: { dbConnectionString: true }
    });

    if (!store || !store.dbConnectionString) {
      throw new Error(`Tenant DB connection string not found for storeId: ${storeId}`);
    }

    const connectionString = store.dbConnectionString;

    // 2. Vérifier si l'instance existe déjà dans le cache
    if (tenantClientsCache.has(connectionString)) {
      return tenantClientsCache.get(connectionString)!;
    }

    // 3. Créer une nouvelle instance avec la chaîne de connexion du tenant
    const newClient = new TenantPrismaClient({
      datasources: {
        db: {
          url: connectionString
        }
      }
    });

    // Stocker dans le cache
    tenantClientsCache.set(connectionString, newClient);
    return newClient;
  }

  /**
   * Client Master pour la gestion des utilisateurs et des boutiques
   */
  static getMasterClient(): MasterPrismaClient {
    return masterPrisma;
  }
}
```

---

## 🚀 4. Procédure de Création et Migration des Tenants

### A. Création Automatique d'une Nouvelle Base Tenant (`provisionTenant.ts`)

```typescript
import { execSync } from 'child_process';
import { Client } from 'pg';
import { TenantPrismaManager } from './tenantManager';

export async function provisionNewTenant(storeId: string, storeName: string) {
  const dbName = `elkassa_tenant_${storeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const connectionString = `postgresql://postgres:postgres@localhost:5432/${dbName}?schema=public`;

  // 1. Créer la BDD physique sur PostgreSQL
  const pgClient = new Client({ connectionString: process.env.DATABASE_URL_MASTER });
  await pgClient.connect();
  await pgClient.query(`CREATE DATABASE "${dbName}";`);
  await pgClient.end();

  // 2. Enregistrer la boutique dans la Master DB
  const masterDb = TenantPrismaManager.getMasterClient();
  await masterDb.store.create({
    data: {
      id: storeId,
      name: storeName,
      code: dbName,
      dbName: dbName,
      dbConnectionString: connectionString
    }
  });

  // 3. Exécuter les migrations de schéma Prisma sur la nouvelle BDD Tenant
  execSync(`DATABASE_URL="${connectionString}" npx prisma db push --schema=./prisma/tenant.prisma`, {
    stdio: 'inherit'
  });

  console.log(`✅ Base Tenant ${dbName} provisionnée avec succès !`);
}
```

---

### B. Execution Globale des Migrations Multi-Tenants (`migrateAllTenants.ts`)

```typescript
import { execSync } from 'child_process';
import { TenantPrismaManager } from './tenantManager';

export async function migrateAllTenants() {
  const masterDb = TenantPrismaManager.getMasterClient();
  const stores = await masterDb.store.findMany({ select: { id: true, dbConnectionString: true } });

  console.log(`🔄 Exécution des migrations sur ${stores.length} bases de données tenants...`);

  for (const store of stores) {
    if (!store.dbConnectionString) continue;
    console.log(`➡️ Migration du tenant: ${store.id}...`);
    try {
      execSync(`DATABASE_URL="${store.dbConnectionString}" npx prisma db push --schema=./prisma/tenant.prisma`, {
        stdio: 'inherit'
      });
    } catch (err) {
      console.error(`❌ Échec de migration pour le tenant ${store.id}:`, err);
    }
  }

  console.log(`✨ Migrations multi-tenants terminées !`);
}
```

---

## 📝 5. Étapes de Déploiement & Migration Future

1. **Phase 1** : Déployer la base centrale `master.prisma` et alimenter `TenantRegistry` avec le store par défaut.
2. **Phase 2** : Exécuter le script de scission/migration des données existantes (`scripts/split-monolith-db.ts`).
3. **Phase 3** : Remplacer `prisma.sale` / `prisma.product` par `(await TenantPrismaManager.getTenantClient(storeId)).sale` dans les Server Actions Next.js.
4. **Phase 4** : Activer le provisioning automatique 1-click lors de la création d'une nouvelle franchise ou boutique.
