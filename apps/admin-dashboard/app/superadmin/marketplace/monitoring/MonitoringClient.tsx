'use client';

import React, { useState, useTransition } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCcw, 
  Flag, 
  History, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Lock,
  Search
} from 'lucide-react';
import { flagRelationship, unflagRelationship, runEmergencyScan, getRelationshipHistory } from './actions';

export default function MonitoringClient({ initialStats, initialRisks }: { initialStats: any, initialRisks: any[] }) {
  const [stats, setStats] = useState(initialStats);
  const [risks, setRisks] = useState(initialRisks);
  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');

  const handleScan = async () => {
    startTransition(async () => {
      const result = await runEmergencyScan();
      window.location.reload(); // Simple way to refresh all server data
    });
  };

  const handleFlag = async (pair: any) => {
    const reason = prompt('Raison du signalement :', 'Activité suspecte hors-circuit');
    if (reason) {
      startTransition(async () => {
        await flagRelationship(pair.storeId, pair.vendorId, reason);
        window.location.reload();
      });
    }
  };

  const handleUnflag = async (pair: any) => {
    if (confirm('Voulez-vous retirer le signalement ?')) {
      startTransition(async () => {
        await unflagRelationship(pair.storeId, pair.vendorId);
        window.location.reload();
      });
    }
  };

  const viewHistory = async (pair: any) => {
    setSelectedPair(pair);
    setHistory(null);
    const data = await getRelationshipHistory(pair.storeId, pair.vendorId);
    setHistory(data);
  };

  const filteredRisks = risks.filter(r => 
    r.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={32} color="#4F46E5" /> Monitor Anti-Bypass
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Détection algorithmique du leakage et des transactions hors-plateforme.</p>
        </div>
        <button 
          onClick={handleScan}
          disabled={isPending}
          style={{ 
            padding: '12px 24px', 
            borderRadius: '16px', 
            background: isPending ? '#94A3B8' : '#1E293B', 
            color: '#fff', 
            border: 'none', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: isPending ? 'default' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <RefreshCcw size={18} className={isPending ? 'animate-spin' : ''} />
          {isPending ? 'Analyse...' : 'Lancer un Scan Global'}
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <StatCard 
          label="Taux de Leakage" 
          value={stats.leakageRiskRate} 
          icon={TrendingDown} 
          color="#EF4444" 
          description="Basé sur vues vs commandes"
        />
        <StatCard 
          label="Score de Santé" 
          value={100 - parseInt(stats.leakageRiskRate) + "%"} 
          icon={ShieldCheck} 
          color="#10B981" 
          description="Intégrité de la marketplace"
        />
        <StatCard 
          label="Relations à Haut Risque" 
          value={stats.highRiskCount} 
          icon={AlertTriangle} 
          color="#F59E0B" 
          description="Score BehaviorScoring > 70"
        />
        <StatCard 
          label="Boutiques Signalées" 
          value={stats.flaggedCount} 
          icon={Flag} 
          color="#4F46E5" 
          description="Flag manuel par Admin"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        
        {/* Main Risk List */}
        <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', minHeight: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Flux de Risque BehaviorScoring</h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="rechercher boutique..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredRisks.map((r) => (
              <div 
                key={r.id} 
                onClick={() => viewHistory(r)}
                style={{ 
                  padding: '20px', 
                  borderRadius: '24px', 
                  background: selectedPair?.id === r.id ? '#F1F5F9' : '#F8FAFC', 
                  border: '1px solid', 
                  borderColor: selectedPair?.id === r.id ? '#4F46E5' : '#E2E8F0',
                  cursor: 'pointer',
                  transition: '0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: r.score >= 80 ? '#FEE2E2' : r.score >= 60 ? '#FEF3C7' : '#E0E7FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px',
                  color: r.score >= 80 ? '#EF4444' : r.score >= 60 ? '#F59E0B' : '#4F46E5'
                }}>
                  {r.score}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>{r.storeName}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Vers : <span style={{ fontWeight: 700 }}>{r.vendorName}</span></div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: '#E2E8F0', fontWeight: 700, color: '#475569' }}>
                      {r.totalInteractions} vus
                    </span>
                    <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: r.totalOrders > 0 ? '#DCFCE7' : '#F1F5F9', fontWeight: 700, color: r.totalOrders > 0 ? '#15803D' : '#94A3B8' }}>
                      {r.totalOrders} commandes
                    </span>
                    {r.isFlagged && (
                      <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: '#EF4444', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flag size={10} /> SIGNALÉ
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} color="#94A3B8" />
              </div>
            ))}
            {filteredRisks.length === 0 && (
              <div style={{ padding: '80px', textAlign: 'center', color: '#94A3B8' }}>
                <ShieldCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Aucune relation à risque détectée actuellement.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', position: 'sticky', top: '100px', height: 'fit-content' }}>
          {!selectedPair ? (
            <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', textAlign: 'center' }}>
              <Activity size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Sélectionnez une relation<br/>pour analyser l'historique.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>Détails de la Relation</h3>
                <button 
                  onClick={() => selectedPair.isFlagged ? handleUnflag(selectedPair) : handleFlag(selectedPair)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '10px', 
                    background: selectedPair.isFlagged ? '#F8FAFC' : '#EF4444', 
                    color: selectedPair.isFlagged ? '#EF4444' : '#fff',
                    border: '1px solid #EF4444',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {selectedPair.isFlagged ? 'Retirer Flag' : 'Signaler'}
                </button>
              </div>

              <div style={{ padding: '16px', borderRadius: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Boutique</div>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>{selectedPair.storeName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendeur</div>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>{selectedPair.vendorName}</div>
                </div>
              </div>

              {selectedPair.isFlagged && (
                <div style={{ padding: '16px', borderRadius: '16px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#B91C1C' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flag size={14} /> Raison du signalement
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{selectedPair.flagReason}</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <History size={18} /> Historique des Activités
                </h4>
                
                {!history ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>Chargement...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {history.interactions.map((i: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', paddingLeft: '12px', borderLeft: '2px solid #E2E8F0', position: 'relative' }}>
                        <div style={{ 
                          position: 'absolute', 
                          left: '-6px', 
                          top: '0', 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: i.type === 'PLACE_ORDER' ? '#10B981' : '#4F46E5',
                          border: '2px solid #fff' 
                        }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{i.type.replace('_', ' ')}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(i.createdAt).toLocaleString('fr-FR')}</div>
                        </div>
                      </div>
                    ))}
                    {history.interactions.length === 0 && <div style={{ fontSize: '12px', color: '#94A3B8' }}>Aucune interaction récente.</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, description }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>{value}</div>
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{description}</div>
      </div>
    </div>
  );
}

