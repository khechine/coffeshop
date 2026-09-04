import { getStore } from '../actions';
import { redirect } from 'next/navigation';
import { ToastProvider } from '../components/Toast';
import OnboardingHelper from '../components/OnboardingHelper';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  if (!store) {
    redirect('/login');
  }

  return (
    <ToastProvider>
      {children}
      <OnboardingHelper />
    </ToastProvider>
  );
}
