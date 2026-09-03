# 📚 Cahier des Charges — CoffeeShop B2B Platform
## Index des Documents

> **Projet** : ElKassa — Plateforme POS & Marketplace B2B pour établissements (cafés, pâtisseries, boulangeries)  
> **Stack** : Next.js 14 · NestJS · Prisma · PostgreSQL · React Native / Expo  
> **Date** : Septembre 2026

---

## 📂 Structure du Cahier des Charges

| Fichier | Contenu |
|---------|---------|
| [01-contexte-et-architecture.md](./01-contexte-et-architecture.md) | Vue d'ensemble, architecture technique, dépendances entre modules |
| [02-module-auth.md](./02-module-auth.md) | Authentification, rôles, PIN caissier, activation terminal |
| [03-module-pos.md](./03-module-pos.md) | POS Web & Mobile — encaissement, tables, tickets, modes de vente |
| [04-module-stock-fournisseurs.md](./04-module-stock-fournisseurs.md) | Stock, recettes, fournisseurs, commandes d'achat, import facture IA |
| [05-module-fiscal-nacef.md](./05-module-fiscal-nacef.md) | Conformité fiscale tunisienne NACEF / S-MDF, Z-report, chainage hash |
| [06-module-marketplace.md](./06-module-marketplace.md) | Marketplace B2B — catalogue vendeur, commandes, bundles, RFQ |
| [07-module-vendor-space.md](./07-module-vendor-space.md) | Espace vendeur — wallet, messagerie, analytics, upsells, notifications |
| [08-module-superadmin.md](./08-module-superadmin.md) | SuperAdmin — gestion plateforme, commissions, leakage detection |
| [09-module-rapports.md](./09-module-rapports.md) | Rapports & analytics — ventes, expenses, top produits, staff |
| [10-schema-base-de-donnees.md](./10-schema-base-de-donnees.md) | Modèles Prisma, relations, enums, index |
| [11-dependances-et-fichiers.md](./11-dependances-et-fichiers.md) | Carte complète fichiers → fonctions → dépendances par app |

---

## 🏗️ Vue Macro du Système

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COFFEESHOP B2B PLATFORM                         │
├────────────────┬─────────────────────────────────────────────────────── ┤
│   APPS         │                   PACKAGES                             │
├────────────────┼────────────────────────────────────────────────────────┤
│ admin-dashboard│ Next.js 14 App Router · TailwindCSS                    │
│ (web)          │ → POS Web, Dashboard, Marketplace B2C, Espace Vendeur  │
├────────────────┼────────────────────────────────────────────────────────┤
│ api            │ NestJS 10 · Prisma Client                              │
│ (backend)      │ → REST API, WebSocket, NACEF, WhatsApp                 │
├────────────────┼────────────────────────────────────────────────────────┤
│ pos-mobile     │ Expo (React Native) · TypeScript                       │
│ (mobile)       │ → App POS caissier / gestionnaire                      │
├────────────────┼────────────────────────────────────────────────────────┤
│ public         │ Landing page statique (Next.js)                        │
├────────────────┼────────────────────────────────────────────────────────┤
│ database       │ Prisma ORM · PostgreSQL · 50+ modèles                  │
├────────────────┼────────────────────────────────────────────────────────┤
│ shared         │ Types TypeScript communs                                │
└────────────────┴────────────────────────────────────────────────────────┘
```

## 👥 Rôles Utilisateurs

| Rôle | Description | App principale |
|------|-------------|----------------|
| `SUPERADMIN` | Administrateur de la plateforme ElKassa | Admin Dashboard → SuperAdmin |
| `STORE_OWNER` | Propriétaire de café/pâtisserie | Admin Dashboard + POS Mobile |
| `CASHIER` | Caissier / barista | POS Web + POS Mobile |
| `VENDOR` | Fournisseur B2B | Admin Dashboard → Espace Vendeur |
| `COURIER` | Livreur | Admin Dashboard → Courier |
