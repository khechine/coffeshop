Agis comme un expert en développement mobile (Flutter ou React Native) et en UX design pour applications POS ultra simplifiées destinées à des utilisateurs non techniques.

Contexte :
Je veux créer une application mobile POS pour coffee shops en Tunisie qui remplace un système papier où les employés cochent chaque produit vendu (expresso, cappuccino, thé, chicha, etc.).

Objectif :
Créer une application mobile moderne, ultra simple, rapide et fiable, où chaque produit est représenté par un bouton, et chaque clic incrémente le nombre de produits vendus.

Contraintes clés :
- Utilisateurs non techniques (serveurs, baristas)
- Doit être plus rapide que le papier
- Utilisable sur téléphone ou tablette
- Interface simple, claire, sans complexité
- Mode offline obligatoire avec synchronisation API

---

1. UX/UI DESIGN

Propose une interface mobile moderne avec :
- Grille de boutons produits (cartes ou boutons larges)
- Chaque bouton contient :
  - Nom du produit
  - Prix
  - Compteur (quantité vendue)
- Interaction :
  - 1 clic = +1 produit
  - Appui long = -1 produit
- Feedback utilisateur :
  - Animation (bounce)
  - Son ou vibration
- Affichage global :
  - Total quantité
  - Total chiffre d’affaires
- Navigation minimale (1 écran principal)

Design attendu :
- Mobile-first
- Gros boutons (tap facile)
- Couleurs par catégorie
- Mode sombre
- Texte lisible en environnement café

---

2. STRUCTURE FONCTIONNELLE

Décris les fonctionnalités :

- Gestion produits (local JSON ou API)
- Compteur en temps réel
- Reset / clôture de session (journée)
- Historique local
- Multi-catégories (café, boissons, chicha)

---

3. ARCHITECTURE MOBILE

Propose une architecture claire :

Frontend :
- Flutter ou React Native
- State management (Provider, Riverpod, Redux ou Zustand)

Backend :
- API REST
- Auth simple (token)

Stockage local :
- SQLite ou local storage

---

4. MODE OFFLINE + SYNC

Décris une stratégie robuste :

- Toutes les ventes sont stockées localement
- Chaque vente = événement (event-based)
- File de synchronisation

Quand internet disponible :
- Sync automatique vers API
- Gestion des conflits
- Retry en cas d’échec

---

5. API DESIGN

Propose des endpoints :

- POST /sales (envoyer ventes)
- GET /products
- POST /session/close

Format des données :
- product_id
- quantity
- timestamp
- device_id

---

6. CODE EXAMPLE (IMPORTANT)

Génère un exemple concret :

- Composant écran principal
- Bouton produit avec incrément
- State management simple
- Exemple appel API

---

7. PERFORMANCE & UX

Propose des optimisations :

- Latence minimale
- Pas de loading bloquant
- UX instantanée

---

8. BONUS

- Ajoute support multi-langue (FR / AR)
- Prévois extension future :
  - stock
  - fournisseurs
  - marketplace

---

Objectif final :
Fournir une base prête à être développée rapidement pour un MVP réel utilisé dans des coffee shops.

Sois concret, structuré, orienté production.