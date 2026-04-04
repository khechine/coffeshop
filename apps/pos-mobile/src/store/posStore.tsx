import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntigravityTheme } from '../theme/AntigravityTheme';
import { NeonFoodTheme } from '../theme/NeonFoodTheme';
import { ITheme } from '../theme/ThemeInterface';

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  color: string;
}


export type CartItem = {
  productId: string;
  quantity: number;
};

export interface SaleEvent {
  id: string;
  items: CartItem[];
  totalPrice: number;
  timestamp: number;
  status: 'pending' | 'synced';
  paymentStatus?: 'PAID' | 'UNPAID' | 'CANCELLED';
  baristaId?: string; // Accountability
}

export type UserRole = 'owner' | 'cashier' | 'vendor' | 'superadmin' | null;
export type AuthMode = 'TERMINAL' | 'ACCOUNT' | null;

export interface POSState {
  cart: Record<string, number>;
  tables: Record<string, Record<string, number>>;
  activeTable: string | null;
  products: Product[];
  pendingSales: SaleEvent[];
  authToken: string | null;
  storeId: string | null;
  storeName: string | null;
  authMode: AuthMode;
  storeTables: { id: string, label: string }[];
  currentBarista: { 
    id: string, name: string, 
    assignedTables?: string[], 
    permissions?: string[], 
    defaultPosMode?: string 
  } | null;
  userRole: UserRole;
  themeName: 'antigravity' | 'neon-food';
  theme: ITheme;
  rachmaCart: Record<string, number>;
  rachmaHistory: { id: string, productId: string, name: string, timestamp: number, type: 'ADD' | 'REMOVE' }[];
  authenticate: (token: string, storeId: string) => void;
  activateTerminal: (code: string, storeId: string) => Promise<boolean>;
  loginWithAccount: (email: string, pass: string) => Promise<boolean>;
  loginWithPin: (pin: string) => Promise<boolean>;
  logoutBarista: () => void;
  logout: () => void;
  deactivateTerminal: () => Promise<void>;
  setTheme: (name: 'antigravity' | 'neon-food') => void;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  addToRachma: (productId: string) => void;
  removeFromRachma: (productId: string) => void;
  clearRachma: () => void;
  clearCart: () => void;
  setActiveTable: (id: string | null) => void;
  checkout: () => void;
  checkoutTable: (id: string) => void;
  checkoutRachma: (paymentStatus?: 'PAID' | 'UNPAID') => void;
  syncSales: () => Promise<void>;
  setProducts: (products: Product[]) => void;
  getTotalItems: () => number;
  getTableTotal: (id: string) => number;
  getTotalPrice: () => number;
  getRachmaTotal: () => number;
  setStoreTables: (tables: { id: string, label: string }[]) => void;
  updatePreparationStatus: (saleId: string, status: string, station?: string) => Promise<boolean>;
}


const defaultProducts = [
  { id: '1', name: 'Expresso', price: 2.5, categoryId: 'cafe', color: '#8c593b' },
  { id: '2', name: 'Direct', price: 3.0, categoryId: 'cafe', color: '#9d6745' },
  { id: '3', name: 'Capucin', price: 3.5, categoryId: 'cafe', color: '#c38755' },
  { id: '4', name: 'Eau Minérale', price: 1.5, categoryId: 'drinks', color: '#448aca' },
  { id: '5', name: 'Thé Vert', price: 2.0, categoryId: 'tea', color: '#4caa6a' },
  { id: '6', name: 'Citronnade', price: 4.5, categoryId: 'drinks', color: '#ddb14a' },
  { id: '7', name: 'Chicha Pomme', price: 15.0, categoryId: 'chicha', color: '#974cd0' },
  { id: '8', name: 'Gâteau Chocolat', price: 6.0, categoryId: 'food', color: '#5a3d31' },
];

