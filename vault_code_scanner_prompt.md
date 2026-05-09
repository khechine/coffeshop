# 🔍 SUPPLIER VAULT — Code Scanner & Plan d'Exécution

> Utilise ce prompt AVANT toute implémentation.
> Colle ce prompt + tout ton code frontend dans une conversation.

---

## TON RÔLE

Tu es un **architecte frontend senior**. Tu reçois le code source complet d'une marketplace B2B Next.js. Tu ne modifies RIEN. Tu analyses, tu cartographies, tu proposes un plan.

---

## OBJECTIF DE L'ANALYSE

Je veux implémenter un système appelé **Supplier Vault** : une révélation progressive de l'identité du fournisseur selon l'engagement du client (4 stades : anonyme → profil → panier → commande confirmée).

Avant de toucher au code, j'ai besoin de :
1. Savoir exactement **où** et **quoi** modifier
2. Identifier les **risques et dépendances**
3. Avoir un **plan d'exécution ordonné** avec effort estimé

---

## PHASE 1 — CARTOGRAPHIE DU CODE

Analyse tous les fichiers fournis et produis une carte structurée :

### 1.1 — Composants qui affichent des infos fournisseur
Liste TOUS les composants/pages qui affichent l'un de ces champs :
- Nom du fournisseur (`supplier.name`, `vendor.name`, ou équivalent)
- Logo / avatar fournisseur
- Téléphone, email, adresse
- Description fournisseur

Pour chaque occurrence, note :
```
Fichier        : chemin/exact/du/fichier.tsx
Ligne(s)       : ~42-67
Champ exposé   : supplier.name / supplier.phone / etc.
Contexte       : card homepage / sidebar produit / header fournisseur / etc.
Risque vault   : CRITIQUE (contact direct) / MODÉRÉ (nom) / FAIBLE (ville)
```

### 1.2 — Pages concernées
Identifie les pages dans `pages/` ou `app/` qui sont impactées :
```
Page           : /
Fichier        : app/page.tsx (ou pages/index.tsx)
Composants     : ProductCard, SupplierBadge, ...
Impact vault   : Élevé / Moyen / Faible
```

### 1.3 — Appels API existants vers les fournisseurs
Liste tous les appels fetch/axios/api vers des endpoints fournisseurs :
```
Fichier        : hooks/useSupplier.ts
Endpoint appelé: GET /api/suppliers/{id}
Champs reçus   : name, phone, email, logo, ...
À modifier     : oui — le endpoint doit filtrer selon le stade vault
```

### 1.4 — State management fournisseur
Identifie comment le state fournisseur est géré :
- Context API ? Zustand ? Redux ? React Query ? useState local ?
- Y a-t-il un store ou hook central pour les fournisseurs ?
- Où est stocké le panier ? (important pour stade 2 du vault)

### 1.5 — Système d'authentification
Identifie :
- Comment l'utilisateur connecté est récupéré (useAuth, useSession, useUser...)
- Où est géré le token JWT dans les appels API
- Y a-t-il déjà une notion de "rôle" ou "permission" côté frontend ?

---

## PHASE 2 — ANALYSE DES RISQUES

Pour chaque point critique identifié, évalue :

### Fuite de données potentielle
```
Risque         : [description du risque]
Fichier        : chemin/du/fichier
Ligne          : ~XX
Gravité        : 🔴 CRITIQUE / 🟡 MODÉRÉ / 🟢 FAIBLE
Fix nécessaire : [description du fix]
```

Cherche spécifiquement :
- Des champs `phone`, `email`, `contact`, `tel`, `mobile` visibles sans condition
- Des spreads d'objets (`...supplier`) qui pourraient exposer tous les champs
- Des `JSON.stringify` ou debug displays d'objets fournisseur complets
- Des endpoints qui retournent tout le profil fournisseur sans filtrage

### Composants réutilisés à fort impact
Identifie les composants utilisés dans PLUSIEURS pages — modifier un seul composant aura un impact global. Signale-les comme "levier" (modifier une fois = impact partout).

---

## PHASE 3 — PLAN D'EXÉCUTION

Sur la base de ton analyse, propose un plan ordonné en tâches atomiques.

### Format de chaque tâche :
```
TÂCHE #N
Titre          : [titre court]
Fichier(s)     : [liste des fichiers à créer ou modifier]
Dépend de      : [numéros des tâches prérequises]
Effort estimé  : XS (< 30min) / S (< 2h) / M (< 4h) / L (< 1 jour)
Risque de casse: Faible / Modéré / Élevé
Description    : [ce qu'il faut faire précisément]
Test de succès : [comment vérifier que c'est bon]
```

### Ordre recommandé des tâches :
Priorise dans cet ordre :
1. D'abord les **fondations** (hook, types, utilitaires)
2. Ensuite les **composants réutilisables** (vault badge, avatar, contact block)
3. Ensuite les **pages par ordre d'impact** (homepage → fournisseur → produit → panier)
4. En dernier les **animations et polish**

---

## PHASE 4 — QUESTIONS BLOQUANTES

Avant de commencer l'implémentation, pose toutes les questions dont tu as besoin. Format :

```
❓ QUESTION #N
Sujet          : [hook auth / state panier / structure API / etc.]
Pourquoi       : [ce que tu ne peux pas savoir sans la réponse]
Options        : [si tu peux proposer des choix]
```

Ne suppose rien sur :
- La structure exacte des objets retournés par l'API
- Le système de routing (App Router vs Pages Router)
- La lib de state management si tu ne la vois pas clairement
- Le système de design / composants UI utilisé (shadcn, chakra, custom...)

---

## FORMAT DE SORTIE ATTENDU

Structure ta réponse exactement ainsi :

```
## 🗺️ Cartographie
[résultats phase 1]

## ⚠️ Risques identifiés
[résultats phase 2]

## 📋 Plan d'exécution — XX tâches
[liste des tâches phase 3]

## ⏱️ Estimation totale
Optimiste  : X heures
Réaliste   : X heures
Pessimiste : X heures

## ❓ Questions bloquantes
[liste des questions phase 4]
```

---

## CE QUE TU NE DOIS PAS FAIRE

- ❌ Ne commence pas à écrire du code
- ❌ Ne suppose pas la structure d'un fichier que tu n'as pas reçu
- ❌ Ne propose pas de refactoring non lié au vault
- ❌ Ne donne pas de plan générique — tout doit être ancré dans le code fourni

---

## VOICI MON CODE :

[COLLE TON CODE ICI — fichier par fichier, avec le chemin en commentaire au-dessus de chaque bloc]

Exemple :
```
// === app/page.tsx ===
export default function HomePage() { ... }

// === components/ProductCard.tsx ===
export function ProductCard({ supplier }) { ... }

// === hooks/useCart.ts ===
export function useCart() { ... }
```
