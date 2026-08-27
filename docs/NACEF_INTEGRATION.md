# Intégration NACEF - CoffeeShop B2B

## Résumé

Document complet de l'intégration NACEF (Nouveau Système de Caisse Enregistreuse Fiscal) pour la conformité fiscale en Tunisie. Ce module permet à la plateforme CoffeeShop B2B de signer électroniquement les tickets via le S-MDF (Module de Données Fiscales) et d'émettre des tickets conformes à la réglementation tunisienne.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Prérequis](#3-prérequis)
4. [Configuration](#4-configuration)
5. [Schéma de base de données](#5-schéma-de-base-de-données)
6. [Module NACEF - Fichiers](#6-module-nacef---fichiers)
7. [API Endpoints](#7-api-endpoints)
8. [Flow de signature d'un ticket](#8-flow-de-signation-dun-ticket)
9. [Mapping des données](#9-mapping-des-données)
10. [Guide d'installation](#10-guide-dinstallation)
11. [Multi-tenant & Isolation](#11-multi-tenant--isolation)
12. [Tests et conformité](#12-tests-et-conformité)
13. [Check-list homologation](#13-check-list-homologation)

---

## 1. Vue d'ensemble

### Qu'est-ce que la NACEF ?

La NACEF (Nouveau Système de Caisse Enregistreuse Fiscal) est un système imposé par le gouvernement tunisien pour :
- La numérotation séquentielle des factures/tickets
- La signature électronique des tickets via un S-MDF (Module de Données Fiscales)
- La génération de QR codes officiels sur chaque ticket
- L'audit trail fiscal complet (chaînage hash)

### Ce que fait ce module

| Fonctionnalité | Statut |
|---|---|
| Communication avec le S-MDF (5 endpoints) | ✅ Implémenté |
| Construction du ticket NACEF v1.1.4 | ✅ Implémenté |
| Conversion DT → Millimes | ✅ Implémenté |
| Signature électronique des tickets | ✅ Implémenté |
| QR code officiel NACEF | ✅ Implémenté |
| Logging audit trail | ✅ Implémenté |
| Mode hors-ligne | ⬜ À implémenter |
| Multi-caisses (S-MDF type serveur) | ⬜ À implémenter |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    POS App / Dashboard                   │
│                    (Expo / Next.js)                      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP POST /sales
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   SalesService                           │
│              (apps/api/src/sales/)                       │
│                                                         │
│  1. Crée la vente (hash chain, fiscal number)           │
│  2. Vérifie si NACEF prêt → isStoreReady()             │
│  3. Appelle signTicket() → retourne QR + ticketId       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   NacefService                           │
│              (apps/api/src/nacef/)                       │
│                                                         │
│  - buildTicket()    → Payload NACEF v1.1.4              │
│  - toBase64()       → Encodage pour le S-MDF            │
│  - signTicket()     → Envoi au S-MDF pour signature     │
│  - logEvent()       → Audit trail                       │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (fetch natif)
                        ▼
┌─────────────────────────────────────────────────────────┐
│              S-MDF Agent (localhost:10006)               │
│                                                         │
│  POST /sic/external/sign/request  ← Signature ticket    │
│  POST /sic/external/sync/request  ← Synchronisation     │
│  GET  /sic/external/manifest      ← État du S-MDF       │
│  POST /sic/external/certificate/  ← Certificat          │
│  POST /sic/external/log/          ← Audit trail         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│            Plateforme NACEF (CIMF)                       │
│         https://www.cimf.tn/                             │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Prérequis

### Logiciel requis

| Composant | Version | Description |
|---|---|---|
| Node.js | ≥ 20.0 | Runtime (fetch natif utilisé) |
| PostgreSQL | 15+ | Base de données |
| S-MDF Agent | ≥ 1.2.0 | Agent local ou distant fourni par la CIMF |

### Identifiants à obtenir

| Identifiant | Source | Format |
|---|---|---|
| **IMDF** | CIMF (délivré après homologation) | 14-16 caractères |
| **Matricule fiscal** | Direction Générale des Impôts | `1234567A` (8 chars) |
| **Référence d'homologation** | CIMF | 8-32 caractères |
| **Référence établissement** | Bureau de contrôle des impôts | `000` (principal) ou `00X` |
| **Code de Pairing** | CIMF | Pour la demande de certificat |

---

## 4. Configuration

### Variables d'environnement

Ajouter dans `.env` :

```env
# NACEF S-MDF Configuration
SMDF_BASE_URL="http://localhost:10006"
SMDF_AGENT_TYPE="client"          # "client" ou "serveur"
```

### Configuration par magasin (Store)

Les champs suivants doivent être remplis dans la table `Store` :

| Champ | Description | Exemple |
|---|---|---|
| `imdf` | Identifiant Module de Données Fiscales | `12345678901234` |
| `matriculeFiscal` | Matricule fiscal du commerçant | `1234567A` |
| `establishmentReference` | Numéro établissement | `000` |
| `commercialName` | Nom commercial | `Mon Coffee Shop` |
| `accreditationReference` | Référence homologation | `AC123456` |
| `isFiscalEnabled` | Activation du mode fiscal | `true` |
| `nacefSyncStatus` | État de synchronisation | `SYNCED` |

---

## 5. Schéma de base de données

### Ajouts au modèle Store

```prisma
// NACEF Official Fields
imdf                    String?   // Identifiant Module de Données Fiscales
matriculeFiscal         String?   // Matricule fiscal commerçant (8 chars)
establishmentReference  String?   // "000" principal, "00X" secondaire
commercialName          String?   // Nom commercial
accreditationReference  String?   // Référence certificat d'homologation
nacefSyncStatus         String?   // NOT_SYNCED, SYNCED, ERROR
nacefLastSyncAt         DateTime?
```

### Ajouts au modèle Sale

```prisma
// NACEF Officiel
nacefTicketId      String?   // ID unique assigné par NACEF
nacefQrCode        String?   // QR code officiel NACEF (base64)
nacefSyncedAt      DateTime? // Date de signature NACEF
nacefOperationType String?   // TICKET, PROFORMA, REFUND, DUPLICATE
nacefContext       String?   // SALE, TRAINING
```

### Nouveau modèle NacefSyncLog

```prisma
model NacefSyncLog {
  id          String   @id @default(cuid())
  storeId     String
  action      String   // SYNC, CERT_REQUEST, SIGN, LOG
  status      String   // SUCCESS, ERROR, PENDING
  request     Json?
  response    Json?
  errorMessage String?
  createdAt   DateTime @default(now())
}
```

### Migration

```bash
cd packages/database
pnpm db:push
# ou
pnpm db:migrate
```

---

## 6. Module NACEF - Fichiers

### Structure

```
apps/api/src/nacef/
├── nacef.module.ts           # Module NestJS
├── nacef.service.ts          # Logique métier (init, sign, sync)
├── nacef-client.ts           # HTTP client → 5 endpoints S-MDF
├── nacef-ticket.builder.ts   # Construit le payload NACEF v1.1.4
├── nacef.helpers.ts          # Utilitaires (dtToMillimes, mappers)
├── nacef.controller.ts       # REST API endpoints
├── index.ts                  # Barrel exports
└── dto/
    ├── sync-request.dto.ts
    ├── sign-request.dto.ts
    ├── certificate-request.dto.ts
    └── log-entry.dto.ts
```

### Description des fichiers

| Fichier | Rôle | Lignes |
|---|---|---|
| `nacef-client.ts` | Client HTTP vers le S-MDF. Utilise `fetch` natif (Node 20). Logging automatique dans `NacefSyncLog`. | 158 |
| `nacef-ticket.builder.ts` | Convertit un `Sale` interne en payload NACEF conforme au schéma v1.1.4. | 225 |
| `nacef.helpers.ts` | Fonctions pures : `dtToMillimes`, `mapPaymentMethod`, `mapOperationType`, `taxRateToCode`, `generateTransactionId` | 73 |
| `nacef.service.ts` | Orchestre les appels client + builder. Méthodes : `initialize`, `signTicket`, `sync`, `isStoreReady` | 191 |
| `nacef.controller.ts` | API REST exposée : 5 endpoints pour gérer le cycle de vie NACEF | 67 |

---

## 7. API Endpoints

### POST `/nacef/initialize/:storeId`

Initialise NACEF pour un magasin (certificat + synchronisation).

**Request body :**
```json
{
  "model": "CoffeeShopPOS",
  "serialNumber": "CR12345678",
  "version": "1.0.0"
}
```

**Response :**
```json
{
  "certResult": { "..." },
  "manifest": {
    "imdf": "12345678901234",
    "status": "5: Can be used to sign tickets.",
    "version": "1.2.0",
    "state": "ONLINE"
  },
  "syncResult": { "..." }
}
```

### POST `/nacef/sign/:saleId`

Signe un ticket avec NACEF. Retourne le ticket ID et le QR code officiel.

**Response :**
```json
{
  "success": true,
  "ticketIdentifier": "TICKET-2026-ABC123",
  "qrcodeImage": "base64...",
  "nacefTicket": { "..." }
}
```

### GET `/nacef/manifest/:storeId`

Récupère l'état courant du S-MDF.

**Response :**
```json
{
  "imdf": "12345678901234",
  "status": "5: Can be used to sign tickets.",
  "version": "1.2.0",
  "type": "0: This SMDF runs a single equipment.",
  "certificateInfo": {
    "certRequestStatus": "CERTIFICATE_GENERATED",
    "issuanceDate": "2026-01-15T10:00:00Z",
    "expirationDate": "2027-01-15T10:00:00Z"
  },
  "state": "ONLINE",
  "availableOfflineTickets": 0
}
```

### POST `/nacef/sync/:storeId`

Synchronise le S-MDF avec la plateforme NACEF.

**Request body :**
```json
{
  "requestPINupdate": false
}
```

### GET `/nacef/ready/:storeId`

Vérifie si un magasin est prêt pour la signature NACEF.

**Response :**
```json
{
  "storeId": "abc123",
  "ready": true
}
```

---

## 8. Flow de signature d'un ticket

```
1. Vente créée (SalesService.createSale)
   │
   ├── Hash chain (SHA-256) calculé
   ├── Numéro fiscal généré (FAC-2026-000001)
   ├── FiscalLog créé
   │
   ▼
2. Vérification NACEF (isStoreReady)
   │
   ├── isFiscalEnabled = true ?
   ├── imdf rempli ?
   ├── matriculeFiscal rempli ?
   ├── accreditationReference rempli ?
   ├── nacefSyncStatus = 'SYNCED' ?
   │
   ▼
3. Construction du ticket NACEF (buildTicket)
   │
   ├── data_type: "ncf.cashier.operation"
   ├── version: "1.1.4"
   ├── transaction: { id, timestamp, operation, originator }
   ├── merchant_identity: { id (MF), taxpayer_establishment }
   ├── customer_identity: { id_type: PP/NP }
   ├── sale_details: [ { product, taxation, quantity } ]
   ├── tax_summary: [ { tax_code, total_amount } ]
   ├── payment_details: { collection_details, returned_change }
   ├── sale_summary: { total_excl_tax, total_incl_tax, total_tax }
   └── delivery_details: { type }
   │
   ▼
4. Encodage Base64 (toBase64)
   │
   ▼
5. Signature S-MDF (signTicket)
   │
   ├── POST /sic/external/sign/request
   │   Body: { base64Ticket, totalHT, totalTax, operationType, transactionType }
   │
   ├── Response: { ticketIdentifier, qrcodeImage }
   │
   ▼
6. Mise à jour Sale
   │
   ├── nacefTicketId = ticketIdentifier
   ├── nacefQrCode = qrcodeImage
   ├── nacefSyncedAt = now()
   │
   ▼
7. Impression du ticket avec QR code officiel
```

---

## 9. Mapping des données

### Conversion des montants

Tous les montants NACEF sont en **millimes entiers** (pas de décimales).

| Interne (DT) | NACEF (Millimes) | Formule |
|---|---|---|
| 15.500 DT | 15500 | `Math.round(dt * 1000)` |
| 0.190 DT | 190 | `Math.round(dt * 1000)` |

### Mapping des modes de paiement

| Interne | NACEF |
|---|---|
| `CASH` | `cash` |
| `CARD` | `bank_card` |
| `CHECK` | `check` |
| `MOBILE` | `mobile_payment` |
| `LOYALTY` | `contre_bon` |
| `RESTAURANT_TICKET` | `restaurant_ticket` |
| `WIRE_TRANSFER` | `wire_transfer` |

### Mapping des types d'opérations

| Interne | NACEF |
|---|---|
| Vente normale | `TICKET` |
| Annulation (`isVoid: true`) | `REFUND` |
| Copie de ticket | `DUPLICATE` |
| Ticket proforma | `PROFORMA` |

### Mapping des codes TVA

| Taux interne | Code NACEF |
|---|---|
| 0% | `EXONERE` |
| 7% | `TVA7` |
| 13% | `TVA13` |
| 19% | `TVA19` |

### Mapping des identifiants clients

| Type client | `id_type` | `id` |
|---|---|---|
| Personne physique (sans MF) | `NP` | absent |
| Personne physique (avec MF) | `PP` | `1234567A` |

---

## 10. Guide d'installation

### Étape 1 : Installer les dépendances

```bash
pnpm install
```

### Étape 2 : Migrer la base de données

```bash
cd packages/database
pnpm db:push
```

### Étape 3 : Configurer les variables d'environnement

Dans `.env` :
```env
SMDF_BASE_URL="http://localhost:10006"
SMDF_AGENT_TYPE="client"
```

### Étape 4 : Configurer le magasin

Via l'API ou directement en base :
```sql
UPDATE "Store" SET
  "imdf" = 'VOTRE_IMDF',
  "matriculeFiscal" = 'VOTRE_MF',
  "establishmentReference" = '000',
  "commercialName" = 'Nom Commercial',
  "accreditationReference" = 'VOTRE_REF',
  "isFiscalEnabled" = true,
  "nacefSyncStatus" = 'NOT_SYNCED'
WHERE id = 'VOTRE_STORE_ID';
```

### Étape 5 : Installer le S-MDF Agent

Télécharger et installer l'agent S-MDF sur le poste de caisse :
- Port par défaut : `10006`
- URL : `http://localhost:10006`

### Étape 6 : Initialiser NACEF

```bash
curl -X POST http://localhost:3001/nacef/initialize/VOTRE_STORE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "model": "CoffeeShopPOS",
    "serialNumber": "VOTRE_SERIAL",
    "version": "1.0.0"
  }'
```

### Étape 7 : Vérifier la synchronisation

```bash
curl http://localhost:3001/nacef/ready/VOTRE_STORE_ID
# {"storeId":"...","ready":true}
```

### Étape 8 : Tester la signature

```bash
curl -X POST http://localhost:3001/nacef/sign/SALE_ID
```

---

## 11. Multi-tenant & Isolation

### Architecture S-MDF par client

Chaque client entreprise a **son propre S-MDF** avec son certificat électronique :

```
┌─────────────────────────────────────────────────────────┐
│           CoffeeShop B2B (Plateforme)                    │
│                                                         │
│  Client A ──→ S-MDF A (localhost:10006) ──→ NACEF       │
│  Client B ──→ S-MDF B (localhost:10007) ──→ NACEF       │
│  Client C ──→ S-MDF C (localhost:10008) ──→ NACEF       │
└─────────────────────────────────────────────────────────┘
```

### Configuration par store

Chaque store doit configurer l'URL de son S-MDF via :

```bash
curl -X POST http://localhost:3001/nacef/config/VOTRE_STORE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-jwt-USER_ID-TIMESTAMP" \
  -d '{
    "smdfUrl": "http://localhost:10006",
    "imdf": "12345678901234",
    "matriculeFiscal": "1234567A",
    "establishmentReference": "000",
    "commercialName": "Mon Coffee Shop",
    "accreditationReference": "AC123456"
  }'
```

### Isolation des données

| Ressource | Isolation | Mécanisme |
|---|---|---|
| Identité fiscale (IMDF, MF) | ✅ Par store | Champs dédiés sur `Store` |
| Chaînage hash fiscal | ✅ Par store | `fiscalSecret` + `currentFiscalSequence` par store |
| Tickets signés | ✅ Par store | `nacefTicketId`, `nacefQrCode` sur `Sale` |
| Logs audit NACEF | ✅ Par store | `NacefSyncLog.storeId` FK |
| S-MDF URL | ✅ Par store | `Store.smdfUrl` — chaque store a son propre S-MDF |

### Authentification & Garde NACEF

Le guard `NacefAuthGuard` (`apps/api/src/auth/nacef-auth.guard.ts`) protège tous les endpoints NACEF :

1. **Validation du token** : format `user-jwt-{userId}-{timestamp}`
2. **Isolation tenant** : l'utilisateur ne peut accéder qu'au store qui lui est assigné
3. **SUPERADMIN** : peut accéder à n'importe quel store
4. **Résolution via saleId** : si l'endpoint utilise `saleId`, le store est résolu automatiquement

```typescript
// Tous les endpoints NACEF sont protégés
@Controller('nacef')
@UseGuards(NacefAuthGuard)  // ← Isolation tenant
export class NacefController { ... }
```

### Flux d'initialisation multi-tenant

```
1. Client installe son S-MDF local
   │
   ▼
2. Admin configure le store
   │
   ├── POST /nacef/config/:storeId
   │   Body: { smdfUrl: "http://localhost:10006", imdf, matriculeFiscal, ... }
   │
   ▼
3. Initialisation NACEF
   │
   ├── POST /nacef/initialize/:storeId
   │   → Certificate request → Manifest → Sync
   │
   ▼
4. Ventes signées par le S-MDF du client
   │
   ├── POST /nacef/sign/:saleId
   │   → Ticket envoyé au S-MDF LOCAL du store
   │   → QR code + ticketIdentifier retournés
   │
   ▼
5. Ticket imprimé avec QR code officiel
```

---

## 12. Tests et conformité

### Scénarios de test (PROCTEST)

| # | Scénario | Endpoint / Action | Résultat attendu |
|---|---|---|---|
| 1 | Synchronisation | `POST /nacef/sync/:storeId` | `status: "5: Can be used to sign tickets."` |
| 2 | Ticket normal | `POST /nacef/sign/:saleId` | `ticketIdentifier` + `qrcodeImage` retournés |
| 3 | Annulation (REFUND) | Vente avec `isVoid: true` | `op_type: "REFUND"` dans le ticket |
| 4 | Copie (DUPLICATE) | Vente avec `nacefOperationType: "DUPLICATE"` | `duplicated_transaction_identifier` requis |
| 5 | Multi-paiement | Vente MIXED avec `paymentDetails` | Plusieurs `collection_details` |
| 6 | Changement PIN | `POST /nacef/sync/:storeId` avec `requestPINupdate: true` | PIN changé |
| 7 | Z-Report | Génération rapport Z | Hash chain cohérent |
| 8 | Livraison | Vente avec `DELIVERY` | `carrier_id` requis (matricule fiscal livreur) |

### Validation du schéma NACEF

Pour valider qu'un ticket est conforme au schéma v1.1.4 :

```typescript
import Ajv from 'ajv';
import nacefSchema from '../../nacef/nacef-smdf-ticket-1.1.4.json';

const ajv = new Ajv();
const validate = ajv.compile(nacefSchema);

const isValid = validate(nacefTicket);
if (!isValid) {
  console.error('Erreurs de validation :', validate.errors);
}
```

### Champs obligatoires du ticket

| Champ | Obligatoire | Format |
|---|---|---|
| `data_type` | ✅ | `"ncf.cashier.operation"` (const) |
| `version` | ✅ | `"1.1.4"` (const) |
| `transaction.id` | ✅ | 8-48 chars |
| `transaction.timestamp` | ✅ | ISO 8601 |
| `transaction.operation.op_type` | ✅ | `TICKET`, `PROFORMA`, `REFUND`, `DUPLICATE` |
| `transaction.operation.context` | ✅ | `SALE`, `TRAINING` |
| `transaction.originator.*` | ✅ | 5 champs requis |
| `merchant_identity.id` | ✅ | Pattern `^\d{7}[A-Z]$` |
| `merchant_identity.id_type` | ✅ | `"MF"` (const) |
| `merchant_identity.taxpayer_establishment.*` | ✅ | 4 champs requis |
| `customer_identity.id_type` | ✅ | `PP` ou `NP` |
| `sale_details` | ✅ | minItems: 1 |
| `sale_details[].product.*` | ✅ | family_code, name, price_pre_tax |
| `sale_details[].taxation` | ✅ | Array |
| `sale_details[].quantity` | ✅ | ≥ 1 |
| `sale_details[].discount_per_unit` | ✅ | { percent, value } |
| `payment_details.collection_details` | ✅ | minItems: 1 |
| `sale_summary.*` | ✅ | total_excl_tax, total_incl_tax, total_tax |
| `delivery_details.type` | ✅ | `SELF_PICKUP` ou `DELIVERY` |

### Tests automatisés

```typescript
// Exemple de test unitaire pour le builder
describe('NacefTicketBuilder', () => {
  it('should convert DT to millimes correctly', () => {
    expect(dtToMillimes(15.5)).toBe(15500);
    expect(dtToMillimes(0.19)).toBe(190);
    expect(dtToMillimes(100)).toBe(100000);
  });

  it('should map payment methods correctly', () => {
    expect(mapPaymentMethod('CASH')).toBe('cash');
    expect(mapPaymentMethod('CARD')).toBe('bank_card');
    expect(mapPaymentMethod('unknown')).toBe('cash'); // fallback
  });

  it('should map operation types correctly', () => {
    expect(mapOperationType(false)).toBe('TICKET');
    expect(mapOperationType(true)).toBe('REFUND');
    expect(mapOperationType(false, true)).toBe('DUPLICATE');
    expect(mapOperationType(false, false, true)).toBe('PROFORMA');
  });

  it('should generate valid transaction ID', () => {
    expect(generateTransactionId('FAC-2026-000001')).toBe('26000001');
  });
});
```

---

## 13. Check-list homologation

### Phase 1 - Développement ✅

| # | Action | Fichier(s) | Statut |
|---|---|---|---|
| 1 | Module NACEF créé | `apps/api/src/nacef/*` | ✅ |
| 2 | Client S-MDF (5 endpoints) | `nacef-client.ts` | ✅ |
| 3 | Ticket builder v1.1.4 | `nacef-ticket.builder.ts` | ✅ |
| 4 | Conversion DT → millimes | `nacef.helpers.ts` | ✅ |
| 5 | DTOs avec validation | `dto/*.ts` | ✅ |
| 6 | Service d'initialisation | `nacef.service.ts` | ✅ |
| 7 | Controller REST | `nacef.controller.ts` | ✅ |
| 8 | Intégration dans SalesService | `sales.service.ts` | ✅ |
| 9 | Module enregistré | `app.module.ts` | ✅ |
| 10 | Schéma DB mis à jour | `schema.prisma` | ✅ |
| 11 | Variables d'env ajoutées | `.env` | ✅ |
| 12 | TypeScript: 0 erreurs | `tsc --noEmit` | ✅ |

### Phase 2 - Configuration ⬜

| # | Action | Statut |
|---|---|---|
| 1 | Obtenir IMDF auprès de la CIMF | ⬜ |
| 2 | Obtenir matricule fiscal | ⬜ |
| 3 | Obtenir référence d'homologation | ⬜ |
| 4 | Installer S-MDF Agent | ⬜ |
| 5 | Configurer les champs Store | ⬜ |
| 6 | Tester connectivité S-MDF | ⬜ |

### Phase 3 - Tests ⬜

| # | Action | Statut |
|---|---|---|
| 1 | Initialisation NACEF | ⬜ |
| 2 | Ticket normal signé | ⬜ |
| 3 | Annulation (REFUND) | ⬜ |
| 4 | Copie (DUPLICATE) | ⬜ |
| 5 | Multi-paiement | ⬜ |
| 6 | Changement PIN | ⬜ |
| 7 | Mode hors-ligne | ⬜ |
| 8 | Z-Report | ⬜ |
| 9 | Tests PROCTEST | ⬜ |

### Phase 4 - Déploiement ⬜

| # | Action | Statut |
|---|---|---|
| 1 | Déployer S-MDF Agent en production | ⬜ |
| 2 | Configurer variables d'env prod | ⬜ |
| 3 | Remplir données Store (prod) | ⬜ |
| 4 | Tester flux complet | ⬜ |
| 5 | Soumettre à la CIMF | ⬜ |
| 6 | Obtenir homologation | ⬜ |

---

## 13. Fichiers de référence NACEF

| Fichier | Emplacement | Description |
|---|---|---|
| `nacef-smdf-api-1.2.0.json` | `nacef/` | Spec OpenAPI 3.0.1 des endpoints S-MDF |
| `nacef-smdf-ticket-1.1.4.json` | `nacef/` | Schéma JSON du ticket NACEF v1.1.4 |
| `Tunisian_NACEF_Integration-1.0.0_postman_collection.json` | `nacef/` | Collection Postman pour tests |
| `NACEF-CC-MDF-01.pdf` | `nacef/` | Cahier des charges MDF |
| `NACEF-PROCTEST-02.pdf` | `nacef/` | Procédure de test d'homologation |

---

## 14. Notes techniques

### Pourquoi fetch natif ?

Le client S-MDF utilise `fetch()` natif de Node.js 20+ au lieu de `@nestjs/axios` :
- Pas de dépendance supplémentaire
- Compatible avec le monorepo pnpm
- Support natif des promises et JSON

### Pourquoi des millimes entiers ?

La spec NACEF exige des **entiers** pour tous les montants (pas de floats). Exemple :
- 15.500 DT → `15500` millimes
- 0.070 DT → `70` millimes

### Chaînage hash (existant)

Le système existant de chaînage hash (SHA-256 + HMAC) est conservé en parallèle :
- `hash` : chaînage entre ventes
- `signature` : HMAC-SHA256
- `fiscalNumber` : numéro séquentiel `FAC-2026-000001`

NACEF ajoute par-dessus :
- `nacefTicketId` : ID assigné par la plateforme NACEF
- `nacefQrCode` : QR code officiel
- `nacefSyncedAt` : horodatage de la signature

### Mode hors-ligne

Le champ `availableOfflineTickets` du manifest indique combien de tickets le S-MDF peut signer hors-ligne. Cette fonctionnalité n'est pas encore implémentée.
