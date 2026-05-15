import { CartProvider } from './CartContext';
import { VaultProvider } from './VaultContext';
import { getUserContext } from '../actions';
import { redirect } from 'next/navigation';
import NotificationToastListener from './components/NotificationToastListener';
import { ToastProvider } from '../components/Toast';

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserContext();
  if (!user) {
    redirect('/login');
  }

  return (
    <ToastProvider>
      <CartProvider>
        <VaultProvider>
          <NotificationToastListener />
          {children}
        </VaultProvider>
      </CartProvider>
    </ToastProvider>
  );
}

