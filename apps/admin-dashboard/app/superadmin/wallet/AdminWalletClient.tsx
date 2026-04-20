'use client';

import React, { useState, useTransition } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Eye, Info, AlertCircle, 
  Wallet, ArrowRight, User, Calendar, CreditCard, ExternalLink
} from 'lucide-react';
import { processDepositRequestAction } from '../../actions';

interface AdminWalletClientProps {
  initialRequests: any[];
}

export default function AdminWalletClient({ initialRequests }: AdminWalletClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [isPending, startTransition] = useTransition();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const handleProcess = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !adminNotes) {
      alert('Veuillez ajouter un motif de refus dans les notes.');
      return;
    }

    startTransition(async () => {
      try {
        await processDepositRequestAction(requestId, status, adminNotes);
        setRequests(requests.filter((r: any) => r.id !== requestId));
        setAdminNotes('');
        alert(status === 'APPROVED' ? 'Dépôt approuvé avec succès !' : 'Dépôt refusé.');
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Approbations de Dépôts</h1>
        <p className="text-slate-500 font-medium">Vérifiez les preuves de paiement et créditez les portefeuilles vendeurs.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Tout est à jour !</h3>
              <p className="text-slate-400 font-medium">Aucune demande de dépôt en attente d'approbation.</p>
            </div>
          </div>
        ) : (
          requests.map((req: any) => (
            <div key={req.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="flex flex-col lg:flex-row">
                
                {/* Info Section */}
                <div className="flex-1 p-8 space-y-6 border-r border-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">
                        {req.vendor.companyName[0]}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">{req.vendor.companyName}</h4>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <User size={14} />
                          <span>ID: {req.vendor.id.slice(-8)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        En attente
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Montant Demandé</p>
                      <p className="text-2xl font-black text-slate-900">{Number(req.amount).toFixed(3)} <span className="text-sm font-bold text-slate-400">DT</span></p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <CreditCard size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Type</span>
                      </div>
                      <p className="font-bold text-indigo-900">Dépôt Portefeuille</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes Administratives (requis pour refus)</label>
                    <textarea 
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      placeholder="Note interne ou motif de refus..."
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium h-24 resize-none"
                    />
                  </div>
                </div>

                {/* Proof Section */}
                <div className="lg:w-96 p-8 bg-slate-50/30 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preuve de paiement</h5>
                    <button 
                      onClick={() => setSelectedProof(req.proofImage)}
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                    >
                      Agrandir <ExternalLink size={12} />
                    </button>
                  </div>
                  
                  <div 
                    onClick={() => setSelectedProof(req.proofImage)}
                    className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-inner overflow-hidden cursor-zoom-in relative group"
                  >
                    <img 
                      src={req.proofImage} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt="Preuve de dépôt" 
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                      <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => handleProcess(req.id, 'REJECTED')}
                      disabled={isPending}
                      className="flex-1 py-4 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-2xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Refuser
                    </button>
                    <button 
                      onClick={() => handleProcess(req.id, 'APPROVED')}
                      disabled={isPending}
                      className="flex-[1.5] py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Approuver le Dépôt
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Proof Modal Overlay */}
      {selectedProof && (
        <div 
          className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-xl p-8 flex flex-col items-center justify-center"
          onClick={() => setSelectedProof(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <XCircle size={40} />
          </button>
          <img 
            src={selectedProof} 
            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" 
            alt="Preuve plein écran" 
          />
          <div className="mt-8 px-6 py-3 bg-white/10 backdrop-blur rounded-full text-white text-sm font-bold animate-pulse">
            Cliquez n'importe où pour fermer
          </div>
        </div>
      )}
    </div>
  );
}
