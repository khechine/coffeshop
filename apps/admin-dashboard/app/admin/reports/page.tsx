import { prisma } from '@coffeeshop/database';
import { getStore } from '../../actions';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const store = await getStore();
  if (!store) return <div>Boutique non trouvée</div>;

  const zReports = await prisma.zReport.findMany({
    where: { storeId: store.id },
    orderBy: { reportDay: 'desc' },
    take: 30
  });

  return (
    <ReportsClient 
      initialReports={JSON.parse(JSON.stringify(zReports))}
      storeName={store.name}
    />
  );
}
