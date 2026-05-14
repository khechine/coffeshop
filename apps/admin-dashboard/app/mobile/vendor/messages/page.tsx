import React from 'react';
import { MessageSquare, Users, Send, ChevronRight } from 'lucide-react';
import { getVendorPortalData } from '../../../actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MobileVendorMessagesPage() {
  let vendorData = null;
  try {
    vendorData = await getVendorPortalData();
  } catch (error) {}

  if (!vendorData) return null;

  // Placeholder pour les messages RFQ.
  // En production, nous utiliserons getTradeMessagesAction.
  const threads = [
    { id: 1, storeName: 'Café de la Gare', lastMessage: 'Pouvez-vous me faire un prix pour 50kg ?', time: '10:30', unread: true },
    { id: 2, storeName: 'Bistro Central', lastMessage: 'Merci pour la livraison rapide.', time: 'Hier', unread: false },
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0 }}>Messages & RFQ</h1>
      </div>

      <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid #FECACA' }}>
        <MessageSquare size={24} color="#E31E24" />
        <div>
          <h4 style={{ margin: 0, color: '#991B1B', fontWeight: 800 }}>Appels d'offres B2B</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#B91C1C' }}>Négociez en direct avec les cafés.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {threads.map((t) => (
          <Link href={`/mobile/vendor/messages/${t.id}`} key={t.id} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#111827' }}>
                {t.storeName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>{t.storeName}</h4>
                  <span style={{ fontSize: '12px', color: t.unread ? '#E31E24' : '#6B7280', fontWeight: t.unread ? 800 : 500 }}>{t.time}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.lastMessage}
                </p>
              </div>
              {t.unread && <div style={{ width: '10px', height: '10px', borderRadius: '5px', background: '#E31E24' }} />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
