'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 500 }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.45)', // Lighter, more modern backdrop
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(10px)',
        opacity: isAnimating ? 1 : 0,
        transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        ref={ref}
        style={{
          background: '#FFFFFF', 
          borderRadius: '24px', 
          width: '100%', 
          maxWidth: width,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          display: 'flex', 
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'hidden',
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease',
          opacity: isAnimating ? 1 : 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1E1B4B', margin: 0, letterSpacing: '-0.5px' }}>{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="modal-close-btn"
            style={{ 
              width: 36, height: 36, borderRadius: '12px', border: '1px solid #E2E8F0', 
              background: '#FFFFFF', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: '#64748B', 
              transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FEE2E2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: '28px', 
          overflowY: 'auto', 
          flex: 1, 
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent'
        }}>
          {children}
        </div>
      </div>
      
      <style>{`
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 20px; }
      `}</style>
    </div>
  );
}
