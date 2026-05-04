'use client';

import React, { useState, useTransition } from 'react';
import { MapPin, Plus, Store, Phone, CheckCircle2, Navigation, Package, XCircle, Edit, Trash2, Locate, Map, X } from 'lucide-react';
import { createVendorPosAction, updateVendorPosAction, updateVendorPosStockAction, deleteVendorPosAction } from '../../../actions';
import { useEffect, useRef } from 'react';

interface VendorPosClientProps {
  initialPosList: any[];
  products: any[];
  vendorMainCoords?: { lat: number | null; lng: number | null };
}

export default function VendorPosClient({ initialPosList, products, vendorMainCoords }: VendorPosClientProps) {
  const [posList, setPosList] = useState(initialPosList || []);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };
  
  // Stock Modal State
  const [activeStockPos, setActiveStockPos] = useState<any>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});

  const handleSaveBranch = (formData: any) => {
    startTransition(async () => {
      try {
        if (editingBranch?.id) {
          await updateVendorPosAction(editingBranch.id, formData);
        } else {
          await createVendorPosAction(formData);
        }
        setIsModalOpen(false);
        setEditingBranch(null);
        window.location.reload();
      } catch (error: any) {
        alert(error.message);
      }
    });
  };

  const handleDeleteBranch = (id: string) => {
    if (!confirm('Supprimer cette franchise ? Cette action est irréversible.')) return;
    startTransition(async () => {
      try {
        await deleteVendorPosAction(id);
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

  const openStockModal = (pos: any) => {
    setActiveStockPos(pos);
    const initialInputs: Record<string, number> = {};
    if (pos.stockItems) {
      pos.stockItems.forEach((inv: any) => {
        initialInputs[inv.vendorProductId] = Number(inv.quantity);
      });
    }
    setStockInputs(initialInputs);
  };

  const handleStockChange = (productId: string, val: string) => {
    setStockInputs(prev => ({
      ...prev,
      [productId]: Number(val) || 0
    }));
  };

  const saveStock = async (productId: string) => {
    if (!activeStockPos) return;
    const qty = stockInputs[productId] || 0;
    startTransition(async () => {
      try {
        await updateVendorPosStockAction(activeStockPos.id, productId, qty);
        // We could selectively update the state here, but reload ensures fresh data for now
        window.location.reload();
      } catch(err: any) {
        alert(err.message);
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
          onClick={() => { setEditingBranch(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> Ajouter une franchise
        </button>
      </div>

      {/* Inline Form Removed - Replaced by Modal */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posList.map((pos) => (
          <div key={pos.id} className={`p-6 rounded-[32px] border flex flex-col justify-between ${pos.isActive ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
            <div>
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                     {pos.name}
                     {pos.isActive && <CheckCircle2 size={16} className="text-emerald-500" />}
                   </h3>
                   {pos.city && <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-1"><MapPin size={14} /> {pos.city}</p>}
                   {vendorMainCoords?.lat && vendorMainCoords?.lng && pos.lat && pos.lng && (
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Navigation size={10} />
                       {getDistance(vendorMainCoords.lat, vendorMainCoords.lng, pos.lat, pos.lng).toFixed(1)} km du siège
                     </p>
                   )}
                 </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingBranch(pos); setIsModalOpen(true); }}
                      className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteBranch(pos.id)}
                      className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => toggleStatus(pos.id, pos.isActive)}
                      disabled={isPending}
                      className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${pos.isActive ? 'border-rose-100 text-rose-500 hover:bg-rose-50' : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'}`}
                    >
                      {pos.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
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
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
               <button 
                onClick={() => openStockModal(pos)}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors"
               >
                 <Package size={16} className="text-indigo-500" /> Gérer le stock
               </button>
               <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-100">Performances</div>
            </div>
          </div>
        ))}
        
        {posList.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-[32px]">
            Aucun point de vente enregistré.<br/>Cliquez sur "Ajouter une franchise" pour commencer.
          </div>
        )}
      </div>

      {/* Stock Management Modal */}
      {activeStockPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[32px] p-6 shadow-2xl border border-slate-200 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <div>
                    <h3 className="text-xl font-black text-slate-900">Stock Local</h3>
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {activeStockPos.name}</p>
                 </div>
                 <button onClick={() => setActiveStockPos(null)} className="text-slate-400 hover:text-slate-900"><XCircle size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 {products.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold">Votre catalogue est vide. Ajoutez des produits d'abord.</div>
                 ) : (
                    products.map((p) => {
                       const currentQty = stockInputs[p.id] !== undefined ? stockInputs[p.id] : 0;
                       return (
                         <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-100">
                               <img src={p.image || '/placeholder.png'} className="w-full h-full object-cover" />
                             </div>
                             <div>
                               <div className="font-bold text-slate-900 leading-tight">{p.name}</div>
                               <div className="text-[10px] font-black text-slate-400 uppercase">{p.unit || 'UNITE'}</div>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0"
                                value={currentQty}
                                onChange={(e) => handleStockChange(p.id, e.target.value)}
                                className="w-20 p-2 text-center font-black bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                              <button 
                               onClick={() => saveStock(p.id)}
                               disabled={isPending}
                               className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 disabled:opacity-50"
                              >
                                Enregistrer
                              </button>
                           </div>
                         </div>
                       );
                    })
                 )}
              </div>
           </div>
        </div>
      )}
      {/* ── Modal Franchise (Add/Edit) ── */}
      {isModalOpen && (
        <BranchModal 
          branch={editingBranch} 
          onClose={() => { setIsModalOpen(false); setEditingBranch(null); }} 
          onSave={handleSaveBranch}
          isPending={isPending}
        />
      )}
    </div>
  );
}

function BranchModal({ branch, onClose, onSave, isPending }: any) {
  const [form, setForm] = useState({
    name: branch?.name || '',
    address: branch?.address || '',
    city: branch?.city || '',
    phone: branch?.phone || '',
    lat: branch?.lat || 36.80,
    lng: branch?.lng || 10.18,
    isActive: branch?.isActive !== undefined ? branch.isActive : true
  });

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (!mapContainerRef.current) return;
      
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([form.lat, form.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background:#4F46E5; width:24px; height:24px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      markerRef.current = L.marker([form.lat, form.lng], { icon, draggable: true }).addTo(mapRef.current);
      
      markerRef.current.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setForm(f => ({ ...f, lat, lng }));
      });
    };
    initMap();
    return () => { if (mapRef.current) mapRef.current.remove(); };
  }, []);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all";
  const labelClass = "block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Map size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {branch ? 'Modifier la franchise' : 'Nouvelle franchise'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400">Configurez les détails et la position GPS</p>
               </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="md:col-span-2">
              <label className={labelClass}>Nom de l'établissement</label>
              <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: ElKassa - Entrepôt Sud" />
            </div>
            <div>
              <label className={labelClass}>Ville / Gouvernorat</label>
              <input className={inputClass} value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Ex: Sfax" />
            </div>
            <div>
              <label className={labelClass}>Téléphone contact</label>
              <input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Ex: 71 000 000" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Adresse complète</label>
              <input className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Ex: Z.I Poudrière II" />
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1.5">
                 <label className={labelClass}>Position GPS précise</label>
                 <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">Déplacez le marqueur bleu</span>
              </div>
              <div className="h-52 rounded-3xl overflow-hidden border border-slate-100 relative shadow-inner">
                <div ref={mapContainerRef} className="h-full w-full" />
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl text-[10px] font-black text-slate-900 border border-slate-100 flex items-center gap-3">
                  <Navigation size={12} className="text-indigo-600" />
                  <span>{form.lat.toFixed(6)}, {form.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={isPending || !form.name}
            onClick={() => onSave(form)}
            className="w-full py-4 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isPending ? 'Synchronisation en cours...' : (branch ? 'Mettre à jour la franchise' : 'Enregistrer la franchise')}
          </button>
        </div>
      </div>
    </div>
  );
}
