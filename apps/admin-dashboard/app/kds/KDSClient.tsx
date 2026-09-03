'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { 
  Flame, Clock, CheckCircle2, AlertTriangle, RefreshCw, 
  Volume2, VolumeX, Maximize, Minimize, History, Filter, 
  ChefHat, Coffee, Utensils, ArrowLeft, Play, Sparkles
} from 'lucide-react';
import { updateKdsOrderStatusAction, getKdsOrdersAction } from '../actions';
import Link from 'next/link';

interface KdsItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  notes?: string;
}

interface KdsOrder {
  id: string;
  orderNumber: string;
  tableName: string;
  customerName: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  createdAt: string;
  items: KdsItem[];
}

export default function KDSClient({ initialOrders = [] }: { initialOrders: KdsOrder[] }) {
  const [orders, setOrders] = useState<KdsOrder[]>(initialOrders);
  const [historyOrders, setHistoryOrders] = useState<KdsOrder[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  const prevOrdersCountRef = useRef<number>(initialOrders.length);

  // Tick clock every second for live timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio API Synthesizer Chime for new order notifications
  const playNewOrderChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

      osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.warn("Audio chime play error:", err);
    }
  };

  // Poll for new orders every 5 seconds
  const fetchOrders = async () => {
    try {
      const latestOrders = await getKdsOrdersAction(selectedStation);
      setOrders(prev => {
        if (latestOrders.length > prevOrdersCountRef.current) {
          playNewOrderChime();
        }
        prevOrdersCountRef.current = latestOrders.length;
        return latestOrders;
      });
    } catch (err) {
      console.error("KDS fetch failed:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [selectedStation, isMuted]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Order status update
  const handleStatusChange = async (orderId: string, currentStatus: string) => {
    let nextStatus: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' = 'PREPARING';
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'SERVED';

    // Optimistic UI Update
    const targetOrder = orders.find(o => o.id === orderId);
    if (nextStatus === 'SERVED') {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (targetOrder) {
        setHistoryOrders(prev => [{ ...targetOrder, status: 'SERVED' }, ...prev.slice(0, 19)]);
      }
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    }

    startTransition(async () => {
      try {
        await updateKdsOrderStatusAction(orderId, nextStatus);
      } catch (err) {
        console.error("Status update error:", err);
        fetchOrders();
      }
    });
  };

  // Recall served order
  const handleRecallOrder = async (order: KdsOrder) => {
    setHistoryOrders(prev => prev.filter(o => o.id !== order.id));
    setOrders(prev => [...prev, { ...order, status: 'READY' }]);
    startTransition(async () => {
      try {
        await updateKdsOrderStatusAction(order.id, 'READY');
      } catch (err) {
        fetchOrders();
      }
    });
  };

  // Compute elapsed time in seconds
  const getElapsedSeconds = (createdAtStr: string) => {
    const created = new Date(createdAtStr).getTime();
    const now = currentTime.getTime();
    return Math.max(0, Math.floor((now - created) / 1000));
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter orders by station
  const filteredOrders = orders.filter(order => {
    if (selectedStation === 'ALL') return true;
    if (selectedStation === 'CUISINE') {
      return order.items.some(i => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('plat') || cat.includes('salé') || cat.includes('viennoiserie') || cat.includes('cuis');
      });
    }
    if (selectedStation === 'BAR') {
      return order.items.some(i => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('café') || cat.includes('boisson') || cat.includes('jus') || cat.includes('bar');
      });
    }
    if (selectedStation === 'PATISSERIE') {
      return order.items.some(i => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('pâtisserie') || cat.includes('gâteau') || cat.includes('dessert');
      });
    }
    return true;
  });

  // Calculate metrics
  const activeCount = filteredOrders.length;
  const pendingCount = filteredOrders.filter(o => o.status === 'PENDING').length;
  const preparingCount = filteredOrders.filter(o => o.status === 'PREPARING').length;
  const readyCount = filteredOrders.filter(o => o.status === 'READY').length;
  const urgentCount = filteredOrders.filter(o => getElapsedSeconds(o.createdAt) > 600).length;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0F172A', 
      color: '#F8FAFC', 
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ── TOP KDS HEADER BAR ─────────────────────────────────────── */}
      <header style={{ 
        height: 68, 
        backgroundColor: '#1E293B', 
        borderBottom: '1px solid #334155', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/pos" style={{ color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={18} /> POS
          </Link>
          <div style={{ width: 1, height: 24, backgroundColor: '#334155' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              <ChefHat size={22} color="#FFF" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '0.5px', color: '#FFF' }}>KDS CUISINE & BAR</h1>
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Écran de préparation en temps réel</span>
            </div>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#0F172A', padding: 4, borderRadius: 12, border: '1px solid #334155' }}>
          {[
            { id: 'ALL', label: 'Toutes', icon: Utensils },
            { id: 'CUISINE', label: 'Cuisine', icon: ChefHat },
            { id: 'BAR', label: 'Bar & Cafés', icon: Coffee },
            { id: 'PATISSERIE', label: 'Pâtisserie', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const active = selectedStation === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStation(tab.id)}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: active ? '#2563EB' : 'transparent',
                  color: active ? '#FFF' : '#94A3B8',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Audio Chime Toggle */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Activer les sons" : "Désactiver les sons"}
            style={{ 
              width: 42, height: 42, borderRadius: 10, border: '1px solid #334155', 
              backgroundColor: isMuted ? '#EF444422' : '#1E293B', 
              color: isMuted ? '#EF4444' : '#10B981', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* History Recall Toggle */}
          <button 
            onClick={() => setShowHistory(!showHistory)}
            title="Historique des commandes servies"
            style={{ 
              height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #334155', 
              backgroundColor: showHistory ? '#2563EB' : '#1E293B', 
              color: '#FFF', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 
            }}
          >
            <History size={18} /> Rappel ({historyOrders.length})
          </button>

          {/* Refresh Button */}
          <button 
            onClick={fetchOrders}
            title="Actualiser les commandes"
            style={{ 
              width: 42, height: 42, borderRadius: 10, border: '1px solid #334155', 
              backgroundColor: '#1E293B', color: '#94A3B8', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <RefreshCw size={18} className={isPending ? 'animate-spin' : ''} />
          </button>

          {/* Fullscreen Toggle */}
          <button 
            onClick={toggleFullscreen}
            title="Plein écran tactile"
            style={{ 
              width: 42, height: 42, borderRadius: 10, border: '1px solid #334155', 
              backgroundColor: '#1E293B', color: '#FFF', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* ── METRICS SUMMARY RIBBON ───────────────────────────────── */}
      <div style={{ 
        backgroundColor: '#020617', 
        borderBottom: '1px solid #1E293B', 
        padding: '10px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: 700
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8' }}>
            <span>Total actives :</span>
            <span style={{ color: '#FFF', fontSize: 16, fontWeight: 900 }}>{activeCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F59E0B' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <span>En attente :</span>
            <span style={{ fontSize: 16, fontWeight: 900 }}>{pendingCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3B82F6' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3B82F6' }} />
            <span>En prép :</span>
            <span style={{ fontSize: 16, fontWeight: 900 }}>{preparingCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span>Prêtes :</span>
            <span style={{ fontSize: 16, fontWeight: 900 }}>{readyCount}</span>
          </div>
        </div>

        {urgentCount > 0 && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            backgroundColor: '#EF444422', border: '1px solid #EF444488', color: '#EF4444', 
            padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900
          }}>
            <AlertTriangle size={16} /> {urgentCount} commande(s) urgente(s) {'>'} 10 min
          </div>
        )}
      </div>

      {/* ── MAIN KDS TICKET CARDS GRID ───────────────────────────── */}
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        {showHistory ? (
          /* History Recall View */
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#3B82F6' }}>
              📜 Historique des dernières commandes servies (Rappel)
            </h2>
            {historyOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>Aucune commande servie récemment</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {historyOrders.map(order => (
                  <div key={order.id} style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 16, border: '1px solid #334155', opacity: 0.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 900, fontSize: 16 }}>#{order.orderNumber}</span>
                      <span style={{ color: '#94A3B8', fontSize: 13 }}>{order.tableName}</span>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: 13, color: '#CBD5E1', margin: '4px 0' }}>
                          <strong>{item.quantity}x</strong> {item.name}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleRecallOrder(order)}
                      style={{ width: '100%', height: 42, borderRadius: 10, border: 'none', backgroundColor: '#2563EB', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                    >
                      ↩️ Rappeler en Cuisine
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div style={{ 
            height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', gap: 16 
          }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={40} color="#475569" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#94A3B8' }}>Aucune commande en attente</h2>
            <p style={{ margin: 0, fontSize: 14 }}>Les nouvelles commandes saisies sur le POS apparaîtront automatiquement ici.</p>
          </div>
        ) : (
          /* Cards Grid */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 20, 
            alignItems: 'start' 
          }}>
            {filteredOrders.map(order => {
              const elapsedSeconds = getElapsedSeconds(order.createdAt);
              const isUrgent = elapsedSeconds > 600; // > 10 mins
              const isWarning = elapsedSeconds > 300 && elapsedSeconds <= 600; // 5-10 mins

              // Card Border & Status Color
              let statusBg = '#F59E0B';
              let statusLabel = 'EN ATTENTE';
              let actionLabel = '▶️ Démarrer';
              let actionBg = '#2563EB';

              if (order.status === 'PREPARING') {
                statusBg = '#3B82F6';
                statusLabel = 'EN PREP.';
                actionLabel = '✅ Marquer Prêt';
                actionBg = '#10B981';
              } else if (order.status === 'READY') {
                statusBg = '#10B981';
                statusLabel = 'PRÊT';
                actionLabel = '🚀 Servi';
                actionBg = '#475569';
              }

              let cardBorderColor = '#334155';
              if (isUrgent) cardBorderColor = '#EF4444';
              else if (isWarning) cardBorderColor = '#F59E0B';

              return (
                <div 
                  key={order.id}
                  style={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: 20, 
                    border: `2px solid ${cardBorderColor}`,
                    boxShadow: isUrgent ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    animation: isUrgent ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ 
                    backgroundColor: '#0F172A', 
                    padding: '14px 18px', 
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>#{order.orderNumber}</span>
                        <span style={{ 
                          fontSize: 11, fontWeight: 900, backgroundColor: statusBg, color: '#FFF', 
                          padding: '3px 8px', borderRadius: 6 
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700, marginTop: 2 }}>
                        {order.tableName}
                      </div>
                    </div>

                    {/* Timer Badge */}
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, 
                      backgroundColor: isUrgent ? '#EF444422' : (isWarning ? '#F59E0B22' : '#10B98122'), 
                      color: isUrgent ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981'),
                      border: `1px solid ${isUrgent ? '#EF444488' : (isWarning ? '#F59E0B88' : '#10B98188')}`,
                      padding: '6px 10px',
                      borderRadius: 10,
                      fontWeight: 900,
                      fontSize: 14
                    }}>
                      <Clock size={16} />
                      {formatElapsedTime(elapsedSeconds)}
                    </div>
                  </div>

                  {/* Card Items List */}
                  <div style={{ padding: 18, flex: 1, minHeight: 140 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: i < order.items.length - 1 ? '1px dashed #334155' : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ 
                            fontSize: 18, fontWeight: 900, color: '#F59E0B', 
                            backgroundColor: '#F59E0B15', minWidth: 32, height: 32, 
                            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                          }}>
                            {item.quantity}x
                          </span>
                          <div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC' }}>{item.name}</span>
                            {item.notes && (
                              <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 700, marginTop: 2 }}>
                                ⚠️ Note : {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Action Button (Large Touch Target 60px) */}
                  <button
                    onClick={() => handleStatusChange(order.id, order.status)}
                    style={{
                      height: 60,
                      width: '100%',
                      border: 'none',
                      backgroundColor: actionBg,
                      color: '#FFF',
                      fontSize: 16,
                      fontWeight: 900,
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
