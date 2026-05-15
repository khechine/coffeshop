import { getUserContext } from '../actions';
import { redirect } from 'next/navigation';

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserContext();
  
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'VENDOR' && user.role !== 'SUPERADMIN') {
    redirect('/admin'); // Or somewhere else
  }

  return (
    <>
      {children}
    </>
  );
}
