'use client';

import React from 'react';
import { CheckCircle2, XCircle, FileText, Store, Wallet, Clock, ArrowUpRight } from 'lucide-react';
import { updateWalletRechargeStatusAction } from '../../../../actions';

export default function RechargeRequestsClient({ initialRequests }: { initialRequests: any[] }) {
  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (confirm(`Voulez-vous vraiment ${status === 'APPROVED' ? 'approuver' : 'rejeter'} cette recharge ?`)) {
      await updateWalletRechargeStatusAction(id, status);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[32px] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Recharges Wallet</h1>
          <p className="mt-2 text-slate-500 font-medium tracking-tight">Validez les preuves de paiement pour créditer les portefeuilles boutiques.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {initialRequests.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-xs tracking-widest">
            Aucune demande de recharge
          </div>
        ) : initialRequests.map((req) => (
          <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm transition-all hover:shadow-md group">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex gap-6">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <ArrowUpRight size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{req.store.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mb-4">
                    {Number(req.amount).toFixed(3)} <span className="text-lg opacity-50">DT</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {req.proofUrl && (
                      <a 
                        href={req.proofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        <FileText size={16} /> Voir la preuve
                      </a>
                    )}
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock size={12} /> Reçue le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3">
                {req.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 justify-center"
                    >
                      <CheckCircle2 size={16} /> Approuver la recharge
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                      className="px-8 py-3 bg-white dark:bg-slate-800 text-rose-600 border border-rose-100 dark:border-rose-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2 justify-center"
                    >
                      <XCircle size={16} /> Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
