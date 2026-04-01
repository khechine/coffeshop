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
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md transition-all duration-300 ${
        isAnimating ? 'bg-slate-950/60 opacity-100' : 'bg-slate-950/0 opacity-0 pointer-events-none'
      }`}
    >
      <div
        ref={ref}
        style={{ maxWidth: width }}
        className={`bg-white dark:bg-slate-900 w-full rounded-[32px] shadow-2xl flex flex-col max-h-[calc(100vh-48px)] overflow-hidden transition-all duration-300 transform border border-slate-200 dark:border-slate-800 ${
          isAnimating ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20 transition-all shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
