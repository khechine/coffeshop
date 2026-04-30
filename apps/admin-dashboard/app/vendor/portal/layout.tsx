'use client';

import React, { useState, useEffect } from 'react';
import { Package, Truck, LayoutDashboard, Settings, LogOut, ShoppingBag, Sun, Moon, ChevronLeft, BarChart3, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import VendorAlertBar from './VendorAlertBar';

export default function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = (localStorage.getItem('vendor-theme') || 'light') as 'dark' | 'light';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendor-theme', newTheme);
    }
  };
  
  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard, href: '/vendor/portal' },
    { id: 'wallet', label: 'Portefeuille', icon: Wallet, href: '/vendor/portal/wallet' },
    { id: 'sales', label: 'Ventes', icon: BarChart3, href: '/vendor/portal/sales' },
    { id: 'catalog', label: 'Catalogue', icon: Package, href: '/vendor/portal/catalog' },
    { id: 'orders', label: 'Commandes', icon: ShoppingBag, href: '/vendor/portal/orders' },
    { id: 'profile', label: 'Profil', icon: Settings, href: '/vendor/portal/settings' },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    const { logoutUser } = await import('../../actions');
    await logoutUser();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <div className={theme}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 overflow-x-hidden">
        {/* Mobile Toggle & Overlay */}
        <div 
          className={`fixed inset-0 bg-black/50 z-[110] transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
          onClick={() => setIsMenuOpen(false)} 
        />
        
        {/* Mobile hamburger */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="fixed top-4 left-4 z-[120] md:hidden bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 shadow-md"
        >
          {isMenuOpen ? <ChevronLeft size={20} /> : <LayoutDashboard size={20} />}
        </button>

        {/* Travel-Style Sidebar */}
        <aside 
          className={`fixed top-0 bottom-0 left-0 z-[115] w-[280px] bg-white border-r border-slate-200 p-6 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Fournisseur</h1>
              <span className="text-xs text-slate-500">Espace B2B</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map(item => {
              const active = isActive(item.href);
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all duration-200 font-medium text-sm ${
                    active 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 pt-5 mt-auto space-y-2">
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-medium cursor-pointer transition-all hover:bg-slate-100"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-none text-red-500 hover:bg-red-50 font-medium cursor-pointer transition-colors"
            >
              <LogOut size={18} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-[280px] min-w-0 transition-all duration-300">
          <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <VendorAlertBar />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
