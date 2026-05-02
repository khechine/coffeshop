'use client';

import React, { useState, useTransition } from 'react';
import { User, Shield, UserCheck, UserX, Search, MessageSquare, Mail, Calendar, Hash, Key, Save, X, History, MapPin, Monitor } from 'lucide-react';
import Modal from '../../../components/Modal';
import { updateUserPasswordAction, getUserLoginHistory } from '../../actions';

export default function SuperAdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleOpenHistory = async (user: any) => {
    setSelectedUser(user);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    const logs = await getUserLoginHistory(user.id);
    setLoginHistory(logs);
    setLoadingHistory(false);
  };

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setModalOpen(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      alert("Le mot de passe doit faire au moins 4 caractères");
      return;
    }
    startTransition(async () => {
      await updateUserPasswordAction(selectedUser.id, newPassword);
      setModalOpen(false);
      alert(`Mot de passe mis à jour pour ${selectedUser.name}`);
    });
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'SUPERADMIN': return { bg: '#FEE2E2', text: '#991B1B' };
      case 'VENDOR': return { bg: '#E0E7FF', text: '#3730A3' };
      case 'STORE_OWNER': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'COURIER': return { bg: '#D1FAE5', text: '#065F46' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const fieldStyle: React.CSSProperties = { 
    width: '100%', padding: '12px 14px', borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none' 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Annuaire des Utilisateurs</h1>
        <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Gérez les permissions et les accès de tous les acteurs de la plateforme.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Utilisateur</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Rôle</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Affiliation</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map(u => {
              const colors = getRoleColor(u.role);
              const affiliation = u.vendorProfile?.companyName || u.store?.name || (u.courierProfile ? 'Service Logistique' : 'Indépendant');
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                   <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${colors.bg}40`, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{u.name?.charAt(0)}</div>
                         <div>
                            <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>{u.name}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{u.email}</div>
                         </div>
                      </div>
                   </td>
                   <td style={{ padding: '20px 24px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, background: colors.bg, color: colors.text }}>{u.role}</span>
                   </td>
                   <td style={{ padding: '20px 24px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{affiliation}</td>
                   <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                       <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                         <button 
                           onClick={() => handleOpenHistory(u)}
                           className="btn btn-outline" 
                           style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                         >
                           <History size={14} /> Traces
                         </button>
                         <button 
                           onClick={() => handleOpenModal(u)}
                           className="btn btn-outline" 
                           style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                         >
                           <Key size={14} /> Password
                         </button>
                         <button className="btn btn-outline" style={{ padding: '8px', color: '#EF4444' }}><UserX size={16} /></button>
                      </div>
                   </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Réinitialiser le Mot de Passe">
         <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '320px' }}>
            <div>
               <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Utilisateur</label>
               <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 700 }}>{selectedUser?.name}</div>
            </div>
            <div>
               <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Nouveau Mot de Passe</label>
               <input 
                 type="text" 
                 autoFocus
                 style={fieldStyle} 
                 value={newPassword} 
                 onChange={e => setNewPassword(e.target.value)} 
                 placeholder="Entrez le nouveau mot de passe..."
                 required
               />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
               <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
               <button type="submit" disabled={isPending} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isPending ? 'Mise à jour...' : <><Save size={16} /> Enregistrer</>}
               </button>
            </div>
         </form>
      </Modal>

      <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="Historique des Connexions">
        <div style={{ minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Utilisateur</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>{selectedUser?.name}</div>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>Chargement des traces...</div>
            ) : loginHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                Aucune connexion récente trouvée.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loginHistory.map((log: any) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0E7FF', color: '#4F46E5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         <Monitor size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                          {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={10} /> {log.ip} • {log.device}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
