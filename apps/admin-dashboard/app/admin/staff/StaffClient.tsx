'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Mail, Phone, ShieldCheck, Key, History, Lock, Clock } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createStaffMember, updateStaffMember, deleteStaffMember, updateStaffPinAction, getStaffSessionLogs } from '../../actions';

const ROLES = [
  { value: 'STORE_OWNER', label: 'Gérant (Owner)', badge: 'blue', desc: 'Accès complet au dashboard' },
  { value: 'CASHIER',     label: 'Caissier',        badge: 'gray', desc: 'Accès POS uniquement' },
];

const PERMISSIONS = [
  { key: 'DASHBOARD', label: 'Dashboard & Statistiques' },
  { key: 'POS',       label: 'Caisse POS (Ventes)' },
  { key: 'TABLES',    label: 'Plan de Salle (Gestion Tables)' },
  { key: 'RACHMA',    label: 'Mode Rachma (Pointage Rapide)' },
  { key: 'PRODUCTS',  label: 'Gestion des Produits' },
  { key: 'STOCK',     label: 'Gestion du Stock' },
  { key: 'SUPPLY',    label: 'Commandes Fournisseurs' },
  { key: 'STAFF',     label: 'Gestion du Personnel' },
  { key: 'BAR',       label: 'Gestion Bar (Prép/KDS)' },
];

interface StaffMember { 
  id: string; 
  name: string; 
  email: string; 
  phone: string | null; 
  role: string;
  defaultPosMode: string | null;
  permissions: string[];
  pinCode?: string | null;
  assignedTables?: string[];
}

