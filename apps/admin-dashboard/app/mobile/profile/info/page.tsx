import React from 'react';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { getStore } from '../../../actions';

export const dynamic = 'force-dynamic';

export default async function ProfileInfoPage() {
  const store = await getStore();

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/mobile/profile" style={{ color: '#111827', textDecoration: 'none' }}>
          <ChevronLeft size={28} />
        </Link>
        <h1 style={{ fontSize: '22px', fontWeight: 950, color: '#111827', margin: 0 }}>Informations du Café</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '8px', display: 'block' }}>Nom de l'établissement</label>
            <input type="text" defaultValue={store?.name || ''} placeholder="Ex: Café Central" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px', fontWeight: 600, outline: 'none' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '8px', display: 'block' }}>Ville</label>
            <input type="text" defaultValue={store?.city || ''} placeholder="Ex: Tunis" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px', fontWeight: 600, outline: 'none' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '8px', display: 'block' }}>Téléphone de contact</label>
            <input type="tel" defaultValue="" placeholder="Ex: +216 20 123 456" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '15px', fontWeight: 600, outline: 'none' }} />
          </div>

          <button style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#111827', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <Save size={20} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
