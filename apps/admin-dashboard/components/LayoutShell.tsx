'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Bell, Menu, X, LogOut, Sun, Moon, ChevronDown } from 'lucide-react';
import { logoutUser } from '../app/actions';

export default function LayoutShell({ 
  children, 
  storeName, 
  storeCity,
  hasMarketplace = true,
  planName = '',
  isFiscalEnabled = false
}: { 
  children: React.ReactNode; 
  storeName: string; 
  storeCity: string;
  hasMarketplace?: boolean;
  planName?: string;
  isFiscalEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [cashierName, setCashierName] = useState<string>('Administrateur');

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    
    // Auth & User
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('pos_cashier_role');
    const savedCashier = localStorage.getItem('pos_cashier');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedRole) setRole(savedRole);
    if (savedCashier) setCashierName(savedCashier);

    // Theme (Corrected for Next.js - apply to HTML)
    const savedTheme = (localStorage.getItem('admin_theme') || 'light') as 'light' | 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('admin_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('pos_cashier');
      localStorage.removeItem('pos_cashier_role');
      localStorage.removeItem('pos_cashier_permissions');
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Initial state from localStorage
    const storedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    setIsCollapsed(storedCollapsed);

    // Listener for sidebar toggle
    const handleToggle = () => {
      const currentCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
      setIsCollapsed(currentCollapsed);
    };

    window.addEventListener('sidebarToggle', handleToggle);
    return () => window.removeEventListener('sidebarToggle', handleToggle);
  }, []);

  // Close menu when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // If the path relates to auth, pos, vendor portal, or superadmin, render without the store dashboard shell
  if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/pos') || pathname.startsWith('/register') || pathname.startsWith('/login') || pathname.startsWith('/vendor/portal') || pathname.startsWith('/superadmin') || pathname.startsWith('/courier')) {
    return <>{children}</>;
  }

  return (
    <div className="saas-shell">
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)} />
      
      {/* Sidebar with mobile-open class */}
      <Sidebar storeName={storeName} isMobileOpen={isMenuOpen} hasMarketplace={hasMarketplace} planName={planName} isFiscalEnabled={isFiscalEnabled} />

      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="topbar-info-desktop">
              <div className="topbar-title">{storeName}</div>
              <div className="topbar-subtitle">
                {storeCity ? `${storeCity}` : 'Dashboard'}
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="alert-bell">
              <Bell size={18} />
              <span className="alert-dot" />
            </div>
            
            <div className="topbar-user-profile">
               <div className="user-info-text">
                  <span className="user-name">{mounted ? cashierName : 'Administrateur'}</span>
                  <span className="user-role">{(role || user?.role || 'STORE_OWNER').replace('_', ' ')}</span>
               </div>
               <div className="user-avatar-wrapper">
                  <div className="user-avatar" style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '15px' }}>
                    {(mounted ? cashierName : 'A').charAt(0).toUpperCase()}
                  </div>
               </div>
               <button onClick={handleLogout} className="topbar-logout-btn" title="Déconnexion">
                  <LogOut size={16} />
               </button>
            </div>
          </div>
        </header>
        <main className="main-body">
          {children}
        </main>
      </div>
    </div>
  );
}

