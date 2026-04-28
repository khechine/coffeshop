'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Check, X, ShieldCheck, Percent, AlertCircle } from 'lucide-react';
import { createCommissionRule, updateCommissionRule, deleteCommissionRule } from '../../actions';

export default function CommissionRulesClient({ rules: initialRules }: { rules: any[] }) {
  const [rules, setRules] = useState(initialRules);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseRate, setBaseRate] = useState(1); // 1%
  const [tiers, setTiers] = useState<{ minAmount: number; rate: number }[]>([]);
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setBaseRate(1);
    setTiers([]);
    setIsDefault(false);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddTier = () => {
    setTiers([...tiers, { minAmount: 0, rate: 0.01 }]);
  };

  const handleRemoveTier = (idx: number) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx: number, field: 'minAmount' | 'rate', value: number) => {
    const newTiers = [...tiers];
    newTiers[idx][field] = value;
    setTiers(newTiers);
  };

  const handleSubmit = async () => {
    if (!name) return alert('Le nom est requis');
    setLoading(true);
    try {
      const data = {
        name,
        description,
        baseRate: baseRate / 100,
        tiers,
        isDefault
      };

      if (editingId) {
        const updated = await updateCommissionRule(editingId, data);
        setRules(rules.map(r => r.id === editingId ? updated : updated.isDefault ? { ...r, isDefault: false } : r));
      } else {
        const created = await createCommissionRule(data);
        setRules(created.isDefault ? [created, ...rules.map(r => ({ ...r, isDefault: false }))] : [created, ...rules]);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule: any) => {
    setEditingId(rule.id);
    setName(rule.name);
    setDescription(rule.description || '');
    setBaseRate(rule.baseRate * 100);
    setTiers(Array.isArray(rule.tiers) ? rule.tiers : []);
    setIsDefault(rule.isDefault);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette règle ?')) return;
    try {
      await deleteCommissionRule(id);
      setRules(rules.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Règles de Commission</h1>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '16px' }}>Gérez les taux et tranches de commission applicables aux vendeurs.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ padding: '12px 24px', borderRadius: '16px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Plus size={20} /> Nouvelle Règle
          </button>
        )}
      </div>

      {isAdding && (
        <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #4F46E5', padding: '32px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{editingId ? 'Modifier la règle' : 'Créer une nouvelle règle'}</h3>
            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={24} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 700, color: '#475569' }}>Nom de la règle</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Standard B2B, Premium Vendeur..."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 700, color: '#475569' }}>Description (Optionnel)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A quoi sert cette règle..."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', minHeight: '80px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 700, color: '#475569' }}>Taux de base (%)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    step="0.1"
                    value={baseRate} 
                    onChange={(e) => setBaseRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                  />
                  <Percent size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                <input 
                  type="checkbox" 
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="isDefault" style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Définir comme règle par défaut</label>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>Tranches de Commission (Optionnel)</label>
                <button 
                  onClick={handleAddTier}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: '#fff', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Ajouter
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tiers.map((tier, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '12px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      placeholder="Min DT"
                      value={tier.minAmount}
                      onChange={(e) => handleTierChange(idx, 'minAmount', Number(e.target.value))}
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                    />
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        step="0.001"
                        placeholder="Taux (ex: 0.01)"
                        value={tier.rate}
                        onChange={(e) => handleTierChange(idx, 'rate', Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                      />
                    </div>
                    <button onClick={() => handleRemoveTier(idx)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {tiers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>
                    Aucune tranche définie. Seul le taux de base sera appliqué.
                  </div>
                )}
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: '#FEF3C7', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '11px', color: '#92400E', lineHeight: 1.4 }}>
                  Les tranches sont appliquées si le montant de la commande est supérieur ou égal au seuil défini.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
            <button onClick={resetForm} style={{ padding: '12px 24px', borderRadius: '12px', background: '#F1F5F9', color: '#475569', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              style={{ padding: '12px 32px', borderRadius: '12px', background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer la règle'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {rules.map(rule => (
          <div key={rule.id} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px', transition: '0.2s', position: 'relative' }}>
            {rule.isDefault && (
              <div style={{ position: 'absolute', top: '-12px', right: '24px', background: '#4F46E5', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Check size={12} strokeWidth={4} /> PAR DÉFAUT
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: 48, height: 48, background: '#EEF2FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                <Percent size={24} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(rule)} style={{ padding: '8px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer' }}>
                  Modifier
                </button>
                <button onClick={() => handleDelete(rule.id)} style={{ padding: '8px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{rule.name}</h4>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>{rule.description || 'Aucune description'}</p>
            
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Taux de base</span>
                <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 900 }}>{(rule.baseRate * 100).toFixed(1)}%</span>
              </div>
              
              {Array.isArray(rule.tiers) && rule.tiers.length > 0 && (
                <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Tranches actives</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {rule.tiers.sort((a: any, b: any) => a.minAmount - b.minAmount).map((tier: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#475569' }}>≥ {tier.minAmount} DT</span>
                        <span style={{ color: '#4F46E5', fontWeight: 700 }}>{(tier.rate * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '16px', fontSize: '11px', color: '#94A3B8' }}>
              Créée le {new Date(rule.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
        ))}

        {rules.length === 0 && !isAdding && (
          <div style={{ gridColumn: 'span 3', padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '32px', border: '1px dashed #E2E8F0' }}>
             <ShieldCheck size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
             <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900, color: '#1E293B' }}>Aucune règle définie</h3>
             <p style={{ margin: 0, color: '#64748B' }}>Commencez par créer votre première règle de commission marketplace.</p>
          </div>
        )}
      </div>

    </div>
  );
}
