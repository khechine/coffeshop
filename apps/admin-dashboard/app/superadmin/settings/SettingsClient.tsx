'use client';

import React, { useState, useTransition } from 'react';
import { Save, Mail, Server } from 'lucide-react';
import { saveSmtpConfigAction } from '../../actions';

export default function SettingsClient({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig || {});
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveSmtpConfigAction(config);
        alert('Configuration sauvegardée avec succès');
      } catch (err: any) {
        alert('Erreur: ' + err.message);
      }
    });
  };

  const fieldStyle: React.CSSProperties = { 
    width: '100%', padding: '12px 14px', borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none' 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Paramètres Système</h1>
        <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Configuration globale de la plateforme (SMTP, etc.)</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={24} color="#4F46E5" /> Configuration SMTP
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Hôte SMTP</label>
            <input 
              type="text" 
              style={fieldStyle} 
              value={config.smtpHost || ''} 
              onChange={e => setConfig({...config, smtpHost: e.target.value})} 
              placeholder="ex: mail.elkassa.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Port SMTP</label>
            <input 
              type="number" 
              style={fieldStyle} 
              value={config.smtpPort || ''} 
              onChange={e => setConfig({...config, smtpPort: parseInt(e.target.value)})} 
              placeholder="ex: 587"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Utilisateur SMTP</label>
            <input 
              type="text" 
              style={fieldStyle} 
              value={config.smtpUser || ''} 
              onChange={e => setConfig({...config, smtpUser: e.target.value})} 
              placeholder="ex: postmaster@elkassa.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Mot de passe SMTP</label>
            <input 
              type="password" 
              style={fieldStyle} 
              value={config.smtpPass || ''} 
              onChange={e => setConfig({...config, smtpPass: e.target.value})} 
              placeholder="Mot de passe"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Adresse Expéditeur (From)</label>
            <input 
              type="text" 
              style={fieldStyle} 
              value={config.smtpFrom || ''} 
              onChange={e => setConfig({...config, smtpFrom: e.target.value})} 
              placeholder="ex: ElKassa <postmaster@elkassa.com>"
            />
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              {isPending ? 'Enregistrement...' : <><Save size={18} /> Sauvegarder</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
