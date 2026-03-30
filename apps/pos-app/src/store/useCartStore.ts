import create from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
}

export type POSMode = 'standard' | 'simplistic';

interface CartState {
  items: CartItem[];
  total: number;
  posMode: POSMode;
  setPosMode: (mode: POSMode) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      posMode: 'standard',

      setPosMode: (mode) => set({ posMode: mode }),

      addToCart: (product) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          const newItems = items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
          set({
            items: newItems,
            total: get().total + product.price,
          });
        } else {
          set({
            items: [...items, { ...product, quantity: 1 }],
            total: get().total + product.price,
          });
        }
      },

      removeFromCart: (productId) => {
        const { items } = get();
        const itemToRemove = items.find((item) => item.id === productId);

        if (itemToRemove) {
          set({
            items: items.filter((item) => item.id !== productId),
            total: get().total - itemToRemove.price * itemToRemove.quantity,
          });
        }
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        const itemToUpdate = items.find((item) => item.id === productId);

        if (itemToUpdate) {
          const newItems = items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          );
          const newTotal = newItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
          );
          set({ items: newItems, total: newTotal });
        }
      },

      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: 'coffeeshop-cart-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

