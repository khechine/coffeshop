'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { updateStore } from '../../actions';
import { Building2, MapPin, Store, Crosshair, Save, Clock, CheckCircle2, FileCheck, AlertCircle, ShieldCheck, FileUp } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

interface StoreProps {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  trialEndsAt: Date | null;
  isVerified: boolean;
}

export default function SettingsClient({ store }: { store: StoreProps }) {
  const [isPending, startTransition] = useTransition();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [form, setForm] = useState({
    name: store.name,
    address: store.address || '',
    city: store.city || '',
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
            <div style="background-color: #4F46E5; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
              <div style="transform: rotate(45deg); color: white; margin-bottom: 2px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
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
    width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', 
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    background: '#F8FAFC'
  };
  const label: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Trial & Verification Banner */}
      <div className="card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
         <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#6366F110', color: '#6366F1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Clock size={20} />
                  </div>
                  <div>
                     <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Période d'Essai</div>
                     <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>
                        {store.trialEndsAt ? Math.max(0, Math.ceil((new Date(store.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0} Jours restants
                     </div>
                  </div>
               </div>
               <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                  Profitez de toutes les fonctionnalités. Après 30 jours, un abonnement sera requis.
               </div>
            </div>

            <div style={{ flex: 1.5, minWidth: '300px' }}>
               <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>État du Compte</div>
               <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { label: 'Email', done: true, icon: <CheckCircle2 size={16} /> },
                    { label: 'Documents', done: store.status !== 'PENDING_DOCS', icon: <FileCheck size={16} /> },
                    { label: 'Activation', done: store.isVerified, icon: <ShieldCheck size={16} /> }
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: s.done ? '#F0FDF4' : '#FFF7ED', border: `1.5px solid ${s.done ? '#DCFCE7' : '#FFEDD5'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                       <div style={{ color: s.done ? '#16A34A' : '#EA580C' }}>{s.icon}</div>
                       <div style={{ fontSize: '11px', fontWeight: 800, color: s.done ? '#16A34A' : '#EA580C' }}>{s.label}</div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Official Documents Section */}
      <div className="card">
         <div className="card-header">
            <span className="card-title"><FileCheck size={16} /> Documents Officiels (Requis pour Marketplace)</span>
         </div>
         <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
               <div>
                  <label style={label}>Copie du KBIS / RNE</label>
                  <div style={{ border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '30px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                     <FileUp size={24} color="#94A3B8" style={{ marginBottom: '8px' }} />
                     <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Cliquez pour uploader</div>
                     <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>PDF, JPG ou PNG</div>
                  </div>
               </div>
               <div>
                  <label style={label}>Matricule Fiscal</label>
                  <div style={{ border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '30px', textAlign: 'center', cursor: 'pointer' }}>
                     <FileUp size={24} color="#94A3B8" style={{ marginBottom: '8px' }} />
                     <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Cliquez pour uploader</div>
                     <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>PDF, JPG ou PNG</div>
                  </div>
               </div>
            </div>
            
            {!store.isVerified && (
               <div style={{ marginTop: '20px', padding: '16px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FEE2E2', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <AlertCircle size={20} color="#EF4444" />
                  <p style={{ fontSize: '13px', color: '#B91C1C', margin: 0 }}>
                     <b>Attention:</b> Tant que vos documents ne sont pas vérifiés, vous ne pourrez pas passer de commandes sur le Marketplace B2B.
                  </p>
               </div>
            )}
         </div>
      </div>
      
      {/* Map Section - Priority on Mobile */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-header">
          <span className="card-title"><MapPin size={16} /> Position sur la Carte</span>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Déplacez le marqueur bleu</div>
        </div>
        <div style={{ position: 'relative', height: '300px', width: '100%' }}>
          <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
          <button type="button" 
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  const { latitude, longitude } = pos.coords;
                  setForm(f => ({ ...f, lat: latitude, lng: longitude }));
                  if (mapRef.current) mapRef.current.setView([latitude, longitude], 15);
                  if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
                });
              }
            }}
            style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000, background: '#fff', border: 'none', padding: '12px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Crosshair size={20} color="#4F46E5" />
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Store size={16} /> Détails de l'Établissement</span>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
          <div>
            <label style={label}>Nom de l'Enseigne</label>
            <input
              style={field}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nom du café"
              required
            />
          </div>

          <div>
            <label style={label}>Adresse Physique</label>
            <input
              style={field}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Rue, numéro..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={label}>Ville</label>
              <input
                style={field}
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Ville"
              />
            </div>
            <div>
              <label style={label}>Téléphone</label>
              <input
                style={field}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Contact"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', opacity: 0.7 }}>
            <div>
              <label style={label}>Lat.</label>
              <input style={{ ...field, fontSize: '12px' }} value={form.lat.toFixed(6)} readOnly disabled />
            </div>
            <div>
              <label style={label}>Long.</label>
              <input style={{ ...field, fontSize: '12px' }} value={form.lng.toFixed(6)} readOnly disabled />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 800, marginTop: '8px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }} disabled={isPending}>
            {isPending ? 'Enregistrement...' : <><Save size={18} /> Sauvegarder</>}
          </button>
        </form>
      </div>
    </div>
  );
}
