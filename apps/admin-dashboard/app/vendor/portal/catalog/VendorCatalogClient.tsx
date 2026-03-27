'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Package, Search, Image as ImageIcon, CheckCircle, Zap, Calendar, Clock, FileSpreadsheet, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../../../../components/Modal';
import { createMarketplaceProductAction, updateMarketplaceProductAction, deleteMarketplaceProductAction } from '../../../actions';

export default function VendorCatalogClient({ initialProducts, categories, globalUnits }: { initialProducts: any[]; categories: any[]; globalUnits: any[] }) {
   const [modalOpen, setModalOpen] = useState(false);
   const [importModalOpen, setImportModalOpen] = useState(false);
   const [toast, setToast] = useState<{ show: boolean, message: string } | null>(null);
   const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

   const showToast = (message: string) => {
     setToast({ show: true, message });
     setTimeout(() => setToast(null), 3000);
   };
  const [form, setForm] = useState<any>({
    name: '',
    price: '',
    unit: 'kg',
    categoryId: '',
    image: '',
    isFeatured: false,
    isFlashSale: false,
    discount: '',
    flashStart: '',
    flashEnd: '',
    minOrderQuantity: '1'
  });

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: p.price.toString(),
      unit: p.unit,
      categoryId: p.categoryId,
      image: p.image || '',
      isFeatured: p.isFeatured,
      isFlashSale: p.isFlashSale,
      discount: p.discount ? p.discount.toString() : '',
      flashStart: p.flashStart ? new Date(p.flashStart).toISOString().slice(0, 16) : '',
      flashEnd: p.flashEnd ? new Date(p.flashEnd).toISOString().slice(0, 16) : '',
      minOrderQuantity: p.minOrderQuantity ? p.minOrderQuantity.toString() : '1'
    });
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setForm({ name: '', price: '', unit: 'kg', categoryId: '', image: '', isFeatured: false, isFlashSale: false, discount: '', flashStart: '', flashEnd: '', minOrderQuantity: '1' });
    setModalOpen(true);
  };

  const handleImport = () => {
    showToast('Importation lancée avec succès !');
    setImportModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        minOrderQuantity: parseFloat(form.minOrderQuantity),
        discount: form.isFlashSale ? parseFloat(form.discount) : null,
        flashStart: form.isFlashSale && form.flashStart ? new Date(form.flashStart).toISOString() : null,
        flashEnd: form.isFlashSale && form.flashEnd ? new Date(form.flashEnd).toISOString() : null
      };

      if (editingId) {
        await updateMarketplaceProductAction(editingId, payload);
      } else {
        await createMarketplaceProductAction(payload);
      }
      setModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      startTransition(async () => {
        await deleteMarketplaceProductAction(id);
      });
    }
  };

  const field: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none' };
  const label: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input type="text" placeholder="Rechercher mes produits..." style={{ ...field, paddingLeft: '48px', height: '44px', background: '#F8FAFC' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setImportModalOpen(true)}>
            <FileSpreadsheet size={18} /> Importer Catalogue
          </button>
          <button className="btn btn-primary" onClick={handleCreateNew}>
            <Plus size={18} /> Nouveau produit
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {initialProducts.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '180px', background: '#F8FAFC', position: 'relative' }}>
              <img src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&auto=format&fit=crop'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                {p.isFeatured && (
                  <div style={{ background: '#F59E0B', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }}>🔥 VEDETTE</div>
                )}
                {p.isFlashSale && (
                  <div style={{ background: '#EF4444', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, boxShadow: '0 2px 4px rgba(239,68,68,0.3)' }}>⚡ FLASH -{p.discount}%</div>
                )}
              </div>
            </div>
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, marginBottom: '6px' }}>{categories.find(c => c.id === p.categoryId)?.name || 'Sans catégorie'}</div>
              <h4 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900, color: '#1E293B', lineHeight: '1.4' }}>{p.name}</h4>
              
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                     <span style={{ fontSize: '24px', fontWeight: 900, color: '#4F46E5' }}>{Number(p.price).toFixed(3)}</span>
                     <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>DT</span>
                   </div>
                   <div style={{ fontSize: '12px', color: '#94A3B8' }}>par {p.unit}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(p)} className="btn btn-outline" style={{ padding: '10px', borderRadius: '12px' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-outline" style={{ padding: '10px', borderRadius: '12px', color: '#EF4444' }}><Trash2 size={16} /></button>
                </div>
              </div>
              
              {p.isFlashSale && p.flashEnd && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0', fontSize: '12px', color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Fin de l'offre : {new Date(p.flashEnd).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Modifier le Produit" : "Nouveau Produit Marketplace"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
          <div><label style={label}>Nom du produit</label><input style={field} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ex: Café Grains Robusta" required /></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={label}>Prix (DT)</label><input style={field} type="number" step="0.001" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
            <div>
              <label style={label}>Unité</label>
              <select style={{...field, appearance: 'none'}} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} required>
                <option value="">-- Sélectionner --</option>
                {globalUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div><label style={label}>Qte Min</label><input style={field} type="number" step="0.5" value={form.minOrderQuantity} onChange={e => setForm({...form, minOrderQuantity: e.target.value})} required /></div>
          </div>

          <div>
            <label style={label}>Catégorie</label>
            <select style={{...field, appearance: 'none', background: '#F8FAFC'}} value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} required>
              <option value="">Sélectionner une catégorie...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={label}>Image (URL)</label>
            <input style={field} value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." />
          </div>

          <div style={{ display: 'flex', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} />
              Vedette
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#EF4444' }}>
              <input type="checkbox" checked={form.isFlashSale} onChange={e => setForm({...form, isFlashSale: e.target.checked})} />
              Vente Flash 🔥
            </label>
          </div>

          <div>
             <label style={label}><ArrowRightCircle size={14} /> Suggestions Upselling (Ventes additionnelles)</label>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                {initialProducts.filter(p => p.id !== editingId).map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                     <input 
                        type="checkbox" 
                        checked={(form.upsellIds || []).includes(p.id)} 
                        onChange={e => {
                           const current = form.upsellIds || [];
                           const next = e.target.checked ? [...current, p.id] : current.filter((id: string) => id !== p.id);
                           setForm({ ...form, upsellIds: next });
                        }} 
                     />
                     <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  </label>
                ))}
             </div>
          </div>

          {form.isFlashSale && (
            <div style={{ background: '#FEF2F2', padding: '20px', borderRadius: '16px', border: '1px solid #FEE2E2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div>
                 <label style={label}>Remise (%)</label>
                 <input style={field} type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} placeholder="ex: 15" required />
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                 <div>
                    <label style={label}>Début</label>
                    <input style={field} type="datetime-local" value={form.flashStart} onChange={e => setForm({...form, flashStart: e.target.value})} required />
                 </div>
                 <div>
                    <label style={label}>Fin</label>
                    <input style={field} type="datetime-local" value={form.flashEnd} onChange={e => setForm({...form, flashEnd: e.target.value})} required />
                 </div>
               </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
              {isPending ? '⏳ Action en cours...' : (editingId ? 'Mettre à jour' : 'Publier le produit')}
            </button>
          </div>
        </form>
       </Modal>

      {/* CSV Import Modal */}
      <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Importer votre catalogue (CSV)">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '480px' }}>
            <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
               <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} color="#6366F1" /> Structure du fichier CSV
               </h3>
               <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', marginBottom: '12px' }}>
                  Votre fichier doit contenir les colonnes suivantes (dans cet ordre) : <br />
                  <code style={{ background: '#EEF2FF', padding: '2px 4px', borderRadius: '4px', color: '#4F46E5', fontWeight: 700 }}>Nom, Prix, Unité, Catégorie, ImageURL</code>
               </p>
               <button 
                  onClick={() => {
                    const blob = new Blob(["Nom,Prix,Unite,Categorie,ImageURL\nCafe Grains,24.500,kg,Cafe,https://...\nLait Entier,1.450,Litre,Laitage,"], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'modele_catalogue_coffeeshop.csv';
                    a.click();
                  }}
                  className="btn btn-outline" 
                  style={{ width: '100%', justifyContent: 'center', borderColor: '#6366F1', color: '#6366F1', fontWeight: 800 }}
               >
                  Télécharger le modèle CSV
               </button>
            </div>

            <div style={{ border: '2px dashed #E2E8F0', borderRadius: '20px', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#6366F1'} onMouseOut={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
               <div style={{ width: '64px', height: '64px', background: '#EEF2FF', borderRadius: '50%', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Package size={28} />
               </div>
               <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Cliquez pour uploader</div>
               <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>ou glissez votre fichier ici</div>
               <input type="file" style={{ display: 'none' }} accept=".csv" />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setImportModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
               <button onClick={handleImport} className="btn btn-primary" style={{ flex: 2 }}>Lancer l'importation</button>
            </div>
         </div>
      </Modal>

      {/* Floating Notification */}
      {toast?.show && (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: '#fff', padding: '16px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 999 }}>
           <div style={{ background: '#10B981', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CheckCircle2 size={18} />
           </div>
           <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#1E293B' }}>Succès !</div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>{toast.message}</div>
           </div>
        </div>
      )}
    </div>
  );
}
