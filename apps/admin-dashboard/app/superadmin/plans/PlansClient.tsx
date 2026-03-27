'use client';

import React, { useState, useTransition } from 'react';
import { PlusCircle, Edit2, Trash2, Save, ToggleLeft, ToggleRight, X, Crown, Check } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createPlanAction, updatePlanAction, deletePlanAction, togglePlanStatusAction } from '../../actions';

export default function PlansClient({ initialPlans }: { initialPlans: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, maxStores: 1, maxProducts: 50, hasMarketplace: true });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', price: 0, maxStores: 1, maxProducts: 50, hasMarketplace: true });
    setModalOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    setForm({ 
      name: plan.name, 
      price: Number(plan.price), 
      maxStores: plan.maxStores, 
      maxProducts: plan.maxProducts,
      hasMarketplace: plan.hasMarketplace ?? true
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    startTransition(async () => {
      try {
        if (editing) {
          await updatePlanAction(editing.id, form);
          setSuccessMsg('Plan mis à jour avec succès !');
        } else {
          await createPlanAction(form);
          setSuccessMsg('Plan créé avec succès !');
        }
        setTimeout(() => {
          setModalOpen(false);
          setSuccessMsg('');
        }, 1500);
      } catch (err: any) {
        alert("Erreur: " + err.message);
      }
    });
  };

  const toggleStatus = (id: string) => {
    startTransition(async () => {
      await togglePlanStatusAction(id);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deletePlanAction(id);
        setDeleteTarget(null);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const fieldStyle: React.CSSProperties = { 
    width: '100%', padding: '12px 14px', borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', fontSize: '15px', outline: 'none', background: '#F8FAFC',
    transition: 'all 0.2s ease'
  };
  const labelStyle: React.CSSProperties = { 
    display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', 
    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' 
  };

  const COLOR_SEQUENCES = ['#10B981', '#4F46E5', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Plans SaaS & Tarification</h1>
          <p>Définissez les offres commerciales de la plateforme.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <PlusCircle size={20} /> Créer un Forfait
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {initialPlans.map((plan, idx) => {
          const color = COLOR_SEQUENCES[idx % COLOR_SEQUENCES.length];
          const isInactive = plan.status === 'INACTIVE';
          
          return (
            <div key={plan.id} className="card" style={{ padding: '24px', opacity: isInactive ? 0.6 : 1, transition: 'all 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{plan.name}</h2>
                    <span className={`badge ${isInactive ? 'gray' : 'green'}`} style={{ marginTop: '4px' }}>
                        {isInactive ? 'Brouillon / Inactif' : '✓ Disponible'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toggleStatus(plan.id)} title={isInactive ? "Activer" : "Désactiver"} style={{ padding: '8px', borderRadius: '10px', background: isInactive ? '#F1F5F9' : '#ECFDF5', border: '1px solid #E2E8F0', cursor: 'pointer', color: isInactive ? '#64748B' : '#10B981' }}>
                    {isInactive ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
                  </button>
                  <button onClick={() => openEdit(plan)} style={{ padding: '8px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#64748B' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget(plan)} style={{ padding: '8px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FEE2E2', cursor: 'pointer', color: '#EF4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '36px', fontWeight: 900, color: color, marginBottom: '24px', letterSpacing: '-1px' }}>
                {Number(plan.price)}<span style={{ fontSize: '16px', fontWeight: 600, color: '#94A3B8' }}> DT/mois</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  { label: 'Points de Vente max.', value: plan.maxStores },
                  { label: 'Produits max.', value: plan.maxProducts },
                  { label: 'Accès Marketplace', value: plan.hasMarketplace ? 'OUI' : 'NON' },
                ].map(feat => (
                  <div key={feat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                      <Check size={14} color={color} strokeWidth={3} />
                      {feat.label}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{feat.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Abonnés Actifs: <strong>{plan.activeCount ?? 0}</strong></div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Revenu estimé: <strong>{(Number(plan.price) * (plan.activeCount ?? 0)).toFixed(0)} DT</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal CRUD */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le Forfait' : 'Nouveau Forfait'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Nom du forfait</label>
            <input style={fieldStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Essentiel, Pro, Enterprise" required />
          </div>
          <div>
            <label style={labelStyle}>Prix Mensuel (DT)</label>
            <input style={fieldStyle} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nombre de POS max.</label>
              <input style={fieldStyle} type="number" value={form.maxStores} onChange={e => setForm(f => ({ ...f, maxStores: parseInt(e.target.value) }))} required />
            </div>
            <div>
              <label style={labelStyle}>Nb. Produits max.</label>
              <input style={fieldStyle} type="number" value={form.maxProducts} onChange={e => setForm(f => ({ ...f, maxProducts: parseInt(e.target.value) }))} required />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
            <input type="checkbox" id="hasMarketplace" checked={form.hasMarketplace} onChange={e => setForm(f => ({ ...f, hasMarketplace: e.target.checked }))} style={{ width: '18px', height: '18px' }} />
            <label htmlFor="hasMarketplace" style={{ fontSize: '14px', fontWeight: 700, cursor: 'pointer', margin: 0 }}>Inclure l'accès au Marketplace B2B</label>
          </div>

          {successMsg && (
            <div style={{ padding: '12px', background: '#ECFDF5', color: '#10B981', borderRadius: '12px', fontSize: '14px', textAlign: 'center', fontWeight: 700, border: '1px solid #D1FAE5' }}>
              <Check size={16} style={{ display: 'inline', marginRight: '8px' }} />
              {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', paddingTop: '12px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, background: successMsg ? '#10B981' : undefined }} disabled={isPending || !!successMsg}>
              {isPending ? 'Enregistrement...' : successMsg ? 'OK ✓' : <><Save size={18} /> {editing ? 'Mettre à jour' : 'Créer le Forfait'}</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le Forfait" width={400}>
        <div style={{ textAlign: 'center' }}>
          <p>Êtes-vous sûr de vouloir supprimer le forfait <strong>{deleteTarget?.name}</strong> ?</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Annuler</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteTarget.id)} disabled={isPending}>
                Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
