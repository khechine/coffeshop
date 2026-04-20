'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Tablet, RefreshCw, Trash2, ShieldCheck, Smartphone, CheckCircle2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../../../components/Modal';
import { createTerminalAction, generateTerminalCodeAction, deleteTerminalAction } from '../../actions';

interface Terminal {
  id: string;
  nickname: string;
  activationCode: string | null;
  status: string;
  lastUsedAt: string | null;
}

export default function TerminalsClient({ terminals, storeId }: { terminals: Terminal[], storeId?: string }) {

  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [codeModal, setCodeModal] = useState<{ open: boolean; code: string; name: string }>({ open: false, code: '', name: '' });
  const [deleteTarget, setDeleteTarget] = useState<Terminal | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createTerminalAction(nickname);
      setNickname('');
      setModalOpen(false);
    });
  };

  const generateCode = async (terminal: Terminal) => {
    startTransition(async () => {
      const code = await generateTerminalCodeAction(terminal.id);
      if (typeof code === 'string') setCodeModal({ open: true, code, name: terminal.nickname });
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteTerminalAction(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  const field: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <>
      <div className="card" style={{ padding: '32px' }}>
        <div className="card-header" style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79, 70, 233, 0.2)' }}>
              <Tablet size={22} color="#FFF" />
            </div>
            <div>
              <span className="card-title" style={{ fontSize: '20px', fontWeight: 900, marginBottom: '2px' }}>Terminaux POS (Tablettes)</span>
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Gérez et appairez vos appareils de caisse mobiles.</p>
            </div>
          </div>
          <button className="btn btn-primary" style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '14px' }} onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nouvel Appareil
          </button>
        </div>

        {storeId && (
          <div className="terminal-pairing-box" style={{ background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)', border: '1px solid #BFDBFE', borderRadius: '24px', padding: '32px', marginBottom: '40px' }}>
            <div className="pairing-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <QrCode size={20} color="#3B82F6" />
                  <span style={{ fontWeight: 900, color: '#1E3A8A', fontSize: '15px' }}>Appairage Instantané</span>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 1000, color: '#1E293B', marginBottom: '8px' }}>Scannez pour activer</h3>
                <p style={{ color: '#64748B', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                  Ouvrez l'application POS sur votre tablette et scannez ce code. L'identifiant <b>{storeId}</b> sera configuré automatiquement.
                </p>
                
                <div style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#DBEAFE', padding: '10px 18px', borderRadius: '14px', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E40AF', opacity: 0.7 }}>ID BOUTIQUE:</span>
                  <span style={{ fontSize: '18px', fontWeight: 1000, color: '#1E40AF', fontFamily: 'monospace' }}>{storeId}</span>
                </div>
              </div>
              
              <div style={{ background: '#FFF', padding: '20px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #FFF', margin: '0 auto' }}>
                <QRCodeSVG 
                  value={JSON.stringify({ type: 'coffeeshop-pair', storeId })} 
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        )}


        <div className="terminals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {terminals.map(t => (
            <div key={t.id} style={{ border: '1.5px solid #F1F5F9', borderRadius: '24px', padding: '24px', background: '#FFF', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '16px', background: t.status === 'ACTIVE' ? '#DCFCE7' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.status === 'ACTIVE' ? '#BBF7D0' : '#E2E8F0'}` }}>
                  {t.status === 'ACTIVE' ? <CheckCircle2 size={26} color="#15803D" /> : <Smartphone size={26} color="#475569" />}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost" style={{ padding: '8px', background: '#F1F5F9' }} onClick={() => generateCode(t)} title="Générer Code Activation">
                    <RefreshCw size={14} color="#475569" />
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '8px', background: '#FEF2F2' }} onClick={() => setDeleteTarget(t)}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginBottom: '6px' }}>{t.nickname}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span className={`badge ${t.status === 'ACTIVE' ? 'green' : 'gray'}`} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 800 }}>{t.status}</span>
                {t.lastUsedAt && <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><Smartphone size={12} /> Vu le {new Date(t.lastUsedAt).toLocaleDateString('fr-FR')}</span>}
              </div>

              {t.activationCode && t.status !== 'ACTIVE' && (
                <div style={{ background: '#EEF2FF', padding: '16px', borderRadius: '16px', border: '1px solid #E0E7FF' }}>
                  <div style={{ fontSize: '11px', color: '#4338CA', textTransform: 'uppercase', fontWeight: 900, marginBottom: '4px', letterSpacing: '0.05em' }}>Code d'activation :</div>
                  <div style={{ fontSize: '28px', fontWeight: 1000, color: '#4F46E5', letterSpacing: '6px', fontFamily: 'monospace' }}>{codeModal.code || t.activationCode}</div>
                </div>
              )}
            </div>
          ))}

          {terminals.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '32px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                <Smartphone size={36} color="#CBD5E1" />
              </div>
              <p style={{ fontWeight: 900, color: '#1E293B', fontSize: '18px', marginBottom: '12px' }}>Aucun terminal configuré</p>
              <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                Ajoutez votre première tablette pour commencer à transformer votre établissement.
              </p>
              <button className="btn btn-primary" style={{ marginTop: '24px', padding: '12px 24px' }} onClick={() => setModalOpen(true)}>
                <Plus size={16} /> Configurer tablette
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Modal Creation */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Autoriser une Tablette">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Nom de l'appareil</label>
            <input style={field} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="ex: Caisse Principale, Tablette Terrasse" required />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>{isPending ? '...' : 'Ajouter'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Code Display */}
      <Modal open={codeModal.open} onClose={() => setCodeModal({ ...codeModal, open: false })} title="Code d'Activation">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck size={32} color="#4F46E5" />
          </div>
          <p style={{ color: '#64748B', marginBottom: '8px' }}>Utilisez ce code sur l'application mobile pour coupler :</p>
          <p style={{ fontWeight: 800, fontSize: '18px', color: '#1E293B', marginBottom: '24px' }}>{codeModal.name}</p>
          
          <div style={{ background: '#F1F5F9', padding: '24px', borderRadius: '20px', marginBottom: '24px' }}>
            <span style={{ fontSize: '48px', fontWeight: 950, color: '#4F46E5', letterSpacing: '8px' }}>{codeModal.code}</span>
          </div>

          <p style={{ fontSize: '12px', color: '#94A3B8' }}>Ce code expirera une fois utilisé par la tablette.</p>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setCodeModal({ ...codeModal, open: false })}>J'ai compris</button>
        </div>
      </Modal>

      {/* Modal Delete */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Révoquer l'appareil">
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '20px' }}>Voulez-vous vraiment révoquer l'accès pour <strong>{deleteTarget?.nickname}</strong> ?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Annuler</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={isPending}>Révoquer</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
