'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Minus, ShoppingCart, Trash2, CheckCircle, Clock, 
  History, User, Coffee, LogOut, Lock, LayoutGrid, CreditCard,
  ChevronRight, AlertCircle, Save, ArrowLeft, MoreVertical, ClipboardList,
  ChevronDown, ChevronUp, ShoppingBag, Edit2, Users, Settings, LayoutDashboard
} from 'lucide-react';
import { recordSale, logStaffSessionAction } from '../actions';

interface Product { id: string; name: string; price: number; category: string; }
interface TableOrder {
  items: any[];
  baristaId: string | null;
  baristaName: string | null;
}

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes
type ViewMode = 'tables' | 'order' | 'simplistic' | 'history' | 'journal';

export default function POSClient({ 
  storeId,
  storeName, 
  initialProducts, 
  initialBaristas = [],
  initialSales = [],
  initialTables = []
}: { 
  storeId: string;
  storeName: string; 
  initialProducts: Product[]; 
  initialBaristas?: any[]; 
  initialSales?: any[];
  initialTables?: any[];
}) {
  const [cashierId, setCashierId] = useState<string | null>(null);
  const [cashierName, setCashierName] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [tableOrders, setTableOrders] = useState<Record<string, TableOrder>>({});
  const [dailySales, setDailySales] = useState<any[]>(initialSales);
  const [viewMode, setViewMode] = useState<ViewMode>('tables');
  const [simplisticSession, setSimplisticSession] = useState<Record<string, number>>({});
  const [simplisticLosses, setSimplisticLosses] = useState<Record<string, number>>({});
  const [isLossMode, setIsLossMode] = useState(false);
  const [isTakeawayMode, setIsTakeawayMode] = useState(false);
  const [packagingId, setPackagingId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [simplisticTakeaway, setSimplisticTakeaway] = useState<Record<string, number>>({});

  const router = useRouter();
  const lastActivityRef = useRef(Date.now());

  // === SESSION & STORAGE ===
  useEffect(() => {
    const cid = localStorage.getItem('pos_cashier_id');
    const cname = localStorage.getItem('pos_cashier_name');
    if (cid && cname) {
      setCashierId(cid);
      setCashierName(cname);
    }
    loadOrders(); // Load global state
  }, []);

  useEffect(() => {
    if (!cashierId) {
      setSimplisticSession({});
      return;
    }
    
    // Load simplistic session for THIS barista
    const savedSimplistic = localStorage.getItem(`pos_simplistic_${cashierId}`);
    const savedLosses = localStorage.getItem(`pos_losses_${cashierId}`);
    
    if (savedSimplistic) {
      try {
        setSimplisticSession(JSON.parse(savedSimplistic));
      } catch (e) {
        console.error("Failed to load simplistic session", e);
        setSimplisticSession({});
      }
    } else {
      setSimplisticSession({});
    }

    if (savedLosses) {
      try {
        setSimplisticLosses(JSON.parse(savedLosses));
      } catch (e) {
        console.error("Failed to load losses", e);
        setSimplisticLosses({});
      }
    } else {
      setSimplisticLosses({});
    }
  }, [cashierId]);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!cashierId) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > TIMEOUT_DURATION) {
        handleLogout();
      }
    }, 60000);

    const updateActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [cashierId]);

  useEffect(() => {
    if (pin.length === 4) handlePinSubmit();
  }, [pin]);

  const loadOrders = () => {
    const saved = localStorage.getItem(`pos_orders_global`);
    if (saved) setTableOrders(JSON.parse(saved));
    else setTableOrders({});
  };

  const saveOrders = (orders: Record<string, TableOrder>) => {
    localStorage.setItem(`pos_orders_global`, JSON.stringify(orders));
  };

  const handlePinSubmit = () => {
    const barista = initialBaristas.find(b => b.pinCode === pin);
    if (barista) {
      setCashierId(barista.id);
      setCashierName(barista.name);
      localStorage.setItem('pos_cashier_id', barista.id);
      localStorage.setItem('pos_cashier_name', barista.name);
      loadOrders();
      setPin("");
      setError("");
      
      // Log LOGIN session trace
      logStaffSessionAction(barista.id, storeId, 'LOGIN');
      
      // Auto-set mode based on barista preference
      if (barista.defaultPosMode === 'simplistic') {
        setViewMode('simplistic');
      } else {
        setViewMode('tables');
      }

      lastActivityRef.current = Date.now();
    } else {
      setError("PIN invalide");
      setPin("");
    }
  };

  const handleLogout = () => {
    if (cashierId) logStaffSessionAction(cashierId, storeId, 'LOGOUT');
    localStorage.removeItem('pos_cashier_id');
    localStorage.removeItem('pos_cashier_name');
    setCashierId(null);
    setCashierName(null);
    setPin("");
    setError("");
    setActiveTable(null);
    setViewMode('tables');
  };

  // === CART LOGIC ===
  const currentTableOrder = activeTable ? tableOrders[activeTable] : null;
  const currentOrderItems = currentTableOrder?.items || [];
  const currentTotal = currentOrderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const filteredSales = dailySales.filter(s => s.cashierId === cashierId);
  const dailyTotal = filteredSales.reduce((a, b) => a + Number(b.total), 0);

  const updateTableOrders = (newOrders: Record<string, TableOrder>) => {
    setTableOrders(newOrders);
    saveOrders(newOrders);
  };

  const [posCategory, setPosCategory] = useState<string>('Tous');
  const [showPackagingPopup, setShowPackagingPopup] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [popupTriggerMode, setPopupTriggerMode] = useState<'ORDER' | 'SIMPLISTIC'>('ORDER');

  const categories = ['Tous', ...Array.from(new Set(initialProducts.map(p => p.category)))];

  const packagingProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes('gobelet') || 
    p.name.toLowerCase().includes('sachet') || 
    p.name.toLowerCase().includes('sac') ||
    p.name.toLowerCase().includes('boite')
  );

  const needsPackaging = (product: any) => {
    const cat = product.category?.toLowerCase() || '';
    const name = product.name.toLowerCase();
    return cat.includes('café') || cat.includes('boisson') || cat.includes('pâtisserie') || cat.includes('gateau') || name.includes('expresso') || name.includes('thé');
  };

  const addItem = (product: any, packagingProduct?: any) => {
    if (!activeTable) return;

    // If it's a candidate for packaging and NO choice has been made yet (neither packaging nor 'Sur Place')
    if (needsPackaging(product) && typeof packagingProduct === 'undefined' && !packagingProducts.find(p => p.id === product.id)) {
      setPendingProduct(product);
      setPopupTriggerMode('ORDER');
      setShowPackagingPopup(true);
      return;
    }

    const current = tableOrders[activeTable] || { items: [], baristaId: cashierId, baristaName: cashierName };
    if (current.items.length === 0) {
      current.baristaId = cashierId;
      current.baristaName = cashierName;
    }

    let newItems = [...current.items];
    
    // Use accompaniment name in main product name if selected
    const mainProductName = packagingProduct ? `${product.name} (avec ${packagingProduct.name})` : product.name;
    const mainProductPrice = Number(product.price);

    // Add or update the main product line
    const existing = newItems.find((i: any) => i.name === mainProductName && i.price === mainProductPrice);
    if (existing) {
      newItems = newItems.map((i: any) => (i.name === mainProductName && i.price === mainProductPrice) ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      newItems.push({ productId: product.id, name: mainProductName, price: mainProductPrice, quantity: 1 });
    }

    // Add the packaging item as a separate line at 0 DT for stock reduction logic
    if (packagingProduct) {
      const packName = `${packagingProduct.name} (Emballage)`;
      const existingPack = newItems.find((i: any) => i.name === packName && i.price === 0);
      if (existingPack) {
        newItems = newItems.map((i: any) => (i.name === packName && i.price === 0) ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newItems.push({ productId: packagingProduct.id, name: packName, price: 0, quantity: 1 });
      }
    }

    updateTableOrders({ ...tableOrders, [activeTable]: { ...current, items: newItems } });
    setShowPackagingPopup(false);
    setPendingProduct(null);
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    if (!activeTable) return;
    const current = tableOrders[activeTable];
    if (!current) return;
    const newItems = current.items.map(i => i.productId === productId ? { ...i, price: newPrice } : i);
    updateTableOrders({ ...tableOrders, [activeTable]: { ...current, items: newItems } });
  };

  const removeItem = (productId: string) => {
    if (!activeTable) return;
    const current = tableOrders[activeTable];
    if (!current) return;
    const newItems = current.items.filter(i => i.productId !== productId);
    if (newItems.length === 0) {
       const { [activeTable]: _, ...others } = tableOrders;
       updateTableOrders(others);
    } else {
       updateTableOrders({ ...tableOrders, [activeTable]: { ...current, items: newItems } });
    }
  };

  const validateOrder = async () => {
    if (!activeTable || currentOrderItems.length === 0) return;
    
    const tableLabel = activeTable === 'direct' ? 'Vente Directe' : `Table ${initialTables.find(t => t.id === activeTable)?.label}`;
    
    try {
      await recordSale({
        total: currentTotal,
        items: currentOrderItems,
        tableName: tableLabel,
        baristaId: cashierId!,
        takenById: currentTableOrder?.baristaId || cashierId!
      });

      // Clear table
      const { [activeTable]: _, ...others } = tableOrders;
      updateTableOrders(others);
      
      // Update local history
      setDailySales([{
        id: Math.random().toString(),
        total: currentTotal,
        table: tableLabel,
        cashier: cashierName,
        cashierId: cashierId,
        takenBy: currentTableOrder?.baristaName || cashierName,
        takenById: currentTableOrder?.baristaId || cashierId,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        items: currentOrderItems
      }, ...dailySales]);

      setViewMode('tables');
      setActiveTable(null);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement de la vente.");
    }
  };

  const simplisticTotal = Object.entries(simplisticSession).reduce((acc, [id, qty]) => {
    const prod = initialProducts.find(p => p.id === id);
    return acc + (prod?.price || 0) * qty;
  }, 0);

  const addSimplistic = (productId: string, packagingProduct?: any) => {
    if (!cashierId) return;

    const product = initialProducts.find(p => p.id === productId);
    if (!product) return;

    // Check for popup trigger
    if (needsPackaging(product) && typeof packagingProduct === 'undefined' && !packagingProducts.find(p => p.id === productId)) {
      setPendingProduct(product);
      setPopupTriggerMode('SIMPLISTIC');
      setShowPackagingPopup(true);
      return;
    }

    if (isLossMode) {
      setSimplisticLosses(prev => {
        const next = { ...prev, [productId]: (prev[productId] || 0) + 1 };
        localStorage.setItem(`pos_losses_${cashierId}`, JSON.stringify(next));
        return next;
      });
    } else {
      setSimplisticSession(prev => {
        const next = { ...prev, [productId]: (prev[productId] || 0) + 1 };
        localStorage.setItem(`pos_simplistic_${cashierId}`, JSON.stringify(next));
        return next;
      });

      // Handle packaging item in simplistic mode
      const targetPackId = packagingProduct ? packagingProduct.id : (isTakeawayMode && packagingId ? packagingId : null);
      if (targetPackId) {
        setSimplisticTakeaway(prev => {
          const next = { ...prev, [targetPackId]: (prev[targetPackId] || 0) + 1 };
          localStorage.setItem(`pos_takeaway_${cashierId}`, JSON.stringify(next));
          return next;
        });
      }
    }
    setShowPackagingPopup(false);
    setPendingProduct(null);
  };

  const resetSimplistic = () => {
    if (!cashierId) return;
    setSimplisticSession({});
    setSimplisticLosses({});
    setSimplisticTakeaway({});
    localStorage.removeItem(`pos_simplistic_${cashierId}`);
    localStorage.removeItem(`pos_losses_${cashierId}`);
    localStorage.removeItem(`pos_takeaway_${cashierId}`);
  };

  const validateSimplistic = async () => {
    const items = Object.entries(simplisticSession)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = initialProducts.find(p => p.id === id);
        return { productId: id, name: prod?.name || '?', price: prod?.price || 0, quantity: qty };
      });

    const lossItems = Object.entries(simplisticLosses)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = initialProducts.find(p => p.id === id);
        return { productId: id, name: `${prod?.name} (Perte)`, price: 0, quantity: qty };
      });

    const packagingItems = Object.entries(simplisticTakeaway)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = initialProducts.find(p => p.id === id);
        return { productId: id, name: `${prod?.name} (Emballage)`, price: 0, quantity: qty };
      });

    if (items.length === 0 && lossItems.length === 0 && packagingItems.length === 0) return;

    try {
      const finalItems = [...items, ...packagingItems];
      if (finalItems.length > 0) {
        await recordSale({
          total: simplisticTotal,
          items: finalItems,
          tableName: 'Session Simpliste',
          baristaId: cashierId!,
          takenById: cashierId!
        });
      }

      if (lossItems.length > 0) {
        await recordSale({
          total: 0,
          items: lossItems,
          tableName: 'Pertes de Session',
          baristaId: cashierId!,
          takenById: cashierId!
        });
      }

      // Update local history
      const newLogs = [];
      if (items.length > 0) {
        newLogs.push({
          id: Math.random().toString(),
          total: simplisticTotal,
          table: 'Session Simpliste',
          cashier: cashierName,
          cashierId: cashierId,
          takenBy: cashierName,
          takenById: cashierId,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          items: items
        });
      }
      if (lossItems.length > 0) {
        newLogs.push({
          id: Math.random().toString(),
          total: 0,
          table: 'Pertes de Session',
          cashier: cashierName,
          cashierId: cashierId,
          takenBy: cashierName,
          takenById: cashierId,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          items: lossItems
        });
      }

      setDailySales([...newLogs, ...dailySales]);
      resetSimplistic();
      setIsLossMode(false);
      alert("Enregistré avec succès !");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  // === UI HELPER ===
  const box: React.CSSProperties = { padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' };

  if (!cashierId) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'linear-gradient(135deg,#1E1B4B 0%,#312E81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ width: '320px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
             <Coffee size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Authentification POS</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>Saisissez votre code PIN barista</p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: pin.length > i ? '#6366F1' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s' }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map(n => (
              <button key={n} onClick={() => {
                if (n === 'C') setPin("");
                else if (n === '✓') handlePinSubmit();
                else if (pin.length < 4) setPin(p => p + n);
              }}
              style={{ height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '20px', fontWeight: 800, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
          </div>
          {error && <div style={{ marginTop: '20px', color: '#F87171', fontWeight: 700 }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', background: '#F1F5F9', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Sidebar - Collapsible on Mobile */}
      <div style={{ 
        width: isMobile ? '60px' : '80px', 
        background: '#1E1B4B', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: isMobile ? '12px 0' : '20px 0', 
        gap: isMobile ? '8px' : '12px', 
        flexShrink: 0 
      }}>
        <div style={{ width: isMobile ? 36 : 50, height: isMobile ? 36 : 50, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
           <Coffee size={isMobile ? 18 : 24} color="#fff" />
        </div>
        
        {[
          { icon: <Clock size={isMobile ? 18 : 20} />, label: isMobile ? null : 'Salle', mode: 'tables' as ViewMode },
          { icon: <Plus size={isMobile ? 18 : 20} />, label: isMobile ? null : 'Session', mode: 'simplistic' as ViewMode },
          { icon: <ClipboardList size={isMobile ? 18 : 20} />, label: isMobile ? null : 'Journal', mode: 'journal' as ViewMode },
          { icon: <History size={isMobile ? 18 : 20} />, label: isMobile ? null : 'Histo', mode: 'history' as ViewMode }
        ].map(btn => (
          <button key={btn.mode} onClick={() => setViewMode(btn.mode)}
            style={{ 
              width: isMobile ? '44px' : '64px', height: isMobile ? '44px' : '64px', borderRadius: '16px', border: 'none', cursor: 'pointer', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              background: (viewMode === btn.mode || (btn.mode === 'tables' && viewMode === 'order')) ? '#6366F1' : 'transparent', 
              color: '#fff', transition: 'all 0.2s'
            }}>
            {btn.icon}
            {btn.label && <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8 }}>{btn.label}</span>}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={{ width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, borderRadius: '14px', background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={isMobile ? 16 : 20} /></button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: '64px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#6366F110', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Coffee size={20} color="#6366F1" />
              </div>
              <div>
                 <div style={{ fontWeight: 900, fontSize: '16px', color: '#1E1B4B', lineHeight: 1.2 }}>{storeName}</div>
                 <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {viewMode === 'tables' ? 'Plan de Salle' : viewMode === 'order' ? 'Prise de Commande' : viewMode === 'simplistic' ? 'Mode Simplifié' : 'Historique'}
                 </div>
              </div>
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: '#F8FAFC', borderRadius: '100px', border: '1px solid #E2E8F0', marginRight: '8px' }}>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{cashierName}</div>
                    <div style={{ fontSize: '9px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                       <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> EN LIGNE
                    </div>
                 </div>
                 <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)' }}>
                    {cashierName?.charAt(0)}
                 </div>
              </div>

              <div style={{ height: '32px', width: '1px', background: '#E2E8F0', margin: '0 4px' }} />

              <button 
                onClick={() => router.push('/')}
                style={{ height: '40px', padding: '0 16px', borderRadius: '10px', background: '#fff', border: '1.5px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>

              <button 
                onClick={handleLogout}
                style={{ height: '40px', width: '40px', borderRadius: '10px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'}
                onMouseOut={(e) => e.currentTarget.style.background = '#FEF2F2'}
              >
                <LogOut size={18} />
              </button>
           </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
           {viewMode === 'tables' && (
             <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                   <button onClick={() => { setActiveTable('direct'); setViewMode('order'); }}
                     style={{ padding: '14px 24px', borderRadius: '12px', background: '#6366F1', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>+ Vente Directe</button>
                   <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={box}><div style={{ fontSize: '10px', color: '#94A3B8' }}>MON CA</div><div style={{ fontSize: '18px', fontWeight: 900 }}>{dailyTotal.toFixed(3)} DT</div></div>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                   {initialTables.map(table => {
                     const orderData = tableOrders[table.id];
                     const hasOrder = orderData && orderData.items.length > 0;
                     const isMine = orderData?.baristaId === cashierId;
                     const total = orderData?.items.reduce((a, i) => a + i.price * i.quantity, 0) || 0;
                     
                     return (
                       <button key={table.id} onClick={() => { setActiveTable(table.id); setViewMode('order'); }}
                         style={{ height: '160px', borderRadius: '24px', border: hasOrder ? '3px solid #6366F1' : '1px solid #E2E8F0', background: hasOrder ? '#EEF2FF' : '#fff', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                         <div style={{ fontWeight: 900, fontSize: '20px' }}>{table.label}</div>
                         <div style={{ fontSize: '11px', color: '#94A3B8' }}>{table.capacity} Personnes</div>
                         {hasOrder && (
                           <div style={{ marginTop: '12px' }}>
                              <div style={{ background: '#6366F1', color: '#fff', padding: '2px 10px', borderRadius: '100px', fontSize: '13px', fontWeight: 800 }}>{total.toFixed(3)} DT</div>
                              <div style={{ marginTop: '8px', fontSize: '10px', color: isMine ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                                {isMine ? 'Ma Commande' : `Par ${orderData.baristaName}`}
                              </div>
                           </div>
                         )}
                         {hasOrder && !isMine && <div style={{ position: 'absolute', top: 12, right: 12 }}><Lock size={14} color="#F59E0B" /></div>}
                       </button>
                     );
                   })}
                </div>
             </div>
           )}

           {viewMode === 'order' && (
             <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ flex: 1, background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ padding: '20px', display: 'flex', gap: '12px' }}>
                      <button onClick={() => setViewMode('tables')} style={{ padding: '8px 16px', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>← Tables</button>
                   </div>
                    <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }} className="no-scrollbar">
                       {categories.map(cat => (
                         <button key={cat} onClick={() => setPosCategory(cat)}
                           style={{ padding: '10px 20px', borderRadius: '100px', background: posCategory === cat ? '#6366F1' : '#fff', color: posCategory === cat ? '#fff' : '#64748B', border: '1px solid', borderColor: posCategory === cat ? '#6366F1' : '#E2E8F0', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}>
                           {cat}
                         </button>
                       ))}
                    </div>
                    <div style={{ flex: 1, padding: '0 20px 20px', overflow: 'auto' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                          {initialProducts
                            .filter(p => {
                               if (posCategory !== 'Tous' && p.category !== posCategory) return false;
                               const isPack = packagingProducts.find(pp => pp.id === p.id);
                               if (isPack && posCategory === 'Tous') return false; 
                               return true;
                            })
                            .map(p => (
                            <button key={p.id} onClick={() => addItem(p)}
                              style={{ padding: '16px', borderRadius: '16px', background: '#fff', border: '1px solid #E2E8F0', cursor: 'pointer', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <div style={{ fontWeight: 800, fontSize: '14px', color: '#1E1B4B' }}>{p.name}</div>
                              <div style={{ color: '#6366F1', fontWeight: 800 }}>{p.price.toFixed(3)} DT</div>
                            </button>
                          ))}
                       </div>
                    </div>
                </div>

                <div style={{ width: '400px', background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{activeTable === 'direct' ? 'Vente Directe' : `Table ${initialTables.find(t => t.id === activeTable)?.label}`}</h2>
                      <button onClick={() => updateTableOrders({ ...tableOrders, [activeTable!]: { ...currentTableOrder!, items: [] } })} style={{ color: '#EF4444', background: 'none', border: 'none' }}><Trash2 size={20} /></button>
                   </div>
                   <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                      {currentOrderItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '8px' }}>
                           <div style={{ flex: 1 }}>
                             <div style={{ fontWeight: 800 }}>{item.name}</div>
                             <div style={{ fontSize: '12px', color: '#94A3B8' }}>{item.price.toFixed(3)} x {item.quantity}
                                 <button onClick={(e) => {
                                   e.stopPropagation();
                                   const p = prompt("Nouveau prix unitaire:", item.price.toString());
                                   if (p !== null) {
                                     const val = parseFloat(p.replace(',', '.'));
                                     if (!isNaN(val)) updateItemPrice(item.productId, val);
                                   }
                                 }} style={{ color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Edit2 size={12} /></button>
</div>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <div style={{ fontWeight: 900, color: '#1E293B', marginRight: '8px' }}>{(item.price * item.quantity).toFixed(3)}</div>
                             <button onClick={() => {
                               const { [activeTable!]: current, ...rest } = tableOrders;
                               const newItems = current.items.filter(i => i.productId !== item.productId);
                               updateTableOrders({ ...rest, [activeTable!]: { ...current, items: newItems } });
                             }} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                               <Trash2 size={16} />
                             </button>
                           </div>
                        </div>
                      ))}
                      {currentOrderItems.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Panier vide.</div>}
                   </div>
                   <div style={{ padding: '24px', background: '#F1F5F9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                         <span style={{ fontWeight: 700, color: '#64748B' }}>TOTAL</span>
                         <span style={{ fontSize: '28px', fontWeight: 900, color: '#6366F1' }}>{currentTotal.toFixed(3)} DT</span>
                      </div>
                      <button onClick={validateOrder} disabled={currentOrderItems.length === 0}
                        style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#10B981', color: '#fff', fontSize: '18px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>ENCAISSER</button>
                   </div>
                </div>
             </div>
           )}

           {viewMode === 'history' && (
             <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                <h2 style={{ fontWeight: 900, marginBottom: '24px' }}>Mon Historique (cliquez pour détails)</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                   {dailySales.map(sale => {
                     const isExpanded = expandedSaleId === sale.id;
                     return (
                       <div key={sale.id} onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)} 
                         style={{ ...box, display: 'flex', flexDirection: 'column', cursor: 'pointer', borderLeft: sale.total === 0 ? '4px solid #EF4444' : '4px solid #10B981' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div>
                                <div style={{ fontWeight: 800, fontSize: '15px' }}>{sale.table}</div>
                                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                  {sale.time} • Pris: <span style={{fontWeight:700, color:'#6366F1'}}>{sale.takenBy}</span>
                                </div>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ fontWeight: 900, color: sale.total === 0 ? '#EF4444' : '#10B981', fontSize: '18px' }}>
                                 {sale.total === 0 ? 'PERTE' : `${Number(sale.total).toFixed(3)} DT`}
                               </div>
                               {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                             </div>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ marginTop: '12px', padding: '10px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                               {sale.items?.map((item: any, idx: number) => (
                                 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                   <span style={{ fontWeight: 600 }}>{item.quantity}X {item.name}</span>
                                   <span style={{ color: '#64748B' }}>{(Number(item.price) * item.quantity).toFixed(3)} DT</span>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
             </div>
           )}

           {viewMode === 'journal' && (() => {
             const myCasings = dailySales.filter(s => s.cashierId === cashierId);
             const myOrdersCashedByOthers = dailySales.filter(s => s.takenById === cashierId && s.cashierId !== cashierId);
             
             const totalCashed = myCasings.reduce((a, b) => a + Number(b.total), 0);
             const totalOrdersByMeOthersCashed = myOrdersCashedByOthers.reduce((a, b) => a + Number(b.total), 0);
             
             return (
               <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                  <h2 style={{ fontWeight: 900, marginBottom: '24px' }}>Mon Journal de Caisse</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                     <div style={{ ...box, background: '#10B981', color: '#fff', border: 'none' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, opacity: 0.9 }}>TOTAL ENCAISSÉ (DANS MON TIROIR)</div>
                        <div style={{ fontSize: '32px', fontWeight: 900 }}>{totalCashed.toFixed(3)} DT</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>{myCasings.length} tickets encaissés par moi</div>
                     </div>
                     <div style={{ ...box, background: '#6366F1', color: '#fff', border: 'none' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, opacity: 0.9 }}>MES COMMANDES (ENCAISSÉES PAR D'AUTRES)</div>
                        <div style={{ fontSize: '32px', fontWeight: 900 }}>{totalOrdersByMeOthersCashed.toFixed(3)} DT</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>{myOrdersCashedByOthers.length} tickets pris par moi</div>
                     </div>
                  </div>

                  <h3 style={{ fontWeight: 800, marginBottom: '16px', color: '#1E293B' }}>Détails de mes opérations</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {dailySales.map(sale => {
                      const isExpanded = expandedSaleId === sale.id;
                      return (
                        <div key={sale.id} onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)} 
                          style={{ ...box, display: 'flex', flexDirection: 'column', cursor: 'pointer', borderLeft: sale.total === 0 ? '4px solid #EF4444' : '4px solid #10B981' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                 <div style={{ fontWeight: 800, fontSize: '15px' }}>{sale.table}</div>
                                 <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                   {sale.time} • Pris: <span style={{fontWeight:700, color:'#6366F1'}}>{sale.takenBy}</span>
                                 </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ fontWeight: 900, color: sale.total === 0 ? '#EF4444' : '#10B981', fontSize: '18px' }}>
                                  {sale.total === 0 ? 'PERTE' : `${Number(sale.total).toFixed(3)} DT`}
                                </div>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                           </div>
                           
                           {isExpanded && (
                             <div style={{ marginTop: '12px', padding: '10px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                {sale.items?.map((item: any, idx: number) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600 }}>{item.quantity}X {item.name}</span>
                                    <span style={{ color: '#64748B' }}>{(Number(item.price) * item.quantity).toFixed(3)} DT</span>
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      );
                    })}
                    {myCasings.length === 0 && myOrdersCashedByOthers.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>Aucune opération trouvée.</div>
                    )}
                  </div>
               </div>
             );
            })()}

            {viewMode === 'simplistic' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: isMobile ? '12px' : '30px', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '16px' : '30px' }}>
                  <div>
                    <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 900, color: '#1E1B4B', margin: 0 }}>Comptage de Session</h2>
                    {!isMobile && <p style={{ color: '#64748B', fontSize: '18px', marginTop: '4px' }}>{isLossMode ? 'MODE PERTE (DÉFECTUEUX)' : 'MODE VENTE (NORMAL)'}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', padding: '4px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <ShoppingBag size={18} color={isTakeawayMode ? '#6366F1' : '#94A3B8'} />
                      <select 
                        value={packagingId || ''} 
                        onChange={(e) => setPackagingId(e.target.value)}
                        style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, outline: 'none', color: '#1E293B' }}
                      >
                        <option value="">Aucun Emballage</option>
                        {initialProducts
                          .filter(p => p.name.toLowerCase().includes('gobelet') || p.name.toLowerCase().includes('emballage') || p.name.toLowerCase().includes('sac') || p.name.toLowerCase().includes('boite'))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))
                        }
                      </select>
                      <button 
                        onClick={() => setIsTakeawayMode(!isTakeawayMode)}
                        style={{ padding: '6px 10px', borderRadius: '8px', background: isTakeawayMode ? '#6366F1' : '#CBD5E1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
                      >
                        {isTakeawayMode ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <button 
                      className={`btn ${isLossMode ? 'btn-danger' : 'btn-primary'}`}
                      style={{ height: '48px', padding: '0 20px', fontSize: '14px', fontWeight: 800 }}
                      onClick={() => setIsLossMode(!isLossMode)}
                    >
                      {isLossMode ? 'PASSÉ EN VENTE' : 'PASSÉ EN PERTE'}
                    </button>
                    <button onClick={resetSimplistic} style={{ padding: '8px 16px', borderRadius: '12px', background: '#FEE2E2', color: '#EF4444', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '160px' : '220px'}, 1fr))`, gap: isMobile ? '12px' : '20px' }}>
                    {initialProducts.map(p => {
                      const qty = simplisticSession[p.id] || 0;
                      const lossQty = simplisticLosses[p.id] || 0;
                      return (
                        <button key={p.id} onClick={() => addSimplistic(p.id)}
                          style={{ 
                            height: isMobile ? '140px' : '180px', borderRadius: isMobile ? '20px' : '30px', background: '#fff', border: '2px solid #E2E8F0', 
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                            justifyContent: 'center', gap: isMobile ? '8px' : '12px', transition: 'all 0.2s', position: 'relative',
                            boxShadow: (qty > 0 || lossQty > 0) ? '0 10px 15px -3px rgba(99, 102, 241, 0.1)' : 'none',
                            borderColor: isLossMode ? (lossQty > 0 ? '#EF4444' : '#E2E8F0') : (qty > 0 ? '#6366F1' : '#E2E8F0')
                          }}>
                          {isTakeawayMode && packagingId && (
                             <div style={{ position: 'absolute', top: 12, left: 12 }}>
                                <ShoppingBag size={14} color="#6366F1" />
                             </div>
                          )}
                          <div style={{ fontWeight: 800, fontSize: isMobile ? '16px' : '20px', color: '#1E293B', textAlign: 'center', padding: '0 8px' }}>{p.name}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {qty > 0 && <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#6366F1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900 }}>{qty}</div>}
                            {lossQty > 0 && <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900 }}>{lossQty}</div>}
                          </div>
                          <div style={{ color: '#6366F1', fontWeight: 800, fontSize: isMobile ? '14px' : '18px' }}>{p.price.toFixed(3)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                  <button onClick={validateSimplistic} 
                    style={{ 
                      flex: 1, height: isMobile ? '70px' : '100px', borderRadius: isMobile ? '20px' : '30px', 
                      background: isLossMode ? '#EF4444' : (simplisticTotal > 0 ? '#10B981' : '#CBD5E1'), 
                      color: '#fff', fontSize: isMobile ? '16px' : '20px', fontWeight: 900, border: 'none', 
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                      justifyContent: 'center', boxShadow: 'none'
                    }}>
                    <Save size={20} />
                    <span>
                      {isLossMode ? 'VALIDER PERTES' : `VALIDER VENTES : ${simplisticTotal.toFixed(3)} DT`}
                    </span>
                    {Object.values(simplisticLosses).reduce((a,b)=>a+b, 0) > 0 && !isLossMode && (
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>({Object.values(simplisticLosses).reduce((a,b)=>a+b, 0)} pertes en cours)</span>
                    )}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
      {/* MODAL EMBALLAGE */}
      {showPackagingPopup && pendingProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '440px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '18px', background: '#6366F110', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={28} color="#6366F1" />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1E1B4B', margin: 0 }}>Mode de Service</h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>{pendingProduct.name}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => popupTriggerMode === 'ORDER' ? addItem(pendingProduct, null) : addSimplistic(pendingProduct.id, null)}
                style={{ height: '70px', borderRadius: '20px', background: '#F8FAFC', border: '2px solid #E2E8F0', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#F0F9FF'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee size={20} color="#64748B" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '16px' }}>Sur Place</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Consommation sur place</div>
                </div>
              </button>

              <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ou À Emporter</span>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {packagingProducts.length > 0 ? (
                  packagingProducts.map(pack => (
                    <button 
                      key={pack.id}
                      onClick={() => popupTriggerMode === 'ORDER' ? addItem(pendingProduct, pack) : addSimplistic(pendingProduct.id, pack)}
                      style={{ height: '120px', borderRadius: '20px', background: '#6366F110', border: '2px solid #6366F120', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366F140'; e.currentTarget.style.background = '#6366F115'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#6366F120'; e.currentTarget.style.background = '#6366F110'; }}
                    >
                       <ShoppingBag size={24} color="#6366F1" />
                       <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '13px', textAlign: 'center' }}>{pack.name}</div>
                    </button>
                  ))
                ) : (
                  <div style={{ gridColumn: 'span 2', padding: '20px', borderRadius: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                    Aucun produit "Emballage" (Gobelet, etc.) n'a été trouvé dans votre catalogue. 
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => { setShowPackagingPopup(false); setPendingProduct(null); }}
              style={{ width: '100%', marginTop: '24px', height: '48px', borderRadius: '14px', background: 'transparent', color: '#94A3B8', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
