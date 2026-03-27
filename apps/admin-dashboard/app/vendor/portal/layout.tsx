'use client';

import React, { useState } from 'react';
import { Package, Truck, LayoutDashboard, Settings, LogOut, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/vendor/portal' },
    { id: 'catalog', label: 'Mon Catalogue', icon: Package, href: '/vendor/portal/catalog' },
    { id: 'orders', label: 'Commandes Reçues', icon: ShoppingBag, href: '/vendor/portal/orders' },
    { id: 'profile', label: 'Profil Entreprise', icon: Settings, href: '/vendor/portal/settings' },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    const { logoutUser } = await import('../../actions');
    await logoutUser();
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Vendor Sidebar */}
      <aside style={{ width: '280px', background: '#1E293B', color: '#fff', padding: '32px 20px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
          <div style={{ width: '40px', height: '40px', background: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Vendor Portal</h1>
            <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace B2B</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map(item => (
            <Link 
              key={item.id} 
              href={item.href}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                textDecoration: 'none',
                color: isActive(item.href) ? '#fff' : '#94A3B8',
                background: isActive(item.href) ? '#4F46E5' : 'transparent',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '20px' }}>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'transparent', border: 'none', color: '#EF4444', fontWeight: 600, cursor: 'pointer' }}
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
