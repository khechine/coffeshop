'use client';

import { useState } from 'react';
import { 
  Calendar, Clock, Package, CheckCircle2, 
  ChevronRight, ChevronLeft, Filter, Printer,
  Layers, AlertCircle
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PlanningClient({ initialPlanning }: { initialPlanning: any[] }) {
  const [selectedDate, setSelectedDate] = useState(startOfToday());

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));

  const dayOrders = initialPlanning.filter(o => 
    isSameDay(new Date(o.deliveryDate), selectedDate)
  );

  // Aggregate by product for production list
  const productionSummary = dayOrders.reduce((acc: any, curr: any) => {
    const key = curr.productName;
    if (!acc[key]) {
      acc[key] = { name: key, totalQty: 0, orders: [] };
    }
    acc[key].totalQty += Number(curr.quantity);
    acc[key].orders.push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Planning de Production</h1>
          <p className="text-slate-500 text-sm font-medium">Préparation des commandes à venir</p>
        </div>
        
        <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold transition-all hover:bg-slate-800">
          <Printer size={18} />
          Imprimer la fiche de Prod
        </button>
      </div>

      {/* Date Picker (Horizontal) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => setSelectedDate(day)}
            className={`flex-shrink-0 flex flex-col items-center min-w-[80px] p-4 rounded-2xl border transition-all ${
              isSameDay(day, selectedDate)
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest mb-1">
              {format(day, 'EEE', { locale: fr })}
            </span>
            <span className="text-xl font-black">
              {format(day, 'dd')}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production List (The "What to make") */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Layers className="text-amber-500" size={20} />
              À Préparer pour {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
            </h2>

            <div className="space-y-3">
              {Object.values(productionSummary).length > 0 ? Object.values(productionSummary).map((item: any) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-amber-600 font-black">
                      {item.totalQty}
                    </div>
                    <div>
                      <div className="font-black text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        {item.orders.length} Commande{item.orders.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              )) : (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto text-slate-200 mb-2" size={32} />
                  <p className="text-slate-400 font-bold">Rien à produire pour cette date</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deliveries Side Panel (The "Who gets it") */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Package className="text-indigo-500" size={20} />
              Livraisons / Retraits
            </h2>

            <div className="space-y-4">
              {dayOrders.map((order) => (
                <div key={order.id} className="relative pl-6 border-l-2 border-slate-100 py-1">
                  <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-400">{order.deliveryTime}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      order.status === 'READY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{order.clientName}</div>
                  <div className="text-xs text-slate-500">{order.productName} (x{Number(order.quantity)})</div>
                </div>
              ))}
              
              {dayOrders.length === 0 && (
                <p className="text-sm text-slate-400 font-medium text-center py-4">Aucune livraison prévue</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
