'use client';

import React, { useState, useTransition } from 'react';
import { updateMissionStatus } from '../actions';
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Navigation, 
  AlertCircle,
  ChevronRight,
  LogOut,
  Store,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CourierClient({ data }: { data: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'COMPLETED'>('MISSIONS');

  const missions = data.orders.filter((o: any) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const completed = data.orders.filter((o: any) => o.status === 'DELIVERED');

  const handleUpdateStatus = (orderId: string, status: string) => {
    startTransition(async () => {
      await updateMissionStatus(orderId, status as any);
    });
  };

  const currentList = activeTab === 'MISSIONS' ? missions : completed;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '80px' }}>
      {/* App Header */}
      <header style={{ background: '#1E1B4B', padding: '24px 20px 40px', color: '#fff', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
             <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courier Portal</h4>
             <h1 style={{ fontSize: '24px', fontWeight: 900 }}>Salut, {data.user?.name || 'Livreur'}!</h1>
          </div>
          <button 
            onClick={() => router.push('/auth/login')}
            style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <LogOut size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', gap: '20px' }}>
          <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Missions</div>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>{missions.length}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Véhicule</div>
            <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
               <Truck size={14} /> {data.vehicleType || 'Standard'}
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '0 20px', marginTop: '-20px' }}>
        {/* Tabs */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '6px', display: 'flex', gap: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('MISSIONS')}
            style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'MISSIONS' ? '#1E1B4B' : 'transparent', color: activeTab === 'MISSIONS' ? '#fff' : '#64748B', fontWeight: 700, fontSize: '14px', transition: 'all 0.2s', cursor: 'pointer' }}
          >
            Missions Actives
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'COMPLETED' ? '#1E1B4B' : 'transparent', color: activeTab === 'COMPLETED' ? '#fff' : '#64748B', fontWeight: 700, fontSize: '14px', transition: 'all 0.2s', cursor: 'pointer' }}
          >
            Historique
          </button>
        </div>

        {/* Mission List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '24px', border: '1px dashed #E2E8F0', color: '#94A3B8' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>Pas de missions pour le moment</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Dès qu'une nouvelle commande est prête, elle apparaîtra ici.</p>
            </div>
          ) : (
            currentList.map((order: any) => (
              <div key={order.id} style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                   <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, background: '#F1F5F9', color: '#1E1B4B', padding: '4px 8px', borderRadius: '6px' }}>#{order.id.slice(-6)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 950, color: '#1E1B4B' }}>{order.total.toFixed(3)} <span style={{fontSize:'12px'}}>DT</span></div>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #F8FAFC', paddingTop: '16px', marginBottom: '20px' }}>
                   {/* Pickup */}
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         <Store size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Point de Collecte (Vendeur)</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B' }}>{order.vendor?.companyName || 'Vendeur Inconnu'}</div>
                        <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <MapPin size={12} /> {order.vendor?.address ? `${order.vendor.address}, ${order.vendor.city}` : 'Addresse non spécifiée'}
                        </div>
                      </div>
                      <button 
                        style={{ marginLeft: 'auto', background: '#F1F5F9', border: 'none', color: '#4F46E5', padding: '8px', borderRadius: '10px', height: 'fit-content' }}
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.vendor?.lat},${order.vendor?.lng}`, '_blank')}
                      >
                        <Navigation size={18} />
                      </button>
                   </div>

                   {/* Delivery */}
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         <MapPin size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Client (Café)</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B' }}>{order.store?.name || 'Café Inconnu'}</div>
                        <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <MapPin size={12} /> {order.store?.address ? `${order.store.address}, ${order.store.city}` : 'Addresse non spécifiée'}
                        </div>
                        {order.store?.phone && (
                          <div style={{ marginTop: '8px' }}>
                            <a href={`tel:${order.store.phone}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1E1B4B', background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
                              <Phone size={14} /> {order.store.phone}
                            </a>
                          </div>
                        )}
                      </div>
                      <button 
                        style={{ marginLeft: 'auto', background: '#F1F5F9', border: 'none', color: '#10B981', padding: '8px', borderRadius: '10px', height: 'fit-content' }}
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.store?.lat},${order.store?.lng}`, '_blank')}
                      >
                        <Navigation size={18} />
                      </button>
                   </div>
                </div>

                {/* Actions */}
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {order.status === 'CONFIRMED' || order.status === 'PENDING' ? (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                        disabled={isPending}
                        style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#4F46E5', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Package size={18} /> Prendre en charge
                      </button>
                    ) : order.status === 'SHIPPED' ? (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        disabled={isPending}
                        style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#10B981', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <CheckCircle2 size={18} /> Marquer comme Livré
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modern Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: '16px', left: '20px', right: '20px', height: '64px', background: '#1E1B4B', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: '0 12px', zIndex: 100 }}>
         <button onClick={() => setActiveTab('MISSIONS')} style={{ background: 'none', border: 'none', color: activeTab === 'MISSIONS' ? '#fff' : 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Truck size={22} />
            <span style={{ fontSize: '10px', fontWeight: 700 }}>Missions</span>
         </button>
         <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-40px', border: '4px solid #F8FAFC', boxShadow: '0 8px 16px rgba(79,70,229,0.3)' }}>
            <Navigation size={22} color="#fff" />
         </div>
         <button onClick={() => setActiveTab('COMPLETED')} style={{ background: 'none', border: 'none', color: activeTab === 'COMPLETED' ? '#fff' : 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <CheckCircle2 size={22} />
            <span style={{ fontSize: '10px', fontWeight: 700 }}>Livré</span>
         </button>
      </nav>
    </div>
  );
}

function getStatusBadge(status: string) {
  const styles: any = {
    PENDING: { bg: '#FEF3C7', color: '#D97706', label: 'En attente' },
    CONFIRMED: { bg: '#E0E7FF', color: '#4338CA', label: 'Confirmé' },
    SHIPPED: { bg: '#F3E8FF', color: '#7E22CE', label: 'En cours' },
    DELIVERED: { bg: '#D1FAE5', color: '#059669', label: 'Livré' },
  };
  const s = styles[status] || styles.PENDING;
  return (
    <span style={{ fontSize: '10px', fontWeight: 800, background: s.bg, color: s.color, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
      {s.label}
    </span>
  );
}
