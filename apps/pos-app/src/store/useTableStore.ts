import { create } from 'zustand';
import { Product } from '../types';

export interface TableCartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
}

export interface TableState {
  id: string;
  label: string;
  items: TableCartItem[];
  customer?: Customer;
}

interface TableStore {
  tables: Record<string, TableState>;
  activeTableId: string | null;
  
  // Actions
  setActiveTable: (id: string) => void;
  initTable: (id: string, label: string) => void;
  addToTableCart: (tableId: string, product: Product) => void;
  removeFromTableCart: (tableId: string, productId: string) => void;
  updateTableItemQuantity: (tableId: string, productId: string, quantity: number) => void;
  clearTableCart: (tableId: string) => void;
  setTableCustomer: (tableId: string, customer: Customer | undefined) => void;
  
  // Selectors
  getActiveTable: () => TableState | undefined;
  getTableTotal: (tableId: string) => number;
}

export const useTableStore = create<TableStore>((set, get) => ({
  tables: {},
  activeTableId: null,

  setActiveTable: (id: string) => set({ activeTableId: id }),

  initTable: (id: string, label: string) => {
    const { tables } = get();
    if (!tables[id]) {
      set({
        tables: {
          ...tables,
          [id]: { id, label, items: [] }
        }
      });
    }
  },

  addToTableCart: (tableId: string, product: Product) => {
    const { tables } = get();
    const table = tables[tableId];
    if (!table) return;

    const existingItem = table.items.find(item => item.id === product.id);
    let newItems;

    if (existingItem) {
      newItems = table.items.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...table.items, { ...product, quantity: 1 }];
    }

    set({
      tables: {
        ...tables,
        [tableId]: { ...table, items: newItems }
      }
    });
  },

  removeFromTableCart: (tableId: string, productId: string) => {
    const { tables } = get();
    const table = tables[tableId];
    if (!table) return;

    set({
      tables: {
        ...tables,
        [tableId]: {
          ...table,
          items: table.items.filter(item => item.id !== productId)
        }
      }
    });
  },

  updateTableItemQuantity: (tableId: string, productId: string, quantity: number) => {
    const { tables } = get();
    const table = tables[tableId];
    if (!table) return;

    set({
      tables: {
        ...tables,
        [tableId]: {
          ...table,
          items: table.items.map(item => 
            item.id === productId ? { ...item, quantity } : item
          )
        }
      }
    });
  },

  clearTableCart: (tableId: string) => {
    const { tables } = get();
    if (!tables[tableId]) return;
    
    set({
      tables: {
        ...tables,
        [tableId]: { ...tables[tableId], items: [], customer: undefined }
      }
    });
  },

  setTableCustomer: (tableId: string, customer: Customer | undefined) => {
    const { tables } = get();
    if (!tables[tableId]) return;

    set({
      tables: {
        ...tables,
        [tableId]: { ...tables[tableId], customer }
      }
    });
  },

  getActiveTable: () => {
    const { tables, activeTableId } = get();
    return activeTableId ? tables[activeTableId] : undefined;
  },

  getTableTotal: (tableId: string) => {
    const table = get().tables[tableId];
    if (!table) return 0;
    return table.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}));
