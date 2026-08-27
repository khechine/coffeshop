'use client';

import React, { useState, useCallback } from 'react';
import {
  ShieldCheck, Server, Wifi, WifiOff, RefreshCw, Save, Play,
  CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, ChevronRight,
  Loader2, Terminal, Shield, FileText, Zap, Eye, EyeOff, Activity,
  Clock, Database, Lock, Key, Hash, AlertCircle, Check
} from 'lucide-react';
import {
  nacefConfigureAction,
  nacefGetManifestAction,
  nacefSyncAction,
  nacefInitializeAction,
  nacefSimulateSignAction,
} from '../../actions';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreData {
  id: string;
  name?: string;
  smdfUrl?: string;
  imdf?: string;
  matriculeFiscal?: string;
  establishmentReference?: string;
  commercialName?: string;
  accreditationReference?: string;
  isFiscalEnabled?: boolean;
  nacefSyncStatus?: string;
  nacefLastSyncAt?: string;
}

interface NacefLog {
  id: string;
  action: string;
  status: string;
  createdAt: string;
  errorMessage?: string;
}

interface NacefConfigClientProps {
  storeId: string;
  initialData: StoreData;
  initialLogs: NacefLog[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  '0': { label: 'Non initialisé — Aucun IMDF assigné', color: '#94A3B8', icon: <AlertCircle size={14} /> },
  '2': { label: 'Certificat demandé', color: '#F59E0B', icon: <Clock size={14} /> },
  '3': { label: 'Client SMDF suspendu', color: '#EF4444', icon: <XCircle size={14} /> },
  '4': { label: 'Non synchronisé — Synchronisation requise', color: '#F97316', icon: <AlertTriangle size={14} /> },
  '5': { label: 'Opérationnel — Prêt à signer', color: '#10B981', icon: <CheckCircle size={14} /> },
  '6': { label: 'Synchronisation en cours...', color: '#3B82F6', icon: <RefreshCw size={14} /> },
};

function getStatusInfo(status: string | undefined) {
  if (!status) return STATUS_LABELS['0'];
  const code = status.split(':')[0].trim();
  return STATUS_LABELS[code] || { label: status, color: '#94A3B8', icon: <Info size={14} /> };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateImdf(v: string) {
  if (!v) return 'IMDF requis';
  if (v.length < 14 || v.length > 16) return 'Doit contenir entre 14 et 16 caractères';
  return null;
}

function validateMatricule(v: string) {
  if (!v) return 'Matricule Fiscal requis';
  if (!/^\d{7}[A-Z]$/.test(v)) return 'Format requis : 7 chiffres + 1 lettre majuscule (ex: 1234567A)';
  return null;
}

function validateAccreditation(v: string) {
  if (!v) return 'Référence d\'accréditation requise';
  if (v.length < 8 || v.length > 32) return 'Entre 8 et 32 caractères requis';
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, icon, color, children }: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '20px 24px',
        borderBottom: '1px solid #F1F5F9',
        background: '#FAFBFC',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: color + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  );
}

function FieldGroup({ label, hint, error, children }: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', fontSize: '11px', fontWeight: 800,
        color: '#94A3B8', marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.08em'
      }}>
        {label}
      </label>
      {children}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <XCircle size={12} color="#EF4444" />
          <span style={{ fontSize: '11px', color: '#EF4444' }}>{error}</span>
        </div>
      )}
      {!error && hint && (
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{hint}</div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '12px',
  border: '1.5px solid #E2E8F0', fontSize: '13px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  background: '#F8FAFC', color: '#0F172A', fontWeight: 600,
  transition: 'all 0.2s',
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: '#FCA5A5',
  background: '#FFF5F5',
};

function PrimaryButton({
  onClick, loading, disabled, color = '#065F46', children, fullWidth
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '10px 18px', borderRadius: '12px', border: 'none',
        background: disabled || loading ? '#E2E8F0' : color,
        color: disabled || loading ? '#94A3B8' : '#fff',
        fontSize: '13px', fontWeight: 800, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', width: fullWidth ? '100%' : 'auto',
        fontFamily: 'inherit',
      }}
    >
      {loading ? <Loader2 size={14} className="spin" /> : null}
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string | undefined }) {
  const info = getStatusInfo(status);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', borderRadius: '20px',
      background: info.color + '15', color: info.color,
      fontSize: '12px', fontWeight: 700,
    }}>
      {info.icon}
      {info.label}
    </div>
  );
}

