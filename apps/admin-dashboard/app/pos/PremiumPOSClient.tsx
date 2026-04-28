'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, ShoppingCart, Trash2, CheckCircle, Clock, 
  History, User, Coffee, LogOut, Lock, LayoutGrid, CreditCard,
  ChevronRight, AlertCircle, Save, ArrowLeft, MoreVertical, ClipboardList,
  ChevronDown, ChevronUp, ShoppingBag, Edit2, Users, Settings, LayoutDashboard, Search,
  X, Wallet, Banknote, Smartphone, Receipt, Tag, Star, Heart, Smile, Zap, Home, Box, Sun, Moon, ShieldCheck, Package
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { recordSale, searchCustomers, createCustomer, getRecentOrders, voidSale } from '../actions';
import './pos-premium.css';

const ICONS: Record<string, React.FC<any>> = {
  Tag, Coffee, Star, Heart, Smile, Zap, Home, Box, ShoppingBag
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
    const savedTheme = localStorage.getItem('pos_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('pos_theme', newVal ? 'dark' : 'light');
      if (newVal) {
        document.body.setAttribute('data-theme', 'dark');
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
  const [view, setView] = useState<'TABLES' | 'POS' | 'ORDERS' | 'CUSTOMERS'>('TABLES');
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
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PAID' | 'VOID'>('ALL');
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
  
  // --- Derived ---
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
    if (!selectedTable) return;
    const tableId = selectedTable.id;
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
    if (!selectedTable) return;
    const tableId = selectedTable.id;

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
    if (!selectedTable) return;
    setTableOrders(prev => {
      const { [selectedTable.id]: _, ...rest } = prev;
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
  const handlePinSubmit = () => {
    const barista = initialBaristas.find(b => b.pinCode === pin);
    if (barista) {
      setCashierId(barista.id);
      setCashierName(barista.name);
      localStorage.setItem('pos_cashier_id', barista.id);
      localStorage.setItem('pos_cashier_name', barista.name);
      setPin("");
    } else {
      setError("PIN invalide");
      setPin("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_cashier_id');
    localStorage.removeItem('pos_cashier_name');
    setCashierId(null);
    setCashierName(null);
    setPin("");
  };

  useEffect(() => {
    const cid = localStorage.getItem('pos_cashier_id');
    const cname = localStorage.getItem('pos_cashier_name');
    const tid = localStorage.getItem('pos_terminal_id');
    if (cid && cname) {
      setCashierId(cid);
      setCashierName(cname);
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
             <Coffee size={40} />
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

  if (view === 'TABLES') {
    return (
      <div className="pos-premium-container" data-theme={isDarkMode ? 'dark' : 'light'} style={{ background: 'var(--pos-sidebar)', transition: 'all 0.3s ease' }}>
         <aside className="pos-sidebar">
            <div className="pos-sidebar-icon active"><LayoutGrid size={24} /></div>
            <div className="pos-sidebar-icon" onClick={() => setView('ORDERS')}><History size={24} /></div>
            <div className="pos-sidebar-icon" onClick={() => setView('CUSTOMERS')}><Users size={24} /></div>
            <div style={{ flex: 1 }} />
            {/* Theme Toggle in Sidebar for Tables view */}
            <div className="pos-sidebar-icon" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </div>
            <div className="pos-sidebar-icon" style={{ color: '#EF4444' }} onClick={handleLogout}><LogOut size={24} /></div>
         </aside>

         <main style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
               <div>
                  <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: 0 }}>Plan de Salle</h1>
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Sélectionnez une table pour commencer la commande</p>
               </div>
               <button className="btn-premium btn-premium-primary" style={{ padding: '20px 40px', fontSize: 18 }} onClick={() => { setSelectedTable({ id: 'DIRECT', label: 'Vente Directe' }); setView('POS'); }}>
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
                        background: hasOrder ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)', 
                        borderColor: hasOrder ? 'var(--pos-primary)' : 'rgba(255,255,255,0.1)', 
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
                         background: hasOrder ? 'var(--pos-primary)' : 'rgba(255,255,255,0.1)', 
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         transition: 'all 0.3s'
                       }}>
                          <Users size={32} color="#fff" />
                       </div>
                       <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{t.label}</div>
                       <div style={{ color: hasOrder ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                          {hasOrder ? `${tableCart.length} articles` : `Table ${t.capacity} pers.`}
                       </div>
                    </div>
                  );
                })}
               {initialTables.length === 0 && (
                 <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.2)' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto 20px' }} />
                    <h2>Aucune table configurée</h2>
                    <p>Utilisez le bouton "Vente Directe" pour continuer.</p>
                 </div>
               )}
            </div>
         </main>
      </div>
    );
  }

  return (
    <div className="pos-premium-container" data-theme={isDarkMode ? 'dark' : 'light'} style={{ transition: 'all 0.3s ease' }}>
      {/* Module Navigation (Sidebar Fine) */}
      <aside className="pos-sidebar">
        <div className="pos-sidebar-icon" onClick={() => router.push('/')} title="Dashboard" style={{ marginBottom: 20 }}>
          <LayoutDashboard size={28} />
        </div>
        <div className="pos-sidebar-icon" onClick={() => setView('TABLES')} title="Tables"><LayoutGrid size={24} /></div>
        <div className={`pos-sidebar-icon ${view === 'POS' ? 'active' : ''}`} onClick={() => setView('POS')} title="Vente"><ShoppingCart size={24} /></div>
        <div className={`pos-sidebar-icon ${view === 'ORDERS' ? 'active' : ''}`} onClick={() => setView('ORDERS')} title="Commandes"><History size={24} /></div>
        <div className={`pos-sidebar-icon ${view === 'CUSTOMERS' ? 'active' : ''}`} onClick={() => setView('CUSTOMERS')} title="Clientèle"><Users size={24} /></div>
        <div style={{ flex: 1 }} />
        
        {/* Theme Toggle */}
        <div className="pos-sidebar-icon" onClick={toggleTheme} title="Changer de thème" style={{ cursor: 'pointer', marginBottom: 10 }}>
           {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </div>

        <div className="pos-sidebar-icon" style={{ color: '#EF4444', height: 70, borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} onClick={handleLogout} title="Clôturer Session">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <LogOut size={28} />
            <span style={{ fontSize: 9, fontWeight: 900 }}>CLÔTURER</span>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper (Responsive Stack) */}
      <div className="pos-main-wrapper">
        {/* NEW: Vertical Category Hybrid Navigation */}
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
        {view === 'POS' ? (
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
                 <p style={{ margin: 0, fontSize: 11, color: 'var(--pos-text-muted)', fontWeight: 700 }}>{storeName.toUpperCase()}</p>
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

              {/* MODE INDICATOR CENTERED */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                 <div style={{ 
                   padding: '8px 24px', 
                   background: 'rgba(99, 102, 241, 0.05)', 
                   border: '1px solid rgba(99, 102, 241, 0.2)', 
                   borderRadius: '50px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '10px'
                 }}>
                   <ShieldCheck size={18} color="var(--pos-primary)" />
                   <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--pos-text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mode Premium Active
                   </span>
                 </div>
              </div>

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
                         <Coffee size={64} strokeWidth={1} />
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

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
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

                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                </div>

                {/* Loyalty Program Settings Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ background: 'var(--pos-sidebar)', borderRadius: 24, padding: 24, color: '#fff' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 900 }}>Programme Fidélité</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Paramétrez comment vos clients gagnent et dépensent leurs points.</p>
                      
                      <div style={{ marginBottom: 20 }}>
                         <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>TAUX DE GAIN</label>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="number" defaultValue={loyaltyEarnRate} style={{ width: 60, padding: 10, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900 }} />
                            <span style={{ fontSize: 13 }}>pts / 1 DT dépensé</span>
                         </div>
                      </div>

                      <div style={{ marginBottom: 24 }}>
                         <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>VALEUR DU POINT</label>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="number" defaultValue={loyaltyRedeemRate} style={{ width: 60, padding: 10, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900 }} />
                            <span style={{ fontSize: 13 }}>pts = 1 DT remise</span>
                         </div>
                      </div>

                      <button className="btn-premium btn-premium-primary" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => alert("Réglages sauvegardés")}>Sauvegarder</button>
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
          <div style={{ flex: 1, padding: 40, background: 'var(--pos-bg)', display: 'flex', gap: 32, overflow: 'hidden' }}>
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
                         <option value="PAID">Payés uniquement</option>
                         <option value="VOID">Annulés uniquement</option>
                      </select>
                   </div>

                   <div style={{ flex: 1, overflowY: 'auto' }}>
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
                              if (orderFilter === 'PAID') return !o.isVoid;
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
                                 <td style={{ padding: '16px', fontSize: 12, color: 'var(--pos-text-muted)' }}>
                                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    await createCustomer(newCustomer);
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
