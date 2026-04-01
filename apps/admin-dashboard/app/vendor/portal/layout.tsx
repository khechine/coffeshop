'use client';

import React, { useState, useEffect } from 'react';
import { Package, Truck, LayoutDashboard, Settings, LogOut, ShoppingBag, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('vendor-theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('vendor-theme', newTheme);
  };
  
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
    <div className={theme}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 overflow-x-hidden">
        {/* Mobile Toggle & Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsMenuOpen(false)} 
      />
      
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 z-[120] md:hidden bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-900 dark:text-white backdrop-blur-md shadow-lg"
      >
        <LayoutDashboard size={20} />
      </button>

      {/* Vendor Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-[115] w-[280px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 p-8 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Truck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black m-0 tracking-tight text-slate-900 dark:text-white">Fournisseur</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Espace B2B</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.id} 
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all duration-200 font-bold text-sm ${
                  active 
                    ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-white/10 border border-indigo-100 dark:border-white/10 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 hover:bg-indigo-50 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800/50 pt-5 mt-auto space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer transition-all"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            Mode {theme === 'dark' ? 'Clair' : 'Sombre'}
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent border-none text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-400/10 font-bold cursor-pointer transition-colors"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[280px] min-w-0 transition-all duration-300">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  </div>
  );
}
