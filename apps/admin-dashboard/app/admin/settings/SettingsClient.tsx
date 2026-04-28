'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { updateStore, seedDemoProductsAction, resetDemoDataAction, seedTunisianStarterPackAction } from '../../actions';
import { 
  Building2, MapPin, Store, Crosshair, Save, Clock, 
  CheckCircle2, FileCheck, AlertCircle, ShieldCheck, 
  FileUp, Eye, Upload, X, ShoppingCart, Sparkles, 
  RotateCcw, Search, Map as MapIcon, Navigation, RefreshCw
} from 'lucide-react';

import 'leaflet/dist/leaflet.css';

import FiscalSettings from './FiscalSettings';
import { getPlanFeatures } from '../../../lib/planFeatures';

interface StoreProps {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  governorate: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  trialEndsAt: Date | null;
  isVerified: boolean;
  officialDocs: any[] | null;
  forceMarketplaceAccess: boolean;
  isFiscalEnabled: boolean;
  subscription?: {
    plan?: {
      name: string;
    }
  }
}

export default function SettingsClient({ store }: { store: StoreProps }) {
  const [isPending, startTransition] = useTransition();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [form, setForm] = useState({
    name: store.name,
    address: store.address || '',
    city: store.city || '',
    governorate: store.governorate || '',
    phone: store.phone || '',
    lat: store.lat || 36.80,
    lng: store.lng || 10.18,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateStore(form);
      alert('Paramètres enregistrés avec succès !');
    });
  };

  // Function to search coordinates based on address
  const handleGeocode = async () => {
    if (!form.address && !form.city) {
      alert('Veuillez saisir au moins une adresse ou une ville.');
      return;
    }

    setIsGeocoding(true);
    try {
      const query = `${form.address}, ${form.city}, ${form.governorate}, Tunisia`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        setForm(f => ({ ...f, lat: newLat, lng: newLng }));
        
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          }
        }
      } else {
        alert("Nous n'avons pas pu localiser cette adresse. Veuillez ajuster manuellement sur la carte.");
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Erreur lors de la recherche de coordonnées.');
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L: any = (await import('leaflet')).default;
      
      if (!mapRef.current && mapContainerRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([form.lat, form.lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="background-color: #4F46E5; width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);">
              <div style="transform: rotate(45deg); color: white; margin-bottom: 2px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        markerRef.current = L.marker([form.lat, form.lng], { 
          icon: customIcon,
          draggable: true 
        }).addTo(mapRef.current);

        markerRef.current.on('dragend', (e: any) => {
          const latLng = e.target.getLatLng();
          setForm(f => ({ ...f, lat: latLng.lat, lng: latLng.lng }));
        });

        mapRef.current.on('click', (e: any) => {
          const latLng = e.latlng;
          if (markerRef.current) markerRef.current.setLatLng(latLng);
          setForm(f => ({ ...f, lat: latLng.lat, lng: latLng.lng }));
        });
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const field: React.CSSProperties = { 
    width: '100%', padding: '14px 18px', borderRadius: '16px', border: '1.5px solid #E2E8F0', 
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    background: '#F8FAFC', transition: 'all 0.2s', fontWeight: 600
  };
  const label: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' };

  return (
    <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-700">
      
      {/* Premium Header */}
      <div className="flex flex-col gap-2">
         <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configuration de l'Établissement</h1>
         <p className="text-sm font-medium text-slate-500 tracking-tight">Gérez l'identité, la localisation et les paramètres fiscaux de votre café.</p>
      </div>

      {/* Trial & Verification Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm overflow-hidden">
         <div className="p-10 flex flex-wrap gap-12">
            <div className="flex-1 min-w-[280px] space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                     <Clock size={24} />
                  </div>
                  <div>
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Période d'Essai</div>
                     <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {store.trialEndsAt ? Math.max(0, Math.ceil((new Date(store.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0} Jours restants
                     </div>
                  </div>
               </div>
               <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Votre établissement est actuellement en mode test. Profitez de toutes les fonctionnalités premium pour configurer votre business.
               </p>
            </div>

            <div className="flex-1.5 min-w-[320px] space-y-4">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checklist d'Activation</div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Email', done: true, icon: <CheckCircle2 size={18} /> },
                    { label: 'Documents', done: store.status !== 'PENDING_DOCS', icon: <FileCheck size={18} /> },
                    { label: 'Identité', done: store.isVerified, icon: <ShieldCheck size={18} /> }
                  ].map((s, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                      s.done ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5' : 'bg-amber-50 border-amber-100 dark:bg-amber-500/5'
                    }`}>
                       <div className={s.done ? 'text-emerald-600' : 'text-amber-600'}>{s.icon}</div>
                       <div className={`text-[10px] font-black uppercase tracking-widest ${s.done ? 'text-emerald-700' : 'text-amber-700'}`}>{s.label}</div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* Left Column: Map & Location */}
         <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm overflow-hidden flex flex-col h-full">
               <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <MapIcon size={20} />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Géo-localisation</h3>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Précision Satellite</div>
               </div>
               
               <div className="relative flex-1 min-h-[400px]">
                  <div ref={mapContainerRef} className="h-full w-full z-0" />
                  
                  {/* Floating Action Buttons on Map */}
                  <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-3">
                     <button type="button" 
                        onClick={() => {
                           if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((pos) => {
                                 const { latitude, longitude } = pos.coords;
                                 setForm(f => ({ ...f, lat: latitude, lng: longitude }));
                                 if (mapRef.current) mapRef.current.setView([latitude, longitude], 17);
                                 if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
                              });
                           }
                        }}
                        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex items-center justify-center text-indigo-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 dark:border-slate-700"
                        title="Ma position actuelle"
                     >
                        <Crosshair size={22} />
                     </button>
                  </div>
               </div>

               <div className="p-8 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</div>
                     <div className="font-mono text-xs font-black text-slate-900 dark:text-white">{form.lat.toFixed(6)}</div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</div>
                     <div className="font-mono text-xs font-black text-slate-900 dark:text-white">{form.lng.toFixed(6)}</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Identity Form */}
         <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm overflow-hidden">
               <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Store size={20} />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Identité Boutique</h3>
                  </div>
               </div>

               <form onSubmit={handleSubmit} className="p-10 space-y-8">
                  <div className="space-y-6">
                     <div>
                        <label style={label}>Nom de l'Enseigne</label>
                        <input
                           style={field}
                           value={form.name}
                           onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                           placeholder="Ex: Mon Café Gourmet"
                           required
                        />
                     </div>

                     <div className="space-y-4">
                        <label style={label}>Localisation Détaillée</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="sm:col-span-2">
                              <input
                                 style={field}
                                 value={form.address}
                                 onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                 placeholder="Adresse (Rue, N°...)"
                              />
                           </div>
                           <input
                              style={field}
                              value={form.city}
                              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                              placeholder="Ville"
                           />
                           <input
                              style={field}
                              value={form.governorate}
                              onChange={e => setForm(f => ({ ...f, governorate: e.target.value }))}
                              placeholder="Gouvernorat"
                           />
                        </div>
                        <button 
                           type="button"
                           onClick={handleGeocode}
                           disabled={isGeocoding}
                           className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3 group border border-slate-200 dark:border-slate-700"
                        >
                           {isGeocoding ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                           Confirmer la position sur la carte
                        </button>
                     </div>

                     <div>
                        <label style={label}>Contact Téléphonique</label>
                        <input
                           style={field}
                           value={form.phone}
                           onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                           placeholder="Numéro de l'établissement"
                        />
                     </div>
                  </div>

                  <div className="pt-4">
                     <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3" disabled={isPending}>
                        {isPending ? <RefreshCw size={20} className="animate-spin" /> : <><Save size={20} /> Sauvegarder les Paramètres</>}
                     </button>
                  </div>
               </form>
            </div>
         </div>

      </div>

      {/* Plan Features & Fiscal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {(() => {
            const currentPlan = store.subscription?.plan?.name || 'Rachma';
            const planDef = getPlanFeatures(currentPlan);
            return (
               <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
                  <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm text-xl">
                           {planDef.icon}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Forfait {currentPlan}</h3>
                     </div>
                     <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                        {planDef.tagline}
                     </span>
                  </div>
                  <div className="p-10 flex-1">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {planDef.features.map(f => (
                           <div key={f.label} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                              f.included ? 'bg-emerald-50/50 border-emerald-100/50 dark:bg-emerald-500/5' : 'bg-slate-50/50 border-slate-100 dark:bg-slate-500/5'
                           }`}>
                              <span className="text-sm">{f.included ? '✅' : '❌'}</span>
                              <span className={`text-xs font-bold tracking-tight ${f.included ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>{f.label}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            );
         })()}

         {(store.subscription?.plan?.name || '').toUpperCase() !== 'RACHMA' && (
            <FiscalSettings 
               storeId={store.id} 
               isFiscalEnabled={store.isFiscalEnabled} 
               planName={store.subscription?.plan?.name || 'FREE'}
            />
         )}
      </div>

      {/* Official Documents & Marketplace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                     <FileCheck size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Documents Officiels</h3>
               </div>
            </div>
            <div className="p-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <label style={label}>Copie du KBIS / RNE</label>
                     <div className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950/50 hover:border-indigo-400 hover:bg-indigo-50/10 transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 shadow-sm transition-all">
                           <Upload size={24} />
                        </div>
                        <div className="text-center">
                           <div className="text-xs font-black text-slate-900 dark:text-white tracking-tight">Charger le document</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF, JPG ou PNG</div>
                        </div>
                     </div>
                  </div>
                  <div>
                     <label style={label}>Matricule Fiscal</label>
                     <div className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950/50 hover:border-indigo-400 hover:bg-indigo-50/10 transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 shadow-sm transition-all">
                           <Upload size={24} />
                        </div>
                        <div className="text-center">
                           <div className="text-xs font-black text-slate-900 dark:text-white tracking-tight">Charger le document</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF, JPG ou PNG</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                     <ShoppingCart size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Marketplace B2B</h3>
               </div>
            </div>
            <div className="p-10 flex-1 flex flex-col justify-center gap-8">
               <div className={`p-8 rounded-[32px] border transition-all flex flex-col gap-4 text-center ${
                  store.forceMarketplaceAccess ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
               }`}>
                  <div className={`text-sm font-black uppercase tracking-[0.2em] ${store.forceMarketplaceAccess ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {store.forceMarketplaceAccess ? 'Accès Autorisé' : 'Accès Restreint'}
                  </div>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">
                     {store.forceMarketplaceAccess 
                        ? 'Vous pouvez commander directement auprès de nos fournisseurs partenaires.' 
                        : 'Votre forfait actuel ne vous permet pas de commander via le marketplace.'}
                  </p>
               </div>
               <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50" disabled>
                  Upgrade Forfait
               </button>
            </div>
         </div>
      </div>

      {/* Demo Actions */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-[48px] p-12 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={200} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="max-w-md space-y-4 text-center md:text-left">
               <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 justify-center md:justify-start">
                  <Sparkles size={24} className="text-indigo-400" /> Mode Démonstration
               </h3>
               <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Testez instantanément votre coffeeshop avec des données fictives pré-configurées. Vous pourrez les supprimer d'un clic avant le passage en production.
               </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
               <button
                  onClick={() => {
                     if (!confirm('Installer le Pack Initial Tunisie (Café, Thé, Citronnade, Chicha, Recettes...) ?')) return;
                     startTransition(async () => {
                        const res = await seedTunisianStarterPackAction(store.id);
                        alert(res.message);
                     });
                  }}
                  disabled={isPending}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-emerald-600/20"
               >
                  <Sparkles size={16} /> Pack Initial Tunisie
               </button>
               <button
                  onClick={() => {
                     if (!confirm('Installer les données de démo génériques ?')) return;
                     startTransition(async () => {
                        await seedDemoProductsAction(store.id);
                        alert('Boutique initialisée avec succès !');
                     });
                  }}
                  disabled={isPending}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3"
               >
                  <Sparkles size={16} /> Démo Générique
               </button>
               <button
                  onClick={() => {
                     if (!confirm('Réinitialiser toutes les données (Produits, Stock, Catégories) ?')) return;
                     startTransition(async () => {
                        await resetDemoDataAction(store.id);
                        alert('Boutique réinitialisée.');
                     });
                  }}
                  disabled={isPending}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3"
               >
                  <RotateCcw size={16} /> Tout Effacer
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}
