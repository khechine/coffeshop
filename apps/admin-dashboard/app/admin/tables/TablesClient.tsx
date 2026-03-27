'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Save, Users, Settings, LayoutDashboard } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createTableAction, updateTableAction, deleteTableAction } from '../../actions';

export default function TablesClient({ initialTables }: { initialTables: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ label: '', capacity: 2 });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ label: '', capacity: 2 });
    setModalOpen(true);
  };

  const openEdit = (table: any) => {
    setEditing(table);
    setForm({ label: table.label, capacity: table.capacity });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editing) {
        await updateTableAction(editing.id, form);
      } else {
        await createTableAction(form);
      }
      setModalOpen(false);
    });
  };

  const fieldStyle: React.CSSProperties = { 
    width: '100%', padding: '12px 14px', borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', fontSize: '15px', outline: 'none', background: '#F8FAFC' 
  };
  const labelStyle: React.CSSProperties = { 
    display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', 
    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' 
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">🍽 Disposition des Tables</span>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Ajouter une Table</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '24px' }}>
          {initialTables.map(table => (
            <div key={table.id} className="card" style={{ padding: '24px', position: 'relative', border: '2px solid #F1F5F9' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                    <Users size={24} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(table)} style={{ padding: '8px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#64748B' }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(table)} style={{ padding: '8px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FEE2E2', cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
               </div>
               
               <div style={{ fontWeight: 900, fontSize: '18px', color: '#1E293B', marginBottom: '4px' }}>{table.label}</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px' }}>
                  <span className="badge gray">{table.capacity} places</span>
                  <span>• Créé le {new Date(table.createdAt).toLocaleDateString()}</span>
               </div>
            </div>
          ))}
          
          {initialTables.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0' }}>
               <LayoutDashboard size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
               <p style={{ fontWeight: 700, color: '#64748B', margin: 0 }}>Aucune table configurée.</p>
               <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '4px' }}>Ajoutez des tables pour commencer à utiliser le plan de salle sur le POS.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la Table' : 'Nouvelle Table'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Nom / Numéro de la Table</label>
            <input 
              style={fieldStyle} 
              value={form.label} 
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))} 
              placeholder="ex: Table 12 ou Terrasse B" 
              required 
            />
          </div>
          <div>
            <label style={labelStyle}>Capacité (Nombre de places)</label>
            <input 
              style={fieldStyle} 
              type="number" 
              min={1} 
              max={20} 
              value={form.capacity} 
              onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))} 
              required 
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', paddingTop: '12px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
              {isPending ? 'Enregistrement...' : <><Save size={18} /> {editing ? 'Mettre à Jour' : 'Créer la Table'}</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer la Table" width={400}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Trash2 size={24} color="#EF4444" />
          </div>
          <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '16px', marginBottom: '8px' }}>Supprimer {deleteTarget?.label} ?</p>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Cette action est irréversible. Toutes les commandes en cours sur cette table seront perdues.</p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Annuler</button>
            <button 
              className="btn btn-danger" 
              style={{ flex: 1 }} 
              onClick={() => {
                startTransition(async () => {
                  await deleteTableAction(deleteTarget.id);
                  setDeleteTarget(null);
                });
              }}
              disabled={isPending}
            >
              {isPending ? '...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
