import { getStore } from '../actions';
import { redirect } from 'next/navigation';
import { ToastProvider } from '../components/Toast';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  if (!store) {
    redirect('/login');
  }

  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
