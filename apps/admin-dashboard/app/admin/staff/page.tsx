import { prisma } from '@coffeeshop/database';
import { Users, ShieldCheck, Clock } from 'lucide-react';
import StaffClient from './StaffClient';

import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function StaffManagement() {
  const store = await getStore();
  const staff = store ? await prisma.user.findMany({ where: { storeId: store.id } }) : [];
  const tables = store ? await prisma.storeTable.findMany({ where: { storeId: store.id }, orderBy: { label: 'asc' } }) : [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Gestion du Personnel</h1>
          <p>Gérez les accès à la caisse et les rôles pour <strong>{store?.name}</strong>.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '24px' }}>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Users size={22} /></div>
          <div><div className="kpi-label">Total Employés</div><div className="kpi-value">{staff.length}</div></div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple"><ShieldCheck size={22} /></div>
          <div><div className="kpi-label">Gérants</div><div className="kpi-value">{staff.filter(u => u.role === 'STORE_OWNER').length}</div></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><Clock size={22} /></div>
          <div><div className="kpi-label">Caissiers</div><div className="kpi-value">{staff.filter(u => u.role === 'CASHIER').length}</div></div>
        </div>
      </div>

      <StaffClient staff={staff as any} tables={tables as any} />
    </div>
  );
}
