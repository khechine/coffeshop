'use client';
import React, { useEffect, useState } from 'react';
import { useToast } from '../../../components/Toast';
import { Zap } from 'lucide-react';

export default function PredictiveAlertsManager() {
  const { showToast } = useToast();
  const [seenAlerts, setSeenAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkAlerts = async () => {
      const { getPredictiveAlertsAction } = await import('../../../actions');
      try {
        const alerts = await getPredictiveAlertsAction();
        alerts.forEach((alert: any) => {
          if (!seenAlerts.has(alert.id)) {
            showToast(
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E31E24', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>
                  <Zap size={14} /> Opportunité de Vente
                </div>
                <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: 1.4 }}>
                   <strong>{alert.clientName}</strong> ({alert.city}) aura bientôt besoin de <strong>{alert.productName}</strong>.
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                   <span>À {alert.distance} km</span>
                   <span>Stock : {alert.currentQty} / {alert.threshold}</span>
                </div>
              </div>,
              'info'
            );
            setSeenAlerts(prev => {
                const next = new Set(prev);
                next.add(alert.id);
                return next;
            });
          }
        });
      } catch (e) {}
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [seenAlerts, showToast]);

  return null;
}
