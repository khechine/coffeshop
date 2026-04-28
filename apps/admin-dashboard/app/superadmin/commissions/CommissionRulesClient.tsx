'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Check, X, ShieldCheck, Percent, AlertCircle, Edit2, Calendar } from 'lucide-react';
import { createCommissionRule, updateCommissionRule, deleteCommissionRule } from '../../actions';

export default function CommissionRulesClient({ rules: initialRules = [] }: { rules: any[] }) {
  const [rules, setRules] = useState(initialRules || []);
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
    <div className="flex flex-col gap-10">
      
      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[32px] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Règles de Commission</h1>
          <p className="mt-2 text-slate-500 font-medium tracking-tight">Gérez les taux et tranches de commission applicables aux vendeurs certifiés.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus size={20} /> Nouvelle Règle
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-indigo-500/20 shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{editingId ? 'Modifier la règle' : 'Créer une nouvelle règle'}</h3>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={28} /></button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nom de la règle</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Standard B2B, Premium Vendeur..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Description (Optionnel)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A quoi sert cette règle..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Taux de base (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    value={baseRate} 
                    onChange={(e) => setBaseRate(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <Percent size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <input 
                  type="checkbox" 
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isDefault" className="text-sm font-black text-slate-900 dark:text-white cursor-pointer">Définir comme règle par défaut</label>
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-950/50 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Tranches de Commission (Optionnel)</label>
                <button 
                  onClick={handleAddTier}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  + Ajouter une tranche
                </button>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {tiers.map((tier, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr,1fr,40px] gap-3 items-center animate-in zoom-in-95 duration-200">
                    <div className="relative">
                       <input 
                        type="number" 
                        placeholder="Min DT"
                        value={tier.minAmount}
                        onChange={(e) => handleTierChange(idx, 'minAmount', Number(e.target.value))}
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black"
                       />
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">DT</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.001"
                        placeholder="Taux (ex: 0.01)"
                        value={tier.rate}
                        onChange={(e) => handleTierChange(idx, 'rate', Number(e.target.value))}
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-indigo-600"
                      />
                      <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button onClick={() => handleRemoveTier(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {tiers.length === 0 && (
                  <div className="text-center py-10 text-slate-400 font-bold text-[10px] uppercase tracking-widest italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    Aucune tranche définie. Seul le taux de base sera appliqué.
                  </div>
                )}
              </div>
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3 items-start">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                  Les tranches sont appliquées en priorité : si le montant de la commande atteint le seuil défini, le taux de la tranche remplace le taux de base.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <button onClick={resetForm} className="px-8 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-sm hover:bg-slate-200 transition-all">Annuler</button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : editingId ? 'Mettre à jour la règle' : 'Créer la règle'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {rules.map(rule => (
          <div key={rule.id} className="group bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            {rule.isDefault && (
              <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1.5 rounded-bl-2xl text-[9px] font-black tracking-widest flex items-center gap-1.5">
                <Check size={10} strokeWidth={4} /> PAR DÉFAUT
              </div>
            )}
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                <ShieldCheck size={28} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(rule)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(rule.id)} className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-400 hover:text-rose-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{rule.name}</h4>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8 h-10 line-clamp-2">{rule.description || 'Aucune description spécifiée pour cette règle.'}</p>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-[24px] border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux Standard</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{(rule.baseRate * 100).toFixed(1)}%</span>
              </div>
              
              {Array.isArray(rule.tiers) && rule.tiers.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Paliers Progressifs</div>
                  <div className="space-y-2">
                    {rule.tiers.sort((a: any, b: any) => a.minAmount - b.minAmount).map((tier: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">≥ {tier.minAmount} DT</span>
                        <span className="text-[11px] font-black text-indigo-600">{(tier.rate * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between items-center">
               <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} /> {new Date(rule.createdAt).toLocaleDateString('fr-FR')}
               </div>
               <div className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">ID: {rule.id.slice(0,8)}</div>
            </div>
          </div>
        ))}

        {rules.length === 0 && !isAdding && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[40px] border-4 border-dashed border-slate-100 dark:border-slate-800">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                <ShieldCheck size={48} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Aucune règle définie</h3>
             <p className="text-slate-500 font-medium">Commencez par créer votre première règle de commission marketplace.</p>
          </div>
        )}
      </div>

    </div>
  );
}
