'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Store, ShieldCheck, MapPin, Package, CreditCard, LogOut, CheckCircle, Truck, Database, Wallet, Menu, X } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarItems = [
    { label: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/superadmin' },
    { label: 'Vendeurs Marketplace', icon: ShieldCheck, href: '/superadmin/vendors', badge: 'Validation' },
    { label: 'Catégories Marketplace', icon: Package, href: '/superadmin/marketplace/categories' },
    { label: 'Coffee Shops', icon: Store, href: '/superadmin/cafes' },
    { label: 'Réseau Livreurs', icon: Truck, href: '/superadmin/couriers' },
    { label: 'Catalogue & Flux', icon: Package, href: '/superadmin/marketplace' },
    { label: 'Carte de Tunisie', icon: MapPin, href: '/superadmin/map' },
    { label: 'Plans & Abonnements', icon: CreditCard, href: '/superadmin/plans' },
    { label: 'Référentiels Globaux', icon: Database, href: '/superadmin/referentiels' },
    { label: 'Gestion Portefeuilles', icon: Wallet, href: '/superadmin/wallet', badge: 'Dépôts' },
    { label: 'Gestion Utilisateurs', icon: Users, href: '/superadmin/users' },
    { label: 'Monitoring Anti-Bypass', icon: ShieldCheck, href: '/superadmin/marketplace/monitoring', badge: 'Sécurité' },
  ];

  const handleLogout = async () => {
    const { logoutUser } = await import('../actions');
    await logoutUser();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      
      {/* Mobile Header (Visible only on Mobile) */}
      <div className="mobile-header">
        <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'transparent', border: 'none', color: '#1E293B', cursor: 'pointer' }}>
          <Menu size={24} />
        </button>
        <div style={{ fontWeight: 900, fontSize: '16px' }}>SUPERADMIN</div>
        <div style={{ width: 24 }} /> {/* Spacer */}
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* SuperAdmin Sidebar */}
      <aside className={`superadmin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #ffffff10' }}>
          <div style={{ width: 40, height: 40, background: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '-0.02em', color: '#fff' }}>SUPERADMIN</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Marketplace Tunisia</div>
          </div>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {sidebarItems.map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#CBD5E1', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: '0.2s' }}
              className="superadmin-link"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && (
                <span style={{ marginLeft: 'auto', background: '#4F46E5', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid #ffffff10' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ffffff20', background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 700 }}>
            <LogOut size={18} /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      <style jsx global>{`
        .superadmin-sidebar {
          width: 280px;
          background: #1E293B;
          color: #fff;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          zIndex: 100;
          transition: transform 0.3s ease;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 40px;
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #fff;
          border-bottom: 1px solid #E2E8F0;
          padding: 0 20px;
          align-items: center;
          justify-content: space-between;
          z-index: 90;
        }

        .mobile-close-btn {
          display: none;
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 95;
          backdrop-filter: blur(4px);
        }

        @media (max-width: 1024px) {
          .superadmin-sidebar {
            transform: translateX(-100%);
            z-index: 1000;
          }
          .superadmin-sidebar.open {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0;
            padding: 80px 20px 40px; /* Space for mobile header */
          }
          .mobile-header {
            display: flex;
          }
          .mobile-close-btn {
            display: block;
          }
          .sidebar-overlay {
            display: block;
          }
        }

        .superadmin-link:hover {
          background: #ffffff10;
          color: #fff !important;
        }
        .btn-super-primary {
          background: #1E293B;
          color: #fff;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }
        .super-status-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
