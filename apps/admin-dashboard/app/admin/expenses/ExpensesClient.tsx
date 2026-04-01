'use client';

import React, { useState, useTransition } from 'react';
import { PlusCircle, Trash2, Save, PiggyBank, Receipt, Droplets, Zap, Home, Users, CreditCard, ChevronRight } from 'lucide-react';
import Modal from '../../../components/Modal';
import { createExpenseAction, deleteExpenseAction } from '../../actions';

const CATEGORIES = [
  { id: 'EAU_SONEDE', label: 'Eau / SONEDE', icon: <Droplets size={16} />, color: '#3B82F6' },
  { id: 'STEG', label: 'Électricité / STEG', icon: <Zap size={16} />, color: '#F59E0B' },
  { id: 'LOYER', label: 'Loyer', icon: <Home size={16} />, color: '#6366F1' },
  { id: 'SALAIRE', label: 'Salaires', icon: <Users size={16} />, color: '#10B981' },
  { id: 'CNSS', label: 'CNSS', icon: <CreditCard size={16} />, color: '#EC4899' },
  { id: 'ACHAT', label: 'Achats / Mat. Premières', icon: <Receipt size={16} />, color: '#8B5CF6' },
  { id: 'AUTRE', label: 'Autres Charges', icon: <PiggyBank size={16} />, color: '#64748B' },
];

export default function ExpensesClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ 
    category: 'AUTRE', 
    amount: '', 
    description: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createExpenseAction({
        ...form,
        amount: parseFloat(form.amount)
      });
      setModalOpen(false);
      setForm({ category: 'AUTRE', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteExpenseAction(id);
      setDeleteId(null);
    });
  };

  // Group by category for the dashboard
  const totalsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: initialExpenses
      .filter(e => e.category === cat.id)
      .reduce((acc, curr) => acc + Number(curr.amount), 0)
  })).sort((a, b) => b.total - a.total);

  const grandTotal = totalsByCategory.reduce((acc, curr) => acc + curr.total, 0);

  const fieldStyle: React.CSSProperties = { 
    width: '100%', padding: '12px 14px', borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', fontSize: '15px', outline: 'none', background: '#fff',
    transition: 'all 0.2s ease'
  };
  const labelStyle: React.CSSProperties = { 
    display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', 
    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' 
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Gestion des Charges</h1>
          <p>Suivez vos dépenses opérationnelles et analysez vos coûts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <PlusCircle size={20} /> Nouvelle Charge
        </button>
      </div>

      {/* Dashboard Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', color: '#fff', border: 'none', padding: '32px' }}>
             <div style={{ fontSize: '14px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>Total des Charges Répertoriées</div>
             <div style={{ fontSize: '48px', fontWeight: 900 }}>{grandTotal.toFixed(3)} <span style={{ fontSize: '20px', opacity: 0.6 }}>DT</span></div>
             <div style={{ marginTop: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '100px', width: 'fit-content' }}>
                <Receipt size={14} /> {initialExpenses.length} factures enregistrées
             </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
           <div className="card-header" style={{ padding: 0, marginBottom: '20px', border: 'none' }}>
              <span className="card-title">Répartition par Catégorie</span>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {totalsByCategory.filter(t => t.total > 0).map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
                   <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#475569' }}>{cat.label}</div>
                   <div style={{ fontWeight: 800, fontSize: '13px' }}>{cat.total.toFixed(3)} DT</div>
                   <div style={{ width: '60px', height: '6px', background: '#F1F5F9', borderRadius: '3px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: cat.color, borderRadius: '3px', width: `${(cat.total / grandTotal) * 100}%` }} />
                   </div>
                </div>
              ))}
              {grandTotal === 0 && <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>Aucune dépense enregistrée.</div>}
           </div>
        </div>
      </div>

      {/* Categories Fast Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
         {CATEGORIES.map(cat => (
            <div key={cat.id} className="card" style={{ padding: '16px', textAlign: 'center', transition: 'all 0.2s' }}>
                <div style={{ width: 40, height: 40, background: `${cat.color}15`, color: cat.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                   {cat.icon}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>{cat.label}</div>
                <div style={{ fontWeight: 900, color: '#1E293B' }}>
                   {totalsByCategory.find(t => t.id === cat.id)?.total.toFixed(1)} DT
                </div>
            </div>
         ))}
      </div>

      {/* Expenses History */}
      <div className="card">
         <div className="card-header">
            <span className="card-title">Historique des Charges</span>
         </div>
      <div className="table-responsive">
         <table className="data-table">
            <thead>
               <tr>
                  <th>Date</th>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th>Montant</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {initialExpenses.map(e => {
                 const cat = CATEGORIES.find(c => c.id === e.category);
                 return (
                   <tr key={e.id}>
                      <td style={{ fontWeight: 700, color: '#64748B' }}>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                      <td>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 28, height: 28, background: `${cat?.color}15`, color: cat?.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               {cat?.icon}
                            </div>
                            <span style={{ fontWeight: 700 }}>{cat?.label}</span>
                         </div>
                      </td>
                      <td style={{ color: '#475569' }}>{e.description || '--'}</td>
                      <td style={{ fontWeight: 900, fontSize: '15px' }}>{Number(e.amount).toFixed(3)} DT</td>
                      <td style={{ textAlign: 'right' }}>
                         <button onClick={() => setDeleteId(e.id)} className="btn btn-ghost" style={{ color: '#EF4444' }}>
                            <Trash2 size={16} />
                         </button>
                      </td>
                   </tr>
                 );
               })}
               {initialExpenses.length === 0 && (
                 <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Aucune charge répertoriée.</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
      </div>

      {/* Modal Creating Expense */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer une Charge">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div>
              <label style={labelStyle}>Catégorie</label>
              <select style={fieldStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                 {CATEGORIES.map(cat => (
                   <option key={cat.id} value={cat.id}>{cat.label}</option>
                 ))}
              </select>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                 <label style={labelStyle}>Montant (DT)</label>
                 <input style={fieldStyle} type="number" step="0.001" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div>
                 <label style={labelStyle}>Date</label>
                 <input style={fieldStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
           </div>

           <div>
              <label style={labelStyle}>Description / Libellé</label>
              <input style={fieldStyle} placeholder="ex: Facture SONEDE Mars 2026" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
           </div>

           <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isPending}>
                 {isPending ? 'Enregistrement...' : <><Save size={18} /> Enregistrer</>}
              </button>
           </div>
        </form>
      </Modal>

      {/* Modal Deleting Expense */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer la charge" width={400}>
        <div style={{ textAlign: 'center' }}>
           <p>Voulez-vous vraiment supprimer cet enregistrement ? Cette action est irréversible.</p>
           <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Conserver</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteId && handleDelete(deleteId)} disabled={isPending}>Supprimer</button>
           </div>
        </div>
      </Modal>
    </>
  );
}
