'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Bell, Menu, X } from 'lucide-react';

export default function LayoutShell({ 
  children, 
  storeName, 
  storeCity,
  hasMarketplace = true
}: { 
  children: React.ReactNode; 
  storeName: string; 
  storeCity: string;
  hasMarketplace?: boolean;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
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
      <Sidebar storeName={storeName} isMobileOpen={isMenuOpen} hasMarketplace={hasMarketplace} />

      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`} style={{ marginLeft: isCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)' }}>
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
            <div className="alert-bell">
              <Bell size={18} />
              <span className="alert-dot" />
            </div>
            <div className="user-avatar" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
              G
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

