'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ClipboardList, User, Search, Menu, MessageSquare, Users } from 'lucide-react';
import { CartProvider } from '../marketplace/CartContext';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Accueil', icon: Home, href: '/mobile' },
    { label: 'Marketplace', icon: Search, href: '/mobile/marketplace' },
    { label: 'Commandes', icon: ClipboardList, href: '/mobile/orders' },
    { label: 'Profil', icon: User, href: '/mobile/profile' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', color: '#111827', display: 'flex', flexDirection: 'column' }}>
      
      {/* Mobile Header - Compact & Sticky */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 100, 
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E5E7EB', padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontWeight: 950, fontSize: '18px', color: '#E31E24', letterSpacing: '-0.02em' }}>
          ELKASSA<span style={{ color: '#111827' }}>.</span>
        </div>
        <button style={{ background: '#F3F4F6', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '90px' }}>
        <CartProvider>
          {children}
        </CartProvider>
      </main>

      {/* Bottom Navigation Bar (PWA Style) */}
      <nav style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        background: '#fff', borderTop: '1px solid #E5E7EB', 
        padding: '8px 12px 24px', // Extra bottom padding for iOS home bar
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 1000, boxShadow: '0 -10px 25px rgba(0,0,0,0.05)'
      }}>
        {(pathname.startsWith('/mobile/vendor') ? [
          { label: 'Accueil', icon: Home, href: '/mobile/vendor' },
          { label: 'Commandes', icon: ClipboardList, href: '/mobile/vendor/orders' },
          { label: 'Messages', icon: MessageSquare, href: '/mobile/vendor/messages' },
          { label: 'CRM', icon: Users, href: '/mobile/vendor/crm' },
          { label: 'Profil', icon: User, href: '/mobile/profile' }
        ] : navItems).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                textDecoration: 'none', color: isActive ? '#E31E24' : '#6B7280',
                transition: 'all 0.2s'
              }}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 800 : 600 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        body {
          -webkit-tap-highlight-color: transparent;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
