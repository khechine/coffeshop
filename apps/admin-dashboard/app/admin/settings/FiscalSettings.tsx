'use client';

import React, { useTransition } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';
import { toggleFiscalMode } from '../../actions';

interface FiscalSettingsProps {
  storeId: string;
  isFiscalEnabled: boolean;
  planName: string;
}

export default function FiscalSettings({ isFiscalEnabled, planName }: FiscalSettingsProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (enabled: boolean) => {
    const msg = enabled 
      ? "Activer le mode fiscal NACEF ? Cette action est irréversible pour les transactions futures et nécessite un abonnement valide."
      : "Désactiver le mode fiscal ? Attention, cela pourrait compromettre votre conformité si vous avez déjà émis des tickets fiscaux.";
    
    if (!confirm(msg)) return;

    startTransition(async () => {
      try {
        await toggleFiscalMode(enabled);
        alert(`Mode fiscal ${enabled ? 'activé' : 'désactivé'} avec succès.`);
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  const isEligible = planName?.toUpperCase() === 'PRO' || planName?.toUpperCase() === 'STARTER';

  return (
    <div className="card" style={{ border: isFiscalEnabled ? '1.5px solid #10B981' : '1px solid #E2E8F0' }}>
      <div className="card-header" style={{ background: isFiscalEnabled ? '#F0FDF4' : 'transparent' }}>
        <span className="card-title" style={{ color: isFiscalEnabled ? '#16A34A' : 'inherit' }}>
          <ShieldCheck size={18} /> Conformité Fiscale NACEF (Tunisie)
        </span>
        {isFiscalEnabled && (
          <div style={{ background: '#10B981', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
             ACTIF & SÉCURISÉ
          </div>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
              Le mode fiscal NACEF active le chaînage des tickets, la signature électronique et la génération de rapports Z conformes à la réglementation tunisienne.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>MODE NACEF</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: isFiscalEnabled ? '#10B981' : '#94A3B8' }}>
                   {isFiscalEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                </div>
             </div>
             <button
               onClick={() => handleToggle(!isFiscalEnabled)}
               disabled={isPending || (!isEligible && !isFiscalEnabled)}
               style={{
                 width: '60px', height: '32px', borderRadius: '20px', border: 'none',
                 background: isFiscalEnabled ? '#10B981' : '#E2E8F0',
                 position: 'relative', cursor: (isEligible || isFiscalEnabled) ? 'pointer' : 'not-allowed',
                 transition: '0.3s', opacity: (isEligible || isFiscalEnabled) ? 1 : 0.5
               }}
             >
               <div style={{
                 width: '26px', height: '26px', background: '#fff', borderRadius: '50%',
                 position: 'absolute', top: '3px', left: isFiscalEnabled ? '31px' : '3px',
                 transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
               }} />
             </button>
          </div>
        </div>

        {!isEligible && !isFiscalEnabled && (
          <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', gap: '12px' }}>
             <Lock size={20} color="#64748B" />
             <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>Plan Pro ou Starter Requis</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Votre plan actuel ne permet pas l'activation du mode fiscal.</div>
             </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#F1F5F9', borderRadius: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#475569' }}>
                <CheckCircle size={16} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Signature HMAC</span>
             </div>
             <div style={{ fontSize: '11px', color: '#64748B' }}>Chaque ticket est signé numériquement et infalsifiable.</div>
          </div>
          <div style={{ padding: '16px', background: '#F1F5F9', borderRadius: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#475569' }}>
                <CheckCircle size={16} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Chaînage SHA-256</span>
             </div>
             <div style={{ fontSize: '11px', color: '#64748B' }}>Les tickets sont liés entre eux pour éviter toute suppression.</div>
          </div>
        </div>

        {isFiscalEnabled && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#FFFBEB', borderRadius: '16px', border: '1px solid #FEF3C7', display: 'flex', gap: '12px' }}>
             <AlertTriangle size={20} color="#D97706" />
             <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
               <b>Rappel :</b> En mode fiscal, vous devez impérativement générer un rapport Z chaque jour avant minuit.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
