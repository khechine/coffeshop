# 02 — Module Authentification & Gestion des Rôles

## 2.1 Périmètre Fonctionnel

Le module d'authentification assure la sécurité d'accès, la gestion des sessions utilisateurs, l'activation des périphériques POS (terminaux caisse) et le contrôle d'accès basé sur les rôles (RBAC) pour l'ensemble des acteurs (SuperAdmin, Store Owner, Cashier/Barista, Vendeur Marketplace, Livreur).

### Fonctionnalités Clés
1. **Connexion standard (Email / Mot de passe)** : Pour gérants de magasin, vendeurs marketplace et superadmin.
2. **Authentification rapide caisse (Code PIN)** : Connexion instantanée des baristas / caissiers au comptoir sans ressaisie du mot de passe complet.
3. **Activation & Appairage de Terminal POS** : Système d'activation via code sécurisé à 6 chiffres pour lier une tablette/téléphone caisse à une boutique.
4. **Inscription double profil (Store Owner / Vendeur)** :
   - Création automatique du profil boutique (`Store`) et souscription de base pour les gérants.
   - Création du profil vendeur (`VendorProfile`) et du portefeuille (`VendorWallet`) initial pour les fournisseurs.
5. **Mise à jour du profil & Code PIN** : Modification coordonnées, mot de passe et attribution de PIN staff.
6. **Contrôle d'accès & Guards** :
   - `MarketplaceAuthGuard` : Vérification du Bearer Token.
   - `StoreStatusGuard` : Blocage des opérations si le magasin est restreint/suspendu.
   - `SuperAdminGuard` : Réservation des fonctions critiques plateforme.
   - `NacefAuthGuard` : Sécurisation des flux fiscaux machine-to-machine.

---

## 2.2 Fichiers Sources & Responsabilités

| Rôle | Fichier | Description |
|------|---------|-------------|
| **Contrôleur API** | `apps/api/src/auth.controller.ts` | Endpoints `/auth/*` (login, register, verify-staff-pin, activate-terminal, update-profile) |
| **Contrôleur Ventes** | `apps/api/src/sales/sales.controller.ts` | Endpoint `/sales/verify/pin`, `/sales/management/staff/*` |
| **Guards API** | `apps/api/src/auth/marketplace.guard.ts` | Validation du token Bearer et extraction du `currentUser` |
| **Guards API** | `apps/api/src/auth/store-status.guard.ts` | Vérification du statut de la boutique (restriction impayé/solde) |
| **Guards API** | `apps/api/src/auth/superadmin.guard.ts` | Vérification du rôle `SUPERADMIN` |
| **Guards API** | `apps/api/src/auth/nacef-auth.guard.ts` | Vérification de la clé API fiscale `x-nacef-key` |
| **Middleware Web** | `apps/admin-dashboard/middleware.ts` | Protection des routes Next.js (`/admin`, `/vendor`, `/pos`, `/superadmin`) |
| **Auth Client Web** | `apps/admin-dashboard/app/login/page.tsx` | Formulaire login web Next.js |
| **Auth Client Web** | `apps/admin-dashboard/app/register/page.tsx` | Formulaire inscription web |
| **Mobile Auth** | `apps/pos-mobile/App.tsx` | Écran de saisie PIN caisse & activation terminal mobile |

---

## 2.3 Spécification des Fonctions

### Backend (`apps/api/src/auth.controller.ts`)

#### `verifyStaffPin(pin: string, storeId: string)`
- **Route** : `GET /auth/verify-staff-pin`
- **Entrées** : `pin` (string), `storeId` (string)
- **Logique** :
  1. Vérifie la présence des paramètres `pin` et `storeId`.
  2. Recherche dans `User` un utilisateur correspondant avec `pinCode === pin` et `storeId === storeId`.
  3. Si NacefService est actif, journalise l'événement `USER_LOGIN` dans le log d'audit S-MDF.
  4. Retourne les informations utilisateur filtrées (`id`, `name`, `role`, `permissions`).
- **Erreurs** : `UnauthorizedException` si paramètres manquants ou PIN incorrect.

#### `activateTerminal(code: string, storeId: string)`
- **Route** : `GET /auth/activate-terminal`
- **Entrées** : `code` (string, 6 caractères), `storeId` (string)
- **Logique** :
  1. Valide que le code fait 6 chiffres.
  2. Recherche un `PosTerminal` ayant `activationCode === code` et `storeId === storeId`.
  3. Passe le statut du terminal à `ACTIVE`, met à jour `lastUsedAt`, et invalide `activationCode` (mis à `null` pour usage unique).
  4. Retourne les métadonnées de la boutique, statut fiscal `isFiscalEnabled`, nom du plan et identifiant du terminal.
- **Erreurs** : `UnauthorizedException` si code invalide ou introuvable.

#### `login(body: { email, password })`
- **Route** : `POST /auth/login`
- **Entrées** : `email` (string), `password` (string)
- **Logique** :
  1. Cherche l'utilisateur par `email.toLowerCase()`.
  2. Compare le mot de passe via `bcrypt.compare`.
  3. Si l'utilisateur est `VENDOR`, extrait le `vendorProfile.id` et `companyName`.
  4. Génère le token de session Bearer `user-jwt-{userId}-{timestamp}`.
  5. Retourne le token et l'objet `user` enrichi.
- **Erreurs** : `UnauthorizedException` si utilisateur inexistant ou mot de passe faux.

#### `register(body: { email, password, name, role, companyName })`
- **Route** : `POST /auth/register`
- **Entrées** : Coordonnées utilisateur + rôle (`STORE_OWNER` ou `VENDOR`) + raison sociale.
- **Logique** :
  1. Vérifie l'unicité de l'email.
  2. Hashe le mot de passe avec `bcrypt.hash(password, 10)`.
  3. Si `STORE_OWNER` : crée un `Store` (statut `PENDING_DOCS`) et lie le `User`.
  4. Si `VENDOR` : crée le `User`, le `VendorProfile` (statut `PENDING`) et le `VendorWallet` (solde 0 DT).
  5. Retourne le token de connexion et le payload utilisateur.

---

## 2.4 Modèles Prisma Impliqués

- `User` (`id`, `email`, `password`, `pinCode`, `role`, `storeId`, `permissions`, `assignedTables`)
- `Store` (`id`, `name`, `status`, `isFiscalEnabled`, `isRestricted`)
- `PosTerminal` (`id`, `nickname`, `activationCode`, `status`, `storeId`, `lastUsedAt`)
- `StaffSessionLog` (`id`, `userId`, `storeId`, `action`, `createdAt`)
- `VendorProfile` & `VendorWallet` (pour les fournisseurs)

---

## 2.5 Dépendances Internes & Externes

- `bcrypt` : Chiffrement salé et comparaison des mots de passe.
- `@coffeeshop/database` : Client Prisma partagé.
- `NacefService` : Traçabilité légale des connexions caissières.
