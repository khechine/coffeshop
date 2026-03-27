import { getCourierPortalData } from '../actions';
import CourierClient from './CourierClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CourierDashboard() {
  const data = await getCourierPortalData();

  if (!data) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '20px', textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>Profil de Livreur non trouvé</h1>
          <p style={{ color: '#64748B', marginTop: '8px' }}>Veuillez vous assurer que vous êtes enregistré en tant que coursier.</p>
        </div>
      </div>
    );
  }

  return <CourierClient data={data as any} />;
}
