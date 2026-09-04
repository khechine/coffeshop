// ─────────────────────────────────────────────────────────────────────────────
// DATA PACKS — Packs de démarrage par type de métier avec Emballages & Recettes (BOM)
// ─────────────────────────────────────────────────────────────────────────────

export type DataPackCategory = {
  name: string;
  color: string;
  icon: string;
};

export type DataPackStockItem = {
  name: string;
  unit: string; // 'kg', 'L', 'pièce', 'sachet', 'paquet'
  cost: number; // prix d'achat en DT
  quantity: number; // stock initial
  minThreshold: number;
  categoryType?: 'INGREDIENT' | 'PACKAGING' | 'CONSUMABLE';
};

export type DataPackRecipeItem = {
  stockItemName: string;
  quantity: number;
  consumeType?: 'BOTH' | 'TAKEAWAY' | 'DINE_IN';
  isPackaging?: boolean;
};

export type DataPackProduct = {
  name: string;
  price: number; // prix de vente en DT
  category: string; // doit correspondre à un name dans categories
  taxRate: number; // 0, 0.07, 0.19
  recipe?: DataPackRecipeItem[];
};

export type DataPack = {
  industry: string;
  label: string;
  icon: string;
  description: string;
  categories: DataPackCategory[];
  stockItems: DataPackStockItem[];
  products: DataPackProduct[];
};

