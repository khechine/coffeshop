'use client';

import React, { useState, useTransition } from 'react';
import { Settings, Check, CreditCard, X, ChevronRight } from 'lucide-react';
import Modal from '../../../components/Modal';
import { assignPlanAction } from '../../actions';

export default function PlanMerchantActions({ storeId, storeName, plans }: { storeId: string, storeName: string, plans: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleAssign = (planId: string) => {
    startTransition(async () => {
      try {
        await assignPlanAction(storeId, planId);
        setOpen(false);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-slate-200 dark:border-slate-800"
      >
        <Settings size={12} /> GÉRER
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Abonnement : ${storeName}`} width={450}>
         <div className="space-y-6 pt-2">
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
               Assignez manuellement un forfait SaaS à ce marchand pour définir ses limites opérationnelles et l'accès au marketplace.
            </p>
            
            <div className="space-y-3">
              {plans.map(plan => (
                <button 
                  key={plan.id}
                  onClick={() => handleAssign(plan.id)}
                  disabled={isPending}
                  className="w-full group p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{plan.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{Number(plan.price)} DT / mois</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            {plans.length === 0 && (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun forfait configuré.</p>
                </div>
            )}

            <button 
               className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-sm hover:bg-slate-200 transition-all"
               onClick={() => setOpen(false)}
            >
               Annuler
            </button>
         </div>
      </Modal>
    </>
  );
}
