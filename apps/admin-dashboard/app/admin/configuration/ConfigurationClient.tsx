'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, LayoutGrid, Users, CreditCard, BarChart3,
  FileText, Tablet, Settings, ChevronRight, Plus, Trash2,
  Shield, Eye, EyeOff, QrCode, ArrowUpRight, TrendingUp,
  MapPin, Phone, Mail, Building2, User, Wallet, Activity,
  Download, ExternalLink, MoreVertical, Search, Filter
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'tables', label: 'Floor Plan', icon: LayoutGrid, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'staff', label: 'Team & Access', icon: Users, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'expenses', label: 'Finance', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'metrics', label: 'Analytics', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'reports', label: 'Fiscal Reports', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'terminals', label: 'POS Terminals', icon: Tablet, color: 'text-teal-600', bg: 'bg-teal-50' },
];

export default function ConfigurationClient({
  store, staff, tables, terminals, totalExpenses, recentExpenses,
  salesCount, revenue, isFiscalEnabled
}: {
  store: any; staff: any[]; tables: any[]; terminals: any[];
  totalExpenses: number; recentExpenses: any[];
  salesCount: number; revenue: number; isFiscalEnabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const netProfit = revenue - totalExpenses;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 p-8 px-10">
      
      {/* Premium Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Settings size={120} className="animate-spin-slow" />
         </div>
         <div className="relative z-10">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Configuration Centrale</h1>
            <p className="mt-2 text-slate-500 font-medium max-w-lg">Pilotage global de l'établissement : équipe, infrastructure POS et audit financier.</p>
         </div>
         <div className="flex gap-4 relative z-10">
            <Link href="/pos" className="px-6 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2">
               Ouvrir la Caisse <ExternalLink size={14} />
            </Link>
         </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 w-fit">
        {TABS.filter(t => t.id !== 'reports' || isFiscalEnabled).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                isActive 
                  ? `bg-white dark:bg-slate-800 ${tab.color} shadow-lg` 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Content */}
      <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && <OverviewTab store={store} salesCount={salesCount} revenue={revenue} netProfit={netProfit} totalExpenses={totalExpenses} staff={staff} />}
        {activeTab === 'tables' && <TablesTab tables={tables} />}
        {activeTab === 'staff' && <StaffTab staff={staff} />}
        {activeTab === 'expenses' && <ExpensesTab totalExpenses={totalExpenses} recentExpenses={recentExpenses} revenue={revenue} />}
        {activeTab === 'metrics' && <MetricsTab revenue={revenue} salesCount={salesCount} totalExpenses={totalExpenses} />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'terminals' && <TerminalsTab terminals={terminals} />}
      </div>
    </div>
  );
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ store, salesCount, revenue, netProfit, totalExpenses, staff }: any) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIBox label="Revenue" value={revenue} color="indigo" icon={TrendingUp} />
        <KPIBox label="Tickets" value={salesCount} color="sky" icon={Tablet} symbol="cmd" />
        <KPIBox label="Profit" value={netProfit} color={netProfit >= 0 ? 'emerald' : 'rose'} icon={Wallet} />
        <KPIBox label="Expenses" value={totalExpenses} color="amber" icon={CreditCard} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <SectionCard title="Détails Établissement" icon={Building2} action={<Link href="/admin/settings" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Modifier</Link>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <InfoField label="Nom Commercial" value={store.name} icon={Building2} />
                    <InfoField label="Localisation" value={store.city || 'Non défini'} icon={MapPin} />
                 </div>
                 <div className="space-y-6">
                    <InfoField label="Contact" value={store.phone || 'Non renseigné'} icon={Phone} />
                    <InfoField label="Adresse Physique" value={store.address || 'Non définie'} icon={MapPin} />
                 </div>
              </div>
           </SectionCard>
        </div>

        <div className="space-y-8">
           <SectionCard title="Équipe Active" icon={Users} action={<Link href="/admin/staff" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Gérer</Link>}>
              <div className="space-y-4">
                 {staff.slice(0, 5).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all cursor-pointer group">
                       <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-600 text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {(s.name || 'U').charAt(0)}
                       </div>
                       <div className="flex-1">
                          <div className="font-black text-slate-900 dark:text-white text-xs tracking-tight">{s.name || 'Utilisateur'}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{(s.role || '').replace('_', ' ')}</div>
                       </div>
                       <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                 ))}
                 {staff.length === 0 && <p className="text-center py-8 text-xs font-bold text-slate-400 italic">Aucun membre d'équipe</p>}
              </div>
           </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ─── TABLES TAB ─── */
function TablesTab({ tables }: { tables: any[] }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
        <div>
           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Plan de Salle</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Infrastructure des tables et zones de service</p>
        </div>
        <Link href="/admin/tables" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2">
          <LayoutGrid size={14} /> Gérer les Tables
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {tables.map((t: any) => (
          <div key={t.id} className={`p-8 rounded-[32px] text-center border-2 transition-all hover:scale-105 cursor-pointer relative overflow-hidden group ${
            t.status === 'OCCUPIED' 
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-500/30' 
              : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'
          }`}>
            <div className={`text-2xl font-black mb-2 ${t.status === 'OCCUPIED' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
               {t.label || t.name}
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${t.status === 'OCCUPIED' ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
              {t.status === 'OCCUPIED' ? 'Occupée' : 'Libre'}
            </div>
            <div className="mt-4 text-[9px] font-bold text-slate-400 opacity-60 uppercase">{t.capacity || '2'} Places</div>
          </div>
        ))}
        {tables.length === 0 && (
           <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
                 <LayoutGrid size={32} />
              </div>
              <p className="text-sm font-black text-slate-400">Aucune table configurée</p>
           </div>
        )}
      </div>
    </div>
  );
}

/* ─── STAFF TAB ─── */
function StaffTab({ staff }: { staff: any[] }) {
  const roleColors: any = { 
     STORE_OWNER: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-600' }, 
     CASHIER: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-600' }, 
     MANAGER: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-600' } 
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
        <div>
           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Équipe & Accès</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestion des droits et authentification collaborateurs</p>
        </div>
        <Link href="/admin/staff" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2">
          <Users size={14} /> Gérer l'Équipe
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((s: any) => {
           const conf = roleColors[s.role] || { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-600' };
           return (
              <div key={s.id} className="p-8 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                <div className="flex items-center gap-5 mb-8">
                   <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-900 dark:text-white group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {(s.name || 'U').charAt(0)}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{s.name || 'Collaborateur'}</h4>
                      <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 ${conf.bg} ${conf.text} rounded-full text-[9px] font-black uppercase tracking-widest`}>
                         <div className={`w-1.5 h-1.5 ${conf.dot} rounded-full animate-pulse`} />
                         {(s.role || 'STAFF').replace('_', ' ')}
                      </div>
                   </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                   <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Mail size={14} className="text-indigo-600" /> {s.email || 'Pas d\'email'}
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Phone size={14} className="text-indigo-600" /> {s.phone || 'Non renseigné'}
                   </div>
                </div>
              </div>
           );
        })}
      </div>
    </div>
  );
}

