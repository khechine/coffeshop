'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, ShoppingCart, Trash2, CheckCircle, Clock, 
  History, User, Cake, LogOut, Lock, LayoutGrid, CreditCard,
  ChevronRight, AlertCircle, Save, ArrowLeft, MoreVertical, ClipboardList,
  ChevronDown, ChevronUp, ShoppingBag, Edit2, Users, Settings, LayoutDashboard, Search,
  X, Wallet, Banknote, Smartphone, Receipt, Tag, Star, Heart, Smile, Zap, Home, Box, Sun, Moon, ShieldCheck, Package, Store, Calculator
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { recordSale, searchCustomers, createCustomer, getRecentOrders, voidSale, getActiveCashSession, openCashSessionAction, closeCashSessionAction, clockInAction, clockOutAction, getActiveAttendance } from '../actions';
import { savePendingAction, getPendingActions, deletePendingAction } from './OfflineSync';
import { PrintService } from './PrintService';
import { DenominationCounter } from './DenominationCounter';
import './pos-premium.css';

const ICONS: Record<string, React.FC<any>> = {
  Tag, Cake, Star, Heart, Smile, Zap, Home, Box, ShoppingBag
};

interface Product { 
  id: string; 
  name: string; 
  price: number; 
  category: string; 
  image?: string; 
}

interface CartItem extends Product {
  quantity: number;
  discountPercent?: number;
  discountAmount?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
}

