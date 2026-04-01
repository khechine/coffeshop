import { getVendorPortalData } from '../../actions';
import { ShoppingBag, Package, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  const portalData = await getVendorPortalData();

  if (!portalData) return <div style={{ padding: '40px' }}>Chargement ou Profil non trouvé...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Tableau de Bord Fournisseur</h2>
        <p style={{ color: '#64748B', marginTop: '4px' }}>Bienvenue sur votre espace de vente B2B, {portalData.companyName}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748B', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Ventes Totales</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#4F46E5' }}>{portalData.orders.reduce((acc: number, o: any) => acc + Number(o.total), 0).toFixed(3)} DT</div>
        </div>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748B', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Commandes actives</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#F59E0B' }}>{portalData.orders.filter((o: any) => o.status === 'PENDING').length}</div>
        </div>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748B', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Produits au catalogue</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10B981' }}>{portalData.products.length}</div>
        </div>
      </div>

      {portalData.orders.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '80px', textAlign: 'center' }}>
          <ShoppingBag size={48} style={{ color: '#E2E8F0', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Aucune commande pour le moment</h3>
          <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 24px' }}>
            Une fois que votre compte sera activé par l'administrateur, vos produits apparaîtront sur le marketplace et vous recevrez vos premières commandes ici.
          </p>
          <Link href="/vendor/portal/catalog" className="btn btn-primary" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none' }}>Gérer mon catalogue</Link>
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><span className="card-title">Dernières Commandes</span></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Café</th>
                  <th>Cité / Ville</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {portalData.orders.map((o: any) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700 }}>{o.store.name}</td>
                    <td>{o.store.city}</td>
                    <td style={{ fontWeight: 800, color: '#4F46E5' }}>{Number(o.total).toFixed(3)} DT</td>
                    <td style={{ color: '#64748B' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${o.status === 'PENDING' ? 'orange' : 'green'}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
