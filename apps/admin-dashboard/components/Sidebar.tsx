'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Coffee, LayoutDashboard, Package, Layers, Users, CreditCard, Crown, Truck, Bell, LogOut, 
  Clock, Tablet, Store, History, Settings, LayoutGrid, Boxes, ShoppingBag, 
  ChevronDown, ChevronRight 
} from 'lucide-react';

import { logoutUser } from '../app/actions';

type Role = 'STORE_OWNER' | 'CASHIER' | 'VENDOR' | 'SUPERADMIN' | null;

export default function Sidebar({ storeName, isMobileOpen, hasMarketplace = true }: { storeName?: string; isMobileOpen?: boolean; hasMarketplace?: boolean }) {
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

  useEffect(() => {
    setMounted(true);
    const storedRole = localStorage.getItem('pos_cashier_role') as Role;
    const storedPerms = localStorage.getItem('pos_cashier_permissions');
    const storedCollapsed = localStorage.getItem('sidebar_collapsed_v2') === 'true';
    const storedSections = localStorage.getItem('sidebar_open_sections');
    
    setRole(storedRole);
    setIsCollapsed(storedCollapsed);
    if (storedSections) {
      setOpenSections(JSON.parse(storedSections));
    } else {
      // Default open sections for a 'complet' look
      setOpenSections(['VENTES', 'PILOTAGE', 'PRODUITS', 'B2B']);
    }
    
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
        // Desktop (> 1100px) or Mobile (< 768px handled by layout)
        // Keep user preference or stay expanded
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
    if (!newState) {
       // When manually expanding, keep it expanded
       localStorage.setItem('sidebar_collapsed_v2', 'false');
    } else {
       localStorage.setItem('sidebar_collapsed_v2', 'true');
    }
    window.dispatchEvent(new Event('sidebarToggle'));
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
    setOpenSections(prev => {
      const newSections = prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section];
      localStorage.setItem('sidebar_open_sections', JSON.stringify(newSections));
      return newSections;
    });
  };

  const isSectionOpen = (section: string) => openSections.includes(section);

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
              <div className="nav-section-header" onClick={() => toggleSection('VENTES')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Ventes & Direct</span>
                {isSectionOpen('VENTES') ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
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

        {/* Terminaux & Matériel - Independent Group */}
        {(hasPerm('TERMINALS') || role === 'STORE_OWNER') && (
          <div className="nav-group tech-group" style={{ marginTop: '12px' }}>
            {displayExpanded && (
              <div className="nav-section-header" style={{ padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Terminaux & Matériel</span>
              </div>
            )}
            <Link href="/admin/terminals" className={`nav-item${isActive('/admin/terminals') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
              <Tablet size={18} />
              {displayExpanded && <span>Gestion Terminaux POS</span>}
            </Link>
          </div>
        )}

        {/* PILOTAGE */}
        {(hasPerm('DASHBOARD') || role === 'STORE_OWNER') && (
          <div className="nav-group">
            {displayExpanded && (
              <div className="nav-section-header" onClick={() => toggleSection('PILOTAGE')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Pilotage Business</span>
                {isSectionOpen('PILOTAGE') ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
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
                {hasPerm('POS') && (
                  <Link href="/admin/tables" title="Plan de Salle" className={`nav-item${isActive('/admin/tables') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                    <LayoutGrid size={18} />
                    {displayExpanded && <span>Plan de Salle</span>}
                  </Link>
                )}
                {hasPerm('STAFF') && (
                  <Link href="/admin/staff" className={`nav-item${isActive('/admin/staff') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                    <Users size={18} />
                    {displayExpanded && <span>Équipe & Accès</span>}
                  </Link>
                )}
                {role === 'STORE_OWNER' && (
                  <Link href="/admin/expenses" title="Gestion Dépenses" className={`nav-item${isActive('/admin/expenses') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                    <CreditCard size={18} />
                    {displayExpanded && <span>Gestion Dépenses</span>}
                  </Link>
                )}
                {role === 'STORE_OWNER' && (
                  <Link href="/admin/settings" title="Configuration Admin" className={`nav-item${isActive('/admin/settings') || isActive('/admin/subscription') ? ' active' : ''}`} style={{ justifyContent: 'flex-start' }}>
                    <Settings size={18} />
                    {displayExpanded && <span>Configuration Admin</span>}
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {/* PRODUITS & CATALOGUE */}
        {(hasPerm('PRODUCTS') || hasPerm('STOCK')) && (
          <div className="nav-group">
            {displayExpanded && (
              <div className="nav-section-header" onClick={() => toggleSection('PRODUITS')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Gestion Produits</span>
                {isSectionOpen('PRODUITS') ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
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
              <div className="nav-section-header" onClick={() => toggleSection('B2B')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 6px' }}>
                <span className="nav-section-label" style={{ padding: 0 }}>Sourcing & B2B</span>
                {isSectionOpen('B2B') ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
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


