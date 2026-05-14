import React from 'react';
import { getVendorPortalData } from '../../actions';
import { Package, TrendingUp, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MobileVendorDashboard() {
  let vendorData = null;
  try {
    vendorData = await getVendorPortalData();
  } catch (error) {
    // Handling not logged in or not a vendor
  }

  if (!vendorData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 16px', color: '#EF4444' }} />
        <h2>Accès Refusé</h2>
        <p>Connectez-vous en tant que vendeur pour accéder à cet espace.</p>
        <Link href="/login" style={{ color: '#E31E24', fontWeight: 'bold' }}>Se connecter</Link>
      </div>
    );
  }

  const { vendor, recentOrders, stats } = vendorData;

  const quickStats = [
    { label: 'Revenus', value: `${Number(stats.totalRevenue).toFixed(0)} DT`, icon: TrendingUp, color: '#10B981' },
    { label: 'À Préparer', value: stats.pendingOrders, icon: Package, color: '#F59E0B' },
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ marginTop: '10px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>Bonjour, {vendor.companyName} ! 📦</h1>
        <p style={{ color: '#6B7280', fontSize: '15px', marginTop: '4px' }}>Aperçu de vos ventes B2B.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {quickStats.map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${s.color}10`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <s.icon size={20} />
             </div>
             <div style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>{s.value}</div>
             <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action Banner */}
      <Link href="/mobile/vendor/orders" style={{ textDecoration: 'none' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #E31E24 0%, #B91C1C 100%)', 
          borderRadius: '24px', padding: '24px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 25px rgba(227,30,36,0.2)'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Commandes en attente</h2>
            <p style={{ fontSize: '14px', color: '#FECACA', margin: '4px 0 0' }}>Gérez les expéditions.</p>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={20} />
          </div>
        </div>
      </Link>

      {/* Recent Activity */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0 }}>Activité Récente</h3>
          <Link href="/mobile/vendor/orders" style={{ fontSize: '14px', fontWeight: 700, color: '#E31E24', textDecoration: 'none' }}>Tout voir</Link>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentOrders.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>Aucune commande récente.</div>
          ) : recentOrders.slice(0,3).map((order: any) => (
            <div key={order.id} style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E31E24' }}>
                <ShoppingBag size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#111827' }}>#{order.id.slice(-6)} - {order.store.name}</div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  {order.status === 'PENDING' ? 'En attente' : order.status === 'ACCEPTED' ? 'Préparation' : 'Livré'}
                </div>
              </div>
              <div style={{ fontWeight: 900, color: '#111827' }}>{Number(order.total).toFixed(0)} DT</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
