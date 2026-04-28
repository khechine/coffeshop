'use client';

import React, { useState, useTransition } from 'react';
import { FileText, Plus, CheckCircle, Download, Calendar, ShieldCheck, Tag, Trash2, Eraser } from 'lucide-react';
import { generateZReportAction, deleteZReportAction } from '../../actions';

export default function ReportsClient({ initialReports, storeName }: { initialReports: any[]; storeName: string; }) {
  const [reports, setReports] = useState(initialReports || []);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateZReportAction();
        setReports([result, ...reports].sort((a, b) => new Date(b.reportDay).getTime() - new Date(a.reportDay).getTime()));
        alert("Rapport Z généré avec succès !");
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Supprimer ce rapport ?")) return;
    startTransition(async () => {
      try {
        await deleteZReportAction(id);
        setReports(reports.filter(r => r.id !== id));
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  const handleCleanEmpty = () => {
    const emptyReports = reports.filter(r => Number(r.totalTtc) === 0);
    if (emptyReports.length === 0) return alert("Aucun rapport vide trouvé.");
    if (!window.confirm(`Supprimer ${emptyReports.length} rapports vides (0.000 DT) ?`)) return;
    
    startTransition(async () => {
      try {
        for (const r of emptyReports) {
          await deleteZReportAction(r.id);
        }
        setReports(reports.filter(r => Number(r.totalTtc) > 0));
        alert("Nettoyage terminé !");
      } catch (e: any) {
        alert("Erreur lors du nettoyage");
      }
    });
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><FileText size={28} color="#6366F1" /> Reporting & Clôtures NACEF</h1>
          <p>Conformité fiscale : Rapports Z journaliers pour {storeName}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleCleanEmpty} 
            disabled={isPending}
            className="btn btn-outline" 
            style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', borderColor: '#FEE2E2' }}
          >
            <Eraser size={18} /> Nettoyer Vides
          </button>
          <button 
            onClick={handleGenerate} 
            disabled={isPending}
            className="btn btn-primary" 
            style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isPending ? 'Génération...' : <><Plus size={18} /> Générer Z-Report du Jour</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {reports.map((report) => (
          <div key={report.id} className="card" style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ padding: '6px 12px', background: '#F0FDF4', color: '#10B981', borderRadius: '8px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> CLÔTURÉ
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {new Date(report.reportDay).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Ventes</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E1B4B' }}>{report.salesCount} Tickets</div>
              </div>
              <div style={{ padding: '16px', background: '#EEF2FF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '10px', color: '#6366F1', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Total TTC</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#4F46E5' }}>{Number(report.totalTtc).toFixed(3)} DT</div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1.5px dashed #E2E8F0', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: '#64748B' }}>Total HT :</span>
                  <span style={{ fontWeight: 800, color: '#1E293B' }}>{Number(report.totalHt).toFixed(3)} DT</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#64748B' }}>TVA Totale :</span>
                  <span style={{ fontWeight: 900, color: '#6366F1' }}>{Number(report.totalTax).toFixed(3)} DT</span>
               </div>
               
               {/* Ventilation par taux */}
               <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                  {Object.entries(report.taxBreakdown || {}).map(([rate, amount]) => (
                    <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>
                      <span>Taux {rate}</span>
                      <span>{Number(amount).toFixed(3)} DT</span>
                    </div>
                  ))}
               </div>
            </div>

            {report.hash && (
              <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '12px', fontSize: '9px', color: '#94A3B8', fontFamily: 'monospace', marginBottom: '20px', wordBreak: 'break-all', display: 'flex', gap: '8px' }}>
                 <ShieldCheck size={16} color="#10B981" style={{ flexShrink: 0 }} />
                 <div>
                    <div style={{ fontWeight: 800, marginBottom: '2px', color: '#1E293B' }}>SIGNATURE NACEF SHA-256</div>
                    {report.hash}
                 </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => handleDelete(report.id)}
                className="btn btn-outline" 
                style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#EF4444' }}
              >
                <Trash2 size={18} /> Supprimer
              </button>
              <button className="btn btn-outline" style={{ flex: 2, padding: '12px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Download size={18} /> Télécharger
              </button>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '2px dashed #E2E8F0' }}>
             <FileText size={64} style={{ opacity: 0.1, marginBottom: '16px' }} />
             <div style={{ color: '#94A3B8', fontSize: '16px', fontWeight: 600 }}>Aucun rapport Z généré pour le moment.</div>
          </div>
        )}
      </div>
    </div>
  );
}