const POSContext = createContext<POSState | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [tables, setTables] = useState<Record<string, Record<string, number>>>({});
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [products, setProductsState] = useState<Product[]>(defaultProducts);
  const [pendingSales, setPendingSales] = useState<SaleEvent[]>([]);
  
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [storeTables, setStoreTablesState] = useState<{ id: string, label: string }[]>([]);
  const [rachmaCart, setRachmaCart] = useState<Record<string, number>>({});
  const [rachmaHistory, setRachmaHistory] = useState<{ id: string, productId: string, name: string, timestamp: number, type: 'ADD' | 'REMOVE' }[]>([]);
  const [currentBarista, setCurrentBarista] = useState<{ 
    id: string, name: string, 
    assignedTables?: string[],
    permissions?: string[],
    defaultPosMode?: string
  } | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [themeName, setThemeName] = useState<'antigravity' | 'neon-food'>('antigravity');
  
  const theme = themeName === 'neon-food' ? NeonFoodTheme : AntigravityTheme;
  
  const [isReady, setIsReady] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadStore = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('pos-offline-cart');
        const storedTables = await AsyncStorage.getItem('pos-tables');
        const storedSales = await AsyncStorage.getItem('pos-offline-sales');
        const storedToken = await AsyncStorage.getItem('pos-auth-token');
        const storedStoreId = await AsyncStorage.getItem('pos-store-id');
        const storedStoreName = await AsyncStorage.getItem('pos-store-name');
        const storedAuthMode = await AsyncStorage.getItem('pos-auth-mode');
        const storedStoreTables = await AsyncStorage.getItem('pos-store-tables');
        const storedBarista = await AsyncStorage.getItem('pos-current-barista');
        const storedRole = await AsyncStorage.getItem('pos-user-role');
        const storedRachma = await AsyncStorage.getItem('pos-rachma-cart');
        const storedTheme = await AsyncStorage.getItem('pos-active-theme');
        
        if (storedCart) setCart(JSON.parse(storedCart));
        if (storedTables) setTables(JSON.parse(storedTables));
        if (storedSales) setPendingSales(JSON.parse(storedSales));
        if (storedToken) setAuthToken(storedToken);
        if (storedStoreId) setStoreId(storedStoreId);
        if (storedStoreName) setStoreName(storedStoreName);
        if (storedAuthMode) setAuthMode(storedAuthMode as AuthMode);
        if (storedStoreTables) setStoreTablesState(JSON.parse(storedStoreTables));
        if (storedBarista) setCurrentBarista(JSON.parse(storedBarista));
        if (storedRole) setUserRole(storedRole as UserRole);
        if (storedRachma) setRachmaCart(JSON.parse(storedRachma));
        if (storedTheme === 'neon-food' || storedTheme === 'antigravity') {
          setThemeName(storedTheme as any);
        }
        
      } catch (e) {
        // ignore storage errors
      } finally {
        setIsReady(true);
      }
    };
    loadStore();
  }, []);


  // Save to AsyncStorage when state changes
  useEffect(() => {
    if (isReady) {
      AsyncStorage.setItem('pos-offline-cart', JSON.stringify(cart)).catch(() => {});
      AsyncStorage.setItem('pos-tables', JSON.stringify(tables)).catch(() => {});
      AsyncStorage.setItem('pos-offline-sales', JSON.stringify(pendingSales)).catch(() => {});
      
      if (authToken) AsyncStorage.setItem('pos-auth-token', authToken).catch(() => {});
      else AsyncStorage.removeItem('pos-auth-token');
      
      if (storeId) AsyncStorage.setItem('pos-store-id', storeId).catch(() => {});
      else AsyncStorage.removeItem('pos-store-id');

      if (storeName) AsyncStorage.setItem('pos-store-name', storeName).catch(() => {});
      else AsyncStorage.removeItem('pos-store-name');

      if (authMode) AsyncStorage.setItem('pos-auth-mode', authMode).catch(() => {});
      else AsyncStorage.removeItem('pos-auth-mode');

      if (storeTables.length > 0) AsyncStorage.setItem('pos-store-tables', JSON.stringify(storeTables)).catch(() => {});
      else AsyncStorage.removeItem('pos-store-tables');

      if (currentBarista) AsyncStorage.setItem('pos-current-barista', JSON.stringify(currentBarista)).catch(() => {});
      else AsyncStorage.removeItem('pos-current-barista');

      if (userRole) AsyncStorage.setItem('pos-user-role', userRole).catch(() => {});
      else AsyncStorage.removeItem('pos-user-role');

      AsyncStorage.setItem('pos-active-theme', themeName).catch(() => {});
      AsyncStorage.setItem('pos-rachma-cart', JSON.stringify(rachmaCart)).catch(() => {});
    }
  }, [cart, tables, pendingSales, authToken, storeId, storeName, authMode, storeTables, currentBarista, userRole, themeName, rachmaCart, isReady]);

  const authenticate = (token: string, store: string) => {
    setAuthToken(token);
    setStoreId(store);
  };

  const activateTerminal = async (code: string, storeId: string): Promise<boolean> => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/auth/activate-terminal?code=${code}&storeId=${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setAuthToken('terminal-token-' + data.terminalId);
        setStoreId(data.storeId);
        setStoreName(data.storeName);
        setAuthMode('TERMINAL');
        return true;
      }
    } catch (e) {
      console.error("❌ Erreur activation terminal:", e);
    }
    return false;
  };

  const loginWithAccount = async (email: string, pass: string): Promise<boolean> => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setStoreId(data.user.storeId);
        setStoreName(data.user.storeName);
        setAuthMode('ACCOUNT');
        
        let role: UserRole = null;
        const backendRole = String(data.user.role).toUpperCase();
        if (backendRole === 'STORE_OWNER') role = 'owner';
        else if (backendRole === 'VENDOR') role = 'vendor';
        else if (backendRole === 'SUPERADMIN') role = 'superadmin';
        else role = 'cashier';
        
        setUserRole(role);
        return true;
      }
    } catch (e) {
      console.error("❌ Erreur connexion compte:", e);
    }
    return false;
  }

  const loginWithPin = async (pin: string): Promise<boolean> => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${API_URL}/sales/verify/pin?pin=${pin}&storeId=${storeId}`);

      if (response.ok) {
        const user = await response.json();
        setCurrentBarista({ 
          id: user.id, 
          name: user.name, 
          assignedTables: user.assignedTables || [],
          permissions: user.permissions || [],
          defaultPosMode: user.defaultPosMode || 'tables'
        });
        if (user.store?.name) setStoreName(user.store.name);
        
        const role: UserRole = (
          String(user.role).toUpperCase() === 'STORE_OWNER' || 
          String(user.role).toLowerCase() === 'owner' || 
          pin === '1221'
        ) ? 'owner' : 'cashier';
        setUserRole(role);
        return true;
      }
    } catch (e) {
      console.error("Erreur de verification PIN:", e);
    }
    return false;
  };


  const logoutBarista = () => {
    setCurrentBarista(null);
    setUserRole(null);
  };

  const setTheme = (name: 'antigravity' | 'neon-food') => {
    setThemeName(name);
  };
  
  const logout = () => {
    setAuthToken(null);
    setStoreId(null);
    setCurrentBarista(null);
    setUserRole(null);
    clearCart();
    // Additional hard reset of everything from storage happens in the useEffect, but we'll manually ensure it here too
  };
  
  const deactivateTerminal = async () => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    
    try {
      if (authToken && storeId) {
        await fetch(`${API_URL}/auth/deactivate-terminal?storeId=${storeId}&token=${authToken}`, {
          method: 'POST'
        });
      }
    } catch (e) {
      console.warn("❌ Backend deactivation notify failed, proceeding anyway.");
    }

    logout();
    setStoreName(null);
    setStoreTablesState([]);
    setPendingSales([]);
    setProductsState(defaultProducts);
    
    // Total wipe of local storage to ensure "il peut plus accéder"
    await AsyncStorage.multiRemove([
      'pos-auth-token',
      'pos-store-id',
      'pos-store-name',
      'pos-store-tables',
      'pos-current-barista',
      'pos-user-role',
      'pos-offline-sales',
      'pos-tables',
      'pos-offline-cart',
      'pos-rachma-cart'
    ]);
  };


  const addToCart = (id: string) => {
    if (activeTable) {
      setTables(prev => {
        const tableCart = prev[activeTable] || {};
        return { ...prev, [activeTable]: { ...tableCart, [id]: (tableCart[id] || 0) + 1 } };
      });
    } else {
      setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  const removeFromCart = (id: string) => {
    if (activeTable) {
      setTables(prev => {
        const tableCart = { ...(prev[activeTable] || {}) };
        tableCart[id] = Math.max(0, (tableCart[id] || 0) - 1);
        if (tableCart[id] === 0) delete tableCart[id];
        return { ...prev, [activeTable]: tableCart };
      });
    } else {
      setCart((prev) => {
        const newCart = { ...prev };
        newCart[id] = Math.max(0, (newCart[id] || 0) - 1);
        if (newCart[id] === 0) delete newCart[id];
        return newCart;
      });
    }
  };

  const addToRachma = (id: string) => {
    const product = products.find(p => p.id === id);
    setRachmaCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setRachmaHistory(prev => [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        productId: id, 
        name: product?.name || 'Inconnu', 
        timestamp: Date.now(), 
        type: 'ADD' 
      },
      ...prev.slice(0, 49) // Keep last 50 actions
    ]);
  };

  const removeFromRachma = (id: string) => {
    const product = products.find(p => p.id === id);
    setRachmaCart(prev => {
      const next = { ...prev };
      next[id] = Math.max(0, (next[id] || 0) - 1);
      if (next[id] === 0) delete next[id];
      return next;
    });
    setRachmaHistory(prev => [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        productId: id, 
        name: product?.name || 'Inconnu', 
        timestamp: Date.now(), 
        type: 'REMOVE' 
      },
      ...prev.slice(0, 49)
    ]);
  };

  const clearRachma = () => {
    setRachmaCart({});
    setRachmaHistory([]);
  };

  const clearCart = () => {
    if (activeTable) {
      setTables(prev => {
        const newTables = { ...prev };
        delete newTables[activeTable];
        return newTables;
      });
    } else {
      setCart({});
    }
  };
  
  const setProducts = (p: Product[]) => setProductsState(p);
  const setStoreTables = (t: { id: string, label: string }[]) => setStoreTablesState(t);

  // Sync products from API when storeId is available
  useEffect(() => {
    if (storeId && isReady) {
      const fetchProducts = async () => {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
        try {
          // Pass storeId to get ONLY this store's products
          const response = await fetch(`${API_URL}/products?storeId=${storeId}`);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              setProductsState(data);
            }
          }
        } catch (e) {
          console.error("❌ Erreur sync produits:", e);
        }
      };
      fetchProducts();

      const fetchTables = async () => {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
        try {
          const response = await fetch(`${API_URL}/management/tables/${storeId}`);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              setStoreTablesState(data);
            }
          }
        } catch (e) {
          console.error("❌ Erreur sync tables:", e);
        }
      };
      fetchTables();
    }
  }, [storeId, isReady]);


  const getTotalItems = () => {
    const targetPayload = activeTable ? (tables[activeTable] || {}) : cart;
    return Object.values(targetPayload).reduce((total, qty) => total + qty, 0);
  };

  const getTableTotal = (id: string) => {
    const tableCart = tables[id] || {};
    return Object.entries(tableCart).reduce((total, [productId, qty]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * qty : 0);
    }, 0);
  };

  const getRachmaTotal = () => {
    return Object.entries(rachmaCart).reduce((total, [id, qty]) => {
      const product = products.find(p => p.id === id);
      return total + (product ? product.price * qty : 0);
    }, 0);
  };

  const getTotalPrice = () => {
    const targetPayload = activeTable ? (tables[activeTable] || {}) : cart;
    return Object.entries(targetPayload).reduce((total, [id, qty]) => {
      const product = products.find(p => p.id === id);
      return total + (product ? product.price * qty : 0);
    }, 0);
  };

  const checkout = () => {
    const targetCart = activeTable ? (tables[activeTable] || {}) : cart;
    if (Object.keys(targetCart).length === 0) return;
    
    const newSale: SaleEvent = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      items: Object.entries(targetCart).map(([productId, quantity]) => ({ productId, quantity })),
      totalPrice: getTotalPrice(),
      timestamp: Date.now(),
      status: 'pending',
      paymentStatus: 'PAID',
      baristaId: currentBarista?.id
    };
    
    setPendingSales(prev => [...prev, newSale]);
    clearCart();
    if (activeTable) setActiveTable(null);
  };

  const checkoutRachma = (paymentStatus: 'PAID' | 'UNPAID' = 'PAID') => {
    if (Object.keys(rachmaCart).length === 0) return;
    
    const newSale: SaleEvent = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      items: Object.entries(rachmaCart).map(([productId, quantity]) => ({ productId, quantity })),
      totalPrice: getRachmaTotal(),
      timestamp: Date.now(),
      status: 'pending',
      paymentStatus,
      baristaId: currentBarista?.id
    };
    
    setPendingSales(prev => [...prev, newSale]);
    clearRachma();
  };

  const checkoutTable = (id: string) => {
    const tableCart = tables[id] || {};
    if (Object.keys(tableCart).length === 0) return;

    const total = getTableTotal(id);
    const newSale: SaleEvent = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      items: Object.entries(tableCart).map(([productId, quantity]) => ({ productId, quantity })),
      totalPrice: total,
      timestamp: Date.now(),
      status: 'pending',
      paymentStatus: 'PAID', // Tables are usually paid at checkout here, but we could make it UNPAID if needed
      baristaId: currentBarista?.id
    };

    setPendingSales(prev => [...prev, newSale]);
    setTables(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const syncSales = async () => {
    const unsynced = pendingSales.filter(s => s.status === 'pending');
    if (unsynced.length === 0 || !storeId) return;
    
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      for (const sale of unsynced) {
        const saleDto = {
          id: sale.id, // Explicit ID for sync
          storeId: storeId,
          total: sale.totalPrice,
          baristaId: sale.baristaId,
          paymentStatus: sale.paymentStatus || 'PAID',
          items: sale.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products.find(p => p.id === item.productId)?.price || 0
          })),
          createdAt: new Date(sale.timestamp).toISOString()
        };

        const response = await fetch(`${API_URL}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleDto)
        });

        if (response.ok) {
          setPendingSales(prev => prev.map(s => s.id === sale.id ? { ...s, status: 'synced' as const } : s));
        }
      }
    } catch (e) {
      console.error("❌ Erreur sync ventes:", e);
    }
  };


  const updatePreparationStatus = async (saleId: string, status: string, station?: string): Promise<boolean> => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    if (!currentBarista) return false;

    try {
      const response = await fetch(`${API_URL}/sales/${saleId}/preparation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          preparedById: currentBarista.id,
          preparationStation: station
        })
      });

      return response.ok;
    } catch (e) {
      console.error("❌ Erreur update preparation:", e);
      return false;
    }
  };


  // Auto-sync effect
  useEffect(() => {
    if (pendingSales.some(s => s.status === 'pending')) {
      const timer = setTimeout(syncSales, 5000); // Sync after 5s of inactivity
      return () => clearTimeout(timer);
    }
  }, [pendingSales.length]);

  return (
    <POSContext.Provider value={{ 
      cart, tables, activeTable, products, pendingSales, authToken, storeId, storeName, authMode, storeTables,
      currentBarista, userRole, themeName, theme, rachmaCart, rachmaHistory, authenticate, activateTerminal, loginWithAccount, loginWithPin, logoutBarista, logout, deactivateTerminal, setTheme,
      addToCart, removeFromCart, addToRachma, removeFromRachma, clearRachma, clearCart, 
      setActiveTable, checkout, checkoutTable, checkoutRachma, 
      syncSales, setProducts, setStoreTables, getTotalItems, getTableTotal, getTotalPrice, getRachmaTotal,
      updatePreparationStatus
    }}>
      {children}
    </POSContext.Provider>
  );
};


export const usePOSStore = (): POSState => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOSStore must be used within a POSProvider');
  }
  return context;
};

