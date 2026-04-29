import { prisma } from '@coffeeshop/database';
import { LayoutDashboard, Users, Plus } from 'lucide-react';
import TablesClient from './TablesClient';
import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function TablesManagement() {
  const store = await getStore();
  if (!store) return <div>Accès refusé</div>;

  const tables = await prisma.storeTable.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'asc' }
  });

  const zones = await prisma.storeZone.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Infrastructure de Salle</h1>
          <p>Organisez votre établissement en zones et disposez vos tables comme un pro.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '24px' }}>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><LayoutDashboard size={22} /></div>
          <div><div className="kpi-label">Zones Actives</div><div className="kpi-value">{zones.length}</div></div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon blue"><Plus size={22} /></div>
          <div><div className="kpi-label">Nombre de Tables</div><div className="kpi-value">{tables.length}</div></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><Users size={22} /></div>
          <div><div className="kpi-label">Capacité Totale</div><div className="kpi-value">{tables.reduce((acc, t) => acc + t.capacity, 0)}</div></div>
        </div>
      </div>

      <TablesClient initialTables={tables} initialZones={zones} />
    </div>
  );
}

