'use client';

import React, { useState } from 'react';
import { ShoppingCart, Calendar, Search, Filter, Printer, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import { PrintService } from '../../pos/PrintService';

export default function SalesClient({ initialSales, storeName, storeAddress, storePhone, planName }: { initialSales: any[]; storeName: string; storeAddress?: string; storePhone?: string; planName?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = initialSales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.fiscalNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.tableName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.takenBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReprint = (sale: any) => {
    // Reconstruct items from sale for printing
    const printItems = sale.items.map((i: any) => ({
      productId: i.productId,
      name: i.product?.name || i.name || 'Produit',
      price: Number(i.price),
      quantity: i.quantity,
      taxRate: Number(i.taxRate || 0.19)
    }));

    PrintService.printTicket({
      storeName,
      storeAddress,
      storePhone,
      sale: {
        ...sale,
        total: Number(sale.total),
        totalHt: Number(sale.totalHt),
        totalTax: Number(sale.totalTax),
        change: Number(sale.change)
      },
      items: printItems
    }, { paperSize: '80mm' }, planName);
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShoppingCart size={24} color="#6366F1" /> Historique des Ventes</h1>
          <p>Toutes les transactions {storeName} — Conformité NACEF active</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Recherche (ticket, facture, barista...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', width: '250px' }}
            />
          </div>
          <button className="btn btn-ghost" style={{ border: '1px solid #E2E8F0', background: '#fff' }}><Calendar size={16} /> Date</button>
          <button className="btn btn-ghost" style={{ border: '1px solid #E2E8F0', background: '#fff' }}><Filter size={16} /> Filtres</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
         <table className="data-table">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th className="mobile-hide">Date & Heure</th>
                <th>Référence / Facture</th>
                <th>Détails de la Commande</th>
                <th>Fiscalité & NACEF</th>
                <th>Staff & Lieu</th>
                <th style={{ textAlign: 'right' }}>Total TTC</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr key={sale.id}>
                   <td className="mobile-hide" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '13px' }}>{new Date(sale.createdAt).toLocaleDateString('fr-FR')}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>
                   </td>
                   <td>
                      <div style={{ fontWeight: 800, color: '#6366F1', fontSize: '14px' }}>#{sale.id.slice(-6).toUpperCase()}</div>
                      {sale.isFiscal && (
                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <CheckCircle size={10} /> {sale.fiscalNumber}
                        </div>
                      )}
                   </td>
                   <td style={{ maxWidth: '250px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', lineHeight: '1.4' }}>
                        {sale.items.map((i: any) => `${i.quantity}x ${i.product?.name || 'Produit'}`).join(', ')}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                        {sale.consumeType === 'TAKEAWAY' ? '🥡 À Emporter' : '☕ Sur Place'}
                      </div>
                   </td>
                   <td>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        HT: <span style={{fontWeight:700}}>{Number(sale.totalHt || 0).toFixed(3)} DT</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        TVA: <span style={{fontWeight:700}}>{Number(sale.totalTax || 0).toFixed(3)} DT</span>
                      </div>
                      {sale.hash && (
                        <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={10} color="#10B981" /> Hash Vérifié
                        </div>
                      )}
                   </td>
                   <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Barista: <span style={{fontWeight:700, color:'#1E1B4B'}}>{sale.takenBy?.name || 'Inconnu'}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ padding: '2px 6px', background: '#F1F5F9', borderRadius: '4px' }}>{sale.tableName || 'Directe'}</span>
                      </div>
                   </td>
                   <td style={{ textAlign: 'right', fontWeight: 900, color: '#1E1B4B', fontSize: '15px' }}>
                      {Number(sale.total).toFixed(3)} DT
                   </td>
                   <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleReprint(sale)}
                        style={{ padding: '8px', borderRadius: '8px', background: '#6366F1', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                        title="Réimprimer le ticket"
                      >
                        <Printer size={16} />
                      </button>
                   </td>
                </tr>
              ))}
            </tbody>
         </table>
         {filtered.length === 0 && (
           <div style={{ padding: '80px', textAlign: 'center', color: '#94A3B8' }}>
             <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
             <div>Aucune vente trouvée dans l'historique.</div>
           </div>
         )}
      </div>
    </div>
  );
}
