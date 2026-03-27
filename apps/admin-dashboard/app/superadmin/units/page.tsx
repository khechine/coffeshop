'use client';

import React, { useState, useTransition } from 'react';
import { Ruler, Plus, Trash2, CheckCircle } from 'lucide-react';
import { createGlobalUnit, deleteGlobalUnit } from '../../actions';

const DEFAULTS = ['unité', 'kg', 'g', 'L', 'mL', 'pcs', 'sachet', 'boite', 'palette'];

export default function UnitsPage() {
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    fetch('/api/units').then(r => r.json()).then((data: any) => {
      setUnits(data);
      setLoaded(true);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      await createGlobalUnit(newName.trim());
      const fresh = await fetch('/api/units').then(r => r.json());
      setUnits(fresh);
      setNewName('');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteGlobalUnit(id);
      setUnits(u => u.filter(x => x.id !== id));
    });
  };

  const field: React.CSSProperties = { padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ruler size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#1E293B' }}>Unités Globales</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Définissez les unités utilisées par tous les cafés pour leurs produits et stocks.</p>
        </div>
      </div>

      {/* Create */}
      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '24px' }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px' }}>
          <input style={field} value={newName} onChange={e => setNewName(e.target.value)} placeholder='ex: "palette", "carton", "L"...' required />
          <button type="submit" disabled={isPending} style={{ padding: '12px 24px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Ajouter
          </button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          {DEFAULTS.map(d => (
            <button key={d} onClick={() => setNewName(d)} style={{ padding: '4px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#475569' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {!loaded ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>Chargement...</div>
        ) : units.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
            <Ruler size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
            <p style={{ fontWeight: 600 }}>Aucune unité. Commencez par en ajouter.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nom</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle size={16} color="#10B981" />
                      <span style={{ fontWeight: 700, color: '#1E293B' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(u.id)} disabled={isPending} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
