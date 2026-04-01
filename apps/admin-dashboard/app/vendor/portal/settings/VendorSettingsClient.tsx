'use client';

import React, { useState, useTransition } from 'react';
import { Settings, Building2, Save, CheckCircle2, Briefcase } from 'lucide-react';
import { updateVendorCategoriesAction, updateVendorActivityPoleAction } from '../../../actions';

export default function VendorSettingsClient({
  portalData,
  activityPoles,
  globalUnits,
}: {
  portalData: any;
  activityPoles: { id: string; name: string; icon?: string | null }[];
  globalUnits: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

  // ── Activity Pole ──────────────────────────────────────────
  const [selectedPoleId, setSelectedPoleId] = useState<string>(
    portalData.activityPoleId || ''
  );

  // ── Marketplace categories (multi-select) ─────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    portalData.categories?.map((c: any) => c.id) || []
  );

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSaveCategories = () => {
    startTransition(async () => {
      await updateVendorCategoriesAction(portalData.id, selectedCategories);
      showToast('Catégories marketplace mises à jour !');
    });
  };

  const handleSavePole = () => {
    startTransition(async () => {
      await updateVendorActivityPoleAction(portalData.id, selectedPoleId || null);
      showToast('Pôle d\'activité enregistré !');
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm dark:shadow-none";
  const labelClass = "block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]";

  return (
    <div className="w-full space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Paramètres Profil</h1>
          <p className="text-slate-500 font-medium mt-1">Gérez votre présence sur la Marketplace B2B</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/20 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Profil vérifié
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-8">

          {/* ── PÔLES D'ACTIVITÉ ── */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 md:p-10 rounded-[40px] backdrop-blur-md relative overflow-hidden group shadow-sm dark:shadow-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/5 blur-[100px] pointer-events-none" />
            
            <div className="flex items-center gap-6 mb-10 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-[24px] flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <Briefcase size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Secteur d'Activité</h2>
                <p className="text-slate-500 text-sm font-medium">Définissez votre spécialité principale</p>
              </div>
            </div>

            {activityPoles.length === 0 ? (
              <div className="py-12 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 font-bold">
                Aucun pôle d'activité configuré
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 relative z-10">
                {activityPoles.map(pole => {
                  const isActive = selectedPoleId === pole.id;
                  return (
                    <label 
                      key={pole.id} 
                      className={`flex items-center gap-4 p-5 rounded-[24px] border-2 cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10' 
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="activityPole"
                        value={pole.id}
                        checked={isActive}
                        onChange={() => setSelectedPoleId(pole.id)}
                        className="w-5 h-5 accent-violet-500"
                      />
                      <div className="flex flex-col">
                        {pole.icon && <span className="text-2xl mb-1">{pole.icon}</span>}
                        <span className={`font-black text-sm uppercase tracking-wider ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {pole.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <button 
              onClick={handleSavePole} 
              disabled={isPending} 
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-violet-600 text-white font-black text-sm hover:bg-violet-500 transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50 uppercase tracking-widest relative z-10"
            >
              {isPending ? 'Enregistrement...' : <><Save size={18} /> Enregistrer le secteur</>}
            </button>
          </div>

          {/* ── CATÉGORIES MARKETPLACE ── */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 md:p-10 rounded-[40px] backdrop-blur-md relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
            
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-[24px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                  <Settings size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Catalogue Marketplace</h2>
                  <p className="text-slate-500 text-sm font-medium">Rayons où vos produits seront visibles</p>
                </div>
              </div>
              <div className="hidden sm:block bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-500/20">
                {selectedCategories.length} Spécialités
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8 relative z-10">
              {portalData.allCategories?.map((cat: any) => {
                const isActive = selectedCategories.includes(cat.id);
                return (
                  <label 
                    key={cat.id} 
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-indigo-500/5' 
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-transparent text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-700 hover:text-slate-600 dark:hover:text-slate-400'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded-md accent-indigo-500"
                      checked={isActive}
                      onChange={() => handleToggleCategory(cat.id)}
                    />
                    <span className="font-bold text-xs uppercase tracking-wider truncate">{cat.name}</span>
                  </label>
                );
              })}
            </div>

            <button 
              onClick={handleSaveCategories} 
              disabled={isPending} 
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 uppercase tracking-widest relative z-10"
            >
              {isPending ? 'Mise à jour...' : <><Save size={18} /> Enregistrer le catalogue</>}
            </button>
          </div>

          {/* ── INFOS ENTREPRISE ── */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 md:p-10 rounded-[40px] backdrop-blur-md shadow-sm dark:shadow-none">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/50 rounded-[24px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-400 shadow-inner">
                <Building2 size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Coordonnées B2B</h2>
                <p className="text-slate-500 text-sm font-medium">Informations légales et contact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Raison Sociale</label>
                <input className={inputClass} defaultValue={portalData.companyName} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Bio / Présentation de l'entreprise</label>
                <textarea className={`${inputClass} min-h-[120px] resize-none py-4`} defaultValue={portalData.description || ''} />
              </div>
              <div>
                <label className={labelClass}>Contact Téléphone</label>
                <input className={inputClass} defaultValue={portalData.phone} />
              </div>
              <div>
                <label className={labelClass}>Gouvernorat / Ville</label>
                <input className={inputClass} defaultValue={portalData.city} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Siège Social (Adresse complète)</label>
                <input className={inputClass} defaultValue={portalData.address} />
              </div>
            </div>
            
            <div className="pt-6">
              <button className="w-full px-8 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-white font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest">
                Sauvegarder les informations
              </button>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR RÉSUMÉ ── */}
        <div className="xl:col-span-4">
          <div className="bg-white dark:bg-slate-900/60 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/50 sticky top-10 backdrop-blur-xl shadow-sm dark:shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              Résumé Marketplace
            </h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Statut</span>
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                  {portalData.status}
                </span>
              </div>
              
              {selectedPoleId && (
                <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800/50">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pôle Actif</span>
                  <span className="text-xs font-black text-violet-600 dark:text-violet-400 flex items-center gap-2">
                    {activityPoles.find(p => p.id === selectedPoleId)?.icon}
                    {activityPoles.find(p => p.id === selectedPoleId)?.name}
                  </span>
                </div>
              )}

              {globalUnits.length > 0 && (
                <div className="pt-4">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4">Unités supportées</div>
                  <div className="flex flex-wrap gap-2">
                    {globalUnits.map(u => (
                      <span key={u.id} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed">
                Votre profil est visible par plus de 50 cafés partenaires sur la plateforme. Gardez vos informations à jour pour maximiser vos opportunités de vente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast */}
      {toast?.show && (
        <div className="fixed bottom-10 right-10 bg-white dark:bg-slate-900 p-4 pr-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 z-[999]">
          <div className="bg-emerald-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="font-black text-sm text-slate-900 dark:text-white">Succès !</div>
            <div className="text-xs text-slate-500 font-medium">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
