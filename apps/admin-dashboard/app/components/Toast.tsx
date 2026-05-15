'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: React.ReactNode, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: string; message: React.ReactNode; type: ToastType }[]>([]);

  const showToast = (message: React.ReactNode, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        {toasts.map(t => (
          <div 
            key={t.id}
            style={{ 
              minWidth: '300px', 
              background: '#fff', 
              borderRadius: '16px', 
              padding: '16px 24px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <style>{`
              @keyframes toastIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            
            {t.type === 'success' && <CheckCircle2 size={20} color="#10B981" />}
            {t.type === 'error' && <AlertCircle size={20} color="#EF4444" />}
            {t.type === 'info' && <Info size={20} color="#3B82F6" />}
            
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', flex: 1 }}>{t.message}</div>
            
            <button 
              onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', marginLeft: 'auto' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
