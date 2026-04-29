'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, History, Store, Tablet, Users, CreditCard, Settings, 
  Boxes, Coffee, BarChart3, ChevronDown, ChevronRight, Package, FileText, TrendingUp,
  Layers, LayoutGrid, Truck, ShoppingBag, Activity
} from 'lucide-react';

import { logoutUser } from '../app/actions';

type Role = 'STORE_OWNER' | 'CASHIER' | 'VENDOR' | 'SUPERADMIN' | null;

export default function Sidebar({ storeName, isMobileOpen, hasMarketplace = true, planName = '', isFiscalEnabled = false }: { storeName?: string; isMobileOpen?: boolean; hasMarketplace?: boolean; planName?: string; isFiscalEnabled?: boolean }) {
  const [role, setRole] = useState<Role>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['VENTES', 'PILOTAGE', 'PRODUITS', 'B2B']);
  const pathname = usePathname();
  const router = useRouter();

  const hasPerm = (p: string) => role === 'STORE_OWNER' || permissions.includes(p);
  const hasAnyAdminPerm = role === 'STORE_OWNER' || permissions.some(p => p !== 'POS');
  const isActive = (href: string) => pathname === href;
  const isRachma = planName.toUpperCase() === 'RACHMA' || (planName.toUpperCase() === 'STARTER' && !isFiscalEnabled);
  const showNacefModules = !isRachma && (isFiscalEnabled || ['PRO', 'ENTERPRISE'].includes(planName.toUpperCase()));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    const storedRole = localStorage.getItem('pos_cashier_role') as Role;
    const storedPerms = localStorage.getItem('pos_cashier_permissions');
    const storedCollapsed = localStorage.getItem('sidebar_collapsed_v2') === 'true';
    const storedSections = localStorage.getItem('sidebar_open_sections');
    
    setRole(storedRole);
    setIsCollapsed(storedCollapsed);
    setOpenSections(['VENTES', 'PILOTAGE', 'PRODUITS', 'B2B']);

    
    if (storedPerms) {
      const perms = JSON.parse(storedPerms);
      setPermissions(perms);
      
      const isOnlyPOS = storedRole === 'CASHIER' && (!perms || perms.length === 0 || (perms.length === 1 && perms[0] === 'POS'));
      if (isOnlyPOS && !pathname.startsWith('/pos')) {
        router.replace('/pos');
      }
    }

    // Auto-collapse logic for medium screens
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth <= 1100) {
        setIsCollapsed(true);
      } else {
        const stored = localStorage.getItem('sidebar_collapsed_v2') === 'true';
        setIsCollapsed(stored);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname, router]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      if (!newState) {
        localStorage.setItem('sidebar_collapsed_v2', 'false');
      } else {
        localStorage.setItem('sidebar_collapsed_v2', 'true');
      }
      window.dispatchEvent(new Event('sidebarToggle'));
    }
  };

  const handleMouseEnter = () => {
    if (isCollapsed) setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Determine if it should show as 'expanded' (truthy if NOT collapsed OR if hovered)
  const displayExpanded = !isCollapsed || isHovered;

  const toggleSection = (section: string) => {
    // Disabled accordion behavior - sections always open
  };

  const isSectionOpen = (section: string) => true;

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

  if (!mounted) return null;
  if (!hasAnyAdminPerm) return null;

  const cashierName = typeof window !== 'undefined' ? localStorage.getItem('pos_cashier') || 'Gérant' : 'Gérant';

  return (
    <aside 
      className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed && !isHovered ? 'collapsed' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Coffee size={22} color="#fff" strokeWidth={2.5} />
        </div>
        {displayExpanded && (
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
            display: !displayExpanded ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Layers size={14} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* VENTES & SERVICE */}
        {hasPerm('POS') && (
          <div className="nav-group">
            {displayExpanded && (
              <div className="nav-section-header" style={{ padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Ventes & Direct</span>
              </div>
            )}
            {(isCollapsed || isSectionOpen('VENTES')) && (
              <>
                <Link href="/pos" className="nav-item pos-btn-sidebar" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', marginBottom: '12px', padding: '12px 14px', borderRadius: '12px', justifyContent: 'flex-start' }}>
                  <Store size={18} strokeWidth={2.5} />
                  {displayExpanded && <span style={{ fontWeight: 800 }}>Accès Caisse POS</span>}
                </Link>
                <Link href="/admin/sales" className={`nav-item${isActive('/admin/sales') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                  <History size={18} />
                  {displayExpanded && <span>Historique Ventes</span>}
                </Link>
              </>
            )}
          </div>
        )}

        {/* PILOTAGE */}
        {(hasPerm('DASHBOARD') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            {displayExpanded && (
              <div className="nav-section-header" style={{ padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Pilotage Business</span>
              </div>
            )}
            {(isCollapsed || isSectionOpen('PILOTAGE')) && (
              <>
                {hasPerm('DASHBOARD') && (
                  <Link href="/" title="Tableau de bord" className={`nav-item${isActive('/') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                    <LayoutDashboard size={18} />
                    {displayExpanded && <span>Vue d'ensemble</span>}
                  </Link>
                )}
                {role === 'STORE_OWNER' && (
                  <>
                    <Link href="/admin/live" title="Live Tracker (Direct)" className={`nav-item${isActive('/admin/live') ? ' active' : ''}`} style={{ justifyContent: 'flex-start', border: '1px solid rgba(16, 185, 129, 0.15)', background: isActive('/admin/live') ? 'rgba(16, 185, 129, 0.15)' : 'transparent', marginTop: '4px' }}>
                      <Activity size={18} color="#10B981" />
                      {displayExpanded && <span style={{ color: '#6EE7B7' }}>Live Tracker (Direct)</span>}
                    </Link>
                    <Link href="/admin/configuration" title="Configuration Admin" className={`nav-item${isActive('/admin/configuration') ? ' active' : ''}`} style={{ justifyContent: 'flex-start', border: '1px solid rgba(99,102,241,0.15)', background: isActive('/admin/configuration') ? 'rgba(99,102,241,0.15)' : 'transparent', marginTop: '4px' }}>
                      <Settings size={18} color="#818CF8" />
                      {displayExpanded && <span style={{ color: '#C7D2FE' }}>Configuration Admin</span>}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* PRODUITS & CATALOGUE */}
        {(hasPerm('PRODUCTS') || hasPerm('STOCK')) && (
          <div className="nav-group">
            {displayExpanded && (
              <div className="nav-section-header" style={{ padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Gestion Produits</span>
              </div>
            )}
            {(isCollapsed || isSectionOpen('PRODUITS')) && (
              <>
                {hasPerm('PRODUCTS') && (
                  <Link href="/admin/products" className={`nav-item${isActive('/admin/products') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                    <Coffee size={18} />
                    {displayExpanded && <span>Menu & Recettes</span>}
                  </Link>
                )}
                {hasPerm('STOCK') && (
                  <Link href="/admin/stock" className={`nav-item${isActive('/admin/stock') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                    <Boxes size={18} />
                    {displayExpanded && <span>Stock Matières</span>}
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {/* MARKETPLACE */}
        {(hasPerm('SUPPLY') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            {displayExpanded && (
              <div className="nav-section-header" style={{ padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Sourcing & B2B</span>
              </div>
            )}
            {(isCollapsed || isSectionOpen('B2B')) && (
              <>
                {hasPerm('SUPPLY') && hasMarketplace && (
                  <Link href="/marketplace" className={`nav-item${isActive('/marketplace') ? ' active' : ''}`} style={{ border: '1px solid rgba(99,102,241,0.15)', background: isActive('/marketplace') ? 'rgba(99,102,241,0.1)' : 'transparent', justifyContent: 'flex-start' }}>
                    <Truck size={18} color="#818CF8" />
                    {displayExpanded && <span>Marketplace B2B</span>}
                  </Link>
                )}
                <Link href="/vendor/dashboard" className={`nav-item${isActive('/vendor/dashboard') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                  <ShoppingBag size={18} />
                  {displayExpanded && <span>Fournisseurs Externes</span>}
                </Link>
              </>
            )}
          </div>
        )}
        {/* ADMINISTRATION PLATEFORME (SuperAdmin Only) */}
        {role === 'SUPERADMIN' && (
          <div className="nav-group" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {displayExpanded && (
              <div className="nav-section-header" style={{ padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0, color: '#818CF8' }}>Administration Plateforme</span>
              </div>
            )}
            <Link href="/superadmin/marketplace/categories" className={`nav-item${isActive('/superadmin/marketplace/categories') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
              <LayoutGrid size={18} />
              {displayExpanded && <span>Catégories Marketplace</span>}
            </Link>
          </div>
        )}
      </nav>

    </aside>
  );
}


