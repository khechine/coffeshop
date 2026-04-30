'use client';

import React, { useState, useEffect } from 'react';
import { BellRing, AlertTriangle, Clock, X } from 'lucide-react';
import { getVendorOrdersWithAlertsAction } from '../../actions';

export default function VendorAlertBar() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getVendorOrdersWithAlertsAction();
        setAlerts(data.alerts || []);
      } catch (e) {
        console.error('Failed to fetch alerts');
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (!isVisible || alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className={`mb-6 p-4 rounded-3xl border-2 shadow-xl transition-all animate-in slide-in-from-top duration-500 ${criticalCount > 0 ? 'bg-rose-50 border-rose-100 shadow-rose-500/5' : 'bg-amber-50 border-amber-100 shadow-amber-500/5'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${criticalCount > 0 ? 'bg-rose-500 shadow-rose-500/20 animate-pulse' : 'bg-amber-500 shadow-amber-500/20'}`}>
            <BellRing size={20} />
          </div>
          <div>
            <div className={`text-sm font-black ${criticalCount > 0 ? 'text-rose-900' : 'text-amber-900'}`}>
              {criticalCount > 0 ? `${criticalCount} Alertes Critiques` : `${alerts.length} Notifications Système`}
            </div>
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
              <Clock size={12} /> {alerts[0]?.message} (via {alerts[0]?.posName})
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-2 hover:bg-white/50 rounded-xl transition-colors text-slate-400"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
