'use client';

import React, { useState } from 'react';
import { ShoppingCart, Calendar, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function SalesClient({ initialSales, storeName }: { initialSales: any[]; storeName: string; }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = initialSales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.takenBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShoppingCart size={24} color="#6366F1" /> Historique des Ventes</h1>
          <p>Toutes les transactions passées sur le POS : {storeName}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Recherche (ticket, table, barista...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', width: '250px' }}
            />
          </div>
          <button className="btn btn-ghost" style={{ border: '1px solid #E2E8F0', background: '#fff' }}><Calendar size={16} /> Date</button>
          <button className="btn btn-ghost" style={{ border: '1px solid #E2E8F0', background: '#fff' }}><Filter size={16} /> Filtres</button>
        </div>
      </div>

      <div className="card">
         <table className="data-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Ticket ID</th>
                <th>Détails de la Commande</th>
                <th>Staff (Prise / Encaissement)</th>
                <th>Emplacement</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr key={sale.id}>
                   <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>{sale.date}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{sale.time}</div>
                   </td>
                   <td style={{ fontWeight: 800, color: '#6366F1' }}>#{sale.id.slice(-6).toUpperCase()}</td>
                   <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', lineHeight: '1.4' }}>
                        {sale.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                   </td>
                   <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        Pris par: <span style={{fontWeight:800, color:'#1E1B4B'}}>{sale.takenBy}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                        Encaissé: <span style={{fontWeight:800, color:'#10B981'}}>{sale.cashier}</span>
                      </div>
                   </td>
                   <td>
                      <span style={{ padding: '4px 10px', background: sale.table === 'Directe' ? '#F1F5F9' : '#EEF2FF', color: sale.table === 'Directe' ? '#64748B' : '#6366F1', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>
                        {sale.table}
                      </span>
                   </td>
                   <td style={{ textAlign: 'right', fontWeight: 900, color: '#10B981', fontSize: '16px', whiteSpace: 'nowrap' }}>
                      {sale.total.toFixed(3)} DT
                   </td>
                </tr>
              ))}
            </tbody>
         </table>
         {filtered.length === 0 && (
           <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Aucune vente trouvée.</div>
         )}
      </div>
    </div>
  );
}
