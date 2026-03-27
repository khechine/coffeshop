import { prisma } from '@coffeeshop/database';
import { Store, MapPin, Building2 } from 'lucide-react';
import SettingsClient from './SettingsClient';
import { getStore } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const store = await getStore();

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg,#0F172A,#1E1B4B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={22} color="#fff" />
          </div>
          <div>
            <h1>Paramètres de l'Établissement</h1>
            <p>Personnalisez les informations de votre café pour la facturation et l'affichage.</p>
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '24px' }}>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Store size={22} /></div>
          <div><div className="kpi-label">Nom du Café</div><div className="kpi-value" style={{ fontSize: '18px' }}>{store.name}</div></div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon orange"><MapPin size={22} /></div>
          <div><div className="kpi-label">Localisation</div><div className="kpi-value" style={{ fontSize: '18px' }}>{store.city || 'Non défini'}</div></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><Building2 size={22} /></div>
          <div><div className="kpi-label">Téléphone</div><div className="kpi-value">{store.phone || 'Non renseigné'}</div></div>
        </div>
      </div>

      <SettingsClient store={store as any} />
    </div>
  );
}
