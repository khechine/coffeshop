'use client';

import React, { useState } from 'react';
import { Coffee, Mail, Lock, User, Store as StoreIcon, MapPin, CheckCircle, FileUp, ShieldCheck, ArrowRight, Building2, Truck, Star, Briefcase, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { registerStoreAction, registerVendorAction } from '../actions';

export default function RegisterPage() {
  const [step, setStep] = useState(0); // 0 = Role Selection, 1 = Personal Info, 2 = Biz Info, 3 = Success
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    companyName: '', // For vendor
    address: '',
    city: '',
    phone: '',
    rne: '',
    cin: '',
    description: '', // For vendor
    role: 'STORE_OWNER' as 'STORE_OWNER' | 'VENDOR',
    subdomain: ''
  });

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleStoreNameChange = (val: string) => {
    setForm(prev => ({ 
      ...prev, 
      storeName: val, 
      subdomain: prev.role === 'STORE_OWNER' ? slugify(val) : prev.subdomain 
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.role === 'STORE_OWNER') {
        await registerStoreAction(form);
      } else {
        await registerVendorAction({
          ...form,
          companyName: form.companyName || form.storeName
        });
      }
      setStep(3);
    } catch (err: any) {
      alert("Erreur: " + (err.message || "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm";
  const labelClass = "block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-[0.1em]";

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      
      {/* Left side: Animated Brand / Info */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-center p-20 bg-indigo-950 text-white overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
         
         <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-4 mb-16">
               <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Coffee size={32} className="text-white" />
               </div>
               <span className="text-3xl font-black tracking-tight">CoffeeSaaS <span className="text-indigo-400">B2B</span></span>
            </div>

            <div className="space-y-8">
               <h1 className="text-6xl font-black leading-[1.1] tracking-tighter">
                  {form.role === 'STORE_OWNER' ? 'Propulsez votre établissement.' : 'Devenez partenaire fournisseur.'}
               </h1>
               <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  {form.role === 'STORE_OWNER' 
                    ? 'Rejoignez l\'écosystème leader pour la gestion de café en Tunisie. Caisse, stock et approvisionnement centralisés.'
                    : 'Élargissez votre réseau de distribution. Vendez directement aux meilleurs cafés et restaurants du pays.'}
               </p>

               <div className="grid grid-cols-1 gap-6 pt-4">
                  {(form.role === 'STORE_OWNER' ? [
                    "Caisse tactile intelligente",
                    "Gestion de stock en temps réel",
                    "Marketplace fournisseurs intégré",
                    "Analyses et rapports détaillés"
                  ] : [
                    "Visibilité auprès de 200+ cafés",
                    "Gestion des commandes simplifiée",
                    "Paiements et facturation automatisés",
                    "Statistiques de vente avancées"
                  ]).map((text, i) => (
                    <div key={i} className="flex items-center gap-4 text-lg text-slate-200 font-bold group">
                       <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CheckCircle size={18} />
                       </div>
                       {text}
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="absolute bottom-12 left-20 flex items-center gap-4">
            <div className="flex -space-x-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full bg-indigo-800 border-2 border-indigo-950 flex items-center justify-center text-xs shadow-lg">
                   <User size={16} />
                 </div>
               ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
              </div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">4.9/5 par nos partenaires</span>
            </div>
         </div>
      </div>

      {/* Right side: Registration Form */}
      <div className="w-full lg:w-[700px] bg-white flex items-center justify-center p-8 md:p-16 relative overflow-y-auto">
         <div className="w-full max-w-md">
            
            {/* Step 0: Choose Path */}
            {step === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-12">
                   <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Bienvenue !</h2>
                   <p className="text-slate-500 font-medium">Choisissez le type de compte qui vous correspond.</p>
                </div>
                
                <div className="space-y-4">
                   <button 
                    onClick={() => { setForm({...form, role: 'STORE_OWNER'}); setStep(1); }} 
                    className="w-full p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300 group text-left flex items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
                   >
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <StoreIcon size={32} />
                      </div>
                      <div className="flex-1">
                         <div className="font-black text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">Café / Restaurant</div>
                         <div className="text-sm text-slate-500 font-medium">Gérer ma caisse et mes stocks</div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                   </button>

                   <button 
                    onClick={() => { setForm({...form, role: 'VENDOR'}); setStep(1); }} 
                    className="w-full p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all duration-300 group text-left flex items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5"
                   >
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Truck size={32} />
                      </div>
                      <div className="flex-1">
                         <div className="font-black text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">Fournisseur B2B</div>
                         <div className="text-sm text-slate-500 font-medium">Vendre aux établissements</div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                   </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                   <p className="text-sm text-slate-500 font-medium">
                     Déjà inscrit ? <Link href="/login" className="text-indigo-600 font-black hover:text-indigo-700 transition-colors">Connectez-vous ici</Link>
                   </p>
                </div>
              </div>
            )}

            {/* Step 1: Account Info */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-10">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
                     Étape 1 sur 2
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Informations de connexion</h2>
                   <p className="text-slate-500 font-medium mt-1">Créez votre accès administrateur.</p>
                </div>

                <div className="space-y-5">
                   <div>
                      <label className={labelClass}>Votre Nom Complet</label>
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className={`${inputClass} pl-12`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Sami Ben Ahmed" required />
                      </div>
                   </div>
                   <div>
                      <label className={labelClass}>Email Professionnel</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" className={`${inputClass} pl-12`} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="sami@entreprise.tn" required />
                      </div>
                   </div>
                   <div>
                      <label className={labelClass}>Mot de passe</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className={`${inputClass} pl-12 pr-12`} 
                          value={form.password} 
                          onChange={e => setForm({...form, password: e.target.value})} 
                          placeholder="••••••••" 
                          required 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                   </div>
                   
                   <div className="pt-4 flex flex-col gap-3">
                     <button 
                      onClick={() => setStep(2)} 
                      disabled={!form.email || !form.password || !form.name} 
                      className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none uppercase tracking-widest"
                     >
                       Suivant <ArrowRight size={18} />
                     </button>
                     <button onClick={() => setStep(0)} className="w-full py-4 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors uppercase tracking-widest">
                       Modifier le type de compte
                     </button>
                   </div>
                </div>
              </div>
            )}

            {/* Step 2: Biz Info */}
            {step === 2 && (
              <form onSubmit={handleRegister} className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-10">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
                     Étape 2 sur 2
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                     {form.role === 'STORE_OWNER' ? 'Votre Établissement' : 'Votre Entreprise'}
                   </h2>
                   <p className="text-slate-500 font-medium mt-1">Détails pour la vérification de votre compte.</p>
                </div>

                <div className="space-y-5">
                   <div>
                      <label className={labelClass}>
                        {form.role === 'STORE_OWNER' ? 'Nom du Café / Restaurant' : 'Nom de l\'entreprise (Grossiste)'}
                      </label>
                      <div className="relative">
                        {form.role === 'STORE_OWNER' ? <StoreIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /> : <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
                        <input 
                          className={`${inputClass} pl-12`} 
                          value={form.role === 'STORE_OWNER' ? form.storeName : form.companyName} 
                          onChange={e => {
                            if (form.role === 'STORE_OWNER') handleStoreNameChange(e.target.value);
                            else setForm({...form, companyName: e.target.value});
                          }} 
                          placeholder={form.role === 'STORE_OWNER' ? "ex: L'Artisan Coffee" : "ex: Distribution Ben Ahmed"} 
                          required 
                        />
                      </div>
                   </div>

                   {form.role === 'STORE_OWNER' && (
                     <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                        <label className={labelClass}>Votre Adresse Web (Sous-domaine)</label>
                        <div className="relative group">
                          <input 
                            className={`${inputClass} font-mono text-xs`} 
                            value={form.subdomain} 
                            onChange={e => setForm({...form, subdomain: slugify(e.target.value)})} 
                            placeholder="mon-cafe" 
                            required 
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden md:block">
                            .coffeeshop.tn
                          </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium">Votre tableau de bord sera accessible via <span className="text-indigo-600 font-bold">{form.subdomain || 'votre-nom'}.coffeeshop.tn</span></p>
                     </div>
                   )}

                   {form.role === 'VENDOR' && (
                     <div>
                        <label className={labelClass}>Brève description de votre activité</label>
                        <textarea 
                          className={`${inputClass} min-h-[80px] resize-none py-3`} 
                          value={form.description} 
                          onChange={e => setForm({...form, description: e.target.value})} 
                          placeholder="ex: Importateur de café italien et accessoires baristas..." 
                          required 
                        />
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Gouvernorat / Ville</label>
                        <input className={inputClass} value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Tunis" required />
                      </div>
                      <div>
                        <label className={labelClass}>Téléphone</label>
                        <input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+216 ..." required />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Identifiant RNE</label>
                        <input className={inputClass} value={form.rne} onChange={e => setForm({...form, rne: e.target.value})} placeholder="1234567M" required />
                      </div>
                      <div>
                        <label className={labelClass}>Numéro de CIN</label>
                        <input className={inputClass} value={form.cin} onChange={e => setForm({...form, cin: e.target.value})} placeholder="01234567" required />
                      </div>
                   </div>

                   {form.role === 'STORE_OWNER' && (
                     <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                          <Star size={20} fill="currentColor" />
                        </div>
                        <div>
                           <div className="text-sm font-black text-blue-900">30 Jours d'Essai Gratuit</div>
                           <div className="text-xs text-blue-700/70 font-medium leading-relaxed mt-0.5">Accès complet à toutes les fonctionnalités sans engagement.</div>
                        </div>
                     </div>
                   )}

                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs hover:bg-slate-50 transition-all uppercase tracking-widest">Retour</button>
                      <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 uppercase tracking-widest">
                        {loading ? 'Traitement...' : 'Terminer'}
                      </button>
                   </div>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="text-center animate-in zoom-in-95 duration-500">
                 <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircle size={56} />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Félicitations !</h2>
                 <p className="text-slate-500 font-medium leading-relaxed mb-10">
                   {form.role === 'STORE_OWNER' 
                    ? "Votre espace café est en cours de préparation. Un email de confirmation a été envoyé à votre adresse."
                    : "Votre demande de compte fournisseur a été reçue. Notre équipe vous contactera sous 24h pour la validation."}
                 </p>
                 <Link href="/login" className="block w-full py-5 rounded-[24px] bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/30 uppercase tracking-widest">
                   Accéder à mon compte
                 </Link>
              </div>
            )}

         </div>
      </div>
    </div>
  );
}
