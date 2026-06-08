'use client';

import { useState, useEffect, useTransition } from 'react';
import { MessageSquare, Settings, Send, Server, Key, Activity, Clock, CheckCircle2, XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { getWhatsAppConfigAction, updateWhatsAppConfigAction, sendTestWhatsAppAction, getWhatsAppLogsAction } from '../../actions';

export const dynamic = 'force-dynamic';

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '12px',
  border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none',
};

export default function WhatsAppDashboard() {
  const [config, setConfig] = useState<{ waServerUrl: string; waApiKey: string; hasExistingKey: boolean }>({ waServerUrl: '', waApiKey: '', hasExistingKey: false });
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testTo, setTestTo] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [testResult, setTestResult] = useState<{ success?: boolean; messageId?: string; error?: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getWhatsAppConfigAction().then(c => {
      setConfig(c);
      setServerUrl(c.waServerUrl);
      setApiKey('');
    });
    getWhatsAppLogsAction().then(setLogs);
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateWhatsAppConfigAction({ waServerUrl: serverUrl, waApiKey: apiKey || undefined });
      const c = await getWhatsAppConfigAction();
      setConfig(c);
      setApiKey('');
    });
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    startTransition(async () => {
      const r = await sendTestWhatsAppAction(testTo, testMsg);
      setTestResult(r);
      const logs = await getWhatsAppLogsAction();
      setLogs(logs);
    });
  };

  const refreshLogs = () => {
    startTransition(async () => {
      const logs = await getWhatsAppLogsAction();
      setLogs(logs);
    });
  };

  const label: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '28px', marginBottom: '24px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', margin: 0 }}>WhatsApp / OpenWA</h1>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '15px' }}>
            Configuration de l&apos;API WhatsApp pour l&apos;envoi de notifications, réinitialisation de mots de passe, etc.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', borderRadius: '12px', background: config.waServerUrl ? '#D1FAE5' : '#FEF3C7', border: `1px solid ${config.waServerUrl ? '#A7F3D0' : '#FDE68A'}` }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.waServerUrl ? '#10B981' : '#D97706' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: config.waServerUrl ? '#065F46' : '#92400E' }}>
            {config.waServerUrl ? 'Connecté' : 'Non configuré'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Configuration */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} color="#4F46E5" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Configuration du Serveur</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>OpenWA auto-hébergé</p>
            </div>
          </div>
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={label}><Server size={12} /> URL du Serveur</label>
              <input style={fieldStyle} value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="https://wa.votreserveur.com" />
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>L&apos;URL de votre instance open-wa (ex: http://localhost:3002)</span>
            </div>
            <div>
              <label style={label}><Key size={12} /> Clé API (optionnelle)</label>
              <input style={fieldStyle} type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={config.hasExistingKey ? '•••••••• (laisser vide pour conserver)' : 'Clé API'} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isPending} style={{ alignSelf: 'flex-start' }}>
              {isPending ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>
          </form>
        </div>

        {/* Test Message */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} color="#10B981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Test d&apos;envoi</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>Vérifier la connexion WhatsApp</p>
            </div>
          </div>
          <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={label}><MessageCircle size={12} /> Numéro du destinataire</label>
              <input style={fieldStyle} value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="+216XXXXXXXX" />
            </div>
            <div>
              <label style={label}><MessageSquare size={12} /> Message</label>
              <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: '80px' }} value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="Votre message de test..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isPending} style={{ alignSelf: 'flex-start', background: '#10B981', borderColor: '#10B981' }}>
              {isPending ? 'Envoi...' : <><Send size={14} /> Envoyer le test</>}
            </button>
            {testResult && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: testResult.success ? '#D1FAE5' : '#FEF2F2', border: `1px solid ${testResult.success ? '#A7F3D0' : '#FECACA'}`, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: testResult.success ? '#065F46' : '#991B1B' }}>
                {testResult.success ? <CheckCircle2 size={18} color="#10B981" /> : <XCircle size={18} color="#EF4444" />}
                {testResult.success ? `Message envoyé (ID: ${testResult.messageId})` : `Erreur: ${testResult.error}`}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Logs */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#D97706" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Historique des Envois</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>Derniers messages WhatsApp</p>
            </div>
          </div>
          <button onClick={refreshLogs} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', background: '#F8FAFC', borderRadius: '12px', fontSize: '14px' }}>
            Aucun message WhatsApp envoyé pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {logs.map((log: any) => (
              <div key={log.id} style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>📱 {log.to}</span>
                    <span className={`badge ${log.status === 'SENT' ? 'green' : 'red'}`} style={{ fontSize: '10px' }}>{log.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</div>
                  {log.error && <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '2px' }}>❌ {log.error}</div>}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} />
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
