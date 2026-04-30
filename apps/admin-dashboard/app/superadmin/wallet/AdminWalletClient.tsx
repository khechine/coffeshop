'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Eye, Info, AlertCircle, 
  Wallet, ArrowRight, User, Calendar, CreditCard, ExternalLink,
  Search, Filter, History, Activity, ArrowUpRight, ArrowDownLeft,
  ChevronRight, RefreshCcw, Download, Trash2, ShieldCheck
} from 'lucide-react';
import { processDepositRequestAction, depositToWalletAction } from '../../actions';

interface AdminWalletClientProps {
  initialRequests: any[];
  initialTransactions: any[];
  vendors?: any[];
}

export default function AdminWalletClient({ initialRequests, initialTransactions = [], vendors = [] }: AdminWalletClientProps) {
  const [requests, setRequests] = useState(initialRequests || []);
  const [transactions, setTransactions] = useState(initialTransactions || []);
  const [isPending, startTransition] = useTransition();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY' | 'AUDIT' | 'CREDIT'>('PENDING');

  // Manual Credit States
  const [creditVendorId, setCreditVendorId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNotes, setCreditNotes] = useState('Bonus manuel B2B');
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const handleProcess = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !adminNotes) {
      alert('Veuillez ajouter un motif de refus dans les notes.');
      return;
    }

    startTransition(async () => {
      try {
        await processDepositRequestAction(requestId, status, adminNotes);
        // Refresh local state or just show alert and reload (reload is cleaner for historical consistency)
        window.location.reload();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleManualCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditVendorId || !creditAmount || isNaN(Number(creditAmount)) || Number(creditAmount) <= 0) {
      alert('Veuillez sélectionner un vendeur et un montant valide.');
      return;
    }

    startTransition(async () => {
      try {
        await depositToWalletAction(creditVendorId, Number(creditAmount), creditNotes);
        window.location.reload();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  // Memoized Data Filtering
  const pendingRequests = useMemo(() => 
    requests.filter((r: any) => r.status === 'PENDING' && (r.vendor?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [requests, searchTerm]
  );

  const historicalRequests = useMemo(() => 
    requests.filter((r: any) => r.status !== 'PENDING' && (r.vendor?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [requests, searchTerm]
  );

  const auditLogs = useMemo(() => 
    transactions.filter((t: any) => {
      const matchesSearch = (t.wallet?.vendor?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
      return matchesSearch && matchesType;
    }),
    [transactions, searchTerm, typeFilter]
  );

  const stats = useMemo(() => {
    const totalDeposits = transactions.filter((t: any) => t.type === 'DEPOSIT').reduce((acc, t) => acc + Number(t.amount), 0);
    const totalCommissions = transactions.filter((t: any) => t.type === 'COMMISSION').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
    return { totalDeposits, totalCommissions };
  }, [transactions]);

  return (
    <div className="flex flex-col gap-10">
      
      {/* Page Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[40px] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestion Portefeuilles</h1>
          <p className="mt-2 text-slate-500 font-medium tracking-tight uppercase text-[10px] tracking-widest">Audit financier et approbations de flux B2B</p>
        </div>
        
        <div className="flex gap-6">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dépôts</span>
              <span className="text-2xl font-black text-emerald-600 tracking-tighter">+{stats.totalDeposits.toFixed(0)} <span className="text-sm">DT</span></span>
           </div>
           <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 hidden md:block" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commissions Total</span>
              <span className="text-2xl font-black text-indigo-600 tracking-tighter">+{stats.totalCommissions.toFixed(0)} <span className="text-sm">DT</span></span>
           </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {[
              { id: 'PENDING', label: 'Approbations', icon: Clock, badge: pendingRequests.length },
              { id: 'CREDIT', label: 'Créditer', icon: Wallet },
              { id: 'HISTORY', label: 'Historique Dépôts', icon: History },
              { id: 'AUDIT', label: 'Audit Log Global', icon: Activity },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[9px]">{tab.badge}</span>
                )}
              </button>
            ))}
         </div>

         <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un vendeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
         </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Tab: PENDING */}
        {activeTab === 'PENDING' && (
          <div className="grid grid-cols-1 gap-8">
            {pendingRequests.length === 0 ? (
              <EmptyState title="Aucune demande" subtitle="Tout est à jour ! Les dépôts vendeurs ont tous été traités." icon={CheckCircle2} />
            ) : (
              pendingRequests.map((req: any) => (
                <DepositRequestCard 
                  key={req.id} 
                  req={req} 
                  adminNotes={adminNotes}
                  setAdminNotes={setAdminNotes}
                  isPending={isPending}
                  handleProcess={handleProcess}
                  setSelectedProof={setSelectedProof}
                />
              ))
            )}
          </div>
        )}

        {/* Tab: HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest first:pl-8">Date Traitement</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendeur</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes Admin</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                   </tr>
                </thead>
                <tbody>
                   {historicalRequests.map((req: any) => (
                      <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                         <td className="p-6 first:pl-8">
                            <div className="flex flex-col">
                               <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                  {new Date(req.updatedAt || req.createdAt).toLocaleDateString('fr-FR')}
                               </span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  {new Date(req.updatedAt || req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                         </td>
                         <td className="p-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                                  {req.vendor?.companyName?.[0]}
                               </div>
                               <span className="text-sm font-black text-slate-700 dark:text-slate-300">{req.vendor?.companyName}</span>
                            </div>
                         </td>
                         <td className="p-6">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{Number(req.amount).toFixed(3)} DT</span>
                         </td>
                         <td className="p-6">
                            {req.status === 'APPROVED' ? (
                               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100/50 dark:border-emerald-500/20">
                                  <CheckCircle2 size={10} /> Approuvé
                               </div>
                            ) : (
                               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100/50 dark:border-rose-500/20">
                                  <XCircle size={10} /> Refusé
                               </div>
                            )}
                         </td>
                         <td className="p-6">
                            <p className="text-xs font-medium text-slate-500 line-clamp-1 italic max-w-[200px]">{req.adminNotes || '—'}</p>
                         </td>
                         <td className="p-6 text-right pr-8">
                            <div className="flex items-center justify-end gap-3">
                               {req.proofImage && (
                                 <button 
                                   onClick={() => setSelectedProof(req.proofImage)} 
                                   className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all shadow-sm"
                                 >
                                    <img src={req.proofImage} className="w-full h-full object-cover" alt="Proof" />
                                 </button>
                               )}
                               <button 
                                onClick={() => setSelectedProof(req.proofImage)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase transition-all"
                               >
                                  <Eye size={12} /> VOIR
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {historicalRequests.length === 0 && <EmptyState title="Aucun historique" subtitle="Les demandes traitées apparaîtront ici." icon={History} />}
          </div>
        )}

        {/* Tab: AUDIT LOG */}
        {activeTab === 'AUDIT' && (
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex gap-2">
                   {['ALL', 'DEPOSIT', 'COMMISSION', 'WITHDRAWAL'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                           typeFilter === type 
                             ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                             : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                         {type}
                      </button>
                   ))}
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-600/20">
                   <Download size={14} /> EXPORT CSV
                </button>
             </div>
             
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest first:pl-8">Date & Heure</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entité</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Montant</th>
                   </tr>
                </thead>
                <tbody>
                   {auditLogs.map((t: any) => {
                      const isPositive = Number(t.amount) > 0;
                      return (
                         <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-6 first:pl-8">
                               <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tighter">
                                     {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                                     {new Date(t.createdAt).toLocaleTimeString('fr-FR')}
                                  </span>
                               </div>
                            </td>
                            <td className="p-6">
                               <span className="text-xs font-black text-slate-700 dark:text-slate-300">{t.wallet?.vendor?.companyName || 'Système'}</span>
                            </td>
                            <td className="p-6">
                               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border ${
                                 t.type === 'COMMISSION' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100/50 dark:border-rose-500/20' : 
                                 t.type === 'DEPOSIT' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100/50 dark:border-emerald-500/20' :
                                 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200/50 dark:border-slate-800'
                               }`}>
                                  {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                  {t.type}
                               </div>
                            </td>
                            <td className="p-6">
                               <p className="text-xs font-medium text-slate-500 line-clamp-1">{t.description}</p>
                            </td>
                            <td className="p-6 text-right pr-8">
                               <span className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isPositive ? '+' : ''}{Number(t.amount).toFixed(3)} DT
                               </span>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
              {auditLogs.length === 0 && <EmptyState title="Aucune donnée" subtitle="Le journal d'audit est vide pour ces critères." icon={Activity} />}
           </div>
        )}

        {/* Tab: MANUAL CREDIT */}
        {activeTab === 'CREDIT' && (
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Créditer un Vendeur</h3>
                <p className="text-slate-500 text-sm font-medium">Ajouter manuellement des fonds au portefeuille d'un vendeur</p>
              </div>
            </div>

            <form onSubmit={handleManualCredit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Vendeur</label>
                <select 
                  value={creditVendorId}
                  onChange={(e) => setCreditVendorId(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  required
                >
                  <option value="" disabled>Sélectionner un vendeur...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.companyName} ({v.user?.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Montant (DT)</label>
                <input 
                  type="number" 
                  step="0.001"
                  min="0.001"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Ex: 100.000"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Description</label>
                <input 
                  type="text" 
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  placeholder="Motif du crédit..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {isPending ? 'Traitement...' : 'Créditer le Portefeuille'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Proof Modal Overlay */}
      {selectedProof && (
        <div 
          className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-2xl p-8 flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={() => setSelectedProof(null)}
        >
          <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
            <XCircle size={48} />
          </button>
          <img 
            src={selectedProof} 
            className="max-w-full max-h-full object-contain rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10" 
            alt="Preuve plein écran" 
          />
          <div className="mt-12 px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full text-white/70 text-sm font-black tracking-widest uppercase">
            Cliquez n'importe où pour fermer
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, subtitle, icon: Icon }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[48px] p-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6">
      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-[32px] flex items-center justify-center text-slate-200 dark:text-slate-700">
        <Icon size={48} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-400 font-medium max-w-sm mx-auto">{subtitle}</p>
      </div>
    </div>
  );
}

function DepositRequestCard({ req, adminNotes, setAdminNotes, isPending, handleProcess, setSelectedProof }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden group">
      <div className="flex flex-col lg:flex-row">
        
        {/* Info Section */}
        <div className="flex-1 p-10 space-y-10 border-r border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-indigo-600/30">
                {req.vendor?.companyName?.[0]}
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">{req.vendor?.companyName}</h4>
                <div className="flex items-center gap-3 text-slate-400 font-black uppercase text-[10px] tracking-widest mt-1">
                  <span className="flex items-center gap-1.5"><User size={14} className="text-indigo-600" /> ID: {req.vendor?.id?.slice(-8)}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-600" /> {new Date(req.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-200/50 dark:border-amber-500/20 animate-pulse">
                <Clock size={12} /> Action Requise
              </div>
              <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">Soumis à {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-[32px] border border-slate-100 dark:border-slate-800 relative overflow-hidden group/amount">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/amount:opacity-20 transition-opacity">
                 <CreditCard size={64} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Montant du Dépôt</p>
              <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                {Number(req.amount).toFixed(3)} <span className="text-xl font-black text-indigo-600">DT</span>
              </p>
            </div>
            <div className="p-8 bg-indigo-600 rounded-[32px] flex flex-col justify-center text-white shadow-xl shadow-indigo-600/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Nature du Flux</span>
              </div>
              <p className="text-2xl font-black tracking-tight">Recharge Portefeuille</p>
              <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest italic">Vérification Manuelle</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest px-1 flex items-center gap-2">
               <Info size={14} className="text-indigo-600" /> Notes de Traitement <span className="text-rose-500 text-[9px] lowercase italic">(obligatoire pour refus)</span>
            </label>
            <textarea 
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Indiquez une note interne ou le motif détaillé du refus..."
              className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[32px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold h-32 resize-none placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Proof Section */}
        <div className="lg:w-[450px] p-10 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-8">
          <div className="flex items-center justify-between px-2">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Justificatif</h5>
            <button 
              onClick={() => setSelectedProof(req.proofImage)}
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-105"
            >
              Zoomer <ExternalLink size={14} />
            </button>
          </div>
          
          <div 
            onClick={() => setSelectedProof(req.proofImage)}
            className="flex-1 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden cursor-zoom-in relative group/proof"
          >
            <img 
              src={req.proofImage} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover/proof:scale-110" 
              alt="Preuve de dépôt" 
            />
            <div className="absolute inset-0 bg-slate-900/0 group-hover/proof:bg-slate-900/40 transition-all flex items-center justify-center">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white scale-0 group-hover/proof:scale-100 transition-transform duration-500">
                  <Eye size={32} />
               </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => handleProcess(req.id, 'REJECTED')}
              disabled={isPending}
              className="flex-1 py-5 border-2 border-rose-100 dark:border-rose-500/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-3xl font-black text-xs tracking-widest uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle size={18} /> Rejeter
            </button>
            <button 
              onClick={() => handleProcess(req.id, 'APPROVED')}
              disabled={isPending}
              className="flex-[2] py-5 bg-slate-900 dark:bg-indigo-600 hover:bg-emerald-600 text-white rounded-3xl font-black text-xs tracking-widest uppercase shadow-2xl shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> Valider le crédit
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