export default function StaffClient({ staff, tables }: { staff: StaffMember[]; tables: { id: string; label: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ 
    name: '', email: '', phone: '', role: 'CASHIER', 
    defaultPosMode: 'tables', permissions: ['POS'] as string[],
    assignedTables: [] as string[]
  });
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [pinTarget, setPinTarget] = useState<StaffMember | null>(null);
  const [newPin, setNewPin] = useState('');
  const [logTarget, setLogTarget] = useState<StaffMember | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', role: 'CASHIER', defaultPosMode: 'tables', permissions: ['POS'], assignedTables: [] }); setModalOpen(true); };
  const openEdit = (m: StaffMember) => { setEditing(m); setForm({ name: m.name, email: m.email, phone: m.phone || '', role: m.role, defaultPosMode: m.defaultPosMode || 'tables', permissions: m.permissions || [], assignedTables: m.assignedTables || [] }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editing) await updateStaffMember(editing.id, form);
      else await createStaffMember(form);
      setModalOpen(false);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => { await deleteStaffMember(deleteTarget.id); setDeleteTarget(null); });
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTarget) return;
    startTransition(async () => {
      await updateStaffPinAction(pinTarget.id, newPin || null);
      setPinTarget(null);
      setNewPin('');
    });
  };

  const openLogs = async (member: StaffMember) => {
    setLogTarget(member);
    setLoadingLogs(true);
    const data = await getStaffSessionLogs(member.id);
    setLogs(data);
    setLoadingLogs(false);
  };

  const field: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <span className="card-title">👥 Équipe Complète</span>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Ajouter un Employé</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Contact</th>
              <th>Rôle</th>
              <th>Accès POS</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => {
              const roleConf = ROLES.find(r => r.value === member.role) || ROLES[1];
              return (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: member.role === 'STORE_OWNER' ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#F1F5F9', color: member.role === 'STORE_OWNER' ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{member.name}</div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>{roleConf.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569' }}><Mail size={12} /> {member.email}</div>
                      {member.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#94A3B8' }}><Phone size={11} /> {member.phone}</div>}
                    </div>
                  </td>
                  <td><span className={`badge ${roleConf.badge}`}>{roleConf.label}</span></td>
                  <td>
                    {member.role === 'CASHIER'
                        ? <span className="badge orange">
                            {member.defaultPosMode === 'rachma' ? 'Rachma' : member.defaultPosMode === 'simplistic' ? 'Simpliste' : member.defaultPosMode === 'bar' ? 'Bar' : 'Salle'}
                          </span>
                      : <span className="badge green">✓ Complet</span>
                    }
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button title="Historique Sessions" className="btn btn-ghost" style={{ padding: '6px 10px', marginRight: '4px' }} onClick={() => openLogs(member)}><History size={14} /></button>
                    <button title="Gérer PIN" className="btn btn-ghost" style={{ padding: '6px 10px', marginRight: '4px' }} onClick={() => { setPinTarget(member); setNewPin(member.pinCode || ''); }}><Key size={14} /></button>
                    <button title="Modifier" className="btn btn-ghost" style={{ padding: '6px 10px', marginRight: '4px' }} onClick={() => openEdit(member)}><Edit2 size={14} /></button>
                    <button title="Révoquer" className="btn btn-ghost" style={{ padding: '6px 10px', color: '#EF4444' }} onClick={() => setDeleteTarget(member)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                <p style={{ fontWeight: 600 }}>Aucun employé. Ajoutez votre équipe.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><ShieldCheck size={16} /> Matrice des Droits d'Accès (Résumé Global)</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fonctionnalité</th>
              {staff.map(m => (
                <th key={m.id} style={{ textAlign: 'center', fontSize: '11px' }}>{m.name.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(p => (
              <tr key={p.key}>
                <td style={{ fontWeight: 600 }}>{p.label}</td>
                {staff.map(m => (
                  <td key={m.id} style={{ textAlign: 'center' }}>
                    {(m.permissions || []).includes(p.key) || m.role === 'STORE_OWNER' ? <span className="badge green">✓</span> : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Create/Edit Modal === */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier l\'Employé' : 'Ajouter un Employé'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={label}>Prénom et Nom</label><input style={field} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Nabil Hamza" required /></div>
          <div><label style={label}>Email (identifiant de connexion)</label><input style={field} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="nabil@cafe.tn" required /></div>
          <div><label style={label}>Téléphone</label><input style={field} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+216 XX XXX XXX" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={label}>Rôle</label>
              <select style={field} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="STORE_OWNER">Gérant (Owner)</option>
                <option value="CASHIER">Caissier</option>
              </select>
            </div>
            <div>
              <label style={label}>Mode POS par défaut</label>
              <select style={field} value={form.defaultPosMode} onChange={e => setForm(f => ({ ...f, defaultPosMode: e.target.value }))}>
                <option value="tables">Plan de Salle (+1 ticket)</option>
                <option value="rachma">Mode Rachma (Pointage)</option>
                <option value="simplistic">Session Simpliste (+1 clic)</option>
                <option value="bar">Bar (Prép./KDS)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={label}>Droits d'Accès Spécifiques</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
              {PERMISSIONS.map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.permissions.includes(p.key)} 
                    onChange={e => {
                      const next = e.target.checked ? [...form.permissions, p.key] : form.permissions.filter(k => k !== p.key);
                      setForm(f => ({ ...f, permissions: next }));
                    }}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={label}>Affectation des Tables (Zone de service)</label>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Cochez les tables visibles par cet utilisateur :</span>
                <button type="button" onClick={() => {
                  const items = tables.length > 0 ? tables.map(t => t.label) : Array.from({ length: 48 }, (_, i) => `T${i + 1}`);
                  setForm(f => ({ ...f, assignedTables: (f.assignedTables || []).length === items.length ? [] : items }));
                }} 
                  style={{ fontSize: '11px', color: '#4F46E5', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                  {(form.assignedTables || []).length === (tables.length || 48) ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {(tables.length > 0 ? tables.map(t => t.label) : Array.from({ length: 48 }, (_, i) => `T${i + 1}`)).map((id) => {
                  const isSelected = (form.assignedTables || []).includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        const current = form.assignedTables || [];
                        const next = isSelected ? current.filter(t => t !== id) : [...current, id];
                        setForm(f => ({ ...f, assignedTables: next }));
                      }}
                      style={{
                        padding: '8px 0',
                        fontSize: '12px',
                        fontWeight: 800,
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                        backgroundColor: isSelected ? '#4F46E5' : '#FFF',
                        color: isSelected ? '#FFF' : '#64748B',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {!editing && <div style={{ background: '#FEF3C7', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400E' }}>⚠ Mot de passe par défaut : <strong>changeme123</strong>.</div>}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>{isPending ? '...' : (editing ? 'Mettre à Jour' : 'Créer l\'Accès')}</button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Révoquer l'Accès" width={400}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Trash2 size={24} color="#EF4444" /></div>
          <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '16px', marginBottom: '8px' }}>Supprimer "{deleteTarget?.name}" ?</p>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>Son accès à la caisse sera immédiatement révoqué.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Annuler</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={isPending}>{isPending ? '...' : 'Révoquer'}</button>
          </div>
        </div>
      </Modal>
      {/* PIN Management Modal */}
      <Modal open={!!pinTarget} onClose={() => setPinTarget(null)} title="Gestion du code PIN" width={400}>
        <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Lock size={24} color="#0EA5E9" /></div>
            <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>Définir le code PIN pour {pinTarget?.name}</p>
            <p style={{ color: '#64748B', fontSize: '13px' }}>Utilisé pour la connexion rapide sur la caisse POS.</p>
          </div>
          <div>
            <label style={label}>Nouveau Code PIN (4 chiffres)</label>
            <input 
              style={{ ...field, textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 900 }} 
              type="text" 
              maxLength={4} 
              pattern="\d{4}" 
              placeholder="0000"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setPinTarget(null)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#0EA5E9' }} disabled={isPending}>Enregistrer</button>
          </div>
          {pinTarget?.pinCode && (
            <button 
              type="button" 
              onClick={() => { if(confirm('Réinitialiser le code PIN ?')) startTransition(async () => { await updateStaffPinAction(pinTarget.id, null); setPinTarget(null); }); }}
              style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Réinitialiser (supprimer le code)
            </button>
          )}
        </form>
      </Modal>

      {/* Session Logs Modal */}
      <Modal open={!!logTarget} onClose={() => setLogTarget(null)} title={`Historique : ${logTarget?.name}`} width={500}>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loadingLogs ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Chargement...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Aucune trace de session trouvée.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.map(log => (
                <div key={log.id} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFBFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.action === 'LOGIN' ? '#10B981' : '#64748B' }} />
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{log.action}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '12px' }}>
                    <Clock size={12} />
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-outline" style={{ width: '100%', marginTop: '20px' }} onClick={() => setLogTarget(null)}>Fermer</button>
      </Modal>
    </>
  );
}
