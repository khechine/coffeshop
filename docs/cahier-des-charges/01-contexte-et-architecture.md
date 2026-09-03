# 01 — Contexte & Architecture Technique

## 1.1 Description du Projet

**ElKassa** est une plateforme SaaS tunisienne qui combine :
- Un **POS (Point de Vente)** en ligne et mobile pour cafés, pâtisseries et boulangeries
- Une **Marketplace B2B** permettant aux établissements de s'approvisionner auprès de fournisseurs
- Un back-office **SuperAdmin** pour piloter la plateforme et surveiller les commissions

---

## 1.2 Architecture Monorepo (Turborepo)

```
coffeeshop-b2B/
├── apps/
│   ├── admin-dashboard/     Next.js 14 App Router (web principal)
│   ├── api/                 NestJS 10 (backend REST + WS)
│   ├── pos-mobile/          Expo React Native (app caissier)
│   └── public/              Landing page
├── packages/
│   ├── database/            Prisma Client + schema.prisma
│   └── shared/              Types TypeScript communs
├── turbo.json               Pipeline Turborepo
├── pnpm-workspace.yaml      Workspace pnpm
└── docker-compose.yml       PostgreSQL + Nginx
```

---

## 1.3 Stack Technique Détaillée

### Backend — `apps/api/`

| Élément | Technologie | Version |
|---------|-------------|---------|
| Framework | NestJS | 10.x |
| ORM | Prisma | 5.x |
| Base de données | PostgreSQL | 15 |
| Auth | Token temporaire (→ JWT RS256 prévu) | — |
| WebSocket | NestJS Gateway | — |
| Validation | class-validator + ValidationPipe | — |
| Upload | Multer (disk storage) | — |
| IA | Google Gemini API | gemini-1.5-flash |
| Fiscal | NACEF S-MDF (protocole tunisien) | — |
| Messagerie | WhatsApp Business API | — |

### Frontend Web — `apps/admin-dashboard/`

| Élément | Technologie |
|---------|-------------|
| Framework | Next.js 14 (App Router) |
| Styling | TailwindCSS + CSS modules |
| State | useState/useEffect (pas de store global) |
| API calls | Server Actions (Next.js) + fetch client |
| Auth | Cookie de session (via middleware.ts) |
| Impression | PrintService (window.print + ESC/POS) |

### Mobile — `apps/pos-mobile/`

| Élément | Technologie |
|---------|-------------|
| Framework | Expo (React Native) |
| Navigation | (App.tsx monolithique) |
| HTTP | fetch natif |
| Auth | AsyncStorage (token) |
| Impression | PrintService.ts (Bluetooth ESC/POS) |

### Base de données — `packages/database/`

| Élément | Détail |
|---------|--------|
| ORM | Prisma 5.x |
| Provider | PostgreSQL |
| Modèles | 50+ models |
| Seed | `seedTunisianStarterPack()` |

---

## 1.4 Modules Fonctionnels & Dépendances

```
┌─────────────┐     utilise      ┌──────────────┐
│  Auth       │ ──────────────▶ │  User         │
│  Module     │                 │  Store        │
└──────┬──────┘                 │  PosTerminal  │
       │ guard                  └──────────────┘
       ▼
┌─────────────┐     écrit        ┌──────────────┐
│  POS        │ ──────────────▶ │  Sale         │
│  Module     │                 │  SaleItem     │
└──────┬──────┘     lit         │  Product      │
       │                        │  StockItem    │
       │ trigger                └──────────────┘
       ▼
┌─────────────┐     décrémente   ┌──────────────┐
│  Inventory  │ ──────────────▶ │  StockItem    │
│  Service    │                 └──────────────┘
└─────────────┘
       
┌─────────────┐     signe        ┌──────────────┐
│  NACEF      │ ──────────────▶ │  Sale         │
│  Module     │                 │  NacefSyncLog │
└─────────────┘                 │  ZReport      │
                                └──────────────┘

┌─────────────┐     gère         ┌──────────────┐
│  Marketplace│ ──────────────▶ │  VendorProduct│
│  Module     │                 │  SupplierOrder│
└──────┬──────┘     déduit      │  VendorWallet │
       │            commission   │  MarketplaceSettlement│
       ▼                        └──────────────┘
┌─────────────┐     surveille    
│  Anti-      │ ──────────────▶ StoreVendorRelationship
│  Leakage    │                 VendorInteraction
└─────────────┘
```

---

## 1.5 Flux de Déploiement

```
GitHub ──▶ docker-compose.yml
           ├── api (NestJS, port 3001)
           ├── admin-dashboard (Next.js, port 3000)
           └── nginx (reverse proxy, ports 80/443)

Env vars:
  DATABASE_URL      (PostgreSQL connexion string)
  GEMINI_API_KEY    (Analyse factures IA)
  PORT              (3001 par défaut API)
  UPLOAD_DIR        (répertoire uploads)
```

---

## 1.6 Points d'Entrée API

| Préfixe | Controller | Description |
|---------|-----------|-------------|
| `/auth/*` | `AuthController` | Login, register, PIN, terminal |
| `/sales/*` | `SalesController` | Ventes POS |
| `/products/*` | `ProductsController` | Catalogue POS (lecture) |
| `/management/*` | `ManagementController` | Back-office complet (guards) |
| `/marketplace/*` | `MarketplaceController` | Anti-leakage, analytics |
| `/nacef/*` | `NacefController` | Fiscal tunisien |
| `/whatsapp/*` | `WhatsappController` | Webhook WA Business |
