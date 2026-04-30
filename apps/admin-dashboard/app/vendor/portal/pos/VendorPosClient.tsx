'use client';

import React, { useState, useTransition } from 'react';
import { MapPin, Plus, Store, Phone, CheckCircle2, Navigation } from 'lucide-react';
import { createVendorPosAction, updateVendorPosAction } from '../../../actions';

interface VendorPosClientProps {
  initialPosList: any[];
}

export default function VendorPosClient({ initialPosList }: VendorPosClientProps) {
  const [posList, setPosList] = useState(initialPosList || []);
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    startTransition(async () => {
      try {
        await createVendorPosAction({ name, address, city, phone });
        setShowAddForm(false);
        setName(''); setAddress(''); setCity(''); setPhone('');
        window.location.reload();
      } catch (error: any) {
        alert(error.message);
      }
    });
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await updateVendorPosAction(id, { isActive: !currentStatus });
        window.location.reload();
      } catch (error: any) {
        alert(error.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 text-slate-700 font-bold">
          <Store size={20} className="text-indigo-600" />
          <span>{posList.length} Point{posList.length > 1 ? 's' : ''} de vente enregistré{posList.length > 1 ? 's' : ''}</span>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Ajouter une branche
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddPos} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-black text-lg text-slate-900 mb-4">Nouvelle Branche</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-slate-500 mb-1 block">Nom de la branche</label>
              <input 
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Entrepôt Tunis, Magasin Sfax..."
                className="w-full p-3 bg-slate-50 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-500 mb-1 block">Téléphone (Optionnel)</label>
              <input 
                type="text" 
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Ex: 55 123 456"
                className="w-full p-3 bg-slate-50 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-black uppercase text-slate-500 mb-1 block">Ville</label>
                  <input 
                    type="text" 
                    value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Ex: Tunis"
                    className="w-full p-3 bg-slate-50 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
               </div>
               <div>
                  <label className="text-xs font-black uppercase text-slate-500 mb-1 block">Adresse complète</label>
                  <input 
                    type="text" 
                    value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Ex: 15 Avenue Habib Bourguiba"
                    className="w-full p-3 bg-slate-50 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Annuler</button>
            <button type="submit" disabled={isPending} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50">
              {isPending ? 'Enregistrement...' : 'Enregistrer la branche'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posList.map((pos) => (
          <div key={pos.id} className={`p-6 rounded-[32px] border ${pos.isActive ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                  {pos.name}
                  {pos.isActive && <CheckCircle2 size={16} className="text-emerald-500" />}
                </h3>
                {pos.city && <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-1"><MapPin size={14} /> {pos.city}</p>}
              </div>
              <button 
                onClick={() => toggleStatus(pos.id, pos.isActive)}
                disabled={isPending}
                className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${pos.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                {pos.isActive ? 'Désactiver' : 'Activer'}
              </button>
            </div>

            <div className="space-y-2 mt-6">
              {pos.address && (
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <Navigation size={14} className="text-indigo-400" /> 
                  <span className="truncate">{pos.address}</span>
                </div>
              )}
              {pos.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <Phone size={14} className="text-indigo-400" /> 
                  <span className="font-bold">{pos.phone}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
               <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Performances</div>
               <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-100">Voir les statistiques</div>
            </div>
          </div>
        ))}
        
        {posList.length === 0 && !showAddForm && (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-[32px]">
            Aucun point de vente enregistré.<br/>Cliquez sur "Ajouter une branche" pour commencer.
          </div>
        )}
      </div>
    </div>
  );
}
