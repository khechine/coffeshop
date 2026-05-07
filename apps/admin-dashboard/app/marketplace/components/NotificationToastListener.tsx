'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, Package, FileText, ArrowRight } from 'lucide-react';
import { getUserNotificationsAction, markNotificationAsReadAction } from '../../actions';

export default function NotificationToastListener() {
  const [activeToasts, setActiveToasts] = useState<any[]>([]);
  const [lastCheckAt, setLastCheckAt] = useState(new Date());

  useEffect(() => {
    const poll = async () => {
      try {
        const notifications = await getUserNotificationsAction();
        if (notifications && notifications.length > 0) {
          // Filter notifications that are newer than the last check
          const newOnes = notifications.filter((n: any) => new Date(n.createdAt) > lastCheckAt);
          
          if (newOnes.length > 0) {
            // Avoid duplicates in active toasts
            setActiveToasts(prev => {
               const existingIds = new Set(prev.map(t => t.id));
               const filteredNew = newOnes.filter(n => !existingIds.has(n.id));
               return [...prev, ...filteredNew];
            });
            setLastCheckAt(new Date());

            // Auto-hide after 10 seconds
            newOnes.forEach((n: any) => {
              setTimeout(() => {
                setActiveToasts(prev => prev.filter(t => t.id !== n.id));
              }, 10000);
            });
          }
        }
      } catch (e) {
        console.error('Polling notifications error:', e);
      }
    };

    // Initial delay to avoid double triggers on mount
    const timer = setTimeout(() => {
      poll();
    }, 1000);

    const interval = setInterval(poll, 10000); // Check every 10 seconds
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [lastCheckAt]);

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'MESSAGE': return <MessageSquare size={20} />;
      case 'ORDER_UPDATE': return <Package size={20} />;
      case 'RFQ_NEW':
      case 'RFQ_QUOTE': return <FileText size={20} />;
      default: return <Bell size={20} />;
    }
  };

  if (activeToasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {activeToasts.map((notif) => (
        <div 
          key={notif.id}
          style={{ 
            width: '350px', 
            background: '#fff', 
            borderRadius: '20px', 
            padding: '20px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid #F1F5F9',
            display: 'flex',
            gap: '16px',
            animation: 'notifSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <style>{`
            @keyframes notifSlideIn {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
          
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: notif.type === 'MESSAGE' ? '#EFF6FF' : '#FEF2F2',
            color: notif.type === 'MESSAGE' ? '#2563EB' : '#E31E24',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {getIcon(notif.type)}
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', margin: '0 0 4px' }}>{notif.title}</h4>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{notif.content}</p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                   markNotificationAsReadAction(notif.id);
                   removeToast(notif.id);
                   if (notif.type === 'MESSAGE') window.location.href = '/marketplace/messages';
                   else if (notif.type.startsWith('RFQ')) window.location.href = '/marketplace/my-requests';
                   else window.location.href = '/marketplace/my-orders';
                }}
                style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '12px', fontWeight: 800, color: '#E31E24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Voir maintenant <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <button 
            onClick={() => removeToast(notif.id)}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