/* ─── EXPENSES TAB ─── */
function ExpensesTab({ totalExpenses, recentExpenses, revenue }: any) {
  const margin = revenue > 0 ? ((1 - totalExpenses / revenue) * 100) : 0;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPIBox label="Total Dépenses" value={totalExpenses} color="rose" icon={ArrowUpRight} />
        <KPIBox label="Marge Estimée" value={margin.toFixed(1)} color={margin >= 30 ? 'emerald' : 'amber'} icon={Activity} symbol="%" />
      </div>

      <SectionCard title="Journal des Dépenses" icon={CreditCard} action={<Link href="/admin/expenses" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Tout voir</Link>}>
         <div className="space-y-2">
            {recentExpenses.length === 0 && <p className="text-center py-12 text-xs font-bold text-slate-400 italic">Aucun flux financier enregistré</p>}
            {recentExpenses.slice(0, 10).map((e: any) => (
              <div key={e.id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
                      <ArrowUpRight size={20} />
                   </div>
                   <div>
                      <div className="font-black text-xs text-slate-900 dark:text-white tracking-tight">{e.label || e.description || 'Dépense'}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(e.createdAt).toLocaleDateString('fr-FR')}</div>
                   </div>
                </div>
                <span className="font-black text-rose-500 text-sm">-{Number(e.amount || 0).toFixed(3)} DT</span>
              </div>
            ))}
         </div>
      </SectionCard>
    </div>
  );
}