function ResultPanel({ result, type }: { result: string; type: 'success' | 'error' | 'info' }) {
  const cfg = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', icon: <CheckCircle size={16} /> },
    error: { bg: '#FFF5F5', border: '#FCA5A5', color: '#991B1B', icon: <XCircle size={16} /> },
    info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: <Info size={16} /> },
  }[type];

  return (
    <div style={{
      display: 'flex', gap: '12px', padding: '14px 16px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: '12px', marginTop: '16px',
    }}>
      <div style={{ color: cfg.color, flexShrink: 0, marginTop: '2px' }}>{cfg.icon}</div>
      <pre style={{
        margin: 0, fontSize: '12px', color: cfg.color,
        fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {result}
      </pre>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NacefConfigClient({
  storeId,
  initialData,
  initialLogs,
}: NacefConfigClientProps) {
  // Connection / URL form
  const [smdfUrl, setSmdfUrl] = useState(initialData.smdfUrl || 'http://localhost:10006');
  const [testResult, setTestResult] = useState<{ json: string; type: 'success' | 'error' } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Identity form
  const [imdf, setImdf] = useState(initialData.imdf || '');
  const [matriculeFiscal, setMatriculeFiscal] = useState(initialData.matriculeFiscal || '');
  const [establishmentRef, setEstablishmentRef] = useState(initialData.establishmentReference || '');
  const [commercialName, setCommercialName] = useState(initialData.commercialName || '');
  const [accreditationRef, setAccreditationRef] = useState(initialData.accreditationReference || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Manifest
  const [manifest, setManifest] = useState<any>(null);
  const [isFetchingManifest, setIsFetchingManifest] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);

  // Sync & Init
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ json: string; type: 'success' | 'error' } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ json: string; type: 'success' | 'error' } | null>(null);
  const [requestPINupdate, setRequestPINupdate] = useState(false);
  // Cash register info for init
  const [crModel, setCrModel] = useState('ElKassa POS');
  const [crSerial, setCrSerial] = useState(`ELKASSA-${storeId.slice(0, 8).toUpperCase()}`);
  const [crVersion, setCrVersion] = useState('1.0.0');

  // Simulator
  const [simAmount, setSimAmount] = useState('25.000');
  const [simTax, setSimTax] = useState('4.250');
  const [simType, setSimType] = useState<'TICKET' | 'PROFORMA' | 'REFUND'>('TICKET');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{ json: string; type: 'success' | 'error' } | null>(null);
  const [simHistory, setSimHistory] = useState<Array<{ ts: string; type: string; result: string; ok: boolean }>>([]);

  // Logs
  const [logs, setLogs] = useState<NacefLog[]>(initialLogs);
  const [nacefSyncStatus, setNacefSyncStatus] = useState(initialData.nacefSyncStatus || 'NOT_CONFIGURED');

  // Validation errors
  const imdfErr = imdf ? validateImdf(imdf) : null;
  const matriculeErr = matriculeFiscal ? validateMatricule(matriculeFiscal) : null;
  const accreditationErr = accreditationRef ? validateAccreditation(accreditationRef) : null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await nacefGetManifestAction(storeId);
      if (!res.success) {
        setTestResult({ json: `⚠️ ${res.error || 'Connexion impossible au S-MDF'}\n\nVérifiez que le service S-MDF est bien démarré sur ${smdfUrl}`, type: 'error' });
      } else {
        setTestResult({ json: JSON.stringify(res.data, null, 2), type: 'success' });
        setManifest(res.data);
      }
    } catch (e: any) {
      setTestResult({ json: e.message || 'Connexion impossible au S-MDF', type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      const res = await nacefConfigureAction(storeId, {
        smdfUrl,
        imdf: imdf || undefined,
        matriculeFiscal: matriculeFiscal || undefined,
        establishmentReference: establishmentRef || undefined,
        commercialName: commercialName || undefined,
        accreditationReference: accreditationRef || undefined,
      });
      if (!res.success) {
        setSaveResult({ msg: res.error || 'Erreur lors de l\'enregistrement.', type: 'error' });
      } else {
        setSaveResult({ msg: '✓ Configuration NACEF enregistrée avec succès.', type: 'success' });
      }
    } catch (e: any) {
      setSaveResult({ msg: e.message || 'Erreur lors de l\'enregistrement.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchManifest = async () => {
    setIsFetchingManifest(true);
    setManifestError(null);
    try {
      const res = await nacefGetManifestAction(storeId);
      if (!res.success) {
        setManifestError(res.error || 'Impossible de récupérer le manifest S-MDF.');
      } else {
        setManifest(res.data);
      }
    } catch (e: any) {
      setManifestError(e.message || 'Impossible de récupérer le manifest S-MDF.');
    } finally {
      setIsFetchingManifest(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await nacefSyncAction(storeId, { requestPINupdate });
      if (!res.success) {
        setSyncResult({ json: `❌ Échec de la synchronisation : ${res.error}`, type: 'error' });
      } else {
        setSyncResult({ json: JSON.stringify(res.data, null, 2), type: 'success' });
        setNacefSyncStatus('SYNCED');
      }
    } catch (e: any) {
      setSyncResult({ json: e.message || 'Erreur lors de la synchronisation.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    setInitResult(null);
    try {
      const res = await nacefInitializeAction(storeId, {
        model: crModel,
        serialNumber: crSerial,
        version: crVersion,
      });
      if (!res.success) {
        setInitResult({ json: `❌ Échec de l'initialisation : ${res.error}`, type: 'error' });
      } else {
        setInitResult({ json: JSON.stringify(res.data, null, 2), type: 'success' });
      }
    } catch (e: any) {
      setInitResult({ json: e.message || 'Erreur lors de l\'initialisation.', type: 'error' });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await nacefSimulateSignAction(storeId, {
        totalHT: Math.round(parseFloat(simAmount) * 1000),
        totalTax: Math.round(parseFloat(simTax) * 1000),
        operationType: simType,
      });
      if (!res.success) {
        setSimResult({ json: res.error || 'Simulation échouée', type: 'error' });
        setSimHistory(prev => [{
          ts: new Date().toLocaleTimeString('fr-FR'),
          type: simType,
          result: res.error || 'Erreur',
          ok: false,
        }, ...prev].slice(0, 5));
      } else {
        const json = JSON.stringify(res.data, null, 2);
        setSimResult({ json, type: 'success' });
        setSimHistory(prev => [{
          ts: new Date().toLocaleTimeString('fr-FR'),
          type: simType,
          result: res.data?.ticketIdentifier || 'OK',
          ok: true,
        }, ...prev].slice(0, 5));
      }
    } catch (e: any) {
      const msg = e.message || 'Simulation échouée';
      setSimResult({ json: msg, type: 'error' });
      setSimHistory(prev => [{
        ts: new Date().toLocaleTimeString('fr-FR'),
        type: simType,
        result: msg,
        ok: false,
      }, ...prev].slice(0, 5));
    } finally {
      setIsSimulating(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const isReady = nacefSyncStatus === 'SYNCED' && !!smdfUrl && !imdfErr && !matriculeErr && !accreditationErr;

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        input:focus { border-color: #047857 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(4,120,87,0.1); }
        select:focus { border-color: #047857 !important; outline: none; }
      `}</style>

      {/* Status Header Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: '16px', marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: isReady ? '#10B981' : '#F59E0B',
            boxShadow: isReady ? '0 0 0 3px rgba(16,185,129,0.2)' : '0 0 0 3px rgba(245,158,11,0.2)',
          }} className={isReady ? '' : 'pulse-dot'} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
              {isReady ? 'Instance S-MDF Opérationnelle' : 'Configuration S-MDF Requise'}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              {smdfUrl || 'URL non configurée'} · Statut BD : {nacefSyncStatus || 'NON_SYNC'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isReady && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '20px',
              background: '#F0FDF4', color: '#166534',
              fontSize: '11px', fontWeight: 800,
            }}>
              <CheckCircle size={12} /> PRÊT
            </div>
          )}
          <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
            API v1.2.0
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ── Section 1: Connexion S-MDF ── */}
        <SectionCard title="Connexion S-MDF" icon={<Server size={16} />} color="#3B82F6">
          <FieldGroup label="URL de l'agent S-MDF" hint="Format: http://[host]:[port] · Défaut NACEF: port 10006">
            <input
              style={inputStyle}
              value={smdfUrl}
              onChange={e => setSmdfUrl(e.target.value)}
              placeholder="http://localhost:10006"
            />
          </FieldGroup>

          {/* URL decomposition display */}
          {smdfUrl && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
              marginBottom: '16px', padding: '12px', background: '#F8FAFC',
              borderRadius: '10px', border: '1px solid #E2E8F0',
            }}>
              {(() => {
                try {
                  const url = new URL(smdfUrl);
                  return (
                    <>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>Hôte</div>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1E293B', fontWeight: 700 }}>{url.hostname}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>Port</div>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#3B82F6', fontWeight: 700 }}>{url.port || '80'}</div>
                      </div>
                    </>
                  );
                } catch { return null; }
              })()}
            </div>
          )}

          <PrimaryButton onClick={handleTestConnection} loading={isTesting} color="#3B82F6" fullWidth>
            <Wifi size={14} /> Tester la connexion S-MDF
          </PrimaryButton>

          {testResult && (
            <ResultPanel result={testResult.json} type={testResult.type} />
          )}
        </SectionCard>

        {/* ── Section 2: Identité Fiscale ── */}
        <SectionCard title="Identité Fiscale de l'Instance" icon={<Shield size={16} />} color="#8B5CF6">
          <FieldGroup
            label="IMDF (Identifiant Module Données Fiscales)"
            hint="14 à 16 caractères — assigné par NACEF"
            error={imdfErr}
          >
            <input
              style={imdfErr ? inputErrorStyle : inputStyle}
              value={imdf}
              onChange={e => setImdf(e.target.value)}
              placeholder="Ex: 12345678901234"
              maxLength={16}
            />
            {imdf && !imdfErr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Check size={12} color="#10B981" />
                <span style={{ fontSize: '11px', color: '#10B981' }}>{imdf.length} caractères · Valide</span>
              </div>
            )}
          </FieldGroup>

          <FieldGroup
            label="Matricule Fiscal"
            hint="Format NACEF : 7 chiffres + 1 lettre majuscule"
            error={matriculeErr}
          >
            <input
              style={matriculeErr ? inputErrorStyle : inputStyle}
              value={matriculeFiscal}
              onChange={e => setMatriculeFiscal(e.target.value.toUpperCase())}
              placeholder="Ex: 1234567A"
              maxLength={8}
            />
          </FieldGroup>

          <FieldGroup label="Nom Commercial">
            <input
              style={inputStyle}
              value={commercialName}
              onChange={e => setCommercialName(e.target.value)}
              placeholder="Ex: CoffeeShop Tunis"
            />
          </FieldGroup>

          <FieldGroup
            label="Référence Établissement"
            hint="8 à 32 caractères"
          >
            <input
              style={inputStyle}
              value={establishmentRef}
              onChange={e => setEstablishmentRef(e.target.value)}
              placeholder="Ex: ETAB-001"
            />
          </FieldGroup>

          <FieldGroup
            label="Référence d'Accréditation"
            hint="8 à 32 caractères — fournie par CIMF"
            error={accreditationErr}
          >
            <input
              style={accreditationErr ? inputErrorStyle : inputStyle}
              value={accreditationRef}
              onChange={e => setAccreditationRef(e.target.value)}
              placeholder="Ex: ACCRED-2026-XXXXX"
            />
          </FieldGroup>

          {saveResult && (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center',
              padding: '10px 14px', borderRadius: '10px', marginBottom: '12px',
              background: saveResult.type === 'success' ? '#F0FDF4' : '#FFF5F5',
              border: `1px solid ${saveResult.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
              color: saveResult.type === 'success' ? '#166534' : '#991B1B',
              fontSize: '12px', fontWeight: 600,
            }}>
              {saveResult.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {saveResult.msg}
            </div>
          )}

          <PrimaryButton
            onClick={handleSaveConfig}
            loading={isSaving}
            color="#8B5CF6"
            fullWidth
            disabled={!!(imdfErr || matriculeErr || accreditationErr)}
          >
            <Save size={14} /> Enregistrer la configuration
          </PrimaryButton>
        </SectionCard>

        {/* ── Section 3: Manifest S-MDF ── */}
        <SectionCard title="Manifest S-MDF — Statut Temps Réel" icon={<Activity size={16} />} color="#10B981">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <StatusBadge status={manifest?.status} />
            <PrimaryButton onClick={handleFetchManifest} loading={isFetchingManifest} color="#10B981">
              <RefreshCw size={13} /> Rafraîchir
            </PrimaryButton>
          </div>

          {manifestError && (
            <div style={{
              padding: '12px 14px', background: '#FFF5F5', border: '1px solid #FCA5A5',
              borderRadius: '10px', color: '#991B1B', fontSize: '12px', marginBottom: '12px',
              display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <WifiOff size={14} /> {manifestError}
            </div>
          )}

          {manifest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'IMDF', val: manifest.imdf, icon: <Key size={12} /> },
                { key: 'Version', val: manifest.version, icon: <Hash size={12} /> },
                { key: 'Type', val: manifest.type, icon: <Database size={12} /> },
                { key: 'État Réseau', val: manifest.state, icon: manifest.state === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} /> },
                { key: 'Tickets Offline', val: manifest.availableOfflineTickets?.toString(), icon: <FileText size={12} /> },
                { key: 'Sync Rate', val: manifest.synchronizationRate ? `${manifest.synchronizationRate}%` : undefined, icon: <RefreshCw size={12} /> },
              ].filter(r => r.val !== undefined).map(row => (
                <div key={row.key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#64748B', fontSize: '12px' }}>
                    {row.icon} {row.key}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{row.val}</div>
                </div>
              ))}

              {manifest.certificateInfo && (
                <div style={{
                  padding: '12px', background: '#F8FAFC', borderRadius: '10px',
                  border: '1px solid #E2E8F0', marginTop: '4px',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Certificat
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Statut : <strong>{manifest.certificateInfo.certRequestStatus}</strong>
                  </div>
                  {manifest.certificateInfo.expirationDate && (
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      Expire le : {new Date(manifest.certificateInfo.expirationDate).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  {manifest.certificateInfo.revoked && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: '#EF4444', fontSize: '11px', marginTop: '4px' }}>
                      <AlertTriangle size={11} /> Certificat révoqué
                    </div>
                  )}
                </div>
              )}

              <details style={{ marginTop: '4px' }}>
                <summary style={{ fontSize: '11px', color: '#64748B', cursor: 'pointer', userSelect: 'none' }}>
                  Voir JSON brut
                </summary>
                <pre style={{
                  marginTop: '8px', padding: '12px', background: '#0F172A', color: '#94ECD4',
                  borderRadius: '10px', fontSize: '10px', overflow: 'auto', maxHeight: '200px',
                }}>
                  {JSON.stringify(manifest, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '13px',
            }}>
              <Server size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <div>Cliquez sur "Rafraîchir" pour charger le manifest</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Nécessite une URL S-MDF configurée</div>
            </div>
          )}
        </SectionCard>

        {/* ── Section 4: Init & Sync ── */}
        <SectionCard title="Initialisation & Synchronisation" icon={<Zap size={16} />} color="#F59E0B">
          <div style={{
            padding: '12px', background: '#FFFBEB', border: '1px solid #FEF3C7',
            borderRadius: '10px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
              ⚠️ L'initialisation déclare un nouveau certificat auprès de NACEF.
              À utiliser uniquement lors de la mise en service initiale.
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Infos Logiciel de Caisse (SIC)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>Modèle</div>
                <input style={{ ...inputStyle, fontSize: '12px', padding: '8px 12px' }}
                  value={crModel} onChange={e => setCrModel(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>Version</div>
                <input style={{ ...inputStyle, fontSize: '12px', padding: '8px 12px' }}
                  value={crVersion} onChange={e => setCrVersion(e.target.value)} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>N° de Série</div>
              <input style={{ ...inputStyle, fontSize: '12px', padding: '8px 12px', fontFamily: 'monospace' }}
                value={crSerial} onChange={e => setCrSerial(e.target.value)} />
            </div>
          </div>

          <PrimaryButton onClick={handleInitialize} loading={isInitializing} color="#F59E0B" fullWidth>
            <Zap size={14} /> Initialiser NACEF (Cert + Sync)
          </PrimaryButton>

          {initResult && (
            <ResultPanel result={initResult.json} type={initResult.type} />
          )}

          <div style={{ margin: '16px 0', borderTop: '1px solid #F1F5F9' }} />

          {/* Sync only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={requestPINupdate}
                onChange={e => setRequestPINupdate(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#F59E0B' }}
              />
              Demander mise à jour du PIN
            </label>
          </div>

          <PrimaryButton onClick={handleSync} loading={isSyncing} color="#0EA5E9" fullWidth>
            <RefreshCw size={14} /> Synchroniser uniquement
          </PrimaryButton>

          {syncResult && (
            <ResultPanel result={syncResult.json} type={syncResult.type} />
          )}
        </SectionCard>

        {/* ── Section 5: Simulateur ── */}
        <SectionCard title="Simulateur d'Interfaçage — Test S-MDF" icon={<Terminal size={16} />} color="#6366F1">
          <div style={{
            padding: '12px', background: '#EEF2FF', border: '1px solid #C7D2FE',
            borderRadius: '10px', marginBottom: '16px', fontSize: '12px', color: '#3730A3',
          }}>
            <strong>Mode simulation :</strong> Envoie un ticket fictif au S-MDF configuré et affiche la réponse.
            Le S-MDF doit être opérationnel (statut 5) pour retourner une vraie signature.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Montant HT (DT)</div>
              <input
                style={{ ...inputStyle, fontSize: '13px', padding: '10px 12px' }}
                value={simAmount}
                onChange={e => setSimAmount(e.target.value)}
                type="number"
                step="0.001"
              />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>TVA (DT)</div>
              <input
                style={{ ...inputStyle, fontSize: '13px', padding: '10px 12px' }}
                value={simTax}
                onChange={e => setSimTax(e.target.value)}
                type="number"
                step="0.001"
              />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Type</div>
              <select
                value={simType}
                onChange={e => setSimType(e.target.value as any)}
                style={{ ...inputStyle, fontSize: '12px', padding: '10px 12px', cursor: 'pointer' }}
              >
                <option value="TICKET">TICKET</option>
                <option value="PROFORMA">PROFORMA</option>
                <option value="REFUND">REFUND</option>
              </select>
            </div>
          </div>

          {/* Computed totals */}
          <div style={{
            display: 'flex', gap: '12px', padding: '12px', background: '#F8FAFC',
            borderRadius: '10px', marginBottom: '16px',
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>HT</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>{parseFloat(simAmount || '0').toFixed(3)} DT</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TVA</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#F59E0B' }}>{parseFloat(simTax || '0').toFixed(3)} DT</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TTC</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#10B981' }}>
                {(parseFloat(simAmount || '0') + parseFloat(simTax || '0')).toFixed(3)} DT
              </div>
            </div>
          </div>

          <PrimaryButton onClick={handleSimulate} loading={isSimulating} color="#6366F1" fullWidth>
            <Play size={14} /> Simuler la signature
          </PrimaryButton>

          {simResult && (
            <ResultPanel result={simResult.json} type={simResult.type} />
          )}

          {/* Simulation history */}
          {simHistory.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Historique des simulations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {simHistory.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', background: h.ok ? '#F0FDF4' : '#FFF5F5',
                    borderRadius: '8px', fontSize: '11px',
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {h.ok ? <CheckCircle size={11} color="#10B981" /> : <XCircle size={11} color="#EF4444" />}
                      <span style={{ color: '#475569', fontFamily: 'monospace' }}>{h.ts}</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: '4px',
                        background: '#E2E8F0', color: '#475569', fontWeight: 700, fontSize: '10px'
                      }}>{h.type}</span>
                    </div>
                    <span style={{
                      fontFamily: 'monospace', color: h.ok ? '#166534' : '#991B1B',
                      fontWeight: 700, fontSize: '10px', maxWidth: '160px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{h.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Section 6: Journal des Logs NACEF ── */}
        <SectionCard title="Journal des Événements NACEF" icon={<FileText size={16} />} color="#64748B">
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '13px' }}>
              <Terminal size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <div>Aucun événement NACEF enregistré</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {logs.map((log) => (
                <div key={log.id} style={{
                  display: 'grid', gridTemplateColumns: '80px 100px 70px 1fr',
                  alignItems: 'center', gap: '8px',
                  padding: '8px 10px',
                  background: log.status === 'SUCCESS' ? '#F0FDF4' : log.status === 'ERROR' ? '#FFF5F5' : '#F8FAFC',
                  borderRadius: '8px', fontSize: '11px',
                }}>
                  <div style={{ fontFamily: 'monospace', color: '#94A3B8' }}>
                    {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    {' '}
                    {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{
                    padding: '2px 6px', borderRadius: '4px',
                    background: '#E2E8F0', color: '#475569', fontWeight: 700,
                    textAlign: 'center', fontSize: '10px', fontFamily: 'monospace',
                  }}>
                    {log.action}
                  </div>
                  <div style={{
                    padding: '2px 6px', borderRadius: '4px', textAlign: 'center',
                    background: log.status === 'SUCCESS' ? '#BBF7D0' : log.status === 'ERROR' ? '#FCA5A5' : '#E2E8F0',
                    color: log.status === 'SUCCESS' ? '#166534' : log.status === 'ERROR' ? '#991B1B' : '#475569',
                    fontWeight: 800, fontSize: '10px',
                  }}>
                    {log.status}
                  </div>
                  <div style={{
                    color: log.errorMessage ? '#EF4444' : '#64748B',
                    fontFamily: 'monospace', fontSize: '10px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {log.errorMessage || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
