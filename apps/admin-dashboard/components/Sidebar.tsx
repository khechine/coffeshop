'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Coffee, LayoutDashboard, Package, Layers, Users, CreditCard, Crown, Truck, Bell, LogOut, Clock } from 'lucide-react';
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
          <Coffee size={20} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          <h1>CoffeeSaaS</h1>
          <span>Platform B2B</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* VENTES & SERVICE */}
        {hasPerm('POS') && (
          <div className="nav-group">
            <span className="nav-section-label">Ventes &amp; Service</span>
            <Link href="/pos" className="nav-item pos-btn-sidebar" style={{ background: '#6366F1', color: '#fff', marginBottom: '8px', borderRadius: '12px' }}>
              <Coffee size={18} />
              Accès Caisse POS
            </Link>
            <Link href="/admin/sales" className={`nav-item${isActive('/admin/sales') ? ' active' : ''}`}>
              <Clock size={18} />
              Historique des Ventes
            </Link>
          </div>
        )}

        {/* PILOTAGE */}
        {(hasPerm('DASHBOARD') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            <span className="nav-section-label">Pilotage &amp; Vision</span>
            {hasPerm('DASHBOARD') && (
              <Link href="/" className={`nav-item${isActive('/') ? ' active' : ''}`}>
                <LayoutDashboard size={18} />
                Tableau de Bord
              </Link>
            )}
            {role === 'STORE_OWNER' && (
              <Link href="/admin/settings" className={`nav-item${isActive('/admin/settings') ? ' active' : ''}`}>
                <Coffee size={18} />
                Paramètres du Café
              </Link>
            )}
             {hasPerm('SUBS') && (
              <Link href="/admin/subscription" className={`nav-item${isActive('/admin/subscription') ? ' active' : ''}`}>
                <CreditCard size={18} />
                Mon Abonnement
              </Link>
            )}
            {hasPerm('POS') && (
              <Link href="/admin/tables" className={`nav-item${isActive('/admin/tables') ? ' active' : ''}`}>
                <Layers size={18} />
                Plan de Salle &amp; Tables
              </Link>
            )}
            {hasPerm('STAFF') && (
              <Link href="/admin/staff" className={`nav-item${isActive('/admin/staff') ? ' active' : ''}`}>
                <Users size={18} />
                Personnel &amp; Accès
              </Link>
            )}
            {(role === 'STORE_OWNER') && (
              <Link href="/admin/expenses" className={`nav-item${isActive('/admin/expenses') ? ' active' : ''}`}>
                <CreditCard size={18} />
                Gestion des Charges
              </Link>
            )}
          </div>
        )}

        {/* PRODUITS & CATALOGUE */}
        {(hasPerm('PRODUCTS') || hasPerm('STOCK')) && (
          <div className="nav-group">
            <span className="nav-section-label">Catalogue &amp; Stocks</span>
            {hasPerm('PRODUCTS') && (
              <Link href="/admin/products" className={`nav-item${isActive('/admin/products') ? ' active' : ''}`}>
                <Package size={18} />
                Catalogue &amp; Recettes
              </Link>
            )}
            {hasPerm('STOCK') && (
              <Link href="/admin/stock" className={`nav-item${isActive('/admin/stock') ? ' active' : ''}`}>
                <Layers size={18} />
                Matières Premières
              </Link>
            )}
          </div>
        )}


        {/* MARKETPLACE */}
        {hasPerm('SUPPLY') && hasMarketplace && (
          <div className="nav-group">
            <span className="nav-section-label">B2B &amp; Marketplace</span>
            <Link href="/marketplace" className={`nav-item${isActive('/marketplace') ? ' active' : ''}`} style={{ border: '1px solid rgba(79,70,229,0.2)' }}>
              <Truck size={18} color="#4F46E5" />
              Marketplace B2B
            </Link>
            <Link href="/vendor/dashboard" className={`nav-item${isActive('/vendor/dashboard') ? ' active' : ''}`}>
              <Package size={18} />
              Fournisseurs &amp; B2B
            </Link>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{cashierName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{cashierName}</div>
            <div className="user-role">OWNER • {storeName || 'Café Dashboard'}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost"
          style={{ width: '100%', marginTop: '8px', justifyContent: 'center', fontSize: '12px' }}>
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
