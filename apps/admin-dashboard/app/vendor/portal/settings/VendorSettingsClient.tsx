'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { Building2, Save, CheckCircle2, Briefcase, MapPin, Crosshair, Package, Upload, X, Palette, Type, MessageSquare, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { updateVendorSectorsAction, updateVendorProfileAction, updateVendorCustomizationAction, updateVendorPasswordAction } from '../../../actions';
import { sanitizeUrl } from '../../../lib/imageUtils';

import 'leaflet/dist/leaflet.css';

export default function VendorSettingsClient({
  portalData,
  mktCategories,
  globalUnits,
  userEmail = '',
}: {
  portalData: any;
  mktCategories: { id: string; name: string; icon?: string | null }[];
  globalUnits: { id: string; name: string }[];
  userEmail?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

  const [customForm, setCustomForm] = useState({
    logoUrl: portalData.customization?.logoUrl || '',
    bannerUrl: portalData.customization?.bannerUrl || '',
    primaryColor: portalData.customization?.primaryColor || '#6366F1',
    secondaryColor: portalData.customization?.secondaryColor || '#1E293B',
    accentColor: portalData.customization?.accentColor || '#F43F5E',
    fontFamily: portalData.customization?.fontFamily || 'Inter',
    welcomeMessage: portalData.customization?.welcomeMessage || '',
  });

  const handleSaveCustomization = () => {
    startTransition(async () => {
      await updateVendorCustomizationAction(customForm);
      showToast('Design mis à jour !');
    });
  };



  const handleUpload = async (file: File, type: 'logo' | 'banner') => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.coffeeshop.elkassa.com';
      const res = await fetch(`${API_URL}/management/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const cleanUrl = sanitizeUrl(data.url);
        setCustomForm(f => ({ ...f, [type === 'logo' ? 'logoUrl' : 'bannerUrl']: cleanUrl }));
      }
    } catch (e) {
      alert('Erreur upload');
    }
  };

  // ── Profile & Map state ───────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [profileForm, setProfileForm] = useState({
    companyName: portalData.companyName || '',
    description: portalData.description || '',
    address: portalData.address || '',
    city: portalData.city || '',
    phone: portalData.phone || '',
    lat: portalData.lat || 36.80,
    lng: portalData.lng || 10.18,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L: any = (await import('leaflet')).default;
      
      if (!mapRef.current && mapContainerRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([profileForm.lat, profileForm.lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="background-color: #4F46E5; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
              <div style="transform: rotate(45deg); color: white; margin-bottom: 2px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        markerRef.current = L.marker([profileForm.lat, profileForm.lng], { 
          icon: customIcon,
          draggable: true 
        }).addTo(mapRef.current);

        markerRef.current.on('dragend', (e: any) => {
          const latLng = e.target.getLatLng();
          setProfileForm(f => ({ ...f, lat: latLng.lat, lng: latLng.lng }));
        });

        mapRef.current.on('click', (e: any) => {
          const latLng = e.latlng;
          if (markerRef.current) markerRef.current.setLatLng(latLng);
          setProfileForm(f => ({ ...f, lat: latLng.lat, lng: latLng.lng }));
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

  const detectGoogleMapsUrl = async (value: string) => {
    // 1. Regex for coordinates in URL (@lat,lng or q=lat,lng)
    const coordRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qCoordRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    
    let lat, lng;
    const match = value.match(coordRegex);
    const qMatch = value.match(qCoordRegex);

    if (match) {
      lat = parseFloat(match[1]);
      lng = parseFloat(match[2]);
    } else if (qMatch) {
      lat = parseFloat(qMatch[1]);
      lng = parseFloat(qMatch[2]);
    }

    if (lat && lng) {
      // Update coordinates
      setProfileForm(f => ({ ...f, lat, lng }));
      if (mapRef.current) mapRef.current.setView([lat, lng], 16);
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);

      // Reverse geocode for clean address
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          // Simplify address (e.g., "Rades, Ben Arous")
          const cleanAddress = parts.slice(0, 3).join(',').trim();
          setProfileForm(f => ({ ...f, address: cleanAddress, city: parts[parts.length - 3]?.trim() || f.city }));
        }
      } catch (e) {
        console.error('Reverse geocoding error', e);
      }
      return true;
    }
    return false;
  };

  const handleSaveProfile = () => {
    startTransition(async () => {
      await updateVendorProfileAction(portalData.id, profileForm);
      showToast('Coordonnées enregistrées avec succès !');
    });
  };

  // ── Activity Poles (multi-select) ─────────────────────────
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>(
    portalData.mktSectors?.map((p: any) => p.id) || []
  );

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleSector = (id: string) => {
    setSelectedSectorIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSaveSectors = () => {
    startTransition(async () => {
      await updateVendorSectorsAction(portalData.id, selectedSectorIds);
      showToast('Secteurs d\'activité enregistrés !');
    });
  };

  // ── Password change state ─────────────────────────────────
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');

  const handleChangePassword = () => {
    setPwdError('');
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) {
      setPwdError('Veuillez remplir tous les champs');
      return;
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdError('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwdForm.newPwd.length < 6) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    startTransition(async () => {
      try {
        await updateVendorPasswordAction({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd });
        showToast('Mot de passe mis à jour avec succès !');
        setPwdForm({ current: '', newPwd: '', confirm: '' });
        setShowPasswordSection(false);
      } catch (e: any) {
        setPwdError(e.message || 'Erreur lors du changement de mot de passe');
      }
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
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Secteurs Marketplace</h2>
                <p className="text-slate-500 text-sm font-medium">Sélectionnez vos spécialités ({selectedSectorIds.length} sélectionnées)</p>
              </div>
            </div>

            {mktCategories.length === 0 ? (
              <div className="py-12 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 font-bold">
                Aucun secteur configuré
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8 relative z-10">
                {mktCategories.map(pole => {
                  const isActive = selectedSectorIds.includes(pole.id);
                  return (
                    <label 
                      key={pole.id} 
                      className={`flex items-center gap-3 p-3 rounded-[16px] border cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'border-violet-500 bg-violet-500/10 shadow-sm shadow-violet-500/10' 
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={pole.id}
                        checked={isActive}
                        onChange={() => handleToggleSector(pole.id)}
                        className="w-4 h-4 accent-violet-500 shrink-0 rounded"
                      />
                      <div className="flex flex-col flex-1 overflow-visible">
                        {pole.icon && <span className="text-xl leading-none mb-1 text-center">{pole.icon}</span>}
                        <span className={`font-black text-[11px] uppercase tracking-wider leading-tight text-center ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {pole.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <button 
              onClick={handleSaveSectors} 
              disabled={isPending} 
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-violet-600 text-white font-black text-sm hover:bg-violet-500 transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50 uppercase tracking-widest relative z-10"
            >
              {isPending ? 'Enregistrement...' : <><Save size={18} /> Enregistrer les secteurs</>}
            </button>
          </div>



          {/* ── PERSONNALISATION MARKETPLACE (PREMIUM) ── */}
          {portalData.isPremium && (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 md:p-10 rounded-[40px] backdrop-blur-md shadow-sm relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
              
              <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <Palette size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Design & Branding</h2>
                  <p className="text-slate-500 text-sm font-medium">Configurez votre identité visuelle premium</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 mb-10">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <label className={labelClass}>Logo Officiel</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {customForm.logoUrl ? (
                        <img 
                          src={sanitizeUrl(customForm.logoUrl) || ''} 
                          className="w-full h-full object-contain" 
                          onError={(e: any) => e.target.src = 'https://ui-avatars.com/api/?name=Vendor&background=6366f1&color=fff'}
                        />
                      ) : (
                        <Upload size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        id="logo-upload" 
                        className="hidden" 
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')}
                      />
                      <label htmlFor="logo-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-slate-800 transition-all">
                        <Upload size={14} /> Changer le logo
                      </label>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">PNG, JPG ou SVG (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="space-y-4">
                  <label className={labelClass}>Bannière de Fiche</label>
                  <div className="w-full h-24 rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                    {customForm.bannerUrl ? (
                      <img 
                        src={sanitizeUrl(customForm.bannerUrl) || ''} 
                        className="w-full h-full object-cover" 
                        onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200'}
                      />
                    ) : (
                      <Upload size={24} className="text-slate-300" />
                    )}
                    <input 
                      type="file" 
                      id="banner-upload" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner')}
                    />
                    <label htmlFor="banner-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-all font-black text-xs uppercase tracking-widest gap-2">
                       <Upload size={16} /> Modifier la bannière
                    </label>
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-6">
                   <label className={labelClass}>Palette de Couleurs</label>
                   <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="text-[10px] font-black text-slate-400 mb-2">PRIMAIRE</div>
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                           <input type="color" value={customForm.primaryColor} onChange={e => setCustomForm(f => ({ ...f, primaryColor: e.target.value }))} className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer" />
                           <span className="font-mono text-[10px] font-black">{customForm.primaryColor}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black text-slate-400 mb-2">ACCENT</div>
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                           <input type="color" value={customForm.accentColor} onChange={e => setCustomForm(f => ({ ...f, accentColor: e.target.value }))} className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer" />
                           <span className="font-mono text-[10px] font-black">{customForm.accentColor}</span>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Font & Message */}
                <div className="space-y-6">
                   <div>
                     <label className={labelClass}>Police de caractères</label>
                     <select 
                       className={inputClass}
                       value={customForm.fontFamily}
                       onChange={e => setCustomForm(f => ({ ...f, fontFamily: e.target.value }))}
                     >
                       <option value="Inter">Inter (Moderne)</option>
                       <option value="Roboto">Roboto (Classique)</option>
                       <option value="Outfit">Outfit (Élégant)</option>
                       <option value="Cairo">Cairo (Arabe/Moderne)</option>
                     </select>
                   </div>
                </div>

                <div className="md:col-span-2">
                   <label className={labelClass}>Message de Bienvenue (Slogan)</label>
                   <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 text-slate-300" size={18} />
                      <textarea 
                        className={`${inputClass} pl-12 min-h-[100px] resize-none`}
                        placeholder="Ex: Le meilleur du café en Tunisie livré chez vous..."
                        value={customForm.welcomeMessage}
                        onChange={e => setCustomForm(f => ({ ...f, welcomeMessage: e.target.value }))}
                      />
                   </div>
                </div>
              </div>

              <button 
                onClick={handleSaveCustomization}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 uppercase tracking-widest relative z-10"
              >
                {isPending ? 'Enregistrement...' : <><Save size={18} /> Appliquer le nouveau design</>}
              </button>
            </div>
          )}

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
                <input className={inputClass} value={profileForm.companyName} onChange={e => setProfileForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              {/* Email display */}
              {userEmail && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Adresse Email du compte</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      className={`${inputClass} pl-10 bg-slate-50/80 dark:bg-slate-950/30 cursor-not-allowed`}
                      value={userEmail}
                      readOnly
                      disabled
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">L’email ne peut pas être modifié directement. Contactez l’administrateur si nécessaire.</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className={labelClass}>Bio / Présentation de l’entreprise</label>
                <textarea className={`${inputClass} min-h-[120px] resize-none py-4`} value={profileForm.description} onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Contact Téléphone</label>
                <input className={inputClass} value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Gouvernorat / Ville</label>
                <input className={inputClass} value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Siège Social (Adresse complète ou Lien Google Maps)</label>
                <input 
                  className={inputClass} 
                  placeholder="Collez une adresse ou un lien Google Maps ici..."
                  value={profileForm.address} 
                  onChange={async (e) => {
                    const val = e.target.value;
                    setProfileForm(f => ({ ...f, address: val }));
                    if (val.includes('google.com/maps') || val.includes('goo.gl/maps')) {
                      await detectGoogleMapsUrl(val);
                    }
                  }} 
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Astuce : Collez le lien Google Maps pour remplir automatiquement la position</p>
              </div>
            </div>

            {/* MAP COMPONENT */}
            <div className="mt-10 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl relative">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2"><MapPin size={16} className="text-indigo-500"/> Position sur la Carte</span>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Déplacez le marqueur</div>
              </div>
              <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
                <button type="button" 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        const { latitude, longitude } = pos.coords;
                        setProfileForm(f => ({ ...f, lat: latitude, lng: longitude }));
                        if (mapRef.current) mapRef.current.setView([latitude, longitude], 15);
                        if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
                      });
                    }
                  }}
                  className="absolute bottom-4 right-4 z-[1000] bg-white border-0 p-3 rounded-full cursor-pointer shadow-lg flex items-center justify-center hover:scale-110 transition-transform text-indigo-600"
                >
                  <Crosshair size={20} />
                </button>
              </div>
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">LATITUDE</label>
                  <input className="w-full bg-transparent text-sm font-mono text-slate-600 dark:text-slate-300 outline-none" value={profileForm.lat.toFixed(6)} readOnly disabled />
                </div>
                <div className="flex-1 border-l border-slate-200 dark:border-slate-800 pl-4">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">LONGITUDE</label>
                  <input className="w-full bg-transparent text-sm font-mono text-slate-600 dark:text-slate-300 outline-none" value={profileForm.lng.toFixed(6)} readOnly disabled />
                </div>
              </div>
            </div>
            
            <div className="pt-6">
              <button 
                onClick={handleSaveProfile}
                disabled={isPending}
                className="w-full px-8 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-white font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isPending ? 'Enregistrement...' : 'Sauvegarder les informations'}
              </button>
            </div>
          </div>

          {/* ── SÉCURITÉ DU COMPTE ── */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-8 md:p-10 rounded-[40px] backdrop-blur-md shadow-sm dark:shadow-none">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/50 rounded-[24px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                <Lock size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sécurité du Compte</h2>
                <p className="text-slate-500 text-sm font-medium">Mettez à jour votre mot de passe</p>
              </div>
            </div>

            {!showPasswordSection ? (
              <button
                onClick={() => setShowPasswordSection(true)}
                className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <Lock size={16} /> Changer le mot de passe
              </button>
            ) : (
              <div className="space-y-4">
                {pwdError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-bold">
                    {pwdError}
                  </div>
                )}
                <div>
                  <label className={labelClass}>Mot de passe actuel</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      className={`${inputClass} pl-10 pr-12`}
                      placeholder="Saisir votre mot de passe actuel"
                      value={pwdForm.current}
                      onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))}
                    />
                    <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      className={`${inputClass} pl-10 pr-12`}
                      placeholder="Minimum 6 caractères"
                      value={pwdForm.newPwd}
                      onChange={e => setPwdForm(f => ({ ...f, newPwd: e.target.value }))}
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="password"
                      className={`${inputClass} pl-10`}
                      placeholder="Répéter le mot de passe"
                      value={pwdForm.confirm}
                      onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all disabled:opacity-50 uppercase tracking-widest"
                  >
                    {isPending ? 'Enregistrement...' : <><Save size={16} /> Mettre à jour</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordSection(false); setPwdError(''); setPwdForm({ current: '', newPwd: '', confirm: '' }); }}
                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
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
              
              {selectedSectorIds.length > 0 && (
                <div className="py-4 border-b border-slate-100 dark:border-slate-800/50">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">Secteurs Actifs</span>
                  <div className="flex flex-wrap gap-2">
                    {mktCategories.filter(p => selectedSectorIds.includes(p.id)).map(p => (
                      <span key={p.id} className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-[10px] font-black border border-violet-100 dark:border-violet-500/20">
                        {p.icon} {p.name}
                      </span>
                    ))}
                  </div>
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
