import { Product } from '../store/useCartStore';

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Café Direct',
    price: 1.500, // TND
    color: '#3e2723', // Dark brown
    icon: 'coffee',
  },
  {
    id: 'p2',
    name: 'Capucin',
    price: 1.800,
    color: '#5d4037', // Medium brown
    icon: 'coffee',
  },
  {
    id: 'p3',
    name: 'Express',
    price: 1.500,
    color: '#8d6e63', // Light brown
    icon: 'coffee',
  },
  {
    id: 'p4',
    name: 'Eau Minérale (0.5L)',
    price: 0.900,
    color: '#0288d1', // Blue
    icon: 'droplet',
  },
  {
    id: 'p5',
    name: 'Chicha Pomme',
    price: 8.000,
    color: '#2e7d32', // Green
    icon: 'wind',
  },
  {
    id: 'p6',
    name: 'Thé Menthe',
    price: 1.200,
    color: '#8bc34a', // Light green
    icon: 'cup-soda',
  },
  {
    id: 'p7',
    name: 'Citronnade',
    price: 2.500,
    color: '#fbc02d', // Yellow
    icon: 'cup-soda',
  },
  {
    id: 'p8',
    name: 'Café Turc',
    price: 1.500,
    color: '#d84315', // Rust/Orange
    icon: 'coffee',
  },
];
