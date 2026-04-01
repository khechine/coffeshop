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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const hasPerm = (p: string) => role === 'STORE_OWNER' || permissions.includes(p);
  const hasAnyAdminPerm = role === 'STORE_OWNER' || permissions.some(p => p !== 'POS');
  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    setMounted(true);
    const storedRole = localStorage.getItem('pos_cashier_role') as Role;
    const storedPerms = localStorage.getItem('pos_cashier_permissions');
    const storedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    
    setRole(storedRole);
    setIsCollapsed(storedCollapsed);
    if (storedPerms) {
      const perms = JSON.parse(storedPerms);
      setPermissions(perms);
      
      const isOnlyPOS = storedRole === 'CASHIER' && (!perms || perms.length === 0 || (perms.length === 1 && perms[0] === 'POS'));
      if (isOnlyPOS && !pathname.startsWith('/pos')) {
        router.replace('/pos');
      }
    }
  }, [pathname, router]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
    // Emit custom event for layout shell
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem('user');
    localStorage.removeItem('pos_cashier');
    localStorage.removeItem('pos_cashier_role');
    localStorage.removeItem('pos_cashier_permissions');
    setRole(null);
    window.location.href = '/login';
  };

  if (!mounted) return null;
  if (!hasAnyAdminPerm) return null;

  const cashierName = typeof window !== 'undefined' ? localStorage.getItem('pos_cashier') || 'Gérant' : 'Gérant';

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Coffee size={22} color="#fff" strokeWidth={2.5} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-logo-text">
            <h1>CoffeeSaaS</h1>
            <span>B2B Platform</span>
          </div>
        )}
        <button 
          onClick={toggleCollapse}
          className="collapse-toggle-btn"
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isCollapsed ? <Layers size={14} /> : <div style={{ fontSize: '10px', fontWeight: 800, padding: '0 4px' }}>HIDE</div>}
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* VENTES & SERVICE */}
        {hasPerm('POS') && (
          <div className="nav-group">
            {!isCollapsed && <span className="nav-section-label">Ventes & Direct</span>}
            <Link href="/pos" className="nav-item pos-btn-sidebar" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', marginBottom: '12px', padding: '12px 14px', borderRadius: '12px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
              <Store size={18} strokeWidth={2.5} />
              {!isCollapsed && <span style={{ fontWeight: 800 }}>Accès Caisse POS</span>}
            </Link>
            <Link href="/admin/sales" className={`nav-item${isActive('/admin/sales') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
              <History size={18} />
              {!isCollapsed && <span>Historique Ventes</span>}
            </Link>
          </div>
        )}

        {/* PILOTAGE */}
        {(hasPerm('DASHBOARD') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            {!isCollapsed && <span className="nav-section-label">Pilotage Business</span>}
            {hasPerm('DASHBOARD') && (
              <Link href="/" title="Tableau de bord" className={`nav-item${isActive('/') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <LayoutDashboard size={18} />
                {!isCollapsed && <span>Vue d'ensemble</span>}
              </Link>
            )}
            {hasPerm('POS') && (
              <Link href="/admin/tables" title="Plan de Salle" className={`nav-item${isActive('/admin/tables') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <LayoutGrid size={18} />
                {!isCollapsed && <span>Plan de Salle</span>}
              </Link>
            )}
            {(hasPerm('TERMINALS') || role === 'STORE_OWNER') && (
              <Link href="/admin/terminals" title="Jumelage Terminal" className={`nav-item${isActive('/admin/terminals') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Tablet size={18} />
                {!isCollapsed && <span>Jumelage Terminal</span>}
              </Link>
            )}
            {hasPerm('STAFF') && (
              <Link href="/admin/staff" title="Équipe & Accès" className={`nav-item${isActive('/admin/staff') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Users size={18} />
                {!isCollapsed && <span>Équipe & Accès</span>}
              </Link>
            )}
            {role === 'STORE_OWNER' && (
              <Link href="/admin/expenses" title="Gestion Dépenses" className={`nav-item${isActive('/admin/expenses') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <CreditCard size={18} />
                {!isCollapsed && <span>Gestion Dépenses</span>}
              </Link>
            )}
            {role === 'STORE_OWNER' && (
              <Link href="/admin/settings" title="Configuration Admin" className={`nav-item${isActive('/admin/settings') || isActive('/admin/subscription') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Settings size={18} />
                {!isCollapsed && <span>Configuration Admin</span>}
              </Link>
            )}
          </div>
        )}

        {/* PRODUITS & CATALOGUE */}
        {(hasPerm('PRODUCTS') || hasPerm('STOCK')) && (
          <div className="nav-group">
            {!isCollapsed && <span className="nav-section-label">Gestion Produits</span>}
            {hasPerm('PRODUCTS') && (
              <Link href="/admin/products" className={`nav-item${isActive('/admin/products') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Coffee size={18} />
                {!isCollapsed && <span>Menu & Recettes</span>}
              </Link>
            )}
            {hasPerm('STOCK') && (
              <Link href="/admin/stock" className={`nav-item${isActive('/admin/stock') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Boxes size={18} />
                {!isCollapsed && <span>Stock Matières</span>}
              </Link>
            )}
          </div>
        )}

        {/* MARKETPLACE */}
        {(hasPerm('SUPPLY') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            {!isCollapsed && <span className="nav-section-label">Sourcing & B2B</span>}
            {hasPerm('SUPPLY') && hasMarketplace && (
              <Link href="/marketplace" className={`nav-item${isActive('/marketplace') ? ' active' : ''}`} style={{ border: '1px solid rgba(99,102,241,0.15)', background: isActive('/marketplace') ? 'rgba(99,102,241,0.1)' : 'transparent', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Truck size={18} color="#818CF8" />
                {!isCollapsed && <span>Marketplace B2B</span>}
              </Link>
            )}
            <Link href="/vendor/dashboard" className={`nav-item${isActive('/vendor/dashboard') ? ' active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
              <ShoppingBag size={18} />
              {!isCollapsed && <span>Fournisseurs Externes</span>}
            </Link>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>{cashierName.charAt(0).toUpperCase()}</div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '14px' }}>{cashierName}</div>
              <div className="user-role" style={{ fontSize: '10px', opacity: 0.6 }}>{role?.replace('_', ' ') || 'OWNER'}</div>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="btn btn-ghost"
          style={{ width: '100%', marginTop: '12px', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)', borderRadius: '10px' }}>
          <LogOut size={14} />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}