// ─────────────────────────────────────────────────────────────────────────────
// ☕ COFFEE SHOP
// ─────────────────────────────────────────────────────────────────────────────
const coffeeShopPack: DataPack = {
  industry: 'COFFEE_SHOP',
  label: 'Coffee Shop / Café',
  icon: '☕',
  description: 'Boissons chaudes, froides, pâtisseries et snacks. Ingrédients et emballages à emporter configurés.',
  categories: [
    { name: 'Boissons Chaudes', color: '#92400E', icon: '☕' },
    { name: 'Boissons Froides', color: '#0369A1', icon: '🧊' },
    { name: 'Pâtisseries', color: '#D97706', icon: '🥐' },
    { name: 'Snacks', color: '#16A34A', icon: '🍿' },
  ],
  stockItems: [
    // Ingrédients
    { name: 'Café espresso (grains)', unit: 'kg', cost: 28, quantity: 5, minThreshold: 1, categoryType: 'INGREDIENT' },
    { name: 'Lait entier', unit: 'L', cost: 1.8, quantity: 20, minThreshold: 5, categoryType: 'INGREDIENT' },
    { name: 'Sucre blanc', unit: 'kg', cost: 1.2, quantity: 10, minThreshold: 2, categoryType: 'INGREDIENT' },
    { name: 'Thé vert (sachet)', unit: 'sachet', cost: 0.15, quantity: 200, minThreshold: 50, categoryType: 'INGREDIENT' },
    { name: 'Crème fraîche', unit: 'L', cost: 4.5, quantity: 3, minThreshold: 1, categoryType: 'INGREDIENT' },
    { name: "Sirop d'orgeat", unit: 'L', cost: 6, quantity: 2, minThreshold: 0.5, categoryType: 'INGREDIENT' },
    { name: 'Eau minérale (bouteille)', unit: 'pièce', cost: 0.45, quantity: 100, minThreshold: 24, categoryType: 'INGREDIENT' },
    { name: 'Capsules café', unit: 'pièce', cost: 0.8, quantity: 100, minThreshold: 20, categoryType: 'INGREDIENT' },

    // Emballages À Emporter
    { name: 'Gobelet Carton 20cl', unit: 'pièce', cost: 0.12, quantity: 200, minThreshold: 50, categoryType: 'PACKAGING' },
    { name: 'Gobelet Carton 30cl', unit: 'pièce', cost: 0.16, quantity: 150, minThreshold: 40, categoryType: 'PACKAGING' },
    { name: 'Couvercle Gobelet 20cl/30cl', unit: 'pièce', cost: 0.05, quantity: 300, minThreshold: 60, categoryType: 'PACKAGING' },
    { name: 'Touillette en bois', unit: 'pièce', cost: 0.02, quantity: 400, minThreshold: 100, categoryType: 'PACKAGING' },
    { name: 'Sac Kraft À emporter', unit: 'pièce', cost: 0.25, quantity: 150, minThreshold: 30, categoryType: 'PACKAGING' },
  ],
  products: [
    {
      name: 'Espresso',
      price: 1.8,
      category: 'Boissons Chaudes',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Café espresso (grains)', quantity: 0.018, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet Carton 20cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Couvercle Gobelet 20cl/30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Touillette en bois', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Double Espresso',
      price: 2.5,
      category: 'Boissons Chaudes',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Café espresso (grains)', quantity: 0.036, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet Carton 20cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Couvercle Gobelet 20cl/30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Cappuccino',
      price: 3.5,
      category: 'Boissons Chaudes',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Café espresso (grains)', quantity: 0.018, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Lait entier', quantity: 0.15, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet Carton 30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Couvercle Gobelet 20cl/30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Touillette en bois', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Latte',
      price: 4,
      category: 'Boissons Chaudes',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Café espresso (grains)', quantity: 0.018, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Lait entier', quantity: 0.25, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet Carton 30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Couvercle Gobelet 20cl/30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Café Noisette',
      price: 2.5,
      category: 'Boissons Chaudes',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Café espresso (grains)', quantity: 0.018, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Lait entier', quantity: 0.05, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet Carton 20cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Thé à la menthe',
      price: 2,
      category: 'Boissons Chaudes',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Thé vert (sachet)', quantity: 1, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet Carton 20cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    { name: 'Eau minérale 0.5L', price: 1, category: 'Boissons Froides', taxRate: 0.07 },
    { name: 'Croissant', price: 2.5, category: 'Pâtisseries', taxRate: 0.19 },
    { name: 'Pain au chocolat', price: 3, category: 'Pâtisseries', taxRate: 0.19 },
    { name: 'Sandwich Mixte', price: 5.5, category: 'Snacks', taxRate: 0.07 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🍽️ RESTAURANT
// ─────────────────────────────────────────────────────────────────────────────
const restaurantPack: DataPack = {
  industry: 'RESTAURANT',
  label: 'Restaurant',
  icon: '🍽️',
  description: 'Entrées, plats, desserts. Ingrédients de cuisine et emballages à emporter préconfigurés.',
  categories: [
    { name: 'Entrées', color: '#16A34A', icon: '🥗' },
    { name: 'Plats', color: '#DC2626', icon: '🍽️' },
    { name: 'Desserts', color: '#D97706', icon: '🍮' },
    { name: 'Boissons', color: '#0369A1', icon: '🥤' },
  ],
  stockItems: [
    { name: 'Viande bovine (kg)', unit: 'kg', cost: 35, quantity: 10, minThreshold: 2, categoryType: 'INGREDIENT' },
    { name: 'Poulet entier', unit: 'kg', cost: 12, quantity: 15, minThreshold: 3, categoryType: 'INGREDIENT' },
    { name: 'Huile d\'olive', unit: 'L', cost: 14, quantity: 5, minThreshold: 1, categoryType: 'INGREDIENT' },
    { name: 'Semoule de blé', unit: 'kg', cost: 1.4, quantity: 10, minThreshold: 2, categoryType: 'INGREDIENT' },
    { name: 'Harissa', unit: 'kg', cost: 5, quantity: 3, minThreshold: 0.5, categoryType: 'INGREDIENT' },

    // Emballages Restaurant
    { name: 'Barquette Aluminium 1000ml', unit: 'pièce', cost: 0.35, quantity: 150, minThreshold: 30, categoryType: 'PACKAGING' },
    { name: 'Sac plastique / Kraft à emporter', unit: 'pièce', cost: 0.20, quantity: 200, minThreshold: 40, categoryType: 'PACKAGING' },
    { name: 'Kit Couverts plastique complet', unit: 'pièce', cost: 0.15, quantity: 200, minThreshold: 50, categoryType: 'PACKAGING' },
  ],
  products: [
    { name: 'Salade méchouia', price: 5, category: 'Entrées', taxRate: 0.07 },
    {
      name: 'Couscous au mouton',
      price: 18,
      category: 'Plats',
      taxRate: 0.07,
      recipe: [
        { stockItemName: 'Viande bovine (kg)', quantity: 0.25, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Semoule de blé', quantity: 0.15, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Barquette Aluminium 1000ml', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Kit Couverts plastique complet', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Sac plastique / Kraft à emporter', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Couscous au poulet',
      price: 14,
      category: 'Plats',
      taxRate: 0.07,
      recipe: [
        { stockItemName: 'Poulet entier', quantity: 0.3, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Semoule de blé', quantity: 0.15, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Barquette Aluminium 1000ml', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Kit Couverts plastique complet', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    { name: 'Eau minérale', price: 1.5, category: 'Boissons', taxRate: 0.07 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🥐 BOULANGERIE
// ─────────────────────────────────────────────────────────────────────────────
const bakeryPack: DataPack = {
  industry: 'BAKERY',
  label: 'Boulangerie / Viennoiserie',
  icon: '🥐',
  description: 'Pains, viennoiseries et gâteaux. Sachets sachets papier et emballages configurés.',
  categories: [
    { name: 'Pains', color: '#92400E', icon: '🍞' },
    { name: 'Viennoiseries', color: '#D97706', icon: '🥐' },
    { name: 'Gâteaux', color: '#DB2777', icon: '🎂' },
  ],
  stockItems: [
    { name: 'Farine T55', unit: 'kg', cost: 1.1, quantity: 50, minThreshold: 10, categoryType: 'INGREDIENT' },
    { name: 'Beurre', unit: 'kg', cost: 14, quantity: 10, minThreshold: 2, categoryType: 'INGREDIENT' },

    // Emballages Boulangerie
    { name: 'Sachet baguette papier', unit: 'pièce', cost: 0.04, quantity: 500, minThreshold: 100, categoryType: 'PACKAGING' },
    { name: 'Boîte gâteau / pâtisserie', unit: 'pièce', cost: 0.40, quantity: 100, minThreshold: 20, categoryType: 'PACKAGING' },
  ],
  products: [
    {
      name: 'Baguette classique',
      price: 0.5,
      category: 'Pains',
      taxRate: 0,
      recipe: [
        { stockItemName: 'Farine T55', quantity: 0.15, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Sachet baguette papier', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    { name: 'Croissant au beurre', price: 1.8, category: 'Viennoiseries', taxRate: 0.19 },
    { name: 'Tarte aux fraises', price: 8, category: 'Gâteaux', taxRate: 0.19 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧃 JUICE BAR / FAST FOOD
// ─────────────────────────────────────────────────────────────────────────────
const juiceBarPack: DataPack = {
  industry: 'JUICE_BAR',
  label: 'Juice Bar / Fast Food',
  icon: '🧃',
  description: 'Jus frais, smoothies et sandwichs avec gobelets plastiques et pailles.',
  categories: [
    { name: 'Jus Frais', color: '#F59E0B', icon: '🍊' },
    { name: 'Smoothies', color: '#EC4899', icon: '🍓' },
    { name: 'Sandwichs', color: '#8B5CF6', icon: '🥪' },
  ],
  stockItems: [
    { name: 'Oranges', unit: 'kg', cost: 1.2, quantity: 30, minThreshold: 5, categoryType: 'INGREDIENT' },
    { name: 'Fraises', unit: 'kg', cost: 5, quantity: 10, minThreshold: 2, categoryType: 'INGREDIENT' },
    { name: 'Lait entier', unit: 'L', cost: 1.8, quantity: 20, minThreshold: 5, categoryType: 'INGREDIENT' },

    // Emballages Juice Bar
    { name: 'Gobelet plastique transparent 30cl', unit: 'pièce', cost: 0.15, quantity: 200, minThreshold: 50, categoryType: 'PACKAGING' },
    { name: 'Paille papier coudée', unit: 'pièce', cost: 0.03, quantity: 300, minThreshold: 60, categoryType: 'PACKAGING' },
    { name: 'Papier emballage sandwich', unit: 'pièce', cost: 0.05, quantity: 300, minThreshold: 50, categoryType: 'PACKAGING' },
  ],
  products: [
    {
      name: 'Jus d\'orange frais',
      price: 3.5,
      category: 'Jus Frais',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Oranges', quantity: 0.4, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet plastique transparent 30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Paille papier coudée', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Smoothie fraise-banane',
      price: 6,
      category: 'Smoothies',
      taxRate: 0.19,
      recipe: [
        { stockItemName: 'Fraises', quantity: 0.1, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Lait entier', quantity: 0.15, consumeType: 'BOTH', isPackaging: false },
        { stockItemName: 'Gobelet plastique transparent 30cl', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
        { stockItemName: 'Paille papier coudée', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
    {
      name: 'Sandwich Thon',
      price: 4,
      category: 'Sandwichs',
      taxRate: 0.07,
      recipe: [
        { stockItemName: 'Papier emballage sandwich', quantity: 1, consumeType: 'TAKEAWAY', isPackaging: true },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🍰 PÂTISSERIE
// ─────────────────────────────────────────────────────────────────────────────
const pastryPack: DataPack = {
  industry: 'PASTRY_SHOP',
  label: 'Pâtisserie / Confiserie',
  icon: '🍰',
  description: 'Gâteaux orientaux et occidentaux avec boîtes pâtisserie.',
  categories: [
    { name: 'Gâteaux Orientaux', color: '#D97706', icon: '🍯' },
    { name: 'Gâteaux Occidentaux', color: '#DB2777', icon: '🎂' },
  ],
  stockItems: [
    { name: 'Farine T55', unit: 'kg', cost: 1.1, quantity: 30, minThreshold: 5, categoryType: 'INGREDIENT' },
    { name: 'Beurre', unit: 'kg', cost: 14, quantity: 10, minThreshold: 2, categoryType: 'INGREDIENT' },
    { name: 'Amandes (poudre)', unit: 'kg', cost: 22, quantity: 5, minThreshold: 1, categoryType: 'INGREDIENT' },
    { name: 'Boîte gâteau / pâtisserie', unit: 'pièce', cost: 0.40, quantity: 100, minThreshold: 20, categoryType: 'PACKAGING' },
  ],
  products: [
    { name: 'Baklawa (100g)', price: 7, category: 'Gâteaux Orientaux', taxRate: 0.19 },
    { name: 'Samsa (pièce)', price: 1.5, category: 'Gâteaux Orientaux', taxRate: 0.19 },
    { name: 'Gâteau au chocolat', price: 6, category: 'Gâteaux Occidentaux', taxRate: 0.19 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 📦 REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
export const DATA_PACKS: Record<string, DataPack> = {
  COFFEE_SHOP: coffeeShopPack,
  RESTAURANT: restaurantPack,
  BAKERY: bakeryPack,
  PASTRY_SHOP: pastryPack,
  JUICE_BAR: juiceBarPack,
};

export function getDataPack(industry: string): DataPack | null {
  return DATA_PACKS[industry] ?? null;
}

export const BUSINESS_TYPES = [
  { industry: 'COFFEE_SHOP', label: 'Coffee Shop / Café', icon: '☕', description: 'Café, boissons chaudes & froides, pâtisseries avec emballages', color: '#92400E', bg: '#FEF3C7' },
  { industry: 'RESTAURANT', label: 'Restaurant', icon: '🍽️', description: 'Cuisine complète avec barquettes & sacs à emporter', color: '#DC2626', bg: '#FEF2F2' },
  { industry: 'BAKERY', label: 'Boulangerie', icon: '🥐', description: 'Pains artisanaux avec sachets baguette', color: '#92400E', bg: '#FEF3C7' },
  { industry: 'PASTRY_SHOP', label: 'Pâtisserie', icon: '🍰', description: 'Gâteaux orientaux & occidentaux avec boîtes', color: '#DB2777', bg: '#FDF2F8' },
  { industry: 'JUICE_BAR', label: 'Juice Bar / Fast Food', icon: '🧃', description: 'Jus frais, smoothies avec gobelets & pailles', color: '#F59E0B', bg: '#FFFBEB' },
];
