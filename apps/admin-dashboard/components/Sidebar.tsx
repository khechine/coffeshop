'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Coffee, LayoutDashboard, Package, Layers, Users, CreditCard, Crown, Truck, Bell, LogOut, Clock, Tablet, Store, History, Settings, LayoutGrid, Boxes, ShoppingBag } from 'lucide-react';

import { logoutUser } from '../app/actions';

type Role = 'STORE_OWNER' | 'CASHIER' | 'VENDOR' | 'SUPERADMIN' | null;

export default function Sidebar({ storeName, isMobileOpen, hasMarketplace = true }: { storeName?: string; isMobileOpen?: boolean; hasMarketplace?: boolean }) {
  const [role, setRole] = useState<Role>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const hasPerm = (p: string) => role === 'STORE_OWNER' || permissions.includes(p);
  const hasAnyAdminPerm = role === 'STORE_OWNER' || permissions.some(p => p !== 'POS');
  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    setMounted(true);
    const storedRole = localStorage.getItem('pos_cashier_role') as Role;
    const storedPerms = localStorage.getItem('pos_cashier_permissions');
    
    setRole(storedRole);
    if (storedPerms) {
      const perms = JSON.parse(storedPerms);
      setPermissions(perms);
      
      // If cashier tries to access non-authorized page, or has only POS access, then redirect to POS
      const isOnlyPOS = storedRole === 'CASHIER' && (!perms || perms.length === 0 || (perms.length === 1 && perms[0] === 'POS'));
      if (isOnlyPOS && !pathname.startsWith('/pos')) {
        router.replace('/pos');
      }
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem('user');
    localStorage.removeItem('pos_cashier');
    localStorage.removeItem('pos_cashier_role');
    localStorage.removeItem('pos_cashier_permissions');
    setRole(null);
    window.location.href = '/login';
  };

  // Don't render sidebar if user has only POS access and no admin permissions
  if (!mounted) return null;
  if (!hasAnyAdminPerm) return null;

  const cashierName = typeof window !== 'undefined' ? localStorage.getItem('pos_cashier') || 'Gérant' : 'Gérant';

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Coffee size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="sidebar-logo-text">
          <h1>CoffeeSaaS</h1>
          <span>B2B Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* VENTES & SERVICE */}
        {hasPerm('POS') && (
          <div className="nav-group">
            <span className="nav-section-label">Ventes & Direct</span>
            <Link href="/pos" className="nav-item pos-btn-sidebar" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', marginBottom: '12px', padding: '12px 14px', borderRadius: '12px' }}>
              <Store size={18} strokeWidth={2.5} />
              <span style={{ fontWeight: 800 }}>Accès Caisse POS</span>
            </Link>
            <Link href="/admin/sales" className={`nav-item${isActive('/admin/sales') ? ' active' : ''}`}>
              <History size={18} />
              <span>Historique Ventes</span>
            </Link>
          </div>
        )}

        {/* PILOTAGE */}
        {(hasPerm('DASHBOARD') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            <span className="nav-section-label">Pilotage Business</span>
            {hasPerm('DASHBOARD') && (
              <Link href="/" className={`nav-item${isActive('/') ? ' active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>Vue d'ensemble</span>
              </Link>
            )}
            {hasPerm('POS') && (
              <Link href="/admin/tables" className={`nav-item${isActive('/admin/tables') ? ' active' : ''}`}>
                <LayoutGrid size={18} />
                <span>Plan de Salle</span>
              </Link>
            )}
            {hasPerm('STAFF') && (
              <Link href="/admin/staff" className={`nav-item${isActive('/admin/staff') ? ' active' : ''}`}>
                <Users size={18} />
                <span>Équipe & Accès</span>
              </Link>
            )}
            {role === 'STORE_OWNER' && (
              <Link href="/admin/expenses" className={`nav-item${isActive('/admin/expenses') ? ' active' : ''}`}>
                <CreditCard size={18} />
                <span>Gestion Dépenses</span>
              </Link>
            )}
            {role === 'STORE_OWNER' && (
              <Link href="/admin/settings" className={`nav-item${isActive('/admin/settings') || isActive('/admin/subscription') ? ' active' : ''}`}>
                <Settings size={18} />
                <span>Configuration Admin</span>
              </Link>
            )}
          </div>
        )}

        {/* PRODUITS & CATALOGUE */}
        {(hasPerm('PRODUCTS') || hasPerm('STOCK')) && (
          <div className="nav-group">
            <span className="nav-section-label">Gestion Produits</span>
            {hasPerm('PRODUCTS') && (
              <Link href="/admin/products" className={`nav-item${isActive('/admin/products') ? ' active' : ''}`}>
                <Coffee size={18} />
                <span>Menu & Recettes</span>
              </Link>
            )}
            {hasPerm('STOCK') && (
              <Link href="/admin/stock" className={`nav-item${isActive('/admin/stock') ? ' active' : ''}`}>
                <Boxes size={18} />
                <span>Stock Matières</span>
              </Link>
            )}
          </div>
        )}


        {/* MARKETPLACE */}
        {(hasPerm('SUPPLY') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            <span className="nav-section-label">Sourcing & B2B</span>
            {hasPerm('SUPPLY') && hasMarketplace && (
              <Link href="/marketplace" className={`nav-item${isActive('/marketplace') ? ' active' : ''}`} style={{ border: '1px solid rgba(99,102,241,0.15)', background: isActive('/marketplace') ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                <Truck size={18} color="#818CF8" />
                <span>Marketplace B2B</span>
              </Link>
            )}
            <Link href="/vendor/dashboard" className={`nav-item${isActive('/vendor/dashboard') ? ' active' : ''}`}>
              <ShoppingBag size={18} />
              <span>Fournisseurs Externes</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>{cashierName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name" style={{ fontSize: '14px' }}>{cashierName}</div>
            <div className="user-role" style={{ fontSize: '10px', opacity: 0.6 }}>{role?.replace('_', ' ') || 'OWNER'}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost"
          style={{ width: '100%', marginTop: '12px', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)', borderRadius: '10px' }}>
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
