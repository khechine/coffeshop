import create from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DenominationCounts {
  [key: string]: number; // key can be '50', '20', '10', '5', '2', '1', '0.500', '0.200', '0.100', '0.050'
}

interface ShiftState {
  isOpen: boolean;
  openingCash: number;
  salesCashTotal: number;
  openTime: string | null;
  openingDetails: DenominationCounts | null;
  
  openShift: (details: DenominationCounts, total: number) => void;
  recordCashSale: (amount: number) => void;
  closeShift: () => void;
  resetShift: () => void;
}

export const useShiftStore = create<ShiftState>(
  persist(
    (set, get) => ({
      isOpen: false,
      openingCash: 0,
      salesCashTotal: 0,
      openTime: null,
      openingDetails: null,

      openShift: (details, total) => {
        set({
          isOpen: true,
          openingCash: total,
          salesCashTotal: 0,
          openTime: new Date().toISOString(),
          openingDetails: details,
        });
      },

      recordCashSale: (amount) => {
        if (get().isOpen) {
          set({
            salesCashTotal: get().salesCashTotal + amount,
          });
        }
      },

      closeShift: () => {
        set({
          isOpen: false,
        });
      },

      resetShift: () => {
        set({
          isOpen: false,
          openingCash: 0,
          salesCashTotal: 0,
          openTime: null,
          openingDetails: null,
        });
      }
    }),
    {
      name: 'coffeeshop-shift-storage',
      getStorage: () => AsyncStorage,
    }
  )
);
