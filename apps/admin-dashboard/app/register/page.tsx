'use client';

import React, { useState } from 'react';
import { Cake, Mail, Lock, User, Store as StoreIcon, MapPin, CheckCircle, FileUp, ShieldCheck, ArrowRight, Building2, Truck, Star, Briefcase, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { registerStoreAction, registerVendorAction, checkSubdomainAvailability, checkEmailAvailability } from '../actions';
import { useEffect, useCallback } from 'react';
function debounce(fn: Function, delay: number) {
  let timeoutId: any;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

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
    subdomain: '',
    industry: 'COFFEE_SHOP' as 'COFFEE_SHOP' | 'BAKERY' | 'PASTRY_SHOP' | 'PASTRY_PRO',
    businessType: 'STORE' as 'STORE' | 'INDEPENDENT'
  });

  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'forbidden'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [officialDocs, setOfficialDocs] = useState<{
    rne: { base64: string; name: string } | null;
    cin: { base64: string; name: string } | null;
  }>({ rne: null, cin: null });

  // Debounced subdomain check
  const checkAvailability = useCallback(
    debounce(async (sub: string) => {
      if (sub.length < 3) {
        setSubdomainStatus('idle');
        return;
      }
      setSubdomainStatus('checking');
      try {
        const res = await checkSubdomainAvailability(sub);
        if (res.forbidden) setSubdomainStatus('forbidden');
        else setSubdomainStatus(res.available ? 'available' : 'taken');
      } catch (err) {
        setSubdomainStatus('idle');
      }
    }, 500),
    []
  );

  // Debounced email check
  const checkEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        setEmailStatus('idle');
        return;
      }
      setEmailStatus('checking');
      try {
        const res = await checkEmailAvailability(email);
        if (res && typeof res.available === 'boolean') {
          setEmailStatus(res.available ? 'available' : 'taken');
        } else {
          setEmailStatus('idle');
        }
      } catch (err) {
        console.error('Email check error:', err);
        setEmailStatus('idle');
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (form.role === 'STORE_OWNER' && form.subdomain) {
      checkAvailability(form.subdomain);
    }
  }, [form.subdomain, form.role, checkAvailability]);

  useEffect(() => {
    if (form.email) {
      checkEmail(form.email);
    }
  }, [form.email, checkEmail]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'rne' | 'cin') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOfficialDocs(prev => ({
          ...prev,
          [type]: { base64: reader.result as string, name: file.name }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (!form.phone || form.phone.trim().length < 8) {
      alert("Le numéro de téléphone mobile est obligatoire et doit contenir au moins 8 chiffres.");
      return;
    }
    if (form.role === 'STORE_OWNER' && (subdomainStatus === 'taken' || subdomainStatus === 'forbidden')) {
      alert(subdomainStatus === 'forbidden' ? "Ce sous-domaine est réservé." : "Ce sous-domaine est déjà utilisé.");
      return;
    }
    if (emailStatus === 'taken') {
      alert("Cet email est déjà utilisé par un autre compte.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        officialDocs
      };

      if (form.role === 'STORE_OWNER') {
        await registerStoreAction(payload);
      } else {
        await registerVendorAction({
          ...payload,
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
                  <Cake size={32} className="text-white" />
               </div>
               <span className="text-3xl font-black tracking-tight">ElKassa Patisserie <span className="text-indigo-400">B2B</span></span>
            </div>

            <div className="space-y-8">
               <h1 className="text-6xl font-black leading-[1.1] tracking-tighter">
                  {form.role === 'STORE_OWNER' ? 'Propulsez votre établissement.' : 'Devenez partenaire fournisseur.'}
               </h1>
               <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  {form.role === 'STORE_OWNER' 
                    ? 'Rejoignez l\'écosystème leader pour la gestion de pâtisserie en Tunisie. Caisse, stock et approvisionnement centralisés.'
                    : 'Élargissez votre réseau de distribution. Vendez directement aux meilleures pâtisseries et commerces du pays.'}
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
                    onClick={() => { setForm({...form, role: 'STORE_OWNER', industry: 'COFFEE_SHOP', businessType: 'STORE'}); setStep(1); }} 
                    className="w-full p-5 rounded-3xl border-2 border-slate-100 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300 group text-left flex items-center gap-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
                   >
                      <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Cake size={28} />
                      </div>
                      <div className="flex-1">
                         <div className="font-black text-base text-slate-900 group-hover:text-indigo-600 transition-colors">Café / Restaurant</div>
                         <div className="text-xs text-slate-500 font-medium">Gestion caisse, stocks & marketplace</div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                   </button>

                   <button 
                    onClick={() => { setForm({...form, role: 'STORE_OWNER', industry: 'BAKERY', businessType: 'STORE'}); setStep(1); }} 
                    className="w-full p-5 rounded-3xl border-2 border-slate-100 bg-white hover:border-amber-500 hover:bg-amber-50/30 transition-all duration-300 group text-left flex items-center gap-5 shadow-sm hover:shadow-xl hover:shadow-amber-500/5"
                   >
                      <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <StoreIcon size={28} />
                      </div>
                      <div className="flex-1">
                         <div className="font-black text-base text-slate-900 group-hover:text-amber-600 transition-colors">Boulangerie / Pâtisserie</div>
                         <div className="text-xs text-slate-500 font-medium">Standard + Planning de production</div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                   </button>

                   <button 
                    onClick={() => { setForm({...form, role: 'STORE_OWNER', industry: 'PASTRY_PRO', businessType: 'INDEPENDENT'}); setStep(1); }} 
                    className="w-full p-5 rounded-3xl border-2 border-slate-100 bg-white hover:border-purple-500 hover:bg-purple-50/30 transition-all duration-300 group text-left flex items-center gap-5 shadow-sm hover:shadow-xl hover:shadow-purple-500/5"
                   >
                      <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Briefcase size={28} />
                      </div>
                      <div className="flex-1">
                         <div className="font-black text-base text-slate-900 group-hover:text-purple-600 transition-colors">Professionnel Pâtissier</div>
                         <div className="text-xs text-slate-500 font-medium">Marketplace + Gestion Commandes Pro</div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                   </button>

                   <button 
                    onClick={() => { setForm({...form, role: 'VENDOR'}); setStep(1); }} 
                    className="w-full p-5 rounded-3xl border-2 border-slate-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all duration-300 group text-left flex items-center gap-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5"
                   >
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Truck size={28} />
                      </div>
                      <div className="flex-1">
                         <div className="font-black text-base text-slate-900 group-hover:text-emerald-600 transition-colors">Fournisseur B2B</div>
                         <div className="text-xs text-slate-500 font-medium">Vendre aux établissements</div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
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
                         <input type="email" className={`${inputClass} pl-12 ${emailStatus === 'taken' ? 'border-rose-500 ring-4 ring-rose-500/10' : emailStatus === 'available' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : ''}`} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="sami@entreprise.tn" required />
                         <div className="absolute right-3 top-1/2 -translate-y-1/2">
                           {emailStatus === 'checking' && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
                           {emailStatus === 'available' && <CheckCircle size={16} className="text-emerald-500" />}
                           {emailStatus === 'taken' && <span className="text-[10px] font-black text-rose-500 uppercase">Déjà utilisé</span>}
                         </div>
                       </div>
                       {emailStatus === 'taken' && <p className="text-[11px] text-rose-500 mt-1 font-medium">Cet email est déjà utilisé par un autre compte.</p>}
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
                       onClick={() => {
                         if (emailStatus === 'taken') {
                           alert("Cet email est déjà utilisé. Veuillez en choisir un autre.");
                           return;
                         }
                         if (emailStatus === 'checking') {
                           alert("Veuillez patienter pendant la vérification de l'email.");
                           return;
                         }
                         setStep(2);
                       }} 
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
                            className={`${inputClass} font-mono text-xs ${
                              subdomainStatus === 'available' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 
                              (subdomainStatus === 'taken' || subdomainStatus === 'forbidden') ? 'border-rose-500 ring-4 ring-rose-500/10' : ''
                            }`} 
                            value={form.subdomain} 
                            onChange={e => setForm({...form, subdomain: slugify(e.target.value)})} 
                            placeholder="mon-cafe" 
                            required 
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {subdomainStatus === 'checking' && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
                            {subdomainStatus === 'available' && <CheckCircle size={16} className="text-emerald-500" />}
                            {(subdomainStatus === 'taken' || subdomainStatus === 'forbidden') && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{subdomainStatus === 'forbidden' ? 'Interdit' : 'Déjà pris'}</span>}
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden md:block border-l border-slate-100 pl-3 ml-1">
                              .elkassa.com
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium italic">
                          {subdomainStatus === 'taken' && "Désolé, ce nom est déjà réservé. Essayez une variante."}
                          {subdomainStatus === 'forbidden' && "Désolé, ce nom est réservé par le système."}
                          {subdomainStatus === 'available' && "Super ! Ce sous-domaine est disponible."}
                          {(subdomainStatus === 'idle' || subdomainStatus === 'checking') && (
                            <>
                              Votre tableau de bord sera accessible via <span className="text-indigo-600 font-black not-italic">{form.subdomain || 'votre-nom'}.elkassa.com</span>
                            </>
                          )}
                        </p>
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
                        <select 
                           className={`${inputClass} cursor-pointer bg-white`} 
                           value={form.city} 
                           onChange={e => setForm({...form, city: e.target.value})} 
                           required
                         >
                           <option value="">Sélectionnez votre ville</option>
                           <optgroup label="Tunis">
                             <option value="Tunis">Tunis</option>
                             <option value="Marsa">Marsa</option>
                             <option value="Carthage">Carthage</option>
                             <option value="Sidi Bou Saïd">Sidi Bou Saïd</option>
                             <option value="Kram">Kram</option>
                             <option value="Bardo">Bardo</option>
                             <option value="La Kasbah (Tunis)">La Kasbah (Tunis)</option>
                             <option value="La Goulette">La Goulette</option>
                             <option value="Sidi Hassine">Sidi Hassine</option>
                           </optgroup>
                           <optgroup label="Ariana">
                             <option value="Ariana">Ariana</option>
                             <option value="Soukra">Soukra</option>
                             <option value="Raoued">Raoued</option>
                             <option value="Sidi Thabet">Sidi Thabet</option>
                             <option value="Kalaat El Andalous">Kalaat El Andalous</option>
                             <option value="Ettadhamen / Mnihla">Ettadhamen / Mnihla</option>
                           </optgroup>
                           <optgroup label="Manouba">
                             <option value="Manouba">Manouba</option>
                             <option value="Den Den">Den Den</option>
                             <option value="Douar Hicher">Douar Hicher</option>
                             <option value="Oued Ellil">Oued Ellil</option>
                             <option value="Jedaida">Jedaida</option>
                             <option value="Tebourba">Tebourba</option>
                             <option value="El Battan">El Battan</option>
                             <option value="Borj El Amri">Borj El Amri</option>
                             <option value="Mornaguia">Mornaguia</option>
                           </optgroup>
                           <optgroup label="Ben Arous">
                             <option value="Ben Arous">Ben Arous</option>
                             <option value="El Mourouj">El Mourouj</option>
                             <option value="Megrine">Megrine</option>
                             <option value="Radès">Radès</option>
                             <option value="Hammam Lif">Hammam Lif</option>
                             <option value="Hammam Chott">Hammam Chott</option>
                             <option value="Ezzahra">Ezzahra</option>
                             <option value="Mornag">Mornag</option>
                             <option value="Boumhel">Boumhel</option>
                             <option value="Mohamedia / Fouchana">Mohamedia / Fouchana</option>
                             <option value="Khalidia">Khalidia</option>
                           </optgroup>
                           <optgroup label="Nabeul">
                             <option value="Nabeul">Nabeul</option>
                             <option value="Dar Chaabane">Dar Chaabane</option>
                             <option value="Béni Khiar">Béni Khiar</option>
                             <option value="Somaa">Somaa</option>
                             <option value="Maamoura">Maamoura</option>
                             <option value="Tazarka">Tazarka</option>
                             <option value="Korba">Korba</option>
                             <option value="Mida">Mida</option>
                             <option value="Menzel Horr">Menzel Horr</option>
                             <option value="Menzel Temime">Menzel Temime</option>
                             <option value="Kelibia">Kelibia</option>
                             <option value="Azmour">Azmour</option>
                             <option value="Hammam Khezaz">Hammam Khezaz</option>
                             <option value="Dar Allouch">Dar Allouch</option>
                             <option value="El Haouaria">El Haouaria</option>
                             <option value="Takelsa">Takelsa</option>
                             <option value="Korbous">Korbous</option>
                             <option value="Soliman">Soliman</option>
                             <option value="Menzel Bouzelfa">Menzel Bouzelfa</option>
                             <option value="Béni Khalled">Béni Khalled</option>
                             <option value="Zaouiet Jedidi">Zaouiet Jedidi</option>
                             <option value="Grombalia">Grombalia</option>
                             <option value="Bouargoub">Bouargoub</option>
                             <option value="Hammamet">Hammamet</option>
                           </optgroup>
                           <optgroup label="Bizerte">
                             <option value="Bizerte">Bizerte</option>
                             <option value="Mateur">Mateur</option>
                             <option value="Menzel Bourguiba">Menzel Bourguiba</option>
                             <option value="Sejnane">Sejnane</option>
                             <option value="Ras Jebel">Ras Jebel</option>
                             <option value="Al Alia">Al Alia</option>
                             <option value="Rafraf">Rafraf</option>
                             <option value="Metline">Metline</option>
                             <option value="Ghar El Melh">Ghar El Melh</option>
                             <option value="Aousja">Aousja</option>
                             <option value="Menzel Jemil">Menzel Jemil</option>
                             <option value="Menzel Abderrahmane">Menzel Abderrahmane</option>
                             <option value="Tinja">Tinja</option>
                           </optgroup>
                           <optgroup label="Zaghouan">
                             <option value="Zaghouan">Zaghouan</option>
                             <option value="El Fahs">El Fahs</option>
                             <option value="Zriba">Zriba</option>
                             <option value="Bir Mcherga">Bir Mcherga</option>
                             <option value="Nadhour">Nadhour</option>
                             <option value="Jebel Oust">Jebel Oust</option>
                           </optgroup>
                           <optgroup label="Sousse">
                             <option value="Sousse">Sousse</option>
                             <option value="Hammam Sousse">Hammam Sousse</option>
                             <option value="Msaken">Msaken</option>
                             <option value="Kalaa Kebira">Kalaa Kebira</option>
                             <option value="Kalaa Seghira">Kalaa Seghira</option>
                             <option value="Akouda">Akouda</option>
                             <option value="Bouficha">Bouficha</option>
                             <option value="Enfidha">Enfidha</option>
                             <option value="Sidi Bou Ali">Sidi Bou Ali</option>
                             <option value="Messaadine">Messaadine</option>
                             <option value="Zaouia Sousse">Zaouia Sousse</option>
                             <option value="Hergla">Hergla</option>
                             <option value="Ezzouhour">Ezzouhour</option>
                             <option value="Ksibet Sousse">Ksibet Sousse</option>
                             <option value="Sidi El Heni">Sidi El Heni</option>
                             <option value="Kondar">Kondar</option>
                           </optgroup>
                           <optgroup label="Monastir">
                             <option value="Bekalta">Bekalta</option>
                             <option value="Bouhjar">Bouhjar</option>
                             <option value="Lamta">Lamta</option>
                             <option value="Moknine">Moknine</option>
                             <option value="Ksar Hellal">Ksar Hellal</option>
                             <option value="Menzel Hayet">Menzel Hayet</option>
                             <option value="Sahline">Sahline</option>
                             <option value="Jemmal">Jemmal</option>
                             <option value="Bembla">Bembla</option>
                             <option value="Beni Hassen">Beni Hassen</option>
                             <option value="Menzel Kamel">Menzel Kamel</option>
                             <option value="Menzel Ennour">Menzel Ennour</option>
                             <option value="Menzel Fersi">Menzel Fersi</option>
                             <option value="Monastir">Monastir</option>
                             <option value="Khniss">Khniss</option>
                             <option value="Ouerdanine">Ouerdanine</option>
                             <option value="Teboulba">Teboulba</option>
                             <option value="Sayada">Sayada</option>
                             <option value="Zeramdine">Zeramdine</option>
                           </optgroup>
                           <optgroup label="Mahdia">
                             <option value="Mahdia">Mahdia</option>
                             <option value="Rejiche">Rejiche</option>
                             <option value="Ksour Essef">Ksour Essef</option>
                             <option value="El Bradâa">El Bradâa</option>
                             <option value="Sidi Alouane">Sidi Alouane</option>
                             <option value="El Jem">El Jem</option>
                             <option value="Boumerdes">Boumerdes</option>
                             <option value="Chebba">Chebba</option>
                             <option value="Melloulèche">Melloulèche</option>
                             <option value="Souassi">Souassi</option>
                             <option value="Chorbane">Chorbane</option>
                             <option value="Hbira">Hbira</option>
                           </optgroup>
                           <optgroup label="Sfax">
                             <option value="Sfax">Sfax</option>
                             <option value="Sakiet Ezzit">Sakiet Ezzit</option>
                             <option value="Sakiet Eddaier">Sakiet Eddaier</option>
                             <option value="El Ain">El Ain</option>
                             <option value="Thyna">Thyna</option>
                             <option value="Gremda">Gremda</option>
                             <option value="El Hencha">El Hencha</option>
                             <option value="Jebiniana">Jebiniana</option>
                             <option value="Skhira">Skhira</option>
                             <option value="Mahres">Mahres</option>
                             <option value="Agareb">Agareb</option>
                             <option value="Bir Ali Ben Khalifa">Bir Ali Ben Khalifa</option>
                             <option value="Kerkennah">Kerkennah</option>
                           </optgroup>
                           <optgroup label="Béja">
                             <option value="Béja">Béja</option>
                             <option value="Medjez El Bab">Medjez El Bab</option>
                             <option value="Teboursouk">Teboursouk</option>
                             <option value="Testour">Testour</option>
                             <option value="Nefza">Nefza</option>
                             <option value="Goubellat">Goubellat</option>
                           </optgroup>
                           <optgroup label="Jendouba">
                             <option value="Jendouba">Jendouba</option>
                             <option value="Bousalem">Bousalem</option>
                             <option value="Tabarka">Tabarka</option>
                             <option value="Ghardimaou">Ghardimaou</option>
                             <option value="Ain Draham">Ain Draham</option>
                             <option value="Fernana">Fernana</option>
                             <option value="Oued Meliz">Oued Meliz</option>
                           </optgroup>
                           <optgroup label="Le Kef">
                             <option value="Le Kef">Le Kef</option>
                             <option value="Sers">Sers</option>
                             <option value="Nebeur">Nebeur</option>
                             <option value="Tajerouine">Tajerouine</option>
                             <option value="Dahmani">Dahmani</option>
                             <option value="Sakiet Sidi Youssef">Sakiet Sidi Youssef</option>
                           </optgroup>
                           <optgroup label="Siliana">
                             <option value="Siliana">Siliana</option>
                             <option value="Makthar">Makthar</option>
                             <option value="Bou Arada">Bou Arada</option>
                             <option value="Le Krib">Le Krib</option>
                             <option value="Rouhia">Rouhia</option>
                             <option value="Gaafour">Gaafour</option>
                             <option value="Bargou">Bargou</option>
                             <option value="Kesra">Kesra</option>
                           </optgroup>
                           <optgroup label="Kairouan">
                             <option value="Kairouan">Kairouan</option>
                             <option value="Sbikha">Sbikha</option>
                             <option value="Oueslatia">Oueslatia</option>
                             <option value="Chebika">Chebika</option>
                             <option value="Haffouz">Haffouz</option>
                             <option value="Nasrallah">Nasrallah</option>
                             <option value="Bouhajla">Bouhajla</option>
                           </optgroup>
                           <optgroup label="Sidi Bouzid">
                             <option value="Sidi Bouzid">Sidi Bouzid</option>
                             <option value="Regueb">Regueb</option>
                             <option value="Sidi Ali Ben Aoun">Sidi Ali Ben Aoun</option>
                             <option value="Jelma">Jelma</option>
                             <option value="Meknassy">Meknassy</option>
                             <option value="Bir El Haffey">Bir El Haffey</option>
                           </optgroup>
                           <optgroup label="Kasserine">
                             <option value="Kasserine">Kasserine</option>
                             <option value="Sbeitla">Sbeitla</option>
                             <option value="Feriana">Feriana</option>
                             <option value="Foussana">Foussana</option>
                             <option value="Sbiba">Sbiba</option>
                             <option value="Thala">Thala</option>
                             <option value="Hidra">Hidra</option>
                           </optgroup>
                           <optgroup label="Gabès">
                             <option value="Gabès">Gabès</option>
                             <option value="El Hamma">El Hamma</option>
                             <option value="Mareth">Mareth</option>
                             <option value="Ghannouch">Ghannouch</option>
                             <option value="Metouia">Metouia</option>
                             <option value="Oudhref">Oudhref</option>
                           </optgroup>
                           <optgroup label="Médenine">
                             <option value="Médenine">Médenine</option>
                             <option value="Zarzis">Zarzis</option>
                             <option value="Djerba Houmt Souk">Djerba Houmt Souk</option>
                             <option value="Djerba Midoun">Djerba Midoun</option>
                             <option value="Djerba Ajim">Djerba Ajim</option>
                             <option value="Ben Guerdane">Ben Guerdane</option>
                             <option value="Beni Khedache">Beni Khedache</option>
                           </optgroup>
                           <optgroup label="Gafsa">
                             <option value="Gafsa">Gafsa</option>
                             <option value="Redeyef">Redeyef</option>
                             <option value="Metlaoui">Metlaoui</option>
                             <option value="Mdhilla">Mdhilla</option>
                             <option value="Om Laarayes">Om Laarayes</option>
                             <option value="El Guettar">El Guettar</option>
                           </optgroup>
                           <optgroup label="Tozeur">
                             <option value="Tozeur">Tozeur</option>
                             <option value="Nefta">Nefta</option>
                             <option value="Degache">Degache</option>
                             <option value="Tameghza">Tameghza</option>
                           </optgroup>
                           <optgroup label="Tataouine">
                             <option value="Tataouine">Tataouine</option>
                             <option value="Ghomrassen">Ghomrassen</option>
                             <option value="Remada">Remada</option>
                             <option value="Dhehiba">Dhehiba</option>
                           </optgroup>
                           <optgroup label="Kébili">
                             <option value="Kébili">Kébili</option>
                             <option value="Douz">Douz</option>
                             <option value="Souk Lahad">Souk Lahad</option>
                             <option value="Jemna">Jemna</option>
                           </optgroup>
                         </select>
                      </div>
                      <div>
                        <label className={labelClass}>Téléphone</label>
                        <input 
                          className={inputClass} 
                          value={form.phone} 
                          onChange={e => {
                            // Simple numeric formatting for TN numbers: +216 00 000 000
                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                            setForm({...form, phone: val});
                          }} 
                          placeholder="21 666 888" 
                          required 
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Registre Commerce (RNE)</label>
                        <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer hover:bg-slate-50 ${officialDocs.rne ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}>
                          <FileUp size={20} className={officialDocs.rne ? 'text-indigo-500' : 'text-slate-400'} />
                          <span className="text-[10px] font-bold text-slate-500 mt-2 text-center truncate w-full px-2">
                            {officialDocs.rne ? officialDocs.rne.name : 'Importer PDF/Image'}
                          </span>
                          <input type="file" className="hidden" accept="image/*,application/pdf" onChange={e => handleFileUpload(e, 'rne')} />
                        </label>
                      </div>
                      <div>
                        <label className={labelClass}>Carte d'Identité (CIN)</label>
                        <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer hover:bg-slate-50 ${officialDocs.cin ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}>
                          <FileUp size={20} className={officialDocs.cin ? 'text-indigo-500' : 'text-slate-400'} />
                          <span className="text-[10px] font-bold text-slate-500 mt-2 text-center truncate w-full px-2">
                             {officialDocs.cin ? officialDocs.cin.name : 'Importer PDF/Image'}
                          </span>
                          <input type="file" className="hidden" accept="image/*,application/pdf" onChange={e => handleFileUpload(e, 'cin')} />
                        </label>
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
