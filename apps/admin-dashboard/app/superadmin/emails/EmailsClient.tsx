'use client';

import React from 'react';
import { Mail, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EmailsClient({ initialLogs }: { initialLogs: any[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Historique des E-mails</h1>
        <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Journal des 100 derniers e-mails envoyés par la plateforme</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Date & Heure</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Destinataire</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Sujet</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {initialLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  Aucun log d'e-mail trouvé.
                </td>
              </tr>
            ) : (
              initialLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                   <td style={{ padding: '20px 24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
                       <Clock size={16} />
                       {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                     </div>
                   </td>
                   <td style={{ padding: '20px 24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontSize: '14px', fontWeight: 700 }}>
                       <Mail size={16} color="#94A3B8" />
                       {log.to}
                     </div>
                   </td>
                   <td style={{ padding: '20px 24px', color: '#334155', fontSize: '14px' }}>
                     {log.subject}
                   </td>
                   <td style={{ padding: '20px 24px' }}>
                     {log.status === 'SENT' ? (
                       <div>
                         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#D1FAE5', color: '#065F46', fontSize: '12px', fontWeight: 800 }}>
                           <CheckCircle2 size={14} /> Envoyé
                         </span>
                         {log.messageId && (
                           <div style={{ marginTop: '6px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>ID: {log.messageId}</div>
                         )}
                       </div>
                     ) : (
                       <div>
                         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '12px', fontWeight: 800 }}>
                           <XCircle size={14} /> Échec
                         </span>
                         {log.error && (
                           <div style={{ marginTop: '6px', fontSize: '11px', color: '#EF4444', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.error}>
                             {log.error}
                           </div>
                         )}
                       </div>
                     )}
                   </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