export default function PremiumPOSClient({ 
  storeId,
  storeName,
  storeAddress,
  storePhone,
  logoUrl,
  ticketConfig,
  printerConfig,
  initialProducts,
  initialCategories = [],
  initialBaristas = [],
  initialSales = [],
  initialTables = [],
  terminals = [],
  planName = 'STARTER',
  isFiscalEnabled = false,
  loyaltyEarnRate = 1,
  loyaltyRedeemRate = 100
}: { 
  storeId: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  logoUrl?: string | null;
  ticketConfig?: any;
  printerConfig?: any;
  initialProducts: Product[];
  initialCategories?: any[];
  initialBaristas?: any[];
  initialSales?: any[];
  initialTables?: any[];
  terminals?: any[];
  planName?: string;
  isFiscalEnabled?: boolean;
  loyaltyEarnRate?: number;
  loyaltyRedeemRate?: number;
}) {
  // --- Misc ---
  const router = useRouter();

  // --- States ---
  const [cashierId, setCashierId] = useState<string | null>(null);
  const [cashierName, setCashierName] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // --- Theme Management ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('pos_theme_variant');
    if (savedTheme === 'koffie') {
      setTheme('koffie');
      document.body.setAttribute('data-theme', 'koffie');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, []);

  const toggleThemeVariant = () => {
    setTheme(prev => {
      const newVal = prev === 'mocha' ? 'koffie' : 'mocha';
      localStorage.setItem('pos_theme_variant', newVal);
      if (newVal === 'koffie') {
        document.body.setAttribute('data-theme', 'koffie');
      } else {
        document.body.removeAttribute('data-theme');
      }
      return newVal;
    });
  };

  const [tableOrders, setTableOrders] = useState<Record<string, CartItem[]>>({});
  const [category, setCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [view, setView] = useState<'TABLES' | 'POS' | 'ORDERS' | 'CUSTOMERS' | 'DASHBOARD'>('DASHBOARD');
  const [theme, setTheme] = useState<'mocha' | 'koffie'>('mocha');
  const [currentParentCategoryId, setCurrentParentCategoryId] = useState<string | null>(null);
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  
  // Customer & Loyalty
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>({
    id: 'passager',
    name: 'Client Passager',
    phone: '',
    loyaltyPoints: 0
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  
  // Orders Module State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PAID' | 'VOID' | 'MINE'>('ALL');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  
  const activeDailyTarget = React.useMemo(() => {
    const barista = initialBaristas.find(b => String(b.id) === String(cashierId));
    return Number(barista?.dailyTarget || 1200);
  }, [cashierId, initialBaristas]);
  
  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MIXED' | 'MEAL_VOUCHER'>('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  // Mixed / per-method amounts
  const [mixedCash, setMixedCash] = useState('');
  const [mixedCard, setMixedCard] = useState('');
  const [mixedVoucher, setMixedVoucher] = useState('');
  // Reference numbers
  const [cardRef, setCardRef] = useState('');
  const [voucherRef, setVoucherRef] = useState('');
  // Which keypad field is active in MIXTE mode ('cash'|'card'|'voucher')
  const [mixedTarget, setMixedTarget] = useState<'cash'|'card'|'voucher'>('cash');
  // Ticket scanning (MEAL_VOUCHER)
  const [scannedTickets, setScannedTickets] = useState<string[]>([]);
  const [ticketUnitValue, setTicketUnitValue] = useState('8.000');
  const [ticketType, setTicketType] = useState('');
  const [scanInput, setScanInput] = useState('');
  // Line item discount popover state
  const [activeDiscountItemId, setActiveDiscountItemId] = useState<string | null>(null);
  
  // New Customer Modal
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);
  const [sessionSales, setSessionSales] = useState<any[]>(initialSales);
  
  // Cash Session State
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openingCounts, setOpeningCounts] = useState<Record<string, number>>({});
  const [closingBalance, setClosingBalance] = useState('0');
  const [closingCounts, setClosingCounts] = useState<Record<string, number>>({});
  const [fondDeCaisse, setFondDeCaisse] = useState('0');
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Auto-lock & Inactivity Timer
  const [lastActivity, setLastActivity] = useState(Date.now());
  const INACTIVITY_TIMEOUT = 120000; // 2 minutes in ms

  useEffect(() => {
    if (!cashierId) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        handleLogout();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [cashierId, lastActivity]);

  // --- Offline Sync Logic ---
  useEffect(() => {
    // Register Service Worker for offline PWA capabilities
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-pos.js')
        .then((registration) => console.log('POS ServiceWorker registered with scope:', registration.scope))
        .catch((error) => console.error('POS ServiceWorker registration failed:', error));
    }

    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    } else {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    try {
      // Sync Sales
      const pendingSales = await getPendingActions('pendingSales');
      // Sync Customers
      const pendingCustomers = await getPendingActions('pendingCustomers');
      
      setPendingSyncCount(pendingSales.length + pendingCustomers.length);
      
      let syncedCount = 0;

      // Sync customers first because sales might depend on them
      if (pendingCustomers.length > 0) {
        for (const customer of pendingCustomers) {
          try {
            await createCustomer(customer.data);
            await deletePendingAction('pendingCustomers', customer.id);
            syncedCount++;
          } catch (err) {
            console.error("Failed to sync customer", err);
          }
        }
      }

      if (pendingSales.length > 0) {
        for (const sale of pendingSales) {
          try {
            // Remove the temporary offline ID before sending to server
            const { id, createdAt, ...salePayload } = sale.data;
            await recordSale(salePayload);
            await deletePendingAction('pendingSales', sale.id);
            syncedCount++;
          } catch (err) {
            console.error("Failed to sync sale", err);
          }
        }
      }

      const remainingSales = await getPendingActions('pendingSales');
      const remainingCustomers = await getPendingActions('pendingCustomers');
      setPendingSyncCount(remainingSales.length + remainingCustomers.length);
      
      if (syncedCount > 0 && remainingSales.length === 0 && remainingCustomers.length === 0) {
        alert(`Synchronisation terminée ! ${syncedCount} élément(s) hors ligne synchronisé(s).`);
      }
    } catch (err) {
      console.error("Sync error", err);
    }
  };
  
  // --- Derived ---
  const peakHoursData = React.useMemo(() => {
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    if (!Array.isArray(sessionSales)) return { matrix, maxVal: 0 };

    sessionSales.forEach((sale: any) => {
      if (!sale?.createdAt) return;
      const date = new Date(sale.createdAt);
      if (isNaN(date.getTime())) return;

      const day = (date.getDay() + 6) % 7; 
      const hour = date.getHours();
      
      if (matrix[day] && typeof hour === 'number' && !isNaN(hour)) {
        matrix[day][hour] += 1;
      }
    });
    let maxVal = 0;
    matrix.forEach(row => row.forEach(val => { if(val > maxVal) maxVal = val; }));
    return { matrix, maxVal };
  }, [sessionSales]);

  const salesByCategory = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!Array.isArray(sessionSales)) return [];

    sessionSales.forEach((sale: any) => {
      if (!Array.isArray(sale?.items)) return;
      
      sale.items.forEach((item: any) => {
        if (!item?.product) return;
        const cat = item.product.category || 'Inconnu';
        counts[cat] = (counts[cat] || 0) + (Number(item.price || 0) * (item.quantity || 0));
      });
    });
    const totalSalesVal = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([name, val]) => ({ name, val: totalSalesVal > 0 ? (val / totalSalesVal) * 100 : 0 }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);
  }, [sessionSales]);

  const getIntensityClass = (val: number, maxVal: number) => {
    if (val === 0) return '';
    if (maxVal === 0) return '';
    const ratio = val / maxVal;
    if (ratio > 0.8) return 'intensity-peak';
    if (ratio > 0.5) return 'intensity-high';
    if (ratio > 0.2) return 'intensity-med';
    return 'intensity-low';
  };

  const filteredProducts = initialProducts.filter(p => {
    const matchesCat = category === 'Tous' || p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const currentCart = selectedTable ? (tableOrders[selectedTable.id] || []) : [];

  // Helper calculation for line item prices & discounts
  const getItemNetPrice = (item: CartItem) => {
    if (item.discountPercent && item.discountPercent > 0) {
      return item.price * (1 - item.discountPercent / 100);
    }
    if (item.discountAmount && item.discountAmount > 0) {
      return Math.max(0, item.price - item.discountAmount);
    }
    return item.price;
  };

  const getItemLineTotal = (item: CartItem) => getItemNetPrice(item) * item.quantity;

  const subtotalBrut = currentCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = currentCart.reduce((acc, item) => acc + getItemLineTotal(item), 0);
  const totalLineDiscounts = subtotalBrut - subtotal;

  // Cross-selling suggestions
  const suggestedProducts = React.useMemo(() => {
    if (currentCart.length === 0) return [];
    
    // Simple heuristic: if cart has drinks, suggest pastries/food. If cart has food, suggest drinks.
    const cartCategories = currentCart.map(c => c.category?.toLowerCase() || '');
    const hasDrinks = cartCategories.some(c => c.includes('café') || c.includes('boisson') || c.includes('jus'));
    const hasFood = cartCategories.some(c => c.includes('viennoiserie') || c.includes('pâtisserie') || c.includes('gâteau') || c.includes('salé'));
    
    let candidates = initialProducts.filter(p => !currentCart.some(c => c.id === p.id));
    
    if (hasDrinks && !hasFood) {
      candidates = candidates.filter(p => {
        const cat = p.category?.toLowerCase() || '';
        return cat.includes('viennoiserie') || cat.includes('pâtisserie') || cat.includes('gâteau') || cat.includes('salé') || cat.includes('snack');
      });
      // Fallback if no matching category
      if (candidates.length === 0) candidates = initialProducts.filter(p => !currentCart.some(c => c.id === p.id));
    } else if (hasFood && !hasDrinks) {
      candidates = candidates.filter(p => {
        const cat = p.category?.toLowerCase() || '';
        return cat.includes('café') || cat.includes('boisson') || cat.includes('jus') || cat.includes('drink');
      });
      if (candidates.length === 0) candidates = initialProducts.filter(p => !currentCart.some(c => c.id === p.id));
    }
    
    // Take up to 2 items
    return candidates.slice(0, 2);
  }, [currentCart, initialProducts]);
  
  const discountFromPoints = isRedeemingPoints && selectedCustomer 
    ? Math.min(selectedCustomer.loyaltyPoints / loyaltyRedeemRate, subtotal)
    : 0;
  const total = subtotal - discountFromPoints;
  const change = Number(amountReceived) > total ? Number(amountReceived) - total : 0;

  // --- Handlers ---
  useEffect(() => {
    if (view === 'ORDERS') {
      fetchOrders();
    }
  }, [view]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      if (isOffline) {
        // En mode hors ligne, afficher au moins les ventes de la session courante
        setOrders(sessionSales);
        return;
      }
      const data = await getRecentOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setIsOffline(true);
      setOrders(sessionSales); // Fallback to local session sales
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleVoidOrder = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible et les stocks seront restaurés.")) return;
    try {
      await voidSale(id);
      alert("Commande annulée avec succès");
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert("Erreur lors de l'annulation");
    }
  };

  // --- Table Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('pos_premium_orders');
    if (saved) {
      try {
        setTableOrders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load table orders", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pos_premium_orders', JSON.stringify(tableOrders));
  }, [tableOrders]);

  const addToCart = (product: Product & { minOrderQty?: number }) => {
    const tableId = selectedTable?.id || 'DIRECT';
    const minQty = Number(product.minOrderQty || 1);

    setTableOrders(prev => {
      const tableCart = prev[tableId] || [];
      const existing = tableCart.find(item => item.id === product.id);
      
      let newCart;
      if (existing) {
        newCart = tableCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        newCart = [...tableCart, { ...product, quantity: minQty }];
      }
      
      return { ...prev, [tableId]: newCart };
    });
  };

  const updateQty = (id: string, delta: number) => {
    const tableId = selectedTable?.id || 'DIRECT';

    setTableOrders(prev => {
      const tableCart = prev[tableId] || [];
      const newCart = tableCart.map(item => {
        if (item.id === id) {
          const minQty = (item as any).minOrderQty || 1;
          let newQty = item.quantity + delta;
          
          if (delta < 0 && newQty < minQty) {
            newQty = 0;
          }
          
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);

      return { ...prev, [tableId]: newCart };
    });
  };

  const updateLineDiscount = (id: string, discountPercent?: number, discountAmount?: number) => {
    const tableId = selectedTable?.id || 'DIRECT';
    setTableOrders(prev => {
      const tableCart = prev[tableId] || [];
      const newCart = tableCart.map(item => {
        if (item.id === id) {
          return {
            ...item,
            discountPercent,
            discountAmount
          };
        }
        return item;
      });
      return { ...prev, [tableId]: newCart };
    });
  };

  const clearCart = () => {
    const tableId = selectedTable?.id || 'DIRECT';
    setTableOrders(prev => {
      const { [tableId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleCustomerSearch = async (val: string) => {
    setCustomerSearch(val);
    if (val.length > 1) {
      if (isOffline) {
        // En mode hors ligne, on cherche d'abord dans les clients temporaires créés localement
        getPendingActions('pendingCustomers').then((pending) => {
          const localMatches = pending
            .map((p: any) => p.data)
            .filter((c: any) => c.name.toLowerCase().includes(val.toLowerCase()) || c.phone.includes(val));
          setCustomerResults(localMatches as any);
        });
        return;
      }

      try {
        const results = await searchCustomers(val);
        setCustomerResults(results as any);
      } catch (err) {
        console.error("Search failed, likely offline", err);
        setIsOffline(true);
        setCustomerResults([]);
      }
    } else {
      setCustomerResults([]);
    }
  };

  const printTicket = async (sale: any, itemsList: any[]) => {
    try {
      const printItems = itemsList.map(item => ({
        id: item.id || item.productId,
        productId: item.productId || item.id,
        name: item.name || item.product?.name || 'Article',
        quantity: Number(item.quantity),
        price: Number(item.price)
      }));
      await PrintService.printTicket({
        storeName,
        storeAddress,
        storePhone,
        logoUrl,
        ticketConfig,
        sale,
        items: printItems
      }, { 
        paperSize: printerConfig?.paperSize || '80mm' 
      }, planName);
    } catch (err) {
      console.error("Print failed:", err);
    }
  };

  const processPayment = async () => {
    setLastActivity(Date.now());

    // Build detailed payment split
    let cashAmt = 0, cardAmt = 0, voucherAmt = 0;
    if (paymentMethod === 'CASH') {
      cashAmt = parseFloat(amountReceived) || total;
    } else if (paymentMethod === 'CARD') {
      cardAmt = total;
    } else if (paymentMethod === 'MEAL_VOUCHER') {
      voucherAmt = scannedTickets.length > 0
        ? scannedTickets.length * (parseFloat(ticketUnitValue) || 0)
        : total;
    } else if (paymentMethod === 'MIXED') {
      cashAmt = parseFloat(mixedCash) || 0;
      cardAmt = parseFloat(mixedCard) || 0;
      voucherAmt = parseFloat(mixedVoucher) || 0;
    }

    const saleData = {
      total,
      subtotal,
      discount: discountFromPoints,
      items: currentCart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price, product: i })),
      baristaId: cashierId || 'pos-internal',
      terminalId: selectedTerminalId || undefined,
      tableName: selectedTable?.label || 'Directe',
      paymentMethod: paymentMethod,
      paymentDetails: {
        cash: cashAmt,
        card: cardAmt,
        voucher: voucherAmt,
        cardRef: cardRef || undefined,
        voucherRef: voucherRef || undefined,
        points: discountFromPoints * loyaltyRedeemRate
      },
      customerId: (selectedCustomer?.id && selectedCustomer.id !== 'passager') ? selectedCustomer.id : undefined,
      change: change,
      isTraining: isTrainingMode,
      createdAt: new Date().toISOString()
    };

    let finalSaleObject: any = null;
    let autoPrintList = [...currentCart];

    try {
      if (isOffline) {
        // Sauvegarde locale
        await savePendingAction('pendingSales', saleData);
        finalSaleObject = { 
          ...saleData, 
          id: 'offline-' + Date.now(),
          totalHt: saleData.subtotal,
          totalTax: saleData.total - saleData.subtotal,
          isFiscal: false,
          cashierName: cashierName
        };
        setSessionSales(prev => [finalSaleObject, ...prev]);
        setPendingSyncCount(prev => prev + 1);
        alert("Mode hors ligne : Vente sauvegardée localement ! Elle sera synchronisée au retour de la connexion.");
      } else {
        const sale = await recordSale(saleData);
        finalSaleObject = isTrainingMode ? {
          ...sale,
          isFiscal: false,
          fiscalNumber: null,
          id: `PROFORMA-${Date.now().toString().slice(-6)}`
        } : sale;
        setSessionSales(prev => [finalSaleObject, ...prev]);
        if (isTrainingMode) {
          alert("🎓 Mode Formation : Billet PRO-FORMA émis (Aucun impact sur le stock, les gains, ni le rapport Z fiscal).");
        } else {
          alert("Vente enregistrée avec succès !");
        }
      }

      // Automatic Printing
      const shouldAutoPrint = ticketConfig?.autoPrint ?? true;
      if (shouldAutoPrint && finalSaleObject) {
        await printTicket(finalSaleObject, autoPrintList);
      }

      clearCart();
      setSelectedCustomer({ id: 'passager', name: 'Client Passager', phone: '', loyaltyPoints: 0 });
      setIsPaymentModalOpen(false);
      setIsRedeemingPoints(false);
      setIsCartOpenMobile(false);
      setAmountReceived('');
      setMixedCash(''); setMixedCard(''); setMixedVoucher('');
      setCardRef(''); setVoucherRef('');
      setScannedTickets([]); setScanInput(''); setTicketType('');
    } catch (err) {
      console.error(err);
      setIsOffline(true);
      await savePendingAction('pendingSales', saleData);
      finalSaleObject = { 
        ...saleData, 
        id: 'offline-' + Date.now(),
        totalHt: saleData.subtotal,
        totalTax: saleData.total - saleData.subtotal,
        isFiscal: false,
        cashierName: cashierName
      };
      setSessionSales(prev => [finalSaleObject, ...prev]);
      setPendingSyncCount(prev => prev + 1);
      alert("Erreur réseau détectée. Passage en mode hors ligne. Vente sauvegardée localement !");
      const shouldAutoPrint = ticketConfig?.autoPrint ?? true;
      if (shouldAutoPrint) await printTicket(finalSaleObject, autoPrintList);
      clearCart();
      setIsPaymentModalOpen(false);
    }
  };

  const handleKeypad = (val: string) => {
    if (paymentMethod === 'MIXED') {
      const setter = mixedTarget === 'cash' ? setMixedCash : mixedTarget === 'card' ? setMixedCard : setMixedVoucher;
      const current = mixedTarget === 'cash' ? mixedCash : mixedTarget === 'card' ? mixedCard : mixedVoucher;
      if (val === 'C') setter('');
      else if (val === '.') { if (!current.includes('.')) setter(prev => prev + '.'); }
      else setter(prev => prev === '' || prev === '0' ? val : prev + val);
    } else {
      if (val === 'C') setAmountReceived('0');
      else if (val === '.') { if (!amountReceived.includes('.')) setAmountReceived(prev => prev + '.'); }
      else setAmountReceived(prev => prev === '0' ? val : prev + val);
    }
  };

  // --- Auth Handlers ---
  const checkSession = async () => {
    try {
      const session = await getActiveCashSession();
      if (session) {
        setActiveSession(session);
        setShowOpeningModal(false);
      } else {
        setShowOpeningModal(true);
      }
    } catch (err) {
      console.error("Session check failed", err);
    }
  };

  const handlePinSubmit = async () => {
    const barista = initialBaristas.find(b => b.pinCode === pin);
    if (barista) {
      setCashierId(barista.id);
      setCashierName(barista.name);
      localStorage.setItem('pos_cashier_id', barista.id);
      localStorage.setItem('pos_cashier_name', barista.name);
      setPin("");
      await checkSession();
    } else {
      setError("PIN invalide");
      setPin("");
    }
  };

  const handleOpenSession = async () => {
    try {
      const session = await openCashSessionAction(Number(openingBalance), openingCounts);
      setActiveSession(session);
      setShowOpeningModal(false);
      
      try {
        const printData = {
          storeName,
          openTime: session.openedAt || new Date().toISOString(),
          cashierName: cashierName || "Caisse",
          counts: openingCounts,
          openingCash: Number(openingBalance)
        };
        await PrintService.printOpeningReport(printData, { paperSize: '80mm' });
      } catch (printErr) {
        console.error("Erreur d'impression:", printErr);
      }
      
      alert("Session ouverte avec succès ! Bon service.");
    } catch (err) {
      alert("Erreur lors de l'ouverture de la session");
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      const expectedTotal = Number(activeSession.openingBalance || 0) + Number(activeSession.totalSales || 0);
      const ecart = Number(closingBalance) - expectedTotal;
      const notes = sessionNotes + `\nTotal compté: ${closingBalance} DT\nFond de caisse gardé: ${fondDeCaisse} DT\nÉcart: ${ecart.toFixed(3)} DT\nMontant à déposer: ${Math.max(0, Number(closingBalance) - Number(fondDeCaisse)).toFixed(3)} DT`;
      
      await closeCashSessionAction(activeSession.id, Number(closingBalance), notes, closingCounts);
      
      // Try to print the Z report
      try {
        const shiftData = {
          storeName,
          storeAddress,
          storePhone,
          openTime: activeSession.createdAt,
          closeTime: new Date().toISOString(),
          openingCash: Number(activeSession.openingBalance || 0),
          salesCashTotal: Number(activeSession.totalSales || 0),
          expectedTotal,
          countedTotal: Number(closingBalance),
          difference: ecart,
          fondDeCaisse: Number(fondDeCaisse),
          montantDepot: Math.max(0, Number(closingBalance) - Number(fondDeCaisse))
        };
        await PrintService.printShiftReport(shiftData, { paperSize: printerConfig?.paperSize || '80mm' });
      } catch (err) {
        console.error("Failed to print Z report:", err);
      }

      alert("Session clôturée avec succès.");
      setActiveSession(null);
      setShowClosingModal(false);
      handleLogout(); // Force logout after closing
    } catch (err) {
      alert("Erreur lors de la clôture");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_cashier_id');
    localStorage.removeItem('pos_cashier_name');
    setCashierId(null);
    setCashierName(null);
    setPin("");
    setActiveSession(null);
  };

  // --- Attendance States & Handlers ---
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendancePin, setAttendancePin] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSuccessMessage, setAttendanceSuccessMessage] = useState("");

  const handleAttendanceSubmit = async (pinValue?: string) => {
    const code = pinValue || attendancePin;
    if (!code || code.length < 4) {
      setAttendanceError("Veuillez saisir votre code PIN complet");
      return;
    }
    setAttendanceLoading(true);
    setAttendanceError("");
    setAttendanceSuccessMessage("");
    try {
      const barista = initialBaristas.find(b => b.pinCode === code);
      if (!barista) {
        setAttendanceError("Code PIN incorrect");
        setAttendancePin("");
        return;
      }

      // Check if user has active attendance
      const active = await getActiveAttendance(barista.id);
      if (active) {
        // Clock out
        const updated = await clockOutAction(active.id);
        const diffMinutes = updated.duration || 0;
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        setAttendanceSuccessMessage(
          `Au revoir ${barista.name} ! Départ enregistré. Durée : ${hours}h ${mins}m.`
        );
      } else {
        // Clock in
        const created = await clockInAction(barista.id, 'POS');
        setAttendanceSuccessMessage(
          `Bonjour ${barista.name} ! Arrivée enregistrée. Bon service !`
        );
      }
      setAttendancePin("");
    } catch (err: any) {
      setAttendanceError(err.message || "Une erreur est survenue lors du pointage");
      setAttendancePin("");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const renderAttendanceModal = () => {
    return (
      <div className="pos-modal-overlay" style={{ zIndex: 5000, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pos-modal-card" style={{ width: '400px', padding: '32px', borderRadius: '24px', background: '#1E1B4B', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={22} className="text-pos-primary" /> Pointage
            </h2>
            <button 
              onClick={() => { setShowAttendanceModal(false); setAttendancePin(""); setAttendanceError(""); setAttendanceSuccessMessage(""); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={24} />
            </button>
          </div>

          {attendanceSuccessMessage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={48} />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5 }}>
                {attendanceSuccessMessage}
              </p>
              <button 
                onClick={() => { setShowAttendanceModal(false); setAttendancePin(""); setAttendanceError(""); setAttendanceSuccessMessage(""); }}
                className="btn-premium btn-premium-primary"
                style={{ width: '100%', height: '48px', borderRadius: '14px', marginTop: '12px' }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>
                Saisissez votre code PIN pour enregistrer votre arrivée ou départ.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ width: '16px', height: '16px', borderRadius: '50%', background: attendancePin.length > i ? 'var(--pos-primary)' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s' }} />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map(n => (
                  <button key={n} disabled={attendanceLoading} onClick={() => {
                    if (n === 'C') setAttendancePin("");
                    else if (n === '✓') handleAttendanceSubmit();
                    else if (attendancePin.length < 4) {
                      const newVal = attendancePin + n.toString();
                      setAttendancePin(newVal);
                      if (newVal.length === 4) {
                        handleAttendanceSubmit(newVal);
                      }
                    }
                  }}
                  style={{ height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '20px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {n}
                  </button>
                ))}
              </div>

              {attendanceError && (
                <div style={{ color: '#F87171', fontSize: '14px', fontWeight: 700, marginTop: '12px' }}>
                  {attendanceError}
                </div>
              )}
              {attendanceLoading && (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '12px' }}>
                  Traitement en cours...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const cid = localStorage.getItem('pos_cashier_id');
    const cname = localStorage.getItem('pos_cashier_name');
    const tid = localStorage.getItem('pos_terminal_id');
    if (cid && cname) {
      setCashierId(cid);
      setCashierName(cname);
      checkSession();
    }
    if (tid) {
      setSelectedTerminalId(tid);
    }
  }, []);

  const selectTerminal = (id: string) => {
    setSelectedTerminalId(id);
    localStorage.setItem('pos_terminal_id', id);
  };

  if (!cashierId) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'linear-gradient(135deg,#1E1B4B 0%,#312E81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '360px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
             <Cake size={40} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>Authentification</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Saisissez votre code PIN {storeName}</p>
          
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '40px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: pin.length > i ? 'var(--pos-primary)' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s' }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map(n => (
              <button key={n} onClick={() => {
                if (n === 'C') setPin("");
                else if (n === '✓') handlePinSubmit();
                else if (pin.length < 4) setPin(p => p + n.toString());
              }}
              style={{ height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '24px', fontWeight: 800, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
          </div>
          {error && <div style={{ marginTop: '24px', color: '#F87171', fontWeight: 800 }}>{error}</div>}
          
          <button 
            onClick={() => { setShowAttendanceModal(true); setAttendancePin(""); setAttendanceError(""); setAttendanceSuccessMessage(""); }}
            style={{ marginTop: '32px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Clock size={20} /> Pointage du personnel
          </button>
        </div>
        {showAttendanceModal && renderAttendanceModal()}
      </div>
    );
  }

  // Terminal Selection UI (if fiscal and no terminal)
  if (isFiscalEnabled && !selectedTerminalId) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'linear-gradient(135deg,#1E1B4B 0%,#312E81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '500px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
             <CreditCard size={40} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>Sélection du Terminal</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Choisissez la caisse que vous utilisez actuellement</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
            {terminals.map((t: any) => (
              <button key={t.id} onClick={() => selectTerminal(t.id)}
              style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <LayoutDashboard size={24} />
                <span style={{ fontWeight: 800 }}>{t.name}</span>
              </button>
            ))}
            {terminals.length === 0 && (
              <div style={{ gridColumn: '1/-1', color: '#F87171' }}>Aucun terminal configuré pour cette boutique.</div>
            )}
          </div>
          
          <button onClick={handleLogout} style={{ marginTop: '40px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', cursor: 'pointer' }}>
             Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-premium-container" data-theme={isDarkMode ? 'dark' : 'light'} style={{ transition: 'all 0.3s ease' }}>
      {/* Main Content Area */}
      <div className="pos-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mode Formation Warning Banner */}
        {isTrainingMode && (
          <div style={{
            background: 'linear-gradient(135deg, #D97706, #B45309)',
            color: '#FFFBEB',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
            flexShrink: 0,
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🎓</span>
              <span>MODE FORMATION ACTIF — Billets émis en PRO-FORMA (Non comptabilisés dans le CA, ni le stock, ni le rapport Z fiscal)</span>
            </div>
            <button
              onClick={() => setIsTrainingMode(false)}
              style={{
                background: '#fff',
                color: '#92400E',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              Quitter la formation
            </button>
          </div>
        )}

        {/* Top Action Nav Bar (Pro Touchscreen Layout) */}
        <div className="pos-top-tab-bar">
          <button className="pos-top-tab-btn tab-green" onClick={() => router.push('/')} title="Accueil Dashboard">
            <Home size={15} /> <span>ACCUEIL</span>
          </button>
          <button className={`pos-top-tab-btn tab-green ${view === 'POS' ? 'active' : ''}`} onClick={() => { if(!selectedTable) setSelectedTable({ id: 'DIRECT', label: 'Vente Directe' }); setView('POS'); }}>
            <ShoppingCart size={15} /> <span>POS / VENTE</span>
          </button>
          <button className={`pos-top-tab-btn tab-orange ${view === 'TABLES' ? 'active' : ''}`} onClick={() => setView('TABLES')}>
            <LayoutGrid size={15} /> <span>TABLES ({initialTables.length})</span>
          </button>
          <button className={`pos-top-tab-btn tab-blue ${view === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setView('DASHBOARD')}>
            <LayoutDashboard size={15} /> <span>TABLEAU DE BORD</span>
          </button>
          <button className={`pos-top-tab-btn tab-cyan ${view === 'ORDERS' ? 'active' : ''}`} onClick={() => setView('ORDERS')}>
            <History size={15} /> <span>HISTORIQUE</span>
          </button>
          <button className={`pos-top-tab-btn tab-purple ${view === 'CUSTOMERS' ? 'active' : ''}`} onClick={() => setView('CUSTOMERS')}>
            <Users size={15} /> <span>CLIENTÈLE</span>
          </button>
          <button className="pos-top-tab-btn tab-dark" onClick={() => { setShowAttendanceModal(true); setAttendancePin(""); setAttendanceError(""); setAttendanceSuccessMessage(""); }}>
            <Clock size={15} /> <span>POINTAGE</span>
          </button>
          <button className={`pos-top-tab-btn ${isTrainingMode ? 'tab-orange active' : 'tab-dark'}`} onClick={() => setIsTrainingMode(!isTrainingMode)}>
            <span>🎓 FORMATION</span>
          </button>
          <button className="pos-top-tab-btn tab-dark" onClick={() => setShowClosingModal(true)}>
            <LogOut size={15} /> <span>CLÔTURER</span>
          </button>
          <div style={{ flex: 1 }} />
          {isOffline && (
            <div style={{ color: '#F59E0B', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.15)', padding: '4px 10px', borderRadius: 8 }}>
              <AlertCircle size={14} /> <span>Hors-ligne ({pendingSyncCount})</span>
            </div>
          )}
        </div>

        {/* Main Content Wrapper (Responsive Stack) */}
        <div className="pos-main-wrapper">
          {/* Categories Column */}
          {view === 'POS' && (
            <div className="pos-categories-column">
               {currentParentCategoryId ? (
                 <>
                   <button 
                     className={`category-vertical-pill`}
                     onClick={() => {
                       setCurrentParentCategoryId(null);
                       setCategory('Tous');
                     }}
                   >
                     <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <ArrowLeft size={20} />
                     </div>
                     <span>Retour</span>
                   </button>
                 {initialCategories.filter(c => c.parentId === currentParentCategoryId).map((cat: any) => {
                    const CatIcon = ICONS[cat.icon || 'Tag'] || Tag;
                    const catColor = cat.color || '#6366F1';
                    const isActive = category === cat.name;
                    return (
                      <button 
                        key={cat.id} 
                        className={`category-vertical-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setCategory(cat.name)}
                        style={isActive ? { backgroundColor: catColor, color: '#fff', borderColor: catColor } : { color: catColor, borderColor: catColor + '40' }}
                      >
                        <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon size={20} />
                        </div>
                        <span>{cat.name}</span>
                      </button>
                    );
                 })}
               </>
             ) : (
               <>
                 <button 
                   className={`category-vertical-pill ${category === 'Tous' ? 'active' : ''}`}
                   onClick={() => setCategory('Tous')}
                 >
                   <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <LayoutDashboard size={20} />
                   </div>
                   <span>Tous</span>
                 </button>
                 {initialCategories.filter(c => !c.parentId).map((cat: any) => {
                    const hasChildren = initialCategories.some(c => c.parentId === cat.id);
                    const CatIcon = ICONS[cat.icon || 'Tag'] || Tag;
                    const catColor = cat.color || '#6366F1';
                    const isActive = category === cat.name && !hasChildren;
                    
                    return (
                      <button 
                        key={cat.id} 
                        className={`category-vertical-pill ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          if (hasChildren) {
                            setCurrentParentCategoryId(cat.id);
                            setCategory(cat.name);
                          } else {
                            setCategory(cat.name);
                          }
                        }}
                        style={isActive ? { backgroundColor: catColor, color: '#fff', borderColor: catColor, boxShadow: `0 8px 20px ${catColor}40` } : { color: catColor, borderColor: catColor + '30', background: 'var(--pos-glass-bg)', backdropFilter: 'blur(10px)' }}
                      >
                        <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon size={22} />
                        </div>
                        <span style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: 14 }}>{cat.name}</span>
                        {hasChildren && <ChevronRight size={16} opacity={0.5} />}
                      </button>
                    );
                 })}
               </>
             )}
          </div>
          )}

          {/* Main Experience Area */}
          <div className="pos-product-section">
        {view === 'DASHBOARD' ? (
          <div style={{ flex: 1, padding: 40, overflowY: 'auto', background: 'var(--pos-bg)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                   <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Tableau de bord</h1>
                   <p style={{ color: 'var(--pos-text-muted)', margin: 0 }}>Vue d'ensemble de votre boutique</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ background: 'var(--pos-card-bg)', padding: '10px 20px', borderRadius: 12, border: '1px solid var(--pos-border)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={18} /> Aujourd'hui
                   </div>
                </div>
             </div>

             <div className="dashboard-metrics-grid">
                <div className="metric-card">
                   <div className="metric-card-header">
                      <span className="metric-label">REVENU TOTAL</span>
                      <div style={{ background: 'var(--pos-accent)', padding: 8, borderRadius: 10, opacity: 0.2 }}><Banknote size={20} /></div>
                   </div>
                   <div className="metric-value">{(sessionSales.reduce((acc, s) => acc + Number(s.total), 0)).toFixed(3)} DT</div>
                   <div className="metric-trend trend-up"><ChevronUp size={16} /> 8.8% <span style={{ color: 'var(--pos-text-muted)', fontWeight: 500, marginLeft: 4 }}>vs hier</span></div>
                </div>
                <div className="metric-card">
                   <div className="metric-card-header">
                      <span className="metric-label">COMMANDES</span>
                      <div style={{ background: 'var(--pos-success)', padding: 8, borderRadius: 10, opacity: 0.2 }}><ClipboardList size={20} /></div>
                   </div>
                   <div className="metric-value">{sessionSales.length}</div>
                   <div className="metric-trend trend-down"><ChevronDown size={16} /> 2.1% <span style={{ color: 'var(--pos-text-muted)', fontWeight: 500, marginLeft: 4 }}>vs hier</span></div>
                </div>
                <div className="metric-card">
                   <div className="metric-card-header">
                      <span className="metric-label">VOS VENTES (SESSION)</span>
                      <div style={{ background: 'var(--pos-primary)', padding: 8, borderRadius: 10, opacity: 0.2 }}><Zap size={20} /></div>
                   </div>
                   <div className="metric-value">{(sessionSales.filter(s => String(s.cashierId || s.baristaId) === String(cashierId)).reduce((acc, s) => acc + Number(s.total), 0)).toFixed(3)} DT</div>
                   <div className="metric-trend trend-up"><ChevronUp size={16} /> En direct</div>
                </div>
                <div className="metric-card">
                   <div className="metric-card-header">
                      <span className="metric-label">CLIENTS LOYAUX</span>
                      <div style={{ background: 'var(--pos-warning)', padding: 8, borderRadius: 10, opacity: 0.2 }}><Users size={20} /></div>
                   </div>
                   <div className="metric-value">{new Set(sessionSales.filter(s => s.customerId).map(s => s.customerId)).size}</div>
                   <div className="metric-trend trend-up"><ChevronUp size={16} /> 5.6% <span style={{ color: 'var(--pos-text-muted)', fontWeight: 500, marginLeft: 4 }}>vs hier</span></div>
                </div>
             </div>

             <div className="dashboard-charts-layout">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div className="heatmap-container">
                       <div className="heatmap-header">
                          <div>
                             <h3 style={{ margin: 0, fontWeight: 900 }}>Heures d'Affluence</h3>
                             <p style={{ margin: 0, fontSize: 13, color: 'var(--pos-text-muted)' }}>Moyenne sur les 30 derniers jours</p>
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)' }}>
                             <span>Bas</span>
                             <div style={{ width: 12, height: 12, borderRadius: 3, background: '#EFEBE9' }} />
                             <div style={{ width: 12, height: 12, borderRadius: 3, background: '#BCAAA4' }} />
                             <div style={{ width: 12, height: 12, borderRadius: 3, background: '#8D6E63' }} />
                             <div style={{ width: 12, height: 12, borderRadius: 3, background: '#5D4037' }} />
                             <span>Haut</span>
                          </div>
                       </div>
                       
                       <div className="heatmap-grid">
                          <div />
                          {Array.from({ length: 24 }).map((_, i) => (
                             <div key={i} className="heatmap-col-label">{i}h</div>
                          ))}
                          
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, dIdx) => (
                             <React.Fragment key={day}>
                                <div className="heatmap-row-label">{day}</div>
                                {peakHoursData.matrix[dIdx].map((val, hIdx) => (
                                   <div 
                                      key={hIdx} 
                                      className={`heatmap-cell ${getIntensityClass(val, peakHoursData.maxVal)}`}
                                      title={`${day} ${hIdx}h: ${val} ventes`}
                                   />
                                ))}
                             </React.Fragment>
                          ))}
                       </div>
                    </div>

                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                       <div className="metric-card" style={{ flex: 1, minWidth: 300 }}>
                          <h3 style={{ margin: '0 0 20px', fontWeight: 900 }}>Top Catégories</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                             {salesByCategory.length > 0 ? salesByCategory.map((cat, idx) => (
                               <div key={cat.name}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
                                     <span>{cat.name}</span>
                                     <span>{cat.val.toFixed(0)}%</span>
                                  </div>
                                  <div style={{ height: 8, background: 'var(--pos-input-bg)', borderRadius: 4, overflow: 'hidden' }}>
                                     <div style={{ height: '100%', width: `${cat.val}%`, background: idx === 0 ? '#5D4037' : idx === 1 ? '#BC6C25' : '#8B5E3C' }} />
                                  </div>
                               </div>
                             )) : (
                               <p style={{ fontSize: 12, color: 'var(--pos-text-muted)' }}>Aucune donnée de vente</p>
                             )}
                          </div>
                       </div>
                       
                       <div className="metric-card" style={{ flex: 1, background: 'var(--pos-primary)', color: '#fff', minWidth: 300 }}>
                          <div style={{ fontSize: 14, opacity: 0.8, fontWeight: 700 }}>OBJECTIF JOURNALIER (VOTRE SESSION)</div>
                          <div style={{ fontSize: 24, fontWeight: 900 }}>
                             {(sessionSales.filter(s => String(s.cashierId || s.baristaId) === String(cashierId)).reduce((acc, s) => acc + Number(s.total), 0)).toFixed(3)} / {activeDailyTarget.toFixed(3)} DT
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                             <div style={{ 
                               height: '100%', 
                               width: `${Math.min(100, Math.floor(((sessionSales.filter(s => String(s.cashierId || s.baristaId) === String(cashierId)).reduce((acc, s) => acc + Number(s.total), 0)) / activeDailyTarget) * 100))}%`, 
                               background: '#fff' 
                             }} />
                          </div>
                          <p style={{ margin: '12px 0 0', fontSize: 11, fontWeight: 600 }}>
                             Vous êtes à {Math.min(100, Math.floor(((sessionSales.filter(s => String(s.cashierId || s.baristaId) === String(cashierId)).reduce((acc, s) => acc + Number(s.total), 0)) / activeDailyTarget) * 100))}% de votre objectif personnel !
                          </p>
                       </div>
                    </div>
                </div>
             </div>
          </div>
        ) : view === 'TABLES' ? (
          <main className="pos-main-content-scroll" style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
             <div className="tables-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
                <div>
                   <h1 style={{ color: 'var(--pos-text-main)', fontSize: 32, fontWeight: 900, margin: 0 }}>Plan de Salle</h1>
                   <p style={{ color: 'var(--pos-text-muted)', margin: 0 }}>Sélectionnez une table pour commencer le service</p>
                </div>
                <button className="btn-premium btn-premium-primary vente-directe-btn" style={{ padding: '20px 40px', fontSize: 18 }} onClick={() => { setSelectedTable({ id: 'DIRECT', label: 'Vente Directe' }); setView('POS'); }}>
                   <ShoppingBag size={24} /> VENTE DIRECTE
                </button>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                 {initialTables.map((t: any) => {
                   const tableCart = tableOrders[t.id] || [];
                   const hasOrder = tableCart.length > 0;
                   const tableTotal = tableCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

                   return (
                     <div key={t.id} className={`customer-selector ${hasOrder ? 'has-active-order' : ''}`} 
                       style={{ 
                         height: 180, 
                         flexDirection: 'column', 
                         background: hasOrder ? 'var(--pos-accent)' : 'var(--pos-input-bg)', 
                         borderColor: hasOrder ? 'var(--pos-primary)' : 'var(--pos-border)', 
                         borderWidth: hasOrder ? 2 : 1,
                         justifyContent: 'center', 
                         gap: 12, 
                         cursor: 'pointer',
                         position: 'relative',
                         boxShadow: hasOrder ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : 'none'
                       }}
                       onClick={() => { setSelectedTable(t); setView('POS'); }}>
                        
                        {hasOrder && (
                          <div style={{ 
                            position: 'absolute', top: 12, right: 12, 
                            background: 'var(--pos-primary)', color: '#fff', 
                            padding: '4px 10px', borderRadius: 10, 
                            fontSize: 12, fontWeight: 900,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                          }}>
                             {tableTotal.toFixed(3)} DT
                          </div>
                        )}

                        <div style={{ 
                          width: 70, height: 70, borderRadius: '50%', 
                          background: hasOrder ? 'var(--pos-primary)' : 'var(--pos-border)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.3s'
                        }}>
                           <Users size={32} color={hasOrder ? '#fff' : 'var(--pos-text-muted)'} />
                        </div>
                        <div style={{ color: 'var(--pos-text-main)', fontWeight: 900, fontSize: 22 }}>{t.label}</div>
                        <div style={{ color: 'var(--pos-text-muted)', fontSize: 13, fontWeight: 700 }}>
                           {hasOrder ? `${tableCart.length} articles` : `Table ${t.capacity} pers.`}
                        </div>
                     </div>
                   );
                 })}
                {initialTables.length === 0 && (
                   <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: 'var(--pos-text-muted)' }}>
                      <AlertCircle size={64} style={{ margin: '0 auto 20px' }} />
                      <h2 style={{ fontWeight: 900 }}>Aucune table configurée</h2>
                      <p>Utilisez le bouton "Vente Directe" pour continuer.</p>
                   </div>
                )}
             </div>
          </main>
        ) : view === 'POS' ? (
        <>
          <header className="pos-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--pos-text-main)' }} onClick={() => setView('TABLES')} title="Retour au plan de salle">
                 <ArrowLeft size={24} />
              </button>
              <div>
                 <h1 style={{ fontWeight: 900, margin: 0, color: 'var(--pos-text-main)', fontSize: 22 }}>
                   {selectedTable?.label || 'Vente Directe'}
                 </h1>
              </div>
              
              <div className="pos-search-wrapper" style={{ position: 'relative', marginLeft: 20 }}>
                <Search size={18} className="pos-search-icon" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--pos-text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Produit..." 
                  className="category-pill pos-search-input" 
                  style={{ width: 300, paddingLeft: 44, borderRadius: 14, background: 'var(--pos-input-bg)', color: 'var(--pos-text-main)', border: 'none', height: 48, fontWeight: 600 }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Mobile Cart Toggle */}
              <button 
                className="btn-premium btn-premium-primary mobile-cart-toggle" 
                onClick={() => setIsCartOpenMobile(true)}
                style={{ display: 'none', padding: '0 16px', height: 48, borderRadius: 14, position: 'relative' }}
              >
                 <ShoppingCart size={20} />
                 {currentCart.length > 0 && <span className="cart-badge-dot">{currentCart.length}</span>}
              </button>



              {/* Customer & Loyalty Selector (Moved to Header for Space) */}
              <div style={{ minWidth: 260, position: 'relative', marginLeft: 16 }}>
                {!selectedCustomer ? (
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="customer-selector" 
                      style={{ width: '100%', borderStyle: 'solid', height: 44, borderRadius: 12, paddingLeft: 14, fontSize: 13, fontWeight: 700 }}
                      placeholder="🔍 Lier client loyal..."
                      value={customerSearch}
                      onChange={e => handleCustomerSearch(e.target.value)}
                    />
                    {customerResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--pos-card-bg)', border: '1px solid var(--pos-border)', borderRadius: 12, zIndex: 200, marginTop: 6, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                        {customerResults.map(c => (
                          <div key={c.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--pos-border)' }} 
                            onClick={() => { setSelectedCustomer(c); setCustomerResults([]); setCustomerSearch(''); }}>
                            <div style={{ fontWeight: 800, fontSize: 13 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--pos-text-muted)' }}>{c.phone} • {c.loyaltyPoints} pts</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="customer-selector" style={{ borderColor: 'var(--pos-primary)', background: '#EEF2FF', height: 44, borderRadius: 12, padding: '0 12px' }}>
                     <div className="customer-avatar" style={{ background: 'var(--pos-primary)', width: 26, height: 26, fontSize: 11 }}>{selectedCustomer.name.charAt(0)}</div>
                     <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCustomer.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--pos-primary)', fontWeight: 800 }}>{selectedCustomer.loyaltyPoints} PTS</div>
                     </div>
                     <X size={16} onClick={() => { setSelectedCustomer(null); setIsRedeemingPoints(false); }} style={{ color: 'var(--pos-text-muted)', cursor: 'pointer' }} />
                  </div>
                )}
              </div>

              {/* Cashier & Terminal Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
                 {cashierName && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--pos-input-bg)', padding: '8px 16px', borderRadius: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--pos-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                        {cashierName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text-muted)', lineHeight: 1, marginBottom: 2 }}>SERVEUR</div>
                        <div style={{ fontWeight: 700, color: 'var(--pos-text-main)', fontSize: 14 }}>{cashierName}</div>
                      </div>
                   </div>
                 )}
                 {selectedTerminalId && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--pos-input-bg)', padding: '8px 16px', borderRadius: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pos-text-muted)' }}>
                        <Store size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text-muted)', lineHeight: 1, marginBottom: 2 }}>CAISSE</div>
                        <div style={{ fontWeight: 700, color: 'var(--pos-text-main)', fontSize: 14 }}>
                          {terminals.find(t => t.id === selectedTerminalId)?.name || 'Terminal'}
                        </div>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </header>

          <div className="pos-product-grid">
            {filteredProducts.map(product => {
               const minQty = (product as any).minOrderQty || 1;
               return (
                <div key={product.id} className="product-card" onClick={() => addToCart(product)} style={{ position: 'relative' }}>
                   {minQty > 1 && (
                     <div className="product-min-badge" style={{ fontSize: 9, padding: '2px 6px' }}>
                        <Package size={10} /> min. {minQty}
                     </div>
                   )}
                   <div className="product-image-container">
                     {product.image ? (
                       <img src={product.image} className="product-image" alt={product.name} />
                     ) : (
                       <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', background: 'linear-gradient(135deg, var(--pos-bg) 0%, var(--pos-input-bg) 100%)' }}>
                         <Cake size={36} strokeWidth={1} />
                       </div>
                     )}
                   </div>
                   <div className="product-info">
                     <span className="product-name" style={{ height: 32, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</span>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <span className="product-price">{product.price.toFixed(3)} DT</span>
                        <div className="btn-premium btn-premium-primary" style={{ width: 26, height: 26, padding: 0, borderRadius: 8 }}>
                           <Plus size={14} />
                        </div>
                     </div>
                   </div>
                </div>
               );
            })}
          </div>
        </>
        ) : view === 'CUSTOMERS' ? (
          <div style={{ flex: 1, padding: 40, background: 'var(--pos-bg)', overflowY: 'auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 style={{ fontWeight: 900, fontSize: 32, margin: 0, color: 'var(--pos-text-main)' }}>Gestion Clientèle & Fidélité</h2>
                <button className="btn-premium btn-premium-primary" onClick={() => setView('POS')}>Retour au POS</button>
             </div>

             <div className="customers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
                {/* Customer List Section */}
                <div style={{ background: '#fff', borderRadius: 24, border: '1px solid var(--pos-border)', padding: 24 }}>
                   <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                      <input 
                        type="text" 
                        placeholder="Rechercher un client..." 
                        className="customer-selector" 
                        style={{ flex: 1, borderStyle: 'solid' }}
                        value={customerSearch}
                        onChange={e => handleCustomerSearch(e.target.value)}
                      />
                      <button className="btn-premium btn-premium-success" onClick={() => setIsAddCustomerModalOpen(true)}>+ Client</button>
                   </div>

                   <div className="mobile-table-view">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }} className="desktop-only-table">
                         <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--pos-bg)' }}>
                               <th style={{ padding: '12px 16px' }}>Client</th>
                               <th style={{ padding: '12px 16px' }}>Points</th>
                               <th style={{ padding: '12px 16px' }}>Dernière Visite</th>
                               <th style={{ padding: '12px 16px' }}>Actions</th>
                            </tr>
                         </thead>
                         <tbody>
                            {customerResults.length > 0 ? customerResults.map((c: any) => (
                              <tr key={c.id} style={{ borderBottom: '1px solid var(--pos-bg)' }}>
                                 <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--pos-text-main)' }}>{c.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--pos-text-muted)' }}>{c.phone}</div>
                                 </td>
                                 <td style={{ padding: '16px' }}>
                                    <div style={{ background: 'var(--pos-bg)', padding: '4px 12px', borderRadius: 8, display: 'inline-block', fontWeight: 900, color: 'var(--pos-primary)' }}>
                                       {c.loyaltyPoints} pts
                                    </div>
                                 </td>
                                 <td style={{ padding: '16px', color: 'var(--pos-text-muted)', fontSize: 13 }}>{new Date().toLocaleDateString()}</td>
                                 <td style={{ padding: '16px' }}>
                                    <button style={{ color: 'var(--pos-primary)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }} onClick={() => alert(`Ajuster points de ${c.name}`)}>Ajuster</button>
                                 </td>
                              </tr>
                            )) : (
                              <tr>
                                 <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--pos-text-muted)' }}>Utilisez la recherche pour trouver un client</td>
                              </tr>
                            )}
                         </tbody>
                      </table>
                      
                      <div className="mobile-only-cards" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
                         {customerResults.map((c: any) => (
                           <div key={c.id} style={{ padding: 16, background: 'var(--pos-bg)', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                 <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</div>
                                 <div style={{ fontSize: 12, color: 'var(--pos-text-muted)' }}>{c.phone}</div>
                                 <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--pos-primary)' }}>{c.loyaltyPoints} PTS</div>
                              </div>
                              <button className="btn-premium" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => alert(`Ajuster points de ${c.name}`)}>Gérer</button>
                           </div>
                         ))}
                         {customerResults.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--pos-text-muted)' }}>Utilisez la recherche.</div>}
                      </div>
                   </div>
                </div>

                {/* Loyalty Program Settings Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ background: 'var(--pos-card-bg)', borderRadius: 24, padding: 24, border: '1px solid var(--pos-border)' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 900, color: 'var(--pos-text-main)' }}>Programme Fidélité</h3>
                      <p style={{ fontSize: 13, color: 'var(--pos-text-muted)', marginBottom: 24 }}>Paramétrez comment vos clients gagnent et dépensent leurs points.</p>
                      
                      <div style={{ marginBottom: 20 }}>
                         <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 8, opacity: 0.6 }}>TAUX DE GAIN</label>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="number" defaultValue={loyaltyEarnRate} style={{ width: 60, padding: 10, borderRadius: 10, border: '1px solid var(--pos-border)', background: 'var(--pos-input-bg)', color: 'var(--pos-text-main)', fontWeight: 900 }} />
                            <span style={{ fontSize: 13, color: 'var(--pos-text-main)', fontWeight: 600 }}>pts / 1 DT dépensé</span>
                         </div>
                      </div>

                      <div style={{ marginBottom: 24 }}>
                         <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 8, opacity: 0.6 }}>VALEUR DU POINT</label>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="number" defaultValue={loyaltyRedeemRate} style={{ width: 60, padding: 10, borderRadius: 10, border: '1px solid var(--pos-border)', background: 'var(--pos-input-bg)', color: 'var(--pos-text-main)', fontWeight: 900 }} />
                            <span style={{ fontSize: 13, color: 'var(--pos-text-main)', fontWeight: 600 }}>pts = 1 DT remise</span>
                         </div>
                      </div>

                      <button className="btn-premium btn-premium-primary" style={{ width: '100%' }} onClick={() => alert("Réglages sauvegardés")}>Sauvegarder</button>
                   </div>
                   
                   <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid var(--pos-border)' }}>
                      <h3 style={{ margin: '0 0 12px', fontWeight: 900 }}>Statistiques</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                         <span style={{ color: 'var(--pos-text-muted)' }}>Clients actifs</span>
                         <span style={{ fontWeight: 800 }}>{customerResults.length || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                         <span style={{ color: 'var(--pos-text-muted)' }}>Points en circulation</span>
                         <span style={{ fontWeight: 800 }}>12,450 pts</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="orders-container" style={{ flex: 1, padding: 40, background: 'var(--pos-bg)', display: 'flex', gap: 32, overflow: 'hidden' }}>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                   <div>
                      <h2 style={{ fontWeight: 900, fontSize: 32, margin: 0, color: 'var(--pos-text-main)' }}>Historique des Ventes</h2>
                      <p style={{ margin: '4px 0 0', color: 'var(--pos-text-muted)', fontSize: 14 }}>Consultez et gérez les transactions récentes</p>
                   </div>
                   <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn-premium btn-premium-primary" onClick={() => fetchOrders()}>Rafraîchir</button>
                      <button className="btn-premium" style={{ background: '#fff', border: '1px solid var(--pos-border)' }} onClick={() => setView('POS')}>Nouvelle Vente</button>
                   </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid var(--pos-border)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                   <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                         <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--pos-text-muted)' }} size={18} />
                         <input 
                           type="text" 
                           placeholder="Rechercher par ID ou Client..." 
                           className="customer-selector" 
                           style={{ width: '100%', paddingLeft: 48, borderStyle: 'solid' }}
                           value={orderSearch}
                           onChange={e => setOrderSearch(e.target.value)}
                         />
                      </div>
                      <select 
                        className="customer-selector" 
                        style={{ width: 180, borderStyle: 'solid' }}
                        value={orderFilter}
                        onChange={(e: any) => setOrderFilter(e.target.value)}
                      >
                         <option value="ALL">Tous les statuts</option>
                         <option value="MINE">Mes ventes uniquement</option>
                         <option value="PAID">Payés uniquement</option>
                         <option value="VOID">Annulés uniquement</option>
                      </select>
                   </div>

                   <div className="orders-table-scroll">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                         <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--pos-bg)' }}>
                               <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--pos-text-muted)' }}>ID COMMANDE</th>
                               <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--pos-text-muted)' }}>CLIENT / TABLE</th>
                               <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--pos-text-muted)' }}>TOTAL</th>
                               <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--pos-text-muted)' }}>DATE</th>
                               <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--pos-text-muted)' }}>STATUT</th>
                            </tr>
                         </thead>
                         <tbody>
                            {orders.filter(o => {
                              if (orderFilter === 'MINE') return String(o.baristaId) === String(cashierId); if (orderFilter === 'PAID') return !o.isVoid;
                              if (orderFilter === 'VOID') return o.isVoid;
                              return true;
                            }).filter(o => {
                               const term = orderSearch.toLowerCase();
                               return o.id.toLowerCase().includes(term) || (o.customer?.name || '').toLowerCase().includes(term);
                            }).map((o: any) => (
                              <tr 
                                key={o.id} 
                                onClick={() => setSelectedOrder(o)}
                                style={{ 
                                  borderBottom: '1px solid var(--pos-bg)', 
                                  cursor: 'pointer', 
                                  background: selectedOrder?.id === o.id ? 'var(--pos-bg)' : 'transparent'
                                }}
                                className="order-row-hover"
                              >
                                 <td style={{ padding: '16px', fontWeight: 800, fontSize: 13 }}>#{o.id.slice(-6).toUpperCase()}</td>
                                 <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: 700 }}>{o.customer?.name || 'Passager'}</div>
                                    <div style={{ fontSize: 11, color: 'var(--pos-text-muted)' }}>{o.tableName || 'Vente directe'}</div>
                                 </td>
                                 <td style={{ padding: '16px', fontWeight: 900, color: 'var(--pos-primary)' }}>{o.total.toFixed(3)} DT</td>
                                 <td style={{ padding: '16px', fontSize: 11, color: 'var(--pos-text-muted)', lineHeight: '1.4' }}>
                                    <div>{new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                                    <div style={{ fontWeight: 700, color: 'var(--pos-text-main)' }}>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                 </td>
                                 <td style={{ padding: '16px' }}>
                                    <span className={o.isVoid ? 'badge-void' : 'badge-paid'}>
                                       {o.isVoid ? 'Annulé' : 'Payé'}
                                    </span>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>

             {/* Order Details Panel */}
             {selectedOrder && (
               <div className="order-details-sidebar" style={{ borderRadius: 24, border: '1px solid var(--pos-border)', overflow: 'hidden' }}>
                  <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--pos-border)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontWeight: 900 }}>Détails Commande</h3>
                        <X size={24} style={{ cursor: 'pointer', color: 'var(--pos-text-muted)' }} onClick={() => setSelectedOrder(null)} />
                     </div>
                     <div style={{ background: 'var(--pos-bg)', padding: 16, borderRadius: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                           <span style={{ fontSize: 12, color: 'var(--pos-text-muted)' }}>#ID</span>
                           <span style={{ fontSize: 12, fontWeight: 800 }}>{selectedOrder.id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ fontSize: 12, color: 'var(--pos-text-muted)' }}>Serveur</span>
                           <span style={{ fontSize: 12, fontWeight: 800 }}>{selectedOrder.takenBy?.name || 'Système'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="order-items-list">
                     <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)', textTransform: 'uppercase' }}>Articles</label>
                     {selectedOrder.items.map((item: any) => (
                       <div key={item.id} className="order-item-row">
                          <div>
                             <div className="order-item-name">{item.product.name}</div>
                             <div style={{ fontSize: 12, color: 'var(--pos-text-muted)' }}>{item.quantity} x {Number(item.price).toFixed(3)}</div>
                          </div>
                          <div style={{ fontWeight: 800 }}>{(item.quantity * Number(item.price)).toFixed(3)} DT</div>
                       </div>
                     ))}

                     <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px dashed var(--pos-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                           <span style={{ color: 'var(--pos-text-muted)', fontSize: 14 }}>Sous-total</span>
                           <span style={{ fontWeight: 700 }}>{selectedOrder.subtotal.toFixed(3)} DT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                           <span style={{ fontWeight: 900, fontSize: 18 }}>Total TTC</span>
                           <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--pos-primary)' }}>{selectedOrder.total.toFixed(3)} DT</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                           <button className="btn-premium" style={{ flex: 1, background: '#fff', border: '1px solid var(--pos-border)' }} onClick={() => printTicket(selectedOrder, selectedOrder.items)}>Imprimer</button>
                           {!selectedOrder.isVoid && (
                             <button className="btn-premium btn-premium-secondary" style={{ flex: 1, backgroundColor: 'var(--pos-danger)', color: '#fff' }} onClick={() => handleVoidOrder(selectedOrder.id)}>Annuler</button>
                           )}
                        </div>
                     </div>
                   </div>
                </div>
              )}
           </div>
        )}
      </div>

      {/* Cart Sidebar (Stay functional always during POS) */}
      {view === 'POS' && (
      <aside className={`pos-cart-sidebar ${isCartOpenMobile ? 'mobile-open' : ''}`}>
        <div className="cart-header" style={{ padding: '16px 20px 8px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <div style={{ padding: 8, background: 'var(--pos-bg)', borderRadius: 10 }}>
                    <Receipt size={18} color="var(--pos-primary)" />
                 </div>
                 <h2 style={{ margin: 0, fontWeight: 900, fontSize: 18 }}>Panier</h2>
                 <span style={{ background: '#EEF2FF', color: 'var(--pos-primary)', padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                   {currentCart.reduce((acc, item) => acc + item.quantity, 0)} arts
                 </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--pos-text-muted)', cursor: 'pointer' }} className="mobile-only-btn" onClick={() => setIsCartOpenMobile(false)}><X size={24} /></button>
                <button style={{ background: 'none', border: 'none', color: 'var(--pos-danger)', cursor: 'pointer' }} onClick={clearCart} title="Vider panier"><Trash2 size={18} /></button>
              </div>
           </div>
        </div>

        <div className="cart-items">
          {currentCart.map(item => {
            const netUnitPrice = getItemNetPrice(item);
            const lineTotal = getItemLineTotal(item);
            const hasDiscount = (item.discountPercent && item.discountPercent > 0) || (item.discountAmount && item.discountAmount > 0);
            const isDiscountOpen = activeDiscountItemId === item.id;

            return (
              <div key={item.id} style={{
                background: 'var(--pos-card-bg)',
                border: '1px solid var(--pos-border)',
                borderRadius: 16,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease'
              }}>
                {/* Line Header: Product Name + Strikethrough Price + Trash */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--pos-text-main)', lineHeight: 1.2 }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {hasDiscount ? (
                        <>
                          <span style={{ textDecoration: 'line-through', fontSize: 12, color: 'var(--pos-text-muted)', fontWeight: 600 }}>
                            {item.price.toFixed(3)} DT
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--pos-primary)' }}>
                            {netUnitPrice.toFixed(3)} DT
                          </span>
                          <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 6 }}>
                            {item.discountPercent ? `-${item.discountPercent}%` : `-${item.discountAmount?.toFixed(3)} DT`}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pos-text-muted)' }}>
                          {item.price.toFixed(3)} DT / un.
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => updateQty(item.id, -item.quantity)}
                    title="Supprimer l'article"
                    style={{ background: 'none', border: 'none', color: 'var(--pos-text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Controls & Subtotal Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Quantity Controls + Remise Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="cart-controls" style={{ padding: '4px 6px', borderRadius: 10 }}>
                      <button className="cart-qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={13} /></button>
                      <span style={{ fontWeight: 800, width: 22, textAlign: 'center', fontSize: 14 }}>{item.quantity}</span>
                      <button className="cart-qty-btn" onClick={() => addToCart(item)}><Plus size={13} /></button>
                    </div>

                    {/* Discount Trigger Button */}
                    <button
                      onClick={() => setActiveDiscountItemId(isDiscountOpen ? null : item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: `1px solid ${hasDiscount ? '#F59E0B' : 'var(--pos-border)'}`,
                        background: hasDiscount ? '#FEF3C7' : 'var(--pos-bg)',
                        color: hasDiscount ? '#92400E' : 'var(--pos-text-muted)',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}>
                      <Tag size={12} />
                      <span>{hasDiscount ? 'Remisé' : '% Remise'}</span>
                    </button>
                  </div>

                  {/* Line Subtotal */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--pos-text-main)' }}>
                      {lineTotal.toFixed(3)} DT
                    </div>
                  </div>
                </div>

                {/* Line Discount Selector Panel */}
                {isDiscountOpen && (
                  <div style={{
                    background: '#F8FAFC',
                    border: '1.5px solid var(--pos-primary)',
                    borderRadius: 12,
                    padding: 10,
                    marginTop: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(99,102,241,0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)', textTransform: 'uppercase' }}>
                        Remise sur {item.name}
                      </span>
                      <X size={14} style={{ cursor: 'pointer', color: 'var(--pos-text-muted)' }} onClick={() => setActiveDiscountItemId(null)} />
                    </div>

                    {/* Quick % Chips */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                      {[5, 10, 15, 20, 50].map(pct => (
                        <button
                          key={pct}
                          onClick={() => {
                            updateLineDiscount(item.id, pct, undefined);
                            setActiveDiscountItemId(null);
                          }}
                          style={{
                            padding: '6px 0',
                            border: `1px solid ${item.discountPercent === pct ? 'var(--pos-primary)' : 'var(--pos-border)'}`,
                            borderRadius: 8,
                            background: item.discountPercent === pct ? 'var(--pos-primary)' : '#fff',
                            color: item.discountPercent === pct ? '#fff' : 'var(--pos-text-main)',
                            fontWeight: 800,
                            fontSize: 11,
                            cursor: 'pointer'
                          }}>
                          -{pct}%
                        </button>
                      ))}
                    </div>

                    {/* Custom Discount input row */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Ex: 10 (%) ou 0.5 (DT)"
                        step="0.001"
                        min="0"
                        style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--pos-border)', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#fff', outline: 'none' }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val) && val > 0) {
                              if (val <= 100) {
                                updateLineDiscount(item.id, val, undefined);
                              } else {
                                updateLineDiscount(item.id, undefined, val);
                              }
                              setActiveDiscountItemId(null);
                            }
                          }
                        }}
                      />
                      {hasDiscount && (
                        <button
                          onClick={() => {
                            updateLineDiscount(item.id, undefined, undefined);
                            setActiveDiscountItemId(null);
                          }}
                          style={{ padding: '6px 10px', background: '#FEF2F2', color: 'var(--pos-danger)', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {currentCart.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2, marginTop: 100 }}>
              <ShoppingCart size={80} strokeWidth={1} />
              <p style={{ fontWeight: 900, fontSize: 18 }}>Panier Vide</p>
            </div>
          )}
        </div>

        {/* Cross-Selling / Upselling Section */}
        {suggestedProducts.length > 0 && (
          <div style={{ padding: '0 24px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={14} fill="#F59E0B" /> Suggestion pour ce client
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {suggestedProducts.map(p => (
                <div key={p.id} onClick={() => addToCart(p)} style={{ flex: '0 0 auto', width: '140px', background: 'var(--pos-bg)', border: '1px solid var(--pos-border)', borderRadius: 12, padding: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.2s' }} className="hover:border-indigo-400 hover:shadow-md">
                   <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-primary)' }}>+{p.price.toFixed(3)} DT</div>
                     <div style={{ background: '#EEF2FF', padding: 4, borderRadius: 6, color: 'var(--pos-primary)' }}><Plus size={14} /></div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="cart-totals">
           {selectedCustomer && (
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: 14, borderRadius: 14, marginBottom: 12, border: '1px solid var(--pos-primary)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: 'var(--pos-accent)', padding: 6, borderRadius: 8 }}>
                    <Wallet size={16} color="#fff" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800 }}>Utiliser Fidélité</span>
                </div>
                <label className="switch">
                   <input type="checkbox" checked={isRedeemingPoints} onChange={e => setIsRedeemingPoints(e.target.checked)} />
                   <span className="slider round"></span>
                </label>
             </div>
           )}

           <div className="total-row"><span>Sous-total brut</span><span style={{ fontWeight: 800 }}>{subtotalBrut.toFixed(3)} DT</span></div>
           {totalLineDiscounts > 0 && (
             <div className="total-row" style={{ color: 'var(--pos-success)' }}>
               <span>Remises articles</span>
               <span style={{ fontWeight: 800 }}>-{totalLineDiscounts.toFixed(3)} DT</span>
             </div>
           )}
           {discountFromPoints > 0 && (
             <div className="total-row" style={{ color: 'var(--pos-success)' }}>
               <span>Remise Points</span>
               <span style={{ fontWeight: 800 }}>-{discountFromPoints.toFixed(3)} DT</span>
             </div>
           )}
           <div className="total-row grand-total" style={{ borderTop: '2px solid var(--pos-border)', paddingTop: 10 }}><span>Total NET</span><span>{total.toFixed(3)} DT</span></div>

           {/* Pro Touchscreen Grand Total Banner */}
           <div className="grand-total-banner">
             Grand Total : {total.toFixed(3)} DT
           </div>

           {/* Pro Touchscreen Bottom Action Buttons */}
           <div className="bottom-touch-actions">
             <button className="pos-top-tab-btn tab-blue" style={{ height: 48, justifyContent: 'center' }} title="Calculatrice / Pavé" onClick={() => setIsPaymentModalOpen(true)}>
               <Calculator size={20} />
             </button>
             <button className="pos-top-tab-btn tab-dark" style={{ height: 48, justifyContent: 'center', background: '#EF4444' }} title="Vider le panier" onClick={clearCart}>
               <Trash2 size={20} />
             </button>
             <button className="pos-top-tab-btn tab-green" style={{ height: 48, justifyContent: 'center', fontSize: 13 }} onClick={() => setIsPaymentModalOpen(true)}>
               ⚡ Encaisser
             </button>
             <button className="pos-top-tab-btn tab-orange" style={{ height: 48, justifyContent: 'center', fontSize: 14 }} disabled={currentCart.length === 0} onClick={() => setIsPaymentModalOpen(true)}>
               <CheckCircle size={18} /> Valider
             </button>
           </div>
        </div>
      </aside>
      )}

      </div> {/* closes pos-main-wrapper */}
      </div> {/* closes pos-main-content */}

      {/* Floating Mobile Cart Bar */}
      {view === 'POS' && currentCart.length > 0 && (
        <div 
          className="mobile-floating-cart-bar" 
          onClick={() => setIsCartOpenMobile(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={18} />
            <span>Panier ({currentCart.reduce((sum, i) => sum + i.quantity, 0)} art.)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{total.toFixed(3)} DT</span>
            <span>➔</span>
          </div>
        </div>
      )}

      {/* Payment Modal (Redesigned UX) */}
      {isPaymentModalOpen && (() => {
        // Computed helpers
        const mixedTotal = (parseFloat(mixedCash)||0) + (parseFloat(mixedCard)||0) + (parseFloat(mixedVoucher)||0);
        const mixedRemaining = Math.max(0, total - mixedTotal);
        const mixedChange = Math.max(0, mixedTotal - total);
        const mixedValid = paymentMethod !== 'MIXED' || Math.abs(mixedTotal - total) < 0.001 || mixedTotal > total;
        const cashChange = paymentMethod === 'CASH' ? Math.max(0, (parseFloat(amountReceived)||0) - total) : 0;
        const canValidate = paymentMethod === 'MIXED' ? mixedTotal >= total - 0.001 : true;

        return (
        <div className="pos-modal-overlay">
           <div className="pos-modal-card" style={{ maxWidth: 900, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                 <div>
                   <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--pos-text-main)', fontSize: 22 }}>Encaissement</h2>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pos-text-muted)', marginTop: 4 }}>
                      <span style={{ fontWeight: 700 }}>{selectedTable?.label || 'Vente Directe'}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 900, color: 'var(--pos-primary)', fontSize: 18 }}>{total.toFixed(3)} DT</span>
                      {isTrainingMode && <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>🎓 FORMATION</span>}
                   </div>
                 </div>
                 <X size={26} onClick={() => setIsPaymentModalOpen(false)} style={{ cursor: 'pointer', color: 'var(--pos-text-muted)' }} />
              </div>

              {/* Payment Method Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
                 {[{id:'CASH', emoji:'💵', label:'ESPÈCES'},{id:'CARD', emoji:'💳', label:'CARTE'},{id:'MEAL_VOUCHER', emoji:'🎟️', label:'PLUXEE / TICKET'},{id:'MIXED', emoji:'🔀', label:'MIXTE'}].map(m => (
                   <button key={m.id}
                     onClick={() => { setPaymentMethod(m.id as any); setAmountReceived(''); setMixedCash(''); setMixedCard(''); setMixedVoucher(''); setCardRef(''); setVoucherRef(''); }}
                     style={{ padding: '12px 8px', border: `2px solid ${paymentMethod === m.id ? 'var(--pos-primary)' : 'var(--pos-border)'}`, borderRadius: 16, background: paymentMethod === m.id ? 'var(--pos-primary)' : 'var(--pos-bg)', color: paymentMethod === m.id ? '#fff' : 'var(--pos-text-main)', fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                     <span style={{ fontSize: 22 }}>{m.emoji}</span>
                     <span>{m.label}</span>
                   </button>
                 ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
                {/* Left: Keypad + specific fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* MIXTE: split fields with tab selector */}
                  {paymentMethod === 'MIXED' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saisir les montants par mode :</div>
                      {[
                        { key: 'cash' as const, label: '💵 Espèces', val: mixedCash },
                        { key: 'card' as const, label: '💳 Carte', val: mixedCard },
                        { key: 'voucher' as const, label: '🎟️ Ticket/Pluxee', val: mixedVoucher },
                      ].map(f => (
                        <div key={f.key}
                          onClick={() => setMixedTarget(f.key)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', border: `2px solid ${mixedTarget === f.key ? 'var(--pos-primary)' : 'var(--pos-border)'}`, borderRadius: 14, cursor: 'pointer', background: mixedTarget === f.key ? '#EEF2FF' : 'var(--pos-bg)', transition: 'all 0.15s' }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{f.label}</span>
                          <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--pos-primary)', minWidth: 80, textAlign: 'right' }}>{f.val ? parseFloat(f.val).toFixed(3) : '0.000'} DT</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CARD: reference number */}
                  {paymentMethod === 'CARD' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>N° Autorisation / Transaction (optionnel)</label>
                      <input type="text" value={cardRef} onChange={e => setCardRef(e.target.value)}
                        placeholder="Ex: TXN-20240823-001"
                        style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--pos-border)', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'var(--pos-bg)', color: 'var(--pos-text-main)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  )}

                  {/* MEAL_VOUCHER: scan / manual entry of tickets */}
                  {paymentMethod === 'MEAL_VOUCHER' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Ticket type selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type de ticket</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          {['Pluxee (Sodexo)', 'Ticket Restaurant', 'Chèque Déjeuner', 'Carte Edenred'].map(t => (
                            <button key={t}
                              onClick={() => setTicketType(prev => prev === t ? '' : t)}
                              style={{ padding: '7px 8px', border: `2px solid ${ticketType === t ? 'var(--pos-primary)' : 'var(--pos-border)'}`, borderRadius: 10, background: ticketType === t ? '#EEF2FF' : 'var(--pos-bg)', color: ticketType === t ? 'var(--pos-primary)' : 'var(--pos-text-main)', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Unit value per ticket */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valeur / ticket :</label>
                        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                          {['5.000', '7.500', '8.000', '10.000'].map(v => (
                            <button key={v} onClick={() => setTicketUnitValue(v)}
                              style={{ flex: 1, padding: '6px 0', border: `2px solid ${ticketUnitValue === v ? 'var(--pos-primary)' : 'var(--pos-border)'}`, borderRadius: 8, background: ticketUnitValue === v ? '#EEF2FF' : 'var(--pos-bg)', color: ticketUnitValue === v ? 'var(--pos-primary)' : 'var(--pos-text-main)', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                              {v} DT
                            </button>
                          ))}
                        </div>
                        <input
                          type="number" step="0.001" min="0"
                          value={ticketUnitValue}
                          onChange={e => setTicketUnitValue(e.target.value)}
                          style={{ width: 72, padding: '6px 8px', border: '2px solid var(--pos-border)', borderRadius: 8, fontSize: 13, fontWeight: 800, color: 'var(--pos-primary)', outline: 'none', textAlign: 'center' }}
                        />
                      </div>

                      {/* Scan input */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scanner ou saisir N° ticket → Entrée</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            id="ticket-scan-input"
                            type="text"
                            autoFocus
                            value={scanInput}
                            onChange={e => setScanInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && scanInput.trim()) {
                                const ref = scanInput.trim().toUpperCase();
                                setScannedTickets(prev => [...prev, ref]);
                                setScanInput('');
                              }
                            }}
                            placeholder="Ex: 1234-5678-ABCD"
                            style={{ flex: 1, padding: '10px 14px', border: '2px solid var(--pos-primary)', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'var(--pos-bg)', color: 'var(--pos-text-main)', outline: 'none' }}
                          />
                          <button
                            onClick={() => {
                              if (scanInput.trim()) {
                                setScannedTickets(prev => [...prev, scanInput.trim().toUpperCase()]);
                                setScanInput('');
                              }
                            }}
                            style={{ padding: '0 14px', background: 'var(--pos-primary)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                            + Ajouter
                          </button>
                        </div>
                      </div>

                      {/* Scanned ticket list */}
                      {scannedTickets.length > 0 && (
                        <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {scannedTickets.map((ref, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: '#065F46', fontFamily: 'monospace' }}>🎟️ #{idx + 1} — {ref}</span>
                              <button onClick={() => setScannedTickets(prev => prev.filter((_, i) => i !== idx))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pos-danger)', fontSize: 16, lineHeight: 1 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CASH: quick amount + keypad */}
                  {paymentMethod === 'CASH' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {[5, 10, 20, 50].map(amt => (
                        <button key={amt} onClick={() => setAmountReceived(amt.toString())}
                          style={{ padding: '10px 0', border: '2px solid #BFDBFE', borderRadius: 12, background: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                          {amt} DT
                        </button>
                      ))}
                      <button onClick={() => setAmountReceived(total.toFixed(3))}
                        style={{ gridColumn: 'span 4', padding: '10px 0', border: '2px solid var(--pos-primary)', borderRadius: 12, background: '#EEF2FF', color: 'var(--pos-primary)', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                        💯 Montant exact : {total.toFixed(3)} DT
                      </button>
                    </div>
                  )}

                  {/* Keypad */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map(k => (
                      <button key={k} onClick={() => handleKeypad(k.toString())}
                        style={{ height: 60, fontSize: 22, fontWeight: 800, border: '2px solid var(--pos-border)', borderRadius: 14, background: k === 'C' ? '#FEF2F2' : 'var(--pos-bg)', color: k === 'C' ? 'var(--pos-danger)' : 'var(--pos-text-main)', cursor: 'pointer', transition: 'all 0.1s' }}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Summary & Validate */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Amount display */}
                  <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 20, textAlign: 'center', border: '2px solid var(--pos-border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>TOTAL À PAYER</div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--pos-text-main)', lineHeight: 1 }}>{total.toFixed(3)} <span style={{ fontSize: 20 }}>DT</span></div>
                  </div>

                  {paymentMethod === 'CASH' && (
                    <>
                      <div style={{ background: 'var(--pos-bg)', padding: 16, borderRadius: 16, border: '1px solid var(--pos-border)' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 4 }}>MONTANT REÇU</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--pos-primary)' }}>{amountReceived || '0.000'} <span style={{ fontSize: 16 }}>DT</span></div>
                      </div>
                      {cashChange > 0 && (
                        <div style={{ background: '#D1FAE5', padding: 16, borderRadius: 16, border: '2px solid #10B981', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#065F46', marginBottom: 4 }}>À RENDRE</div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: '#065F46' }}>{cashChange.toFixed(3)} DT</div>
                        </div>
                      )}
                    </>
                  )}

                  {paymentMethod === 'MIXED' && (
                    <>
                      <div style={{ background: 'var(--pos-bg)', padding: 14, borderRadius: 16, border: '1px solid var(--pos-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}><span>💵 Espèces</span><span>{(parseFloat(mixedCash)||0).toFixed(3)} DT</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}><span>💳 Carte</span><span>{(parseFloat(mixedCard)||0).toFixed(3)} DT</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}><span>🎟️ Ticket</span><span>{(parseFloat(mixedVoucher)||0).toFixed(3)} DT</span></div>
                        <div style={{ height: 1, background: 'var(--pos-border)', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900 }}><span>Total saisi</span><span style={{ color: mixedTotal >= total - 0.001 ? 'var(--pos-success)' : 'var(--pos-danger)' }}>{mixedTotal.toFixed(3)} DT</span></div>
                      </div>
                      {mixedRemaining > 0.001 && (
                        <div style={{ background: '#FEF3C7', padding: 14, borderRadius: 14, border: '2px solid #F59E0B', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', marginBottom: 4 }}>RESTE À COUVRIR</div>
                          <div style={{ fontSize: 26, fontWeight: 900, color: '#92400E' }}>{mixedRemaining.toFixed(3)} DT</div>
                        </div>
                      )}
                      {mixedChange > 0.001 && (
                        <div style={{ background: '#D1FAE5', padding: 14, borderRadius: 14, border: '2px solid #10B981', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#065F46', marginBottom: 4 }}>MONNAIE À RENDRE</div>
                          <div style={{ fontSize: 26, fontWeight: 900, color: '#065F46' }}>{mixedChange.toFixed(3)} DT</div>
                        </div>
                      )}
                    </>
                  )}

                  {(paymentMethod === 'CARD') && cardRef && (
                    <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 14, fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
                      💳 Réf. : {cardRef}
                    </div>
                  )}

                  {paymentMethod === 'MEAL_VOUCHER' && scannedTickets.length > 0 && (
                    <div style={{ background: '#F0FDF4', padding: 14, borderRadius: 14, border: '2px solid #10B981' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#065F46', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {ticketType || '🎟️ Tickets scannés'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        <span>Nombre de tickets</span>
                        <span style={{ fontWeight: 900 }}>{scannedTickets.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        <span>Valeur / ticket</span>
                        <span style={{ fontWeight: 900 }}>{parseFloat(ticketUnitValue || '0').toFixed(3)} DT</span>
                      </div>
                      <div style={{ height: 1, background: '#A7F3D0', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: '#065F46' }}>
                        <span>Total tickets</span>
                        <span>{(scannedTickets.length * (parseFloat(ticketUnitValue) || 0)).toFixed(3)} DT</span>
                      </div>
                      {scannedTickets.length * (parseFloat(ticketUnitValue) || 0) < total - 0.001 && (
                        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '6px 10px', borderRadius: 8 }}>
                          ⚠️ Insuffisant — reste {(total - scannedTickets.length * (parseFloat(ticketUnitValue) || 0)).toFixed(3)} DT
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ flex: 1 }} />

                  <button
                    className="btn-premium btn-premium-success"
                    style={{ width: '100%', height: 68, fontSize: 18, borderRadius: 18, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', opacity: canValidate ? 1 : 0.5 }}
                    disabled={!canValidate}
                    onClick={processPayment}>
                    <CheckCircle size={24} /> VALIDER LA VENTE
                  </button>
                  {!canValidate && (
                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--pos-danger)', fontWeight: 700 }}>Veuillez couvrir la totalité du montant</div>
                  )}
                </div>
              </div>
           </div>
        </div>
        );
      })()}
      
      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="pos-modal-overlay">
           <div className="pos-modal-card" style={{ width: 440 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                 <h2 style={{ margin: 0, fontWeight: 900 }}>Nouveau Client</h2>
                 <X size={24} onClick={() => setIsAddCustomerModalOpen(false)} style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 8, color: 'var(--pos-text-muted)' }}>NOM COMPLET</label>
                    <input 
                      type="text" 
                      className="customer-selector" 
                      style={{ width: '100%', height: 50, borderStyle: 'solid' }}
                      value={newCustomer.name}
                      onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 8, color: 'var(--pos-text-muted)' }}>TÉLÉPHONE</label>
                    <input 
                      type="text" 
                      className="customer-selector" 
                      style={{ width: '100%', height: 50, borderStyle: 'solid' }}
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 8, color: 'var(--pos-text-muted)' }}>EMAIL (OPTIONNEL)</label>
                    <input 
                      type="email" 
                      className="customer-selector" 
                      style={{ width: '100%', height: 50, borderStyle: 'solid' }}
                      value={newCustomer.email}
                      onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                 </div>
              </div>

              <button 
                className="btn-premium btn-premium-primary" 
                style={{ width: '100%', height: 60, marginTop: 32 }}
                disabled={!newCustomer.name || !newCustomer.phone || isCreatingCustomer}
                onClick={async () => {
                  try {
                    setIsCreatingCustomer(true);
                    if (isOffline) {
                      const tempCustomer = { ...newCustomer, id: 'offline-cust-' + Date.now(), loyaltyPoints: 0 };
                      await savePendingAction('pendingCustomers', tempCustomer);
                      setCustomerResults(prev => [tempCustomer, ...prev]);
                      setSelectedCustomer(tempCustomer);
                      setPendingSyncCount(prev => prev + 1);
                      alert("Mode hors ligne : Client enregistré localement.");
                      setIsAddCustomerModalOpen(false);
                      setNewCustomer({ name: '', phone: '', email: '' });
                    } else {
                      const customer = await createCustomer(newCustomer);
                      setCustomerResults(prev => [customer, ...prev]);
                      setSelectedCustomer(customer);
                      alert("Client créé avec succès !");
                      setIsAddCustomerModalOpen(false);
                      setNewCustomer({ name: '', phone: '', email: '' });
                    }
                  } catch (err: any) {
                    if (err.message === 'DUPLICATE_PHONE') {
                      alert("Ce numéro de téléphone est déjà associé à un client existant.");
                    } else {
                      // Passer en mode hors ligne si erreur réseau
                      setIsOffline(true);
                      const tempCustomer = { ...newCustomer, id: 'offline-cust-' + Date.now(), loyaltyPoints: 0 };
                      await savePendingAction('pendingCustomers', tempCustomer);
                      setCustomerResults(prev => [tempCustomer, ...prev]);
                      setSelectedCustomer(tempCustomer);
                      setPendingSyncCount(prev => prev + 1);
                      alert("Erreur réseau : Client enregistré localement en mode hors ligne.");
                      setIsAddCustomerModalOpen(false);
                      setNewCustomer({ name: '', phone: '', email: '' });
                    }
                  } finally {
                    setIsCreatingCustomer(false);
                  }
                }}
              >
                {isCreatingCustomer ? "Création..." : "Enregistrer le client"}
              </button>
           </div>
        </div>
      )}

      {/* Opening Session Modal */}
      {showOpeningModal && (
        <div className="pos-modal-overlay" style={{ zIndex: 4000 }}>
          <div className="pos-modal-card" style={{ width: 800, maxWidth: '95vw', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Ouverture de Caisse</h2>
            </div>
            <p style={{ color: 'var(--pos-text-muted)', marginBottom: 24 }}>Saisissez votre fond de caisse initial pour commencer votre service.</p>
            
            <div style={{ display: 'flex', gap: 32 }}>
              {/* Left Column: Denomination Counter */}
              <div style={{ flex: 1, maxHeight: '60vh', overflowY: 'auto' }}>
                 <DenominationCounter onChange={(counts, total) => {
                   setOpeningCounts(counts);
                   setOpeningBalance(total.toString());
                 }} />
              </div>

              {/* Right Column: Summary */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                 <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'var(--pos-accent)', color: 'var(--pos-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Banknote size={32} />
                 </div>
                 
                 <div className="payment-amount-display" style={{ marginBottom: 32, background: 'var(--pos-bg)', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 8px', color: 'var(--pos-text-muted)' }}>TOTAL EN CAISSE</p>
                    <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--pos-primary)' }}>{Number(openingBalance).toFixed(3)} DT</span>
                 </div>

                 <button className="btn-premium btn-premium-primary" style={{ width: '100%', height: 60, fontSize: 18 }} onClick={handleOpenSession}>
                    OUVRIR LA SESSION
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closing Session Modal */}
      {showClosingModal && (
        <div className="pos-modal-overlay" style={{ zIndex: 4000 }}>
          <div className="pos-modal-card" style={{ width: 850, maxWidth: '95vw', padding: 32 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Clôture de Caisse</h2>
                <X size={24} onClick={() => setShowClosingModal(false)} style={{ cursor: 'pointer' }} />
             </div>
             
             <div style={{ display: 'flex', gap: 32 }}>
                {/* Left Column: Denomination Counter */}
                <div style={{ flex: '1 1 50%', maxHeight: '60vh', overflowY: 'auto' }}>
                   <DenominationCounter onChange={(counts, total) => {
                     setClosingCounts(counts);
                     setClosingBalance(total.toString());
                   }} />
                </div>

                {/* Right Column: Summary & Actions */}
                <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ background: 'var(--pos-bg)', padding: 16, borderRadius: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                         <span style={{ fontWeight: 700, color: 'var(--pos-text-muted)' }}>Ventes Session:</span>
                         <span style={{ fontWeight: 900, color: 'var(--pos-primary)' }}>{Number(activeSession?.totalSales || 0).toFixed(3)} DT</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                         <span style={{ fontWeight: 700, color: 'var(--pos-text-muted)' }}>Fond initial:</span>
                         <span style={{ fontWeight: 900 }}>{Number(activeSession?.openingBalance || 0).toFixed(3)} DT</span>
                      </div>
                      <div style={{ height: 1, background: 'var(--pos-border)', margin: '12px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 12 }}>
                         <span style={{ fontWeight: 900 }}>Total Attendu:</span>
                         <span style={{ fontWeight: 900 }}>{(Number(activeSession?.openingBalance || 0) + Number(activeSession?.totalSales || 0)).toFixed(3)} DT</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                         <span style={{ fontWeight: 700, color: 'var(--pos-text-muted)' }}>Total Compté:</span>
                         <span style={{ fontWeight: 900, color: 'var(--pos-primary)' }}>{Number(closingBalance).toFixed(3)} DT</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ fontWeight: 700, color: 'var(--pos-text-muted)' }}>Écart:</span>
                         <span style={{ fontWeight: 900, color: (Number(closingBalance) - (Number(activeSession?.openingBalance || 0) + Number(activeSession?.totalSales || 0))) < 0 ? '#EF4444' : '#10B981' }}>
                           {(Number(closingBalance) - (Number(activeSession?.openingBalance || 0) + Number(activeSession?.totalSales || 0))).toFixed(3)} DT
                         </span>
                      </div>
                   </div>

                   <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--pos-text-muted)', textAlign: 'left' }}>FOND DE CAISSE (À CONSERVER)</label>
                      <input
                         type="number"
                         style={{ width: '100%', borderRadius: 12, border: '1px solid var(--pos-border)', padding: 12, background: 'var(--pos-bg)', color: 'var(--pos-text-main)', fontSize: 18, fontWeight: 'bold' }}
                         value={fondDeCaisse}
                         onChange={e => setFondDeCaisse(e.target.value)}
                      />
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, background: 'var(--pos-accent)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                      <span style={{ fontWeight: 900, color: 'var(--pos-primary)' }}>Montant à Déposer:</span>
                      <span style={{ fontWeight: 900, color: 'var(--pos-primary)' }}>{Math.max(0, Number(closingBalance) - Number(fondDeCaisse)).toFixed(3)} DT</span>
                   </div>

                   <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--pos-text-muted)' }}>NOTES DE CLÔTURE</label>
                      <textarea 
                        style={{ width: '100%', borderRadius: 12, border: '1px solid var(--pos-border)', padding: 12, background: 'var(--pos-bg)', color: 'var(--pos-text-main)' }}
                        rows={2}
                        placeholder="Écart de caisse, remarques..."
                        value={sessionNotes}
                        onChange={e => setSessionNotes(e.target.value)}
                      />
                   </div>

                   <button className="btn-premium btn-premium-danger" style={{ width: '100%', height: 60, fontSize: 18, marginTop: 'auto' }} onClick={handleCloseSession}>
                      VALIDER LA CLÔTURE
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
      {/* Mobile Bottom Nav */}
      <nav className="pos-mobile-nav">
         <div className={`mobile-nav-item ${view === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setView('DASHBOARD')}>
            <LayoutDashboard size={20} />
            <span>Stats</span>
         </div>
         <div className={`mobile-nav-item ${view === 'TABLES' ? 'active' : ''}`} onClick={() => setView('TABLES')}>
            <LayoutGrid size={20} />
            <span>Tables</span>
         </div>
         <div className={`mobile-nav-item ${view === 'POS' ? 'active' : ''}`} onClick={() => { if(!selectedTable) setSelectedTable({ id: 'DIRECT', label: 'Vente Directe' }); setView('POS'); }}>
            <ShoppingCart size={20} />
            <span>Vente</span>
         </div>
         <div className={`mobile-nav-item ${view === 'ORDERS' ? 'active' : ''}`} onClick={() => setView('ORDERS')}>
            <History size={20} />
            <span>Journal</span>
         </div>
         <div className={`mobile-nav-item ${view === 'CUSTOMERS' ? 'active' : ''}`} onClick={() => setView('CUSTOMERS')}>
            <Users size={20} />
            <span>Clients</span>
         </div>
      </nav>

      <style>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #CBD5E1; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--pos-primary); }
        input:checked + .slider:before { transform: translateX(20px); }
      `}</style>
      {showAttendanceModal && renderAttendanceModal()}
    </div>
  );
}
