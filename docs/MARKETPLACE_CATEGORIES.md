# Conception Système de Catégories - Marketplace B2B

## Résumé Exécutif

Ce document décrit l'architecture complète du système de catégories pour une marketplace B2B en Tunisie destined aux coffee shops, salons de thé, snacks et chicha.

---

## 1. Structure Hybride Imposée

```
Category (globale) → Subcategory (validée) → Product → Tags (libres)
```

| Niveau | Flexibilité | Exemple |
|--------|--------------|---------|
| **Category** | Fixe (admin) | "Matières Premières" |
| **Subcategory** | Semi-flexible (proposition + validation) | "Café grain" |
| **Tags** | Libre (vendeur) | "premium", "bio", "tunisien" |

---

## 2. Base de Catégories (Niveau 1 - Fixe)

### Matières Premières
| Category | Icon | Description |
|----------|------|-------------|
| Café | ☕ | Grains, moulu, capsules |
| Lait & Crèmerie | 🥛 | Lait, crème, végétation |
| Thé & Infusions | 🍵 | Thé, tisanes |
| Chocolat & Boissons | 🍫 | Chocolat, cacao |
| Sucre & Edulcorants | 🍚 | Sucre, miel |
| Sirops & Arômes | 🍯 | Sirops, extraits |

### Consommables
| Category | Icon | Description |
|----------|------|-------------|
| Gobelets | 🥤 | Carton, plastique |
| Couvercles & Pailles | 🥤 | Accessoires |
| Emballages | 📦 | Boîtes, sacs |
| Serviettes & Napperons | 🧻 | Hygiène |

### Chicha
| Category | Icon | Description |
|----------|------|-------------|
| Tabac | 🌿 | Classique, premium |
| Charbon | 🔥 | Naturel, compressé |
| Accessoires | 💨 | Tuyaux, heads |

### Food & Snacks
| Category | Icon | Description |
|----------|------|-------------|
| Pâtisseries | 🥐 | Viennoiseries, gateaux |
| Sandwichs & Baguettes | 🥖 | Snacks salés |
| Snacks Emballés | 🍟 | Chips, biscuits |

### Boissons Froides
| Category | Icon | Description |
|----------|------|-------------|
| Jus | 🧃 | Frais, sirupeux |
| Soda | 🥤 | Boissons gazeuses |
| Eau | 💧 | Plate, gazeuse |

### Equipements
| Category | Icon | Description |
|----------|------|-------------|
| Machines Café | 🖥️ | Espresso, automatique |
| Moulins | ⚙️ | Broyeurs |
| Réfrigération | 🧊 | Vitrines, chambres |
| Accessoires Barista | 🛠️ | Tamper, pichet |

### Hygiène
| Category | Icon | Description |
|----------|------|-------------|
| Nettoyage | 🧹 | Detergents |
| Désinfection | 🧴 | Antibacterien |

### Services (Optionnel)
| Category | Icon | Description |
|----------|------|-------------|
| Maintenance | 🔧 | Reparation |
| Formation | 📚 | Certification |

---

## 3. Sous-Catégories Validées (Niveau 2)

Chaque category racine possede des sous-categories pre-definies avec possibility de proposition.

### Exemple: Café
```
Café
├── Grains (Arabica, Robusta, Blend)
├── Moulu (Express, Filter, Turkish)
├── Capsules (Nespresso, Dolce Gusto, Compatible)
├── Instant (Café soluble)
└── Premium (Single origin,Specialty)
```

### Exemple: Gobelets
```
Gobelets
├── Carton (chaud, froid, био)
├── Plastique (PP, PLA)
├── Verre (consigné)
└── Taille (15cl, 25cl, 33cl, 50cl)
```

### Workflow de Proposition
1. Vendeur propose nouvelle sous-categorie
2. Notification admin
3. Validation/rejet avec motif
4. Si validee → disponible pour tous

---

## 4. Tags Libres (Niveau 3)

Les vendeurs peuvent ajouter des tags libres pour le search et le grouping.

### Tags Recommandés (suggestion auto)
```
- bio / naturel
- premium / standard / economy
- tunisien / importé
- vegan / sans lactose
- halal / casher
- promotion / flash-sale
- nouveau / best-seller
- recyclable / eco-friendly
```

---

## 5. Schema Base de Donnees

### categories (Niveau 1 - Fixe)
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   // "Café", "Gobelets"
  slug        String   @unique
  icon        String?  // emoji ou icon name
  description String?
  sortOrder   Int      @default(0)
  
  // Governance
  status      CategoryStatus @default(ACTIVE)
  isGlobal    Boolean  @default(true) // true = impose par admin
  
  subcategories Subcategory[]
  createdAt   DateTime @default(now())
}

enum CategoryStatus {
  ACTIVE
  HIDDEN
  ARCHIVED
}
```

### subcategories (Niveau 2 - Semi-flexible)
```prisma
model Subcategory {
  id          String   @id @default(cuid())
  name        String   // "Grains", "Capsules"
  slug        String   @unique
  description String?
  
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  
  // Validation workflow
  status      SubcategoryStatus @default(ACTIVE)
  proposedBy  String? // vendorId si proposee
  validatedBy String? // adminId
  
  products    Product[]
  createdAt   DateTime @default(now())
}

