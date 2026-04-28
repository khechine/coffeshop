'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Tablet, ShieldCheck, Clock, RefreshCw, 
  Trash2, ChevronRight, CheckCircle2, AlertCircle,
  Smartphone, QrCode, Lock, Zap
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateTerminalCodeAction, deleteTerminalAction } from '../../../actions';
import { useRouter } from 'next/navigation';

export default function TerminalDetailClient({ terminal }: { terminal: any }) {
  const [isPending, startTransition] = useTransition();
  const [pairingCode, setPairingCode] = useState(terminal.activationCode || '');
  const router = useRouter();

  const handleGenerateCode = () => {
    startTransition(async () => {
      try {
        const code = await generateTerminalCodeAction(terminal.id);
        setPairingCode(code);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce terminal ?')) return;
    startTransition(async () => {
      await deleteTerminalAction(terminal.id);
      router.push('/admin/terminals');
    });
  };

  const isActive = terminal.status === 'ACTIVE';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <Link href="/admin/configuration" className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
            <ArrowLeft size={14} /> Retour à la configuration
          </Link>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-teal-600 border border-slate-100 dark:border-slate-800 shadow-sm">
                <Tablet size={24} />
             </div>
             <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{terminal.nickname}</h1>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleDelete}
            disabled={isPending}
            className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all"
            title="Supprimer le terminal"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Status & QR Code */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest ${
              isActive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isActive ? 'Connecté' : 'En attente de couplage'}
            </div>

            <div className="flex flex-col gap-8">
               <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isActive ? 'Terminal Actif' : 'Couplage requis'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                    {isActive 
                      ? 'Ce terminal est correctement synchronisé avec votre établissement et prêt à encaisser.'
                      : 'Suivez les instructions ci-dessous pour lier cet appareil physique à votre compte CoffeeShop.'}
                  </p>
               </div>

               {!isActive && (
                 <div className="flex flex-col md:flex-row gap-10 items-center bg-slate-50 dark:bg-slate-950 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-inner">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-indigo-600/10">
                       {pairingCode ? (
                         <QRCodeSVG 
                            value={pairingCode} 
                            size={180} 
                            level="H"
                            includeMargin={false}
                         />
                       ) : (
                         <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <QrCode size={48} className="text-slate-300" />
                         </div>
                       )}
                    </div>
                    <div className="flex-1 space-y-6 text-center md:text-left">
                       <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Code d'activation</div>
                          <div className="text-5xl font-black text-indigo-600 tracking-tighter">
                             {pairingCode || '------'}
                          </div>
                       </div>
                       <button 
                         onClick={handleGenerateCode}
                         disabled={isPending}
                         className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2 mx-auto md:mx-0"
                       >
                         <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} /> 
                         {pairingCode ? 'Regénérer le code' : 'Générer un code'}
                       </button>
                    </div>
                 </div>
               )}

               {isActive && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatusFeature icon={ShieldCheck} title="Sécurisé" desc="Chiffrement de bout-en-bout" color="indigo" />
                    <StatusFeature icon={Zap} title="Temps Réel" desc="Sync instantanée des stocks" color="amber" />
                    <StatusFeature icon={CheckCircle2} title="Certifié" desc="Conforme aux normes fiscales" color="emerald" />
                    <StatusFeature icon={Smartphone} title="Mobile" desc="Optimisé pour tablettes & TPE" color="sky" />
                 </div>
               )}
            </div>
          </div>

          {/* Instructions Card (Only if Inactive) */}
          {!isActive && (
            <div className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-600/30 overflow-hidden relative">
               <div className="absolute -right-20 -bottom-20 opacity-10">
                  <Smartphone size={300} />
               </div>
               <div className="relative z-10 space-y-8">
                  <h3 className="text-2xl font-black tracking-tight">Comment coupler ?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <Step number="1" text="Installez l'application CoffeeShop POS sur votre tablette." />
                     <Step number="2" text="Ouvrez l'application et choisissez 'Coupler un terminal'." />
                     <Step number="3" text="Scannez le QR Code ou saisissez le code à 6 chiffres." />
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata */}
        <div className="space-y-8">
           <SectionBox title="Détails Techniques">
              <div className="space-y-6">
                 <MetaItem label="ID Unique" value={terminal.id.slice(-12)} icon={Lock} />
                 <MetaItem label="Créé le" value={new Date(terminal.createdAt).toLocaleDateString('fr-FR')} icon={Clock} />
                 <MetaItem label="Dernière Activité" value={terminal.lastUsedAt ? new Date(terminal.lastUsedAt).toLocaleString('fr-FR') : 'Jamais'} icon={Activity} />
                 <MetaItem label="Boutique" value={terminal.store?.name} icon={Building2} />
              </div>
           </SectionBox>

           <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mx-auto shadow-sm">
                 <AlertCircle size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                 Besoin d'aide ? <br />
                 <span className="text-indigo-600 cursor-pointer hover:underline">Consulter le centre d'assistance</span>
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatusFeature({ icon: Icon, title, desc, color }: any) {
  const colors: any = {
    indigo: 'text-indigo-600 bg-indigo-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    sky: 'text-sky-600 bg-sky-50'
  };
  return (
    <div className="flex gap-4 p-6 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-100">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${colors[color]}`}>
          <Icon size={20} />
       </div>
       <div>
          <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{title}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{desc}</div>
       </div>
    </div>
  );
}

function Step({ number, text }: { number: string, text: string }) {
  return (
    <div className="flex flex-col gap-4">
       <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg border border-white/30">
          {number}
       </div>
       <p className="text-sm font-bold leading-relaxed opacity-90">{text}</p>
    </div>
  );
}

function SectionBox({ title, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
       <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-50 dark:border-slate-800">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</h3>
       </div>
       <div className="p-8">
          {children}
       </div>
    </div>
  );
}

function MetaItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex gap-4">
       <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-300">
          <Icon size={14} />
       </div>
       <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</div>
          <div className="font-black text-slate-700 dark:text-slate-200 text-xs truncate uppercase tracking-tight">{value}</div>
       </div>
    </div>
  );
}

function Building2(props: any) { return <Smartphone {...props} /> } // Just a proxy for Building icon if missing
function Activity(props: any) { return <RefreshCw {...props} /> } // Proxy for Activity icon
