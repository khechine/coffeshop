'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText, Store, Wallet, Clock, ArrowUpRight, ShieldAlert, Award, User, ShoppingBag } from 'lucide-react';
import { updateWalletRechargeStatusAction, processDepositRequestAction } from '../../../actions';
import { useRouter } from 'next/navigation';

export default function RechargeRequestsClient({ 
  initialClientRequests, 
  initialVendorRequests 
}: { 
  initialClientRequests: any[]; 
  initialVendorRequests: any[]; 
}) {
  const router = useRouter();
  const [clientRequests, setClientRequests] = useState(initialClientRequests);
  const [vendorRequests, setVendorRequests] = useState(initialVendorRequests);
  const [activeTab, setActiveTab] = useState<'clients' | 'vendors'>('clients');

  const handleClientStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (confirm(`Voulez-vous vraiment ${status === 'APPROVED' ? 'approuver' : 'rejeter'} cette recharge de boutique ?`)) {
      try {
        await updateWalletRechargeStatusAction(id, status);
        setClientRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Une erreur est survenue');
      }
    }
  };

  const handleVendorStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (confirm(`Voulez-vous vraiment ${status === 'APPROVED' ? 'approuver' : 'rejeter'} ce dépôt de vendeur ?`)) {
      try {
        await processDepositRequestAction(id, status, `Dossier traité par le super-administrateur.`);
        setVendorRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Une erreur est survenue');
      }
    }
  };

  const pendingClientsCount = clientRequests.filter((r: any) => r.status === 'PENDING').length;
  const pendingVendorsCount = vendorRequests.filter((r: any) => r.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Recharges & Dépôts</h1>
          <p className="mt-2 text-slate-500 font-medium tracking-tight">Validez les preuves de paiement pour créditer les portefeuilles des boutiques et fournisseurs.</p>
        </div>
        
        {/* Modern Tabs Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'clients'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <User size={14} />
            Boutiques (Clients)
            {pendingClientsCount > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === 'clients' ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white animate-pulse'
              }`}>
                {pendingClientsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'vendors'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <ShoppingBag size={14} />
            Fournisseurs (Vendeurs)
            {pendingVendorsCount > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === 'vendors' ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white animate-pulse'
              }`}>
                {pendingVendorsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Requests Lists */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'clients' ? (
          clientRequests.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-xs tracking-widest">
              Aucune demande de recharge boutique
            </div>
          ) : (
            clientRequests.map((req: any) => (
              <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm transition-all hover:shadow-md group">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex gap-6">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <ArrowUpRight size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{req.store?.name || 'Boutique Inconnue'}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
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
                            href={req.proofUrl.startsWith('http') ? req.proofUrl : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com'}${req.proofUrl}`} 
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
                          onClick={() => handleClientStatusUpdate(req.id, 'APPROVED')}
                          className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 justify-center"
                        >
                          <CheckCircle2 size={16} /> Approuver la recharge
                        </button>
                        <button 
                          onClick={() => handleClientStatusUpdate(req.id, 'REJECTED')}
                          className="px-8 py-3.5 bg-white dark:bg-slate-800 text-rose-600 border border-rose-100 dark:border-rose-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-slate-900 transition-all flex items-center gap-2 justify-center"
                        >
                          <XCircle size={16} /> Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          vendorRequests.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-xs tracking-widest">
              Aucune demande de dépôt fournisseur
            </div>
          ) : (
            vendorRequests.map((req: any) => (
              <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm transition-all hover:shadow-md group">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex gap-6">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <ArrowUpRight size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{req.vendor?.companyName || 'Fournisseur Inconnu'}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
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
                        {req.proofImage && (
                          <a 
                            href={req.proofImage.startsWith('http') ? req.proofImage : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com'}${req.proofImage}`} 
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
                          onClick={() => handleVendorStatusUpdate(req.id, 'APPROVED')}
                          className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 justify-center"
                        >
                          <CheckCircle2 size={16} /> Approuver le dépôt
                        </button>
                        <button 
                          onClick={() => handleVendorStatusUpdate(req.id, 'REJECTED')}
                          className="px-8 py-3.5 bg-white dark:bg-slate-800 text-rose-600 border border-rose-100 dark:border-rose-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-slate-900 transition-all flex items-center gap-2 justify-center"
                        >
                          <XCircle size={16} /> Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
