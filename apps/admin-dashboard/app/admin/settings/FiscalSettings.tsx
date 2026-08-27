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
  const [isPending, setIsPending] = React.useState(false);

  const handleActivate = async () => {
    const msg = "Activer le mode fiscal NACEF ? Cette action enclenche le chaînage cryptographique des factures et la conformité légale CIMF.";
    
    if (!confirm(msg)) return;

    setIsPending(true);
    try {
      await toggleFiscalMode(true);
      alert("Mode fiscal NACEF activé avec succès.");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsPending(false);
    }
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
             ACTIF & CONFORME
          </div>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
              Le mode fiscal NACEF active le chaînage SHA-256 des tickets, la signature électronique S-MDF et la génération des rapports Z de fin de journée.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>STATUT FISCAL</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: isFiscalEnabled ? '#10B981' : '#94A3B8' }}>
                   {isFiscalEnabled ? 'VERROUILLÉ ACTIF' : 'NON ACTIVÉ'}
                </div>
             </div>
             {!isFiscalEnabled ? (
               <button
                 onClick={handleActivate}
                 disabled={isPending || !isEligible}
                 style={{
                   padding: '8px 16px', borderRadius: '12px', border: 'none',
                   background: '#10B981', color: '#fff', fontWeight: 800, fontSize: '13px',
                   cursor: isEligible ? 'pointer' : 'not-allowed', opacity: isEligible ? 1 : 0.5
                 }}
               >
                 {isPending ? 'Activation...' : 'Activer NACEF'}
               </button>
             ) : (
               <div style={{
                 padding: '6px 12px', borderRadius: '12px', background: '#F0FDF4',
                 border: '1px solid #BBF7D0', color: '#166534', fontSize: '11px', fontWeight: 800,
                 display: 'flex', alignItems: 'center', gap: '6px'
               }}>
                 <Lock size={13} /> INALTÉRABLE
               </div>
             )}
          </div>
        </div>

        {isFiscalEnabled && (
          <div style={{
            padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: '14px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start'
          }}>
            <Info size={18} color="#6366F1" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
              <strong>Besoin d'effectuer des tests ou de former des caissiers ?</strong><br />
              Pour respecter la piste d'audit CIMF, le mode fiscal ne doit pas être désactivé à chaud. Utilisez directement le <strong>Mode Formation</strong> sur la caisse POS : les tickets seront émis en <em>PRO-FORMA</em> sans impacter les ventes, le stock, ni la clôture fiscale Z.
            </div>
          </div>
        )}

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