enum SubcategoryStatus {
  ACTIVE      // disponible
  PENDING     // en attente validation
  REJECTED    // rejetee
  ARCHIVED    // archivee
}
```

### products (Reference standardisee)
```prisma
model Product {
  id              String   @id @default(cuid())
  name            String   // "Café grain 1kg"
  sku             String?  // Code produit standard
  
  // References
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  subcategoryId   String?
  subcategory     Subcategory? @relation(fields: [subcategoryId], references: [id])
  
  // Specs standardisees
  unit            String   // "kg", "L", "piece"
  defaultPrice    Decimal? // Prix de reference
  
  brand           String?  // Marque
  tags            String[] // Tags libres
  
  // Metadata
  isStandard      Boolean  @default(false) // true = produit reference
  isActive        Boolean  @default(true)
  
  vendorProducts  VendorProduct[]
  createdAt       DateTime @default(now())
}
```

### vendor_products (Catalogue vendeur)
```prisma
model VendorProduct {
  id              String   @id @default(cuid())
  
  // Reference produit standard
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  
  // Vendeur specifique
  vendorId        String
  vendor          VendorProfile @relation(fields: [vendorId], references: [id])
  
  // Donnees specifiques vendeur
  price           Decimal
  minOrderQty     Decimal  @default(1)
  stockStatus     StockStatus @default(IN_STOCK)
  
  // Offre
  isFeatured      Boolean  @default(false)
  isFlashSale     Boolean  @default(false)
  discountPrice   Decimal?
  flashStart      DateTime?
  flashEnd        DateTime?
  
  image           String?
  description     String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([productId, vendorId]) // Un prix par vendor par produit
}

enum StockStatus {
  IN_STOCK
  LOW_STOCK
  OUT_OF_STOCK
  DISCONTINUED
}
```

### tags (pour recherche)
```prisma
model Tag {
  id        String   @id @default(cuid())
  name      String   @unique // "premium", "bio"
  type      TagType  @default(GENERAL)
  
  // Statistiques
  usageCount Int     @default(0)
  
  products   Product[]
  
  createdAt  DateTime @default(now())
}

enum TagType {
  GENERAL    // Tags libres
  BRAND      // Marques (auto-creees)
  DIET       // Regime (vegan, bio)
  ORIGIN     // Origine (tunisien, francais)
}
```

---

## 6. Gestion Vendeur

### Onboarding Categorie
```
1. Inscription
2. Selection activite (ActivityPole)
   - Coffee Shop
   - Salon de the
   - Snack
   - Chicha
3. Categories imposees selon activite
4. Sous-categories suggerees
5. Validation finale
```

### Ajout Produit
```
1. Recherche produit existant (SKU/name)
   - Si existe → selectionner
   - Si non → creer nouveau produit reference
2. Specifier sous-categorie (obligatoire)
3. Ajouter tags libres (optionnel)
4. Definir prix et conditions
```

### Proposition Sous-Categorie
```
Bouton "Proposer une sous-categorie"
→ Formulaire: nom, description, justification
→ Soumission
→ Statut PENDING
→ Admin recoit notification
→ Validation/Rejet
→ Si validee → disponible pour tous
```

---

## 7. UX Acheteur

### Navigation Principale
```
[Categories] → [Sous-categories] → [Produits]
     ↓
  Filtres lateraux
     ↓
  Resultats + Compare
```

### Filtres Avances
```
- Prix (min-max, range slider)
- Marque
- Origine
- Tags (bio, premium, tunisien)
- Disponibilite
- Note vendeur
- Zone livraison
```

### Recherche
```
- Search intelligent (fuzzy)
- Suggestions auto-complete
- Filtres rapides (top tags)
- Recherche vocale (mobile)
```

### Comparaison
```
Table de comparaison produit:
| Produit | Vendeur A | Vendeur B | Vendeur C |
|---------|-----------|-----------|-----------|
| Prix    | 25 DT     | 22 DT     | 28 DT     |
| Marque  | X         | Y         | Z         |
| Livraison| 24h     | 48h       | 24h       |
| Min cmd | 5         | 10        | 1         |
```

---

## 8. Scalabilite

### Extension a d'autres metiers

| Metier | Categories specifiques |
|--------|------------------------|
| Restaurant | Plats, Ingredients, Boissons |
| Epicerie | Epicerie salee, Sucre, Boissons |
| Hotel | Amenagement, Hygiene, Restauration |
| Bureau | Boissons, Consommables |

### Architecture Multi-Tenant
```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  type      TenantType // COFFEE_SHOP, RESTAURANT, HOTEL...
  
  categories Category[] // Categories specifiques
}

enum TenantType {
  COFFEE_SHOP
  TEASalon
  SNACK
  CHICHA
  RESTAURANT
  EPICERIE
  HOTEL
  BUREAU
}
```

---

## 9. Gouvernance

### Regles
1. **Categories racines**: seul superadmin peut creer/modifier
2. **Sous-categories**: proposition vendor → validation admin
3. **Tags**: libres mais filtres auto pour eviter doublons
4. **Produits standards**: verification periodic admin
5. **Prix**: transparency totale, historique visible

### Dashboard Admin
- Statistiques utilisation categories
- Propositions en attente (notifications)
- Tags populaires
- Produits standards a creer

---

## 10. Points d'Attention

### Erreurs a eviter
- ❌ Trop de categories (complexite UI)
- ❌ Categories vides (peu de produits)
- ❌ Tags non moderes (duplicatas, spam)
- ❌ Produits Dupliques (plusieurs SKU pour meme produit)
- ❌ Pas de workflow validation (qualite heterogene)

### Solutions
- ✅ Limiter categories racines (< 20)
- ✅ Seuil minimal produits avant affichage
- ✅ Suggestion tags existants + moderation
- ✅ Matching automatique SKU
- ✅ Pipeline validation strict

---

## 11. Prochaines Etapes

1. **Migration schema** vers nouvelle structure
2. **Seed categories** avec base proposee
3. **Creation UI** gestion categories (admin)
4. **Workflow proposition** sous-categories
5. **Generation SKU** pour produits standards
6. **Search/filtres** performants

---

*Document genera pour CoffeeShop B2B Tunisia - Version 1.0*
