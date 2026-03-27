import { prisma } from '@coffeeshop/database';
import SuperAdminVendorsTable from './SuperAdminVendorsTable';

export const dynamic = 'force-dynamic';

export default async function SuperAdminVendorsPage() {
  const vendors = await prisma.vendorProfile.findMany({
    include: { 
      user: true, 
      categories: true,
      products: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Vendeurs Marketplace</h1>
        <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Validation des inscriptions et gestion des comptes fournisseurs certifiés.</p>
      </div>

      <SuperAdminVendorsTable vendors={vendors} />
    </div>
  );
}
