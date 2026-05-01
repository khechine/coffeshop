'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, ShoppingCart, Trash2, CheckCircle, Clock, 
  History, User, Cake, LogOut, Lock, LayoutGrid, CreditCard,
  ChevronRight, AlertCircle, Save, ArrowLeft, MoreVertical, ClipboardList,
  ChevronDown, ChevronUp, ShoppingBag, Edit2, Users, Settings, LayoutDashboard, Search,
  X, Wallet, Banknote, Smartphone, Receipt, Tag, Star, Heart, Smile, Zap, Home, Box, Sun, Moon, ShieldCheck, Package
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { recordSale, searchCustomers, createCustomer, getRecentOrders, voidSale, getActiveCashSession, openCashSessionAction, closeCashSessionAction } from '../actions';
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
  
  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MIXED'>('CASH');
  const [amountReceived, setAmountReceived] = useState('0');
  
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
  const [closingBalance, setClosingBalance] = useState('0');
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

  const subtotal = currentCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
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
      const data = await getRecentOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
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
          
          // Enforce min quantity if decreasing
          if (delta < 0 && newQty < minQty) {
            newQty = 0; // Remove item if it goes below min
          }
          
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);

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
      const results = await searchCustomers(val);
      setCustomerResults(results as any);
    } else {
      setCustomerResults([]);
    }
  };

  const processPayment = async () => {
    setLastActivity(Date.now());
    try {
      const sale = await recordSale({
        total,
        subtotal,
        discount: discountFromPoints,
        items: currentCart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        baristaId: cashierId || 'pos-internal',
        terminalId: selectedTerminalId || undefined,
        tableName: selectedTable?.label || 'Directe',
        paymentMethod: paymentMethod,
        paymentDetails: {
          cash: paymentMethod === 'CASH' ? total : 0,
          card: paymentMethod === 'CARD' ? total : 0,
          points: discountFromPoints * loyaltyRedeemRate
        },
        customerId: (selectedCustomer?.id && selectedCustomer.id !== 'passager') ? selectedCustomer.id : undefined,
        change: change
      });

      setSessionSales(prev => [sale, ...prev]);

      alert("Vente enregistrée avec succès !");
      clearCart();
      setSelectedCustomer({
        id: 'passager',
        name: 'Client Passager',
        phone: '',
        loyaltyPoints: 0
      });
      setIsPaymentModalOpen(false);
      setIsRedeemingPoints(false);
      setIsCartOpenMobile(false);
    } catch (err) {
      alert("Erreur lors du paiement");
    }
  };

  const handleKeypad = (val: string) => {
    if (val === 'C') setAmountReceived('0');
    else if (val === '.') {
      if (!amountReceived.includes('.')) setAmountReceived(prev => prev + '.');
    }
    else {
      setAmountReceived(prev => prev === '0' ? val : prev + val);
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
      const session = await openCashSessionAction(Number(openingBalance));
      setActiveSession(session);
      setShowOpeningModal(false);
      alert("Session ouverte avec succès ! Bon service.");
    } catch (err) {
      alert("Erreur lors de l'ouverture de la session");
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      await closeCashSessionAction(activeSession.id, Number(closingBalance), sessionNotes);
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
        </div>
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
      {/* Module Navigation (Sidebar) */}
      <aside className="pos-sidebar">
        <div className="pos-sidebar-icon" onClick={() => router.push('/')} title="Dashboard" style={{ marginBottom: 20 }}>
          <LayoutDashboard size={28} />
        </div>
        <div className={`pos-sidebar-icon ${view === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setView('DASHBOARD')} title="Tableau de bord"><LayoutDashboard size={24} /></div>
        <div className={`pos-sidebar-icon ${view === 'TABLES' ? 'active' : ''}`} onClick={() => setView('TABLES')} title="Tables"><LayoutGrid size={24} /></div>
        <div className={`pos-sidebar-icon ${view === 'POS' ? 'active' : ''}`} onClick={() => { if(!selectedTable) setSelectedTable({ id: 'DIRECT', label: 'Vente Directe' }); setView('POS'); }} title="Vente"><ShoppingCart size={24} /></div>
        <div className={`pos-sidebar-icon ${view === 'ORDERS' ? 'active' : ''}`} onClick={() => setView('ORDERS')} title="Commandes"><History size={24} /></div>
        <div className={`pos-sidebar-icon ${view === 'CUSTOMERS' ? 'active' : ''}`} onClick={() => setView('CUSTOMERS')} title="Clientèle"><Users size={24} /></div>
        <div style={{ flex: 1 }} />
        
        {/* Theme Toggle */}
        <div className="pos-sidebar-icon" onClick={toggleThemeVariant} title="Changer de thème" style={{ cursor: 'pointer', marginBottom: 10 }}>
           {theme === 'mocha' ? <Cake size={24} /> : <Zap size={24} />}
        </div>

        <div className="pos-sidebar-icon" style={{ color: 'var(--pos-warning)' }} onClick={handleLogout} title="Verrouiller">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Lock size={28} />
            <span style={{ fontSize: 9, fontWeight: 900 }}>VERROUILLER</span>
          </div>
        </div>

        <div className="pos-sidebar-icon" style={{ color: '#EF4444', height: 70, borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} onClick={() => setShowClosingModal(true)} title="Clôturer Session">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <LogOut size={28} />
            <span style={{ fontSize: 9, fontWeight: 900 }}>CLÔTURER</span>
          </div>
        </div>
      </aside>

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
                             {(sessionSales.filter(s => String(s.cashierId || s.baristaId) === String(cashierId)).reduce((acc, s) => acc + Number(s.total), 0)).toFixed(3)} / 1200.000 DT
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                             <div style={{ 
                               height: '100%', 
                               width: `${Math.min(100, Math.floor(((sessionSales.filter(s => String(s.cashierId || s.baristaId) === String(cashierId)).reduce((acc, s) => acc + Number(s.total), 0)) / 1200) * 100))}%`, 
                               background: '#fff' 
                             }} />
                          </div>
                          <p style={{ margin: '12px 0 0', fontSize: 11, fontWeight: 600 }}>
                             Vous êtes à {Math.min(100, Math.floor(((sessionSales.filter(s => String(s.cashierId || s.baristaId) === String(cashierId)).reduce((acc, s) => acc + Number(s.total), 0)) / 1200) * 100))}% de votre objectif personnel !
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



              {/* Extra spacer to balance the header flex if needed */}
              <div style={{ width: 100 }} />
            </div>
          </header>

          <div className="pos-product-grid">
            {filteredProducts.map(product => {
               const minQty = (product as any).minOrderQty || 1;
               return (
                <div key={product.id} className="product-card" onClick={() => addToCart(product)} style={{ position: 'relative' }}>
                   {minQty > 1 && (
                     <div className="product-min-badge">
                        <Package size={12} /> min. {minQty}
                     </div>
                   )}
                   <div className="product-image-container" style={{ height: 210 }}>
                     {product.image ? (
                       <img src={product.image} className="product-image" alt={product.name} />
                     ) : (
                       <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', background: 'linear-gradient(135deg, var(--pos-bg) 0%, var(--pos-input-bg) 100%)' }}>
                         <Cake size={64} strokeWidth={1} />
                       </div>
                     )}
                   </div>
                   <div className="product-info" style={{ padding: 18 }}>
                     <span className="product-name" style={{ fontSize: 17, marginBottom: 8, height: 44, display: 'block', fontWeight: 900 }}>{product.name}</span>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="product-price" style={{ fontSize: 20, fontWeight: 1000, color: 'var(--pos-primary)' }}>{product.price.toFixed(3)} DT</span>
                        <div className="btn-premium btn-premium-primary" style={{ width: 36, height: 36, padding: 0, borderRadius: 10, boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}>
                           <Plus size={20} />
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
                           <button className="btn-premium" style={{ flex: 1, background: '#fff', border: '1px solid var(--pos-border)' }} onClick={() => alert("Impression ticket...")}>Exporter</button>
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
    </div>

    {/* Cart Sidebar (Stay functional always during POS) */}
      {view === 'POS' && (
      <aside className={`pos-cart-sidebar ${isCartOpenMobile ? 'mobile-open' : ''}`}>
        <div className="cart-header">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <div style={{ padding: 10, background: 'var(--pos-bg)', borderRadius: 12 }}>
                    <Receipt size={20} color="var(--pos-primary)" />
                 </div>
                 <h2 style={{ margin: 0, fontWeight: 900, fontSize: 18 }}>Panier</h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--pos-text-muted)', cursor: 'pointer' }} className="mobile-only-btn" onClick={() => setIsCartOpenMobile(false)}><X size={24} /></button>
                <button style={{ background: 'none', border: 'none', color: 'var(--pos-danger)', cursor: 'pointer' }} onClick={clearCart}><Trash2 size={20} /></button>
              </div>
           </div>
           
           {/* Customer Selector Integration */}
           {!selectedCustomer ? (
             <div style={{ position: 'relative' }}>
               <input 
                 className="customer-selector" 
                 style={{ width: '100%', borderStyle: 'dashed', height: 54 }}
                 placeholder="Lier un client loyal..."
                 value={customerSearch}
                 onChange={e => handleCustomerSearch(e.target.value)}
               />
               {customerResults.length > 0 && (
                 <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--pos-border)', borderRadius: 12, zIndex: 100, marginTop: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                   {customerResults.map(c => (
                     <div key={c.id} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--pos-border)' }} 
                       onClick={() => { setSelectedCustomer(c); setCustomerResults([]); setCustomerSearch(''); }}>
                       <div style={{ fontWeight: 800 }}>{c.name}</div>
                       <div style={{ fontSize: 12, color: 'var(--pos-text-muted)' }}>{c.phone} • {c.loyaltyPoints} pts</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           ) : (
             <div className="customer-selector" style={{ borderColor: 'var(--pos-primary)', background: '#EEF2FF', height: 64 }}>
                <div className="customer-avatar" style={{ background: 'var(--pos-primary)' }}>{selectedCustomer.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 800, fontSize: 14 }}>{selectedCustomer.name}</div>
                   <div style={{ fontSize: 11, color: 'var(--pos-primary)', fontWeight: 800 }}>{selectedCustomer.loyaltyPoints} POINTS</div>
                </div>
                <X size={18} onClick={() => { setSelectedCustomer(null); setIsRedeemingPoints(false); }} style={{ color: 'var(--pos-text-muted)', cursor: 'pointer' }} />
             </div>
           )}
        </div>

        <div className="cart-items">
          {currentCart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{(item.price * item.quantity).toFixed(3)} DT</div>
              </div>
              <div className="cart-controls">
                <button className="cart-qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                <span style={{ fontWeight: 800, width: 22, textAlign: 'center' }}>{item.quantity}</span>
                <button className="cart-qty-btn" onClick={() => addToCart(item)}><Plus size={14} /></button>
              </div>
            </div>
          ))}
          {currentCart.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2, marginTop: 100 }}>
              <ShoppingCart size={80} strokeWidth={1} />
              <p style={{ fontWeight: 900, fontSize: 18 }}>Panier Vide</p>
            </div>
          )}
        </div>

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

           <div className="total-row"><span>Sous-total</span><span style={{ fontWeight: 800 }}>{subtotal.toFixed(3)} DT</span></div>
           {discountFromPoints > 0 && (
             <div className="total-row" style={{ color: 'var(--pos-success)' }}>
               <span>Remise Points</span>
               <span style={{ fontWeight: 800 }}>-{discountFromPoints.toFixed(3)} DT</span>
             </div>
           )}
           <div className="total-row grand-total"><span>Total</span><span>{total.toFixed(3)} DT</span></div>
        </div>

        <div className="cart-actions">
           <button className="btn-premium btn-premium-orange" style={{ height: 60 }} onClick={() => { setView('TABLES'); setSelectedTable(null); }}><Save size={20} /> Mettre en attente</button>
           <button className="btn-premium btn-premium-primary" style={{ height: 60 }} disabled={currentCart.length === 0} onClick={() => setIsPaymentModalOpen(true)}>
             <CheckCircle size={22} /> Encaisser
           </button>
        </div>
      </aside>
      )}

      {/* Payment Modal (Unchanged functional part) */}
      {isPaymentModalOpen && (
        <div className="pos-modal-overlay">
           <div className="pos-modal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                 <div>
                   <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--pos-sidebar)', fontSize: 24 }}>Encaissement</h2>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pos-text-muted)' }}>
                      <span style={{ fontWeight: 800 }}>{selectedTable?.label || 'Directe'}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 800, color: 'var(--pos-primary)' }}>{total.toFixed(3)} DT</span>
                   </div>
                 </div>
                 <X size={28} onClick={() => setIsPaymentModalOpen(false)} style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                 <button className={`category-pill ${paymentMethod === 'CASH' ? 'active' : ''}`} style={{ height: 50 }} onClick={() => setPaymentMethod('CASH')}>ESPECES</button>
                 <button className={`category-pill ${paymentMethod === 'CARD' ? 'active' : ''}`} style={{ height: 50 }} onClick={() => setPaymentMethod('CARD')}>CARTE</button>
                 <button className={`category-pill ${paymentMethod === 'MIXED' ? 'active' : ''}`} style={{ height: 50 }} onClick={() => setPaymentMethod('MIXED')}>MIXTE</button>
              </div>

              <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 24, textAlign: 'center', border: '1px solid var(--pos-border)' }}>
                 <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>MONTANT REÇU</div>
                 <div style={{ fontSize: 54, fontWeight: 900, color: 'var(--pos-primary)' }}>{amountReceived} <span style={{ fontSize: 24 }}>DT</span></div>
              </div>

              <div className="keypad-grid">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map(k => (
                   <button key={k} className="keypad-btn" onClick={() => handleKeypad(k.toString())}>{k}</button>
                 ))}
              </div>

              {change > 0 && (
                <div style={{ marginTop: 24, textAlign: 'center', background: '#D1FAE5', padding: 20, borderRadius: 20, border: '2px solid #10B981' }}>
                   <div style={{ fontWeight: 900, color: '#065F46', fontSize: 18 }}>RENDU : {change.toFixed(3)} DT</div>
                </div>
              )}

              <button className="btn-premium btn-premium-success" style={{ width: '100%', height: 72, marginTop: 24, fontSize: 18, borderRadius: 20 }} onClick={processPayment}>
                 <CheckCircle size={24} /> VALIDER LA VENTE
              </button>
           </div>
        </div>
      )}
      
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
                    const customer = await createCustomer(newCustomer);
                    setCustomerResults(prev => [customer, ...prev]);
                    setSelectedCustomer(customer);
                    alert("Client créé avec succès !");
                    setIsAddCustomerModalOpen(false);
                    setNewCustomer({ name: '', phone: '', email: '' });
                  } catch (err: any) {
                    if (err.message === 'DUPLICATE_PHONE') {
                      alert("Ce numéro de téléphone est déjà associé à un client existant.");
                    } else {
                      alert("Erreur lors de la création : " + err.message);
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
          <div className="pos-modal-card" style={{ width: 400, textAlign: 'center' }}>
             <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'var(--pos-accent)', color: 'var(--pos-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Banknote size={32} />
             </div>
             <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Ouverture de Caisse</h2>
             <p style={{ color: 'var(--pos-text-muted)', marginBottom: 24 }}>Saisissez votre fond de caisse initial pour commencer votre service.</p>
             
             <div className="payment-amount-display" style={{ marginBottom: 24, background: 'var(--pos-bg)', padding: '20px', borderRadius: '16px' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--pos-primary)' }}>{openingBalance} DT</span>
             </div>

             <div className="keypad-grid" style={{ marginBottom: 24 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map(n => (
                  <button key={n} className="keypad-btn" style={{ height: 60, fontSize: 20 }} onClick={() => {
                    if (n === 'C') setOpeningBalance('0');
                    else if (n === '.') { if (!openingBalance.includes('.')) setOpeningBalance(b => b + '.'); }
                    else setOpeningBalance(b => b === '0' ? n.toString() : b + n.toString());
                  }}>{n}</button>
                ))}
             </div>

             <button className="btn-premium btn-premium-primary" style={{ width: '100%', height: 60, fontSize: 18 }} onClick={handleOpenSession}>
                OUVRIR LA SESSION
             </button>
          </div>
        </div>
      )}

      {/* Closing Session Modal */}
      {showClosingModal && (
        <div className="pos-modal-overlay" style={{ zIndex: 4000 }}>
          <div className="pos-modal-card" style={{ width: 450 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Clôture de Caisse</h2>
                <X size={24} onClick={() => setShowClosingModal(false)} style={{ cursor: 'pointer' }} />
             </div>
             
             <div style={{ background: 'var(--pos-bg)', padding: 20, borderRadius: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                   <span style={{ fontWeight: 700, color: 'var(--pos-text-muted)' }}>Ventes Session:</span>
                   <span style={{ fontWeight: 900, color: 'var(--pos-primary)' }}>{Number(activeSession?.totalSales || 0).toFixed(3)} DT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ fontWeight: 700, color: 'var(--pos-text-muted)' }}>Fond initial:</span>
                   <span style={{ fontWeight: 900 }}>{Number(activeSession?.openingBalance || 0).toFixed(3)} DT</span>
                </div>
                <div style={{ height: 1, background: 'var(--pos-border)', margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
                   <span style={{ fontWeight: 900 }}>Total Attendu:</span>
                   <span style={{ fontWeight: 900 }}>{(Number(activeSession?.openingBalance || 0) + Number(activeSession?.totalSales || 0)).toFixed(3)} DT</span>
                </div>
             </div>

             <div className="payment-amount-display" style={{ marginBottom: 24, background: 'var(--pos-bg)', padding: '15px', borderRadius: '16px' }}>
                <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 4px', color: 'var(--pos-text-muted)' }}>MONTANT RÉEL EN CAISSE</p>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--pos-primary)' }}>{closingBalance} DT</span>
             </div>

             <div className="keypad-grid" style={{ marginBottom: 24 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map(n => (
                  <button key={n} className="keypad-btn" style={{ height: 50, fontSize: 18 }} onClick={() => {
                    if (n === 'C') setClosingBalance('0');
                    else if (n === '.') { if (!closingBalance.includes('.')) setClosingBalance(b => b + '.'); }
                    else setClosingBalance(b => b === '0' ? n.toString() : b + n.toString());
                  }}>{n}</button>
                ))}
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

             <button className="btn-premium btn-premium-danger" style={{ width: '100%', height: 60, fontSize: 18 }} onClick={handleCloseSession}>
                VALIDER LA CLÔTURE
             </button>
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

      <style jsx>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #CBD5E1; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--pos-primary); }
        input:checked + .slider:before { transform: translateX(20px); }
      `}</style>
    </div>
  );
}
