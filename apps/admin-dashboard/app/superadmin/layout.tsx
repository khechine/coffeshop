import { getUserContext } from '../actions';
import { redirect } from 'next/navigation';
import SuperAdminLayoutClient from './SuperAdminLayoutClient';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserContext();
  
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'SUPERADMIN') {
    redirect('/admin');
  }

  return (
    <SuperAdminLayoutClient>
      {children}
    </SuperAdminLayoutClient>
  );
}
