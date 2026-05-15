import React from 'react';
import { ChevronLeft, CreditCard, Download, FileText } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ProfileBillingPage() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/mobile/profile" style={{ color: '#111827', textDecoration: 'none' }}>
          <ChevronLeft size={28} />
        </Link>
        <h1 style={{ fontSize: '22px', fontWeight: 950, color: '#111827', margin: 0 }}>Facturation</h1>
      </div>

      <div style={{ background: '#ECFDF5', border: '1px solid #10B981', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#10B981', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#065F46' }}>Plan Actuel</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#047857' }}>Gratuit (Standard B2B)</p>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', marginBottom: '16px' }}>Dernières Factures</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#F3F4F6', padding: '10px', borderRadius: '10px', color: '#6B7280' }}>
                   <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>Facture #{2040 + i}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>0{i}/05/2026 • 240.50 DT</p>
                </div>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: '#4F46E5', padding: '8px' }}>
                <Download size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
