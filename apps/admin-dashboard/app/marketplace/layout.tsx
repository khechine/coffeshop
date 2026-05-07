import { CartProvider } from './CartContext';
import { getUserContext } from '../actions';
import { redirect } from 'next/navigation';

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserContext();
  if (!user) {
    redirect('/login');
  }

  return (
    <CartProvider>
      {children}
      
      {/* Global Floating Help Button */}
      <div className="fixed bottom-8 right-8 z-[100] md:bottom-12 md:right-12">
        <a 
          href="/marketplace/help"
          className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-200 hover:scale-110 active:scale-95 transition-all duration-300 group"
          title="Besoin d'aide ?"
        >
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
            </span>
          </div>
        </a>
      </div>
    </CartProvider>
  );
}
