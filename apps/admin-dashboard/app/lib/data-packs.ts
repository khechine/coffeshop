// ─────────────────────────────────────────────────────────────────────────────
// DATA PACKS — Packs de démarrage par type de métier
// Utilisé par installDataPackAction() pour initialiser les données de base
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
};

export type DataPackProduct = {
  name: string;
  price: number; // prix de vente en DT
  category: string; // doit correspondre à un name dans categories
  taxRate: number; // 0, 0.07, 0.19
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
  description: 'Boissons chaudes, froides, pâtisseries et snacks. Idéal pour un café de quartier ou tendance.',
  categories: [
    { name: 'Boissons Chaudes', color: '#92400E', icon: '☕' },
    { name: 'Boissons Froides', color: '#0369A1', icon: '🧊' },
    { name: 'Pâtisseries', color: '#D97706', icon: '🥐' },
    { name: 'Snacks', color: '#16A34A', icon: '🍿' },
  ],
  stockItems: [
    { name: 'Café espresso (grains)', unit: 'kg', cost: 28, quantity: 5, minThreshold: 1 },
    { name: 'Lait entier', unit: 'L', cost: 1.8, quantity: 20, minThreshold: 5 },
    { name: 'Sucre blanc', unit: 'kg', cost: 1.2, quantity: 10, minThreshold: 2 },
    { name: 'Thé vert (sachet)', unit: 'sachet', cost: 0.15, quantity: 200, minThreshold: 50 },
    { name: 'Crème fraîche', unit: 'L', cost: 4.5, quantity: 3, minThreshold: 1 },
    { name: "Sirop d'orgeat", unit: 'L', cost: 6, quantity: 2, minThreshold: 0.5 },
    { name: 'Eau minérale (bouteille)', unit: 'pièce', cost: 0.45, quantity: 100, minThreshold: 24 },
    { name: 'Capsules café', unit: 'pièce', cost: 0.8, quantity: 100, minThreshold: 20 },
    { name: 'Beurre', unit: 'kg', cost: 14, quantity: 2, minThreshold: 0.5 },
    { name: 'Farine T55', unit: 'kg', cost: 1.1, quantity: 5, minThreshold: 1 },
  ],
  products: [
    { name: 'Espresso', price: 1.8, category: 'Boissons Chaudes', taxRate: 0.19 },
    { name: 'Double Espresso', price: 2.5, category: 'Boissons Chaudes', taxRate: 0.19 },
    { name: 'Cappuccino', price: 3.5, category: 'Boissons Chaudes', taxRate: 0.19 },
    { name: 'Latte', price: 4, category: 'Boissons Chaudes', taxRate: 0.19 },
    { name: 'Café Noisette', price: 2.5, category: 'Boissons Chaudes', taxRate: 0.19 },
    { name: 'Thé à la menthe', price: 2, category: 'Boissons Chaudes', taxRate: 0.19 },
    { name: 'Chocolat chaud', price: 3.5, category: 'Boissons Chaudes', taxRate: 0.19 },
    { name: 'Café Glacé', price: 4.5, category: 'Boissons Froides', taxRate: 0.19 },
    { name: 'Limonade', price: 3, category: 'Boissons Froides', taxRate: 0.19 },
    { name: 'Eau minérale 0.5L', price: 1, category: 'Boissons Froides', taxRate: 0.07 },
    { name: 'Eau minérale 1.5L', price: 1.5, category: 'Boissons Froides', taxRate: 0.07 },
    { name: 'Jus d\'orange', price: 4, category: 'Boissons Froides', taxRate: 0.19 },
    { name: 'Croissant', price: 2.5, category: 'Pâtisseries', taxRate: 0.19 },
    { name: 'Pain au chocolat', price: 3, category: 'Pâtisseries', taxRate: 0.19 },
    { name: 'Mille-feuille', price: 4.5, category: 'Pâtisseries', taxRate: 0.19 },
    { name: 'Sandwich Mixte', price: 5.5, category: 'Snacks', taxRate: 0.07 },
    { name: 'Club Sandwich', price: 7, category: 'Snacks', taxRate: 0.07 },
    { name: 'Brownie Chocolat', price: 3, category: 'Pâtisseries', taxRate: 0.19 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🍽️ RESTAURANT
// ─────────────────────────────────────────────────────────────────────────────
const restaurantPack: DataPack = {
  industry: 'RESTAURANT',
  label: 'Restaurant',
  icon: '🍽️',
  description: 'Entrées, plats, desserts et boissons. Parfait pour un restaurant traditionnel ou gastronomique.',
  categories: [
    { name: 'Entrées', color: '#16A34A', icon: '🥗' },
    { name: 'Plats', color: '#DC2626', icon: '🍽️' },
    { name: 'Desserts', color: '#D97706', icon: '🍮' },
    { name: 'Boissons', color: '#0369A1', icon: '🥤' },
    { name: 'Menus', color: '#7C3AED', icon: '📋' },
  ],
  stockItems: [
    { name: 'Viande bovine (kg)', unit: 'kg', cost: 35, quantity: 10, minThreshold: 2 },
    { name: 'Poulet entier', unit: 'kg', cost: 12, quantity: 15, minThreshold: 3 },
    { name: 'Huile végétale', unit: 'L', cost: 3.2, quantity: 10, minThreshold: 2 },
    { name: 'Huile d\'olive', unit: 'L', cost: 14, quantity: 5, minThreshold: 1 },
    { name: 'Tomates fraîches', unit: 'kg', cost: 1.5, quantity: 10, minThreshold: 2 },
    { name: 'Pommes de terre', unit: 'kg', cost: 0.8, quantity: 20, minThreshold: 5 },
    { name: 'Oignons', unit: 'kg', cost: 0.6, quantity: 10, minThreshold: 2 },
    { name: 'Farine T55', unit: 'kg', cost: 1.1, quantity: 10, minThreshold: 2 },
    { name: 'Riz', unit: 'kg', cost: 2.5, quantity: 15, minThreshold: 3 },
    { name: 'Semoule de blé', unit: 'kg', cost: 1.4, quantity: 10, minThreshold: 2 },
    { name: 'Harissa', unit: 'kg', cost: 5, quantity: 3, minThreshold: 0.5 },
    { name: 'Concentré de tomate', unit: 'kg', cost: 3.5, quantity: 5, minThreshold: 1 },
  ],
  products: [
    { name: 'Salade méchouia', price: 5, category: 'Entrées', taxRate: 0.07 },
    { name: 'Soupe harira', price: 4, category: 'Entrées', taxRate: 0.07 },
    { name: 'Brick à l\'oeuf', price: 3, category: 'Entrées', taxRate: 0.07 },
    { name: 'Salade tunisienne', price: 4, category: 'Entrées', taxRate: 0.07 },
    { name: 'Couscous au mouton', price: 18, category: 'Plats', taxRate: 0.07 },
    { name: 'Couscous au poulet', price: 14, category: 'Plats', taxRate: 0.07 },
    { name: 'Merguez grillés', price: 13, category: 'Plats', taxRate: 0.07 },
    { name: 'Poulet rôti', price: 15, category: 'Plats', taxRate: 0.07 },
    { name: 'Tajine poulet légumes', price: 16, category: 'Plats', taxRate: 0.07 },
    { name: 'Kefta grillée', price: 14, category: 'Plats', taxRate: 0.07 },
    { name: 'Assiette de frites', price: 4, category: 'Plats', taxRate: 0.07 },
    { name: 'Mahalabia', price: 4, category: 'Desserts', taxRate: 0.19 },
    { name: 'Zlabia', price: 3, category: 'Desserts', taxRate: 0.19 },
    { name: 'Eau minérale', price: 1.5, category: 'Boissons', taxRate: 0.07 },
    { name: 'Jus de citron', price: 3, category: 'Boissons', taxRate: 0.19 },
    { name: 'Boisson gazeuse', price: 2.5, category: 'Boissons', taxRate: 0.19 },
    { name: 'Menu Couscous', price: 22, category: 'Menus', taxRate: 0.07 },
    { name: 'Menu Poulet', price: 20, category: 'Menus', taxRate: 0.07 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🥐 BOULANGERIE
// ─────────────────────────────────────────────────────────────────────────────
const bakeryPack: DataPack = {
  industry: 'BAKERY',
  label: 'Boulangerie / Viennoiserie',
  icon: '🥐',
  description: 'Pains, viennoiseries et gâteaux. Idéal pour une boulangerie artisanale.',
  categories: [
    { name: 'Pains', color: '#92400E', icon: '🍞' },
    { name: 'Viennoiseries', color: '#D97706', icon: '🥐' },
    { name: 'Gâteaux', color: '#DB2777', icon: '🎂' },
    { name: 'Boissons', color: '#0369A1', icon: '☕' },
  ],
  stockItems: [
    { name: 'Farine T55', unit: 'kg', cost: 1.1, quantity: 50, minThreshold: 10 },
    { name: 'Farine complète', unit: 'kg', cost: 1.4, quantity: 20, minThreshold: 5 },
    { name: 'Levure fraîche', unit: 'kg', cost: 4, quantity: 5, minThreshold: 1 },
    { name: 'Beurre', unit: 'kg', cost: 14, quantity: 10, minThreshold: 2 },
    { name: 'Oeufs', unit: 'pièce', cost: 0.45, quantity: 120, minThreshold: 30 },
    { name: 'Sucre blanc', unit: 'kg', cost: 1.2, quantity: 20, minThreshold: 5 },
    { name: 'Sel fin', unit: 'kg', cost: 0.5, quantity: 5, minThreshold: 1 },
    { name: 'Chocolat noir (couverture)', unit: 'kg', cost: 18, quantity: 5, minThreshold: 1 },
    { name: 'Amandes effilées', unit: 'kg', cost: 25, quantity: 2, minThreshold: 0.5 },
    { name: 'Vanille liquide', unit: 'L', cost: 20, quantity: 1, minThreshold: 0.2 },
  ],
  products: [
    { name: 'Baguette classique', price: 0.5, category: 'Pains', taxRate: 0 },
    { name: 'Pain complet', price: 1.2, category: 'Pains', taxRate: 0 },
    { name: 'Pain de mie (tranché)', price: 2.5, category: 'Pains', taxRate: 0 },
    { name: 'Pain au son', price: 1.5, category: 'Pains', taxRate: 0 },
    { name: 'Croissant au beurre', price: 1.8, category: 'Viennoiseries', taxRate: 0.19 },
    { name: 'Pain au chocolat', price: 2, category: 'Viennoiseries', taxRate: 0.19 },
    { name: 'Brioche individuelle', price: 1.5, category: 'Viennoiseries', taxRate: 0.19 },
    { name: 'Chausson aux pommes', price: 2, category: 'Viennoiseries', taxRate: 0.19 },
    { name: 'Gâteau yaourt', price: 6, category: 'Gâteaux', taxRate: 0.19 },
    { name: 'Tarte aux fraises', price: 8, category: 'Gâteaux', taxRate: 0.19 },
    { name: 'Mille-feuille', price: 4, category: 'Gâteaux', taxRate: 0.19 },
    { name: 'Café espresso', price: 1.8, category: 'Boissons', taxRate: 0.19 },
    { name: 'Thé', price: 1.5, category: 'Boissons', taxRate: 0.19 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧃 JUICE BAR / FAST FOOD
// ─────────────────────────────────────────────────────────────────────────────
const juiceBarPack: DataPack = {
  industry: 'JUICE_BAR',
  label: 'Juice Bar / Fast Food',
  icon: '🧃',
  description: 'Jus frais, smoothies et snacks rapides. Parfait pour un bar à jus ou restauration rapide.',
  categories: [
    { name: 'Jus Frais', color: '#F59E0B', icon: '🍊' },
    { name: 'Smoothies', color: '#EC4899', icon: '🍓' },
    { name: 'Cocktails', color: '#10B981', icon: '🥤' },
    { name: 'Snacks', color: '#F97316', icon: '🌯' },
    { name: 'Sandwichs', color: '#8B5CF6', icon: '🥪' },
  ],
  stockItems: [
    { name: 'Oranges', unit: 'kg', cost: 1.2, quantity: 30, minThreshold: 5 },
    { name: 'Fraises', unit: 'kg', cost: 5, quantity: 10, minThreshold: 2 },
    { name: 'Bananes', unit: 'kg', cost: 1.5, quantity: 15, minThreshold: 3 },
    { name: 'Mangues', unit: 'kg', cost: 4, quantity: 5, minThreshold: 1 },
    { name: 'Citrons', unit: 'kg', cost: 1.5, quantity: 10, minThreshold: 2 },
    { name: 'Menthe fraîche', unit: 'kg', cost: 3, quantity: 2, minThreshold: 0.3 },
    { name: 'Lait entier', unit: 'L', cost: 1.8, quantity: 20, minThreshold: 5 },
    { name: 'Miel', unit: 'kg', cost: 18, quantity: 2, minThreshold: 0.5 },
    { name: 'Pain baguette', unit: 'pièce', cost: 0.5, quantity: 20, minThreshold: 5 },
    { name: 'Thon conserve', unit: 'pièce', cost: 2.5, quantity: 30, minThreshold: 10 },
  ],
  products: [
    { name: 'Jus d\'orange frais', price: 3.5, category: 'Jus Frais', taxRate: 0.19 },
    { name: 'Jus de citronnade', price: 3, category: 'Jus Frais', taxRate: 0.19 },
    { name: 'Jus de grenade', price: 5, category: 'Jus Frais', taxRate: 0.19 },
    { name: 'Jus de mangue', price: 5, category: 'Jus Frais', taxRate: 0.19 },
    { name: 'Smoothie fraise-banane', price: 6, category: 'Smoothies', taxRate: 0.19 },
    { name: 'Smoothie tropical', price: 6.5, category: 'Smoothies', taxRate: 0.19 },
    { name: 'Smoothie vert détox', price: 7, category: 'Smoothies', taxRate: 0.19 },
    { name: 'Cocktail pêche-menthe', price: 6, category: 'Cocktails', taxRate: 0.19 },
    { name: 'Limonade maison', price: 4, category: 'Cocktails', taxRate: 0.19 },
    { name: 'Sandwich Thon', price: 4, category: 'Sandwichs', taxRate: 0.07 },
    { name: 'Sandwich Kefta', price: 5, category: 'Sandwichs', taxRate: 0.07 },
    { name: 'Wrap végétarien', price: 5.5, category: 'Sandwichs', taxRate: 0.07 },
    { name: 'Frites maison', price: 3.5, category: 'Snacks', taxRate: 0.07 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 🍰 PÂTISSERIE
// ─────────────────────────────────────────────────────────────────────────────
const pastryPack: DataPack = {
  industry: 'PASTRY_SHOP',
  label: 'Pâtisserie / Confiserie',
  icon: '🍰',
  description: 'Gâteaux orientaux et occidentaux, confiseries et boissons. Pour une pâtisserie artisanale.',
  categories: [
    { name: 'Gâteaux Orientaux', color: '#D97706', icon: '🍯' },
    { name: 'Gâteaux Occidentaux', color: '#DB2777', icon: '🎂' },
    { name: 'Chocolaterie', color: '#92400E', icon: '🍫' },
    { name: 'Glaces', color: '#06B6D4', icon: '🍦' },
    { name: 'Boissons', color: '#0369A1', icon: '☕' },
  ],
  stockItems: [
    { name: 'Farine T55', unit: 'kg', cost: 1.1, quantity: 30, minThreshold: 5 },
    { name: 'Sucre glace', unit: 'kg', cost: 2, quantity: 10, minThreshold: 2 },
    { name: 'Sucre semoule', unit: 'kg', cost: 1.2, quantity: 20, minThreshold: 5 },
    { name: 'Beurre', unit: 'kg', cost: 14, quantity: 10, minThreshold: 2 },
    { name: 'Oeufs', unit: 'pièce', cost: 0.45, quantity: 200, minThreshold: 50 },
    { name: 'Amandes (poudre)', unit: 'kg', cost: 22, quantity: 5, minThreshold: 1 },
    { name: 'Miel', unit: 'kg', cost: 18, quantity: 5, minThreshold: 1 },
    { name: 'Eau de rose', unit: 'L', cost: 5, quantity: 3, minThreshold: 0.5 },
    { name: 'Chocolat noir 70%', unit: 'kg', cost: 20, quantity: 3, minThreshold: 0.5 },
    { name: 'Crème fraîche', unit: 'L', cost: 4.5, quantity: 5, minThreshold: 1 },
    { name: 'Gélatine en feuilles', unit: 'kg', cost: 30, quantity: 0.5, minThreshold: 0.1 },
    { name: 'Pistaches', unit: 'kg', cost: 35, quantity: 2, minThreshold: 0.3 },
  ],
  products: [
    { name: 'Baklawa (100g)', price: 7, category: 'Gâteaux Orientaux', taxRate: 0.19 },
    { name: 'Samsa (pièce)', price: 1.5, category: 'Gâteaux Orientaux', taxRate: 0.19 },
    { name: 'Makroud (pièce)', price: 0.8, category: 'Gâteaux Orientaux', taxRate: 0.19 },
    { name: 'Bouza pistache (100g)', price: 8, category: 'Gâteaux Orientaux', taxRate: 0.19 },
    { name: 'Kaak el warka (pièce)', price: 1.2, category: 'Gâteaux Orientaux', taxRate: 0.19 },
    { name: 'Gâteau au chocolat', price: 6, category: 'Gâteaux Occidentaux', taxRate: 0.19 },
    { name: 'Tarte aux fruits', price: 7, category: 'Gâteaux Occidentaux', taxRate: 0.19 },
    { name: 'Eclair chocolat', price: 3.5, category: 'Gâteaux Occidentaux', taxRate: 0.19 },
    { name: 'Macaron (pièce)', price: 2.5, category: 'Gâteaux Occidentaux', taxRate: 0.19 },
    { name: 'Truffes chocolat (pièce)', price: 2, category: 'Chocolaterie', taxRate: 0.19 },
    { name: 'Rocher chocolat (pièce)', price: 2.5, category: 'Chocolaterie', taxRate: 0.19 },
    { name: 'Glace artisanale (boule)', price: 2.5, category: 'Glaces', taxRate: 0.19 },
    { name: 'Coupe glacée', price: 7, category: 'Glaces', taxRate: 0.19 },
    { name: 'Café espresso', price: 1.8, category: 'Boissons', taxRate: 0.19 },
    { name: 'Thé à la menthe', price: 2, category: 'Boissons', taxRate: 0.19 },
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

// Liste ordonnée pour le wizard
export const BUSINESS_TYPES = [
  { industry: 'COFFEE_SHOP', label: 'Coffee Shop / Café', icon: '☕', description: 'Café, boissons chaudes & froides, pâtisseries', color: '#92400E', bg: '#FEF3C7' },
  { industry: 'RESTAURANT', label: 'Restaurant', icon: '🍽️', description: 'Cuisine complète, plats tunisiens & internationaux', color: '#DC2626', bg: '#FEF2F2' },
  { industry: 'BAKERY', label: 'Boulangerie', icon: '🥐', description: 'Pains artisanaux, viennoiseries & gâteaux', color: '#92400E', bg: '#FEF3C7' },
  { industry: 'PASTRY_SHOP', label: 'Pâtisserie', icon: '🍰', description: 'Gâteaux orientaux & occidentaux, confiseries', color: '#DB2777', bg: '#FDF2F8' },
  { industry: 'JUICE_BAR', label: 'Juice Bar / Fast Food', icon: '🧃', description: 'Jus frais, smoothies, sandwichs rapides', color: '#F59E0B', bg: '#FFFBEB' },
];