/* ─── METRICS TAB ─── */
function MetricsTab({ revenue, salesCount, totalExpenses }: any) {
  const avg = salesCount > 0 ? revenue / salesCount : 0;
  const margin = revenue > 0 ? ((1 - totalExpenses / revenue) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIBox label="Panier Moyen" value={avg} color="indigo" icon={Activity} />
        <KPIBox label="Volume Mensuel" value={salesCount} color="sky" icon={Tablet} symbol="cmd" />
        <KPIBox label="CA Réalisé" value={revenue} color="emerald" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SectionCard title="Indicateurs de Santé" icon={Activity}>
            <div className="space-y-6">
               <MetricRow label="Taux de Marge" value={`${margin.toFixed(1)} %`} sub="Cible: > 60%" />
               <MetricRow label="Charge / Vente" value={`${salesCount > 0 ? (totalExpenses / salesCount).toFixed(3) : 0} DT`} sub="Coût par ticket" />
               <MetricRow label="Projection Journalière" value={`${(revenue / 30).toFixed(3)} DT`} sub="Basé sur 30 jours" />
            </div>
         </SectionCard>
         <div className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-600/30 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-700 group-hover:scale-110 transition-transform duration-700 opacity-50" />
            <div className="relative z-10 space-y-6">
               <BarChart3 size={64} className="mx-auto opacity-40" />
               <h3 className="text-2xl font-black tracking-tight">Analyse Approfondie</h3>
               <p className="text-sm font-medium text-indigo-100 max-w-[200px] mx-auto opacity-70">Accédez aux graphiques détaillés et rapports de performance.</p>
               <Link href="/admin/metrics" className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                  Ouvrir Analytics
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}

/* ─── REPORTS TAB ─── */
function ReportsTab() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[48px] p-16 text-center border border-slate-100 dark:border-slate-800 shadow-2xl space-y-10">
         <div className="w-24 h-24 bg-violet-50 dark:bg-violet-500/10 rounded-[32px] flex items-center justify-center text-violet-600 mx-auto shadow-inner">
            <FileText size={48} />
         </div>
         <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Rapports Z (NACEF)</h2>
            <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto text-sm">
               Consultez et générez vos rapports Z conformes à la réglementation NACEF. Clôturez vos journées comptables et exportez les données fiscales en un clic.
            </p>
         </div>
         <Link href="/admin/reports" className="inline-flex items-center gap-3 px-10 py-5 bg-violet-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-violet-500 shadow-2xl shadow-violet-600/20 transition-all hover:scale-105">
            Accéder aux Rapports Z <ChevronRight size={18} />
         </Link>
      </div>
    </div>
  );
}

/* ─── TERMINALS TAB ─── */
function TerminalsTab({ terminals }: { terminals: any[] }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
        <div>
           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Terminaux POS</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestion des points de vente physiques synchronisés</p>
        </div>
        <Link href="/admin/terminals" className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 transition-all flex items-center gap-2">
          <Tablet size={14} /> Gérer les Terminaux
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terminals.map((t: any) => (
          <div key={t.id} className="p-8 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-teal-400 transition-all">
            <div className="flex justify-between items-start mb-10">
               <div className="w-16 h-16 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                  <Tablet size={28} />
               </div>
               <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  t.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
               }`}>
                  {t.isActive ? 'Connecté' : 'Hors-ligne'}
               </div>
            </div>
            <div className="space-y-1">
               <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{t.name || 'Terminal POS'}</h4>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Paring Code: {t.pairingCode || '—'}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">ID: {t.id.slice(-8)}</span>
               <Link href={`/admin/terminals/${t.id}`} className="p-2 text-slate-300 hover:text-teal-600 transition-colors">
                  <QrCode size={18} />
               </Link>
            </div>
          </div>
        ))}
        {terminals.length === 0 && (
           <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-sm font-black text-slate-400">Aucun terminal enregistré</p>
           </div>
        )}
      </div>
    </div>
  );
}

/* ─── REUSABLE COMPONENTS ─── */
function KPIBox({ label, value, color, icon: Icon, symbol = 'DT' }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className={`p-8 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group`}>
      <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500 ${c.split(' ')[1]}`}>
         <Icon size={120} />
      </div>
      <div className="relative z-10">
         <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">{label}</div>
         <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
               {typeof value === 'number' ? value.toFixed(value < 100 ? 1 : 0) : value}
            </span>
            <span className={`text-sm font-black mb-1 opacity-60`}>{symbol}</span>
         </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
               <Icon size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
         </div>
         {action}
      </div>
      <div className="p-10">
         {children}
      </div>
    </div>
  );
}

function InfoField({ label, value, icon: Icon }: any) {
  return (
    <div className="flex gap-4">
       <div className="mt-1 w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-300">
          <Icon size={14} />
       </div>
       <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
          <div className="font-black text-slate-700 dark:text-slate-200 text-sm">{value}</div>
       </div>
    </div>
  );
}

function MetricRow({ label, value, sub }: any) {
  return (
    <div className="flex justify-between items-center group">
       <div>
          <div className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{label}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sub}</div>
       </div>
       <div className="text-lg font-black text-indigo-600 group-hover:scale-110 transition-transform">{value}</div>
    </div>
  );
}
