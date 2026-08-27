import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import NacefConfigClient from './NacefConfigClient';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NacefConfigPage() {
  const store = await getStore();
  if (!store) return <div>Non autorisé</div>;

  // Fetch full NACEF fields from DB
  const storeData = await (prisma as any).store.findUnique({
    where: { id: store.id },
    select: {
      id: true,
      name: true,
      smdfUrl: true,
      imdf: true,
      matriculeFiscal: true,
      establishmentReference: true,
      commercialName: true,
      accreditationReference: true,
      isFiscalEnabled: true,
      nacefSyncStatus: true,
      nacefLastSyncAt: true,
    },
  });

  // Fetch last 20 NACEF logs
  const logs = await (prisma as any).nacefSyncLog.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).catch(() => []);

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '12px',
            background: 'linear-gradient(135deg, #065F46, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <h1>Configuration NACEF / S-MDF</h1>
            <p>Configurez et simulez l&apos;interfaçage avec la plateforme fiscale NACEF.</p>
          </div>
        </div>
      </div>

      <NacefConfigClient
        storeId={store.id}
        initialData={JSON.parse(JSON.stringify(storeData || {}))}
        initialLogs={JSON.parse(JSON.stringify(logs))}
      />
    </div>
  );
}
