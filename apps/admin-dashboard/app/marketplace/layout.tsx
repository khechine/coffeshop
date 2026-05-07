import { CartProvider } from './CartContext';
import { getUserContext } from '../actions';
import { redirect } from 'next/navigation';
import NotificationToastListener from './components/NotificationToastListener';

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserContext();
  if (!user) {
    redirect('/login');
  }

  return (
    <CartProvider>
      <NotificationToastListener />
      {children}
    </CartProvider>
  );
}
