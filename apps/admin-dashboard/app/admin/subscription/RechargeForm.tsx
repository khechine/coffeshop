'use client';

import React, { useRef, useState } from 'react';
import { ArrowUpRight, FileText, Loader2 } from 'lucide-react';
import { submitWalletRechargeRequestAction } from '../../actions';
import { useToast } from '../../components/Toast';

export default function RechargeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await submitWalletRechargeRequestAction(formData);
      if (res.success) {
        showToast('Demande de recharge envoyée avec succès !');
        formRef.current?.reset();
        // Optionnel: rafraîchir la page pour voir la nouvelle demande
        window.location.reload();
      }
    } catch (e: any) {
      showToast('Erreur lors de l\'envoi : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
          <ArrowUpRight size={24} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Recharger mon Wallet</h3>
          <p className="text-xs text-slate-500 font-medium">Soumettez une preuve de virement pour créditer votre compte.</p>
        </div>
      </div>

      <form 
        ref={formRef}
        action={handleSubmit} 
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant à recharger (DT)</label>
            <input 
              name="amount"
              type="number" 
              step="0.001"
              required
              placeholder="Ex: 100.000"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preuve de paiement (Screenshot/PDF)</label>
            <div className="relative group">
              <input 
                name="proofFile"
                type="file"
                accept="image/*,.pdf"
                required
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-medium italic">Veuillez joindre une capture d'écran de votre virement.</p>
          </div>
        </div>
        <button 
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Envoi en cours...
            </>
          ) : 'Soumettre la recharge'}
        </button>
      </form>
    </div>
  );
}
