'use client';

import React, { useState, useTransition } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, Info, ShieldCheck, UserCheck, Plus, Camera, Image as ImageIcon, X
} from 'lucide-react';
import { approveMarketplaceOrderAction, createWalletDepositRequestAction } from '../../../actions';
import Modal from '../../../../components/Modal';

interface WalletClientProps {
  initialWallet: any;
  orders: any[];
  commissionRate: number;
  initialDepositRequests: any[];
  isGracePeriodActive: boolean;
}

export default function WalletClient({ 
  initialWallet, 
  orders, 
  commissionRate, 
  initialDepositRequests,
  isGracePeriodActive
}: WalletClientProps) {
  const [wallet, setWallet] = useState(initialWallet);
  const [depositRequests, setDepositRequests] = useState(initialDepositRequests);
  const [isPending, startTransition] = useTransition();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Deposit Form State
  const [depositForm, setDepositForm] = useState({
    amount: '',
    imagePreview: ''
  });

  // Filter orders that need vendor approval
  const pendingOrders = orders.filter(o => 
    o.settlement && !o.settlement.vendorApproved && !o.settlement.isProcessed
  );

  const handleApprove = async (orderId: string) => {
    startTransition(async () => {
      try {
        await approveMarketplaceOrderAction(orderId, 'VENDOR');
        window.location.reload(); 
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleRequestDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.amount || !depositForm.imagePreview) {
      alert('Veuillez saisir un montant et une preuve de paiement');
      return;
    }

    startTransition(async () => {
      try {
        await createWalletDepositRequestAction({
          amount: parseFloat(depositForm.amount),
          proofImage: depositForm.imagePreview
        });
        setIsDepositModalOpen(false);
        setDepositForm({ amount: '', imagePreview: '' });
        window.location.reload();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  // A vendor is "visible" if: balance > 0, OR grace period is active (balance <= 0 but pending deposit)
  const isVisible = wallet.balance > 0 || isGracePeriodActive;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar: Balance & Stats */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="flex items-center justify-between mb-6 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Wallet size={20} />
              </div>
              <span className="font-bold text-indigo-100 tracking-wide uppercase text-xs">Solde Disponible</span>
            </div>
            {isGracePeriodActive && (
              <span className="px-2 py-1 bg-amber-400 text-amber-900 text-[10px] font-black rounded-lg uppercase animate-pulse shadow-lg">
                Période de grâce
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-2 relative">
            <span className="text-5xl font-black">{wallet.balance.toFixed(3)}</span>
            <span className="text-indigo-200 text-xl font-bold">DT</span>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest relative ${isVisible ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'}`}>
            <div className={`w-2 h-2 rounded-full ${isVisible ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {isVisible ? (isGracePeriodActive && wallet.balance <= 0 ? 'Visibilité maintenue (Grace)' : 'Visibilité Active') : 'Marketplace Masqué'}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-4 relative">
            <div className="flex justify-between items-center text-sm">
              <span className="text-indigo-200">Marge Négociée</span>
              <span className="font-black text-white">{(commissionRate * 100).toFixed(1)}%</span>
            </div>
            <button 
              onClick={() => setIsDepositModalOpen(true)}
              className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-black text-sm shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
            >
              Recharger le compte
            </button>
          </div>
        </div>

        {/* Visibility Info Card */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6">
          <div className="flex gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
              <Info size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-amber-900 dark:text-amber-300">Règle de visibilité</h4>
              <p className="text-sm text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                Votre visibilité sur le marketplace est conditionnée par un solde positif. 
                Si votre solde atteint 0 DT, vos produits et packs seront automatiquement masqués.
              </p>
            </div>
          </div>
        </div>

        {/* Deposit Requests Section */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm italic underline decoration-indigo-500 underline-offset-4">Mes Demandes</h3>
            {depositRequests.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-lg uppercase tracking-wider">En attente</span>
            )}
          </div>
          <div className="space-y-3">
            {depositRequests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Aucune demande de dépôt</p>
            ) : (
              depositRequests.map((req: any) => (
                <div key={req.id} className="p-3 bg-slate-50 rounded-2xl flex flex-col gap-2 border border-transparent hover:border-slate-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-900 text-sm font-mono">+ {req.amount.toFixed(3)} DT</p>
                      <p className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {req.status === 'PENDING' ? 'En cours' : 
                       req.status === 'APPROVED' ? 'Validé' : 'Refusé'}
                    </span>
                  </div>
                  {req.status === 'REJECTED' && req.adminNotes && (
                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl p-2">
                      <AlertCircle size={12} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-rose-700 font-bold leading-relaxed">
                        Motif de refus : {req.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Approvals & Transactions */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Pending Approvals Section */}
        {pendingOrders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Approvals en attente 
                <span className="w-6 h-6 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center animate-bounce">
                  {pendingOrders.length}
                </span>
              </h3>
            </div>

            <div className="grid gap-4">
              {pendingOrders.map((order: any) => (
                <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase">
                        Commande #{order.id.slice(-5)}
                      </span>
                      <span className="text-xs text-slate-400">du {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-900">{order.store.name}</h4>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Total</p>
                        <p className="font-bold text-slate-800">{order.total.toFixed(3)} DT</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-rose-400 uppercase font-black tracking-widest leading-none">Marge</p>
                        <p className="font-black text-rose-600">-{order.settlement?.commissionAmount.toFixed(3)} DT</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.settlement?.superadminApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                        <ShieldCheck size={18} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Admin</span>
                    </div>
                    
                    <button 
                      onClick={() => handleApprove(order.id)}
                      disabled={isPending}
                      className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      Payer Commission
                      <UserCheck size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions History */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-900">Historique Complet</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Tout</span>
              <span className="px-3 py-1 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors">Dépôts</span>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {wallet.transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <Clock size={40} className="opacity-10" />
                <p className="font-medium">Aucun mouvement pour le moment</p>
              </div>
            ) : (
              wallet.transactions.map((t: any) => (
                <div key={t.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    t.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {t.amount > 0 ? <Plus size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{t.description || t.type}</p>
                    <p className="text-slate-400 text-[10px] font-medium">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${t.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toFixed(3)} DT
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Deposit Request Modal */}
      <Modal open={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Demander un rechargement">
        <form onSubmit={handleRequestDeposit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Montant à recharger (DT)</label>
              <input 
                type="number" 
                step="0.001"
                required
                value={depositForm.amount}
                onChange={e => setDepositForm({...depositForm, amount: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all text-xl font-black"
                placeholder="0.000"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Preuve de paiement</label>
              
              <div className="relative w-full h-48 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center group mb-4">
                {depositForm.imagePreview ? (
                  <>
                    <img src={depositForm.imagePreview} className="w-full h-full object-cover" alt="Preuve" />
                    <button 
                      type="button"
                      onClick={() => setDepositForm({...depositForm, imagePreview: ''})}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <ImageIcon size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                      Uploadez une image du virement ou du ticket de paiement
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl cursor-pointer hover:bg-indigo-100 transition-all text-sm font-black">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setDepositForm({...depositForm, imagePreview: ev.target?.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <ImageIcon size={16} /> Choisir Fichier
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl cursor-pointer hover:bg-emerald-100 transition-all text-sm font-black">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setDepositForm({...depositForm, imagePreview: ev.target?.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Camera size={16} /> Prendre Photo
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Envoi en cours...' : 'Envoyer la Demande'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
