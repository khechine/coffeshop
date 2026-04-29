'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Pointer, Banknote, Utensils, AlertCircle } from 'lucide-react';

type LiveEvent = {
  id: string;
  type: 'rachma_tap' | 'sale_completed' | 'table_updated';
  timestamp: Date;
  data: any;
};

// Assuming the API is on the same domain or a known backend domain
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com';

export default function LiveDashboardPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [ongoingTotal, setOngoingTotal] = useState(0);

  useEffect(() => {
    // 1. Get user from local storage
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const user = JSON.parse(storedUserStr);
        if (user.storeId) {
          setStoreId(user.storeId);
        }
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!storeId) return;

    // 2. Connect to WebSocket
    const socket: Socket = io(BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_store', { storeId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('live_activity', (payload: any) => {
      const newEvent: LiveEvent = {
        id: Math.random().toString(36).substring(7),
        type: payload.type,
        timestamp: new Date(),
        data: payload.data || payload,
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100

      if ((payload.type === 'rachma_tap' || payload.type === 'table_updated') && payload.data?.price) {
        const amt = Number(payload.data.price);
        if (!isNaN(amt)) {
          setOngoingTotal(prev => prev + (payload.data.action === 'add' ? amt : -amt));
        }
      }

      if (payload.type === 'sale_completed' && payload.data) {
        const totalRaw = payload.data.total;
        let amountToAdd = 0;
        
        // Handle Decimal.js structure or direct numbers/strings
        if (typeof totalRaw === 'number') {
          amountToAdd = totalRaw;
        } else if (typeof totalRaw === 'string') {
          amountToAdd = parseFloat(totalRaw);
        } else if (totalRaw && typeof totalRaw === 'object') {
          // Prisma/Decimal.js case
          if (totalRaw.d && Array.isArray(totalRaw.d)) {
            amountToAdd = Number(totalRaw.d.join('')) / Math.pow(10, totalRaw.e || 0);
          } else if (typeof totalRaw.toString === 'function') {
            const strVal = totalRaw.toString();
            if (strVal !== '[object Object]') amountToAdd = parseFloat(strVal);
          }
        }
        
        if (!isNaN(amountToAdd) && amountToAdd > 0) {
          setTodayTotal((prev) => prev + amountToAdd);
          // When a sale is committed, we can't easily know which "ongoing" taps it clears 
          // without a complex sync, so we just let the user know it's committed.
          // Usually, ongoing should be manually reset or handled per-table.
          // For now, let's NOT reset ongoingTotal to 0, but let it grow/shrink naturally.
          // Or we can subtract if we have the detail.
        }
      }
    });

    return () => {
      socket.emit('leave_store', { storeId });
      socket.disconnect();
    };
  }, [storeId]);

  const renderEventIcon = (type: string) => {
    switch (type) {
      case 'rachma_tap': return <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Pointer size={18} className="text-emerald-500" /></div>;
      case 'sale_completed': return <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><Banknote size={18} className="text-indigo-500" /></div>;
      case 'table_updated': return <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Utensils size={18} className="text-amber-500" /></div>;
      default: return <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><AlertCircle size={18} className="text-white" /></div>;
    }
  };

  const renderEventDescription = (event: LiveEvent) => {
    if (event.type === 'rachma_tap' || event.type === 'table_updated') {
      const actionText = event.data.action === 'add' ? 'a ajouté' : 'a retiré';
      const productName = event.data.productName ? ` ${event.data.productName}` : ' un produit';
      const takeawayText = event.data.isTakeaway ? ' (à emporter)' : '';
      const modeContext = event.type === 'table_updated' ? `(${event.data.tableName})` : '(Rachma)';
      return <span className="text-white text-sm"><span className="font-bold text-slate-200">{event.data.baristaName || event.data.baristaId}</span> {actionText}<span className="font-bold text-white">{productName}</span>{takeawayText} <span className="text-slate-400 text-xs font-semibold">{modeContext}</span></span>;
    }
    if (event.type === 'sale_completed') {
      return <p className="text-slate-100 text-[15px]">Vente encaissée pour <span className="text-emerald-400 font-black">{Number(event.data.total).toFixed(3)} DT</span> <span className="text-slate-400 text-sm font-medium">#{event.data.fiscalNumber || event.data.id?.substring(0,6)}</span></p>;
    }
    return <p className="text-slate-100 text-[15px]">Activité enregistrée</p>;
  };

  return (
    <div className="p-8 px-10 max-w-6xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="text-emerald-500" />
            Live Tracker
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            <span className="text-slate-300 text-sm font-semibold">{isConnected ? 'Connecté en direct' : 'Déconnecté / Tentative de reconnexion...'}</span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[32px] flex flex-col items-center justify-center shadow-lg shadow-emerald-500/5">
          <span className="text-emerald-400 text-xs font-black tracking-widest mb-2">ENCAISSÉ (LIVE SÉSSION)</span>
          <span className="text-white text-5xl font-black">{todayTotal.toFixed(3)} DT</span>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-8 rounded-[32px] flex flex-col items-center justify-center shadow-lg shadow-amber-500/5">
          <span className="text-amber-400 text-xs font-black tracking-widest mb-2">EN COURS (TAPS NON CLÔTURÉS)</span>
          <span className="text-white text-5xl font-black">{Math.max(0, ongoingTotal).toFixed(3)} DT</span>
        </div>
      </div>

      {/* Feed */}
      <div>
        <h2 className="text-slate-300 text-xs font-black tracking-[0.2em] mb-6 flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
           FLUX D'ACTIVITÉ EN TEMPS RÉEL
        </h2>
        
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="p-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500">En attente d'activité en magasin...</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.04] transition-colors">
                {renderEventIcon(event.type)}
                <div className="flex-1">
                  {renderEventDescription(event)}
                  <p className="text-slate-400 text-xs mt-1 font-bold tracking-wider">{event.timestamp.toLocaleTimeString('fr-FR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
