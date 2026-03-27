import { prisma } from '@coffeeshop/database';
import SuperAdminUsersClient from './SuperAdminUsersClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { store: true, vendorProfile: true, courierProfile: true },
    orderBy: { createdAt: 'desc' }
  });

  return <SuperAdminUsersClient initialUsers={users} />;
}
