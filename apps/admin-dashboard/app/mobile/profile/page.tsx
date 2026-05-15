import React from 'react';
import { User, LogOut, Settings, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react';
import { getStore, getUser } from '../../actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MobileProfilePage() {
  const store = await getStore();
  const user = await getUser();

  const menuItems = [
    { label: 'Informations du Café', icon: User, color: '#4F46E5', href: '/mobile/profile/info' },
    { label: 'Abonnement & Facturation', icon: CreditCard, color: '#10B981', href: '/mobile/profile/billing' },
    { label: 'Sécurité & Accès', icon: ShieldCheck, color: '#F59E0B', href: '/mobile/profile/security' },
    { label: 'Préférences', icon: Settings, color: '#6B7280', href: '/mobile/profile/preferences' },
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>Mon Profil</h1>
      
      {/* Profile Header */}
      <div style={{ background: '#111827', borderRadius: '24px', padding: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 950 }}>
          {(store?.name || 'C').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 900 }}>{store?.name || 'Mon Café'}</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>{user?.email || 'admin@elkassa.com'}</p>
        </div>
      </div>

      {/* Settings Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {menuItems.map((item, i) => (
          <Link href={item.href} key={i} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '16px 20px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={20} />
              </div>
              <span style={{ flex: 1, fontSize: '15px', fontWeight: 800, color: '#111827' }}>{item.label}</span>
              <ChevronRight size={20} color="#9CA3AF" />
            </div>
          </Link>
        ))}
      </div>

      {/* Logout Button */}
      <div style={{ marginTop: '20px' }}>
        <a href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', padding: '18px', borderRadius: '20px', background: '#FEF2F2', color: '#E31E24', textDecoration: 'none', fontSize: '15px', fontWeight: 900, border: '1px solid #FECACA' }}>
          <LogOut size={20} />
          Se déconnecter
        </a>
      </div>
    </div>
  );
}
