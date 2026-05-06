'use client';

import React, { useState, useEffect } from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { Target, Clock, MessageCircle, FileText, ChevronRight, User, CheckCircle2 } from 'lucide-react';

export default function MyRequestsClient({ rfqs, store }: any) {
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (date: any) => {
    if (!mounted) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader store={store} />

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: '#111827', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Target size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>Mes Demandes de Devis</h1>
            <p style={{ color: '#6B7280', margin: '4px 0 0' }}>Suivez vos appels d'offres et consultez les propositions des fournisseurs.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
          {/* RFQ List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rfqs.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <p style={{ color: '#6B7280' }}>Vous n'avez pas encore créé de demande.</p>
              </div>
            ) : (
              rfqs.map((rfq: any) => (
                <div 
                  key={rfq.id}
                  onClick={() => setSelectedRfq(rfq)}
                  style={{ 
                    background: '#fff', 
                    borderRadius: '16px', 
                    padding: '20px', 
                    border: `2px solid ${selectedRfq?.id === rfq.id ? '#111827' : 'transparent'}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ 
                      fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', 
                      padding: '4px 8px', borderRadius: '4px',
                      background: rfq.status === 'OPEN' ? '#DCFCE7' : '#F3F4F6',
                      color: rfq.status === 'OPEN' ? '#166534' : '#6B7280'
                    }}>
                      {rfq.status === 'OPEN' ? 'En cours' : 'Clôturé'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(rfq.createdAt)}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{rfq.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} /> {rfq.category}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageCircle size={14} /> {rfq.quotes.length} offre(s)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details & Quotes */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', border: '1px solid #E5E7EB', minHeight: '600px' }}>
            {selectedRfq ? (
              <div>
                <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '24px', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: '0 0 12px' }}>{selectedRfq.title}</h2>
                  <p style={{ color: '#4B5563', lineHeight: 1.6 }}>{selectedRfq.description}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
                    <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Quantité</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{selectedRfq.quantity}</span>
                    </div>
                    <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Budget</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{selectedRfq.budget ? `${selectedRfq.budget} DT` : 'Non spécifié'}</span>
                    </div>
                    <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Échéance</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{selectedRfq.deadline ? formatDate(selectedRfq.deadline) : 'ASAP'}</span>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', marginBottom: '20px' }}>Offres Reçues ({selectedRfq.quotes.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedRfq.quotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                      <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p>En attente de réponses des fournisseurs...</p>
                    </div>
                  ) : (
                    selectedRfq.quotes.map((quote: any) => (
                      <div key={quote.id} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={20} color="#6B7280" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#111827' }}>{quote.vendor.companyName}</div>
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>{quote.vendor.city} • {formatDate(quote.createdAt)}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#16A34A' }}>{Number(quote.price).toFixed(2)} DT</div>
                          </div>
                        </div>
                        {quote.notes && (
                          <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', fontSize: '14px', color: '#4B5563', marginBottom: '16px' }}>
                            "{quote.notes}"
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#111827', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Accepter l'offre</button>
                          <button style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Discuter</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#6B7280' }}>
                <Target size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <p>Sélectionnez une demande pour voir les détails et les offres.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
