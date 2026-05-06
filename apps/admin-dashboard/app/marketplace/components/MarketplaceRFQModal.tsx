'use client';

import React, { useState } from 'react';
import { X, Send, Package, Target, Calendar, Info } from 'lucide-react';
import { createMarketplaceRFQ, getMarketplaceSectors } from '../../actions';

export default function MarketplaceRFQModal({ onClose }: { onClose: () => void }) {
  const [sectors, setSectors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    quantity: 1,
    budget: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    getMarketplaceSectors().then(setSectors);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMarketplaceRFQ({
        ...formData,
        quantity: Number(formData.quantity),
        budget: formData.budget ? Number(formData.budget) : undefined,
      });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la création du RFQ');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ width: '64px', height: '64px', background: '#DCFCE7', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Send size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>Demande Envoyée !</h2>
          <p style={{ color: '#6B7280', marginTop: '8px' }}>Les fournisseurs concernés seront notifiés et vous recevrez des devis prochainement.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'modalIn 0.3s ease-out' }}>
        {/* Header */}
        <div style={{ padding: '24px 32px', background: '#111827', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Demander un Devis (RFQ)</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>Décrivez votre besoin et recevez des offres des fournisseurs.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Titre de la demande</label>
              <input 
                id="rfq-title"
                name="title"
                required
                type="text" 
                placeholder="Ex: 50kg de café Arabica Premium"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Catégorie</label>
              <select 
                id="rfq-category"
                name="category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px', background: '#fff' }}
              >
                <option value="">Sélectionner</option>
                {sectors.map((s: any) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Quantité</label>
              <input 
                id="rfq-quantity"
                name="quantity"
                required
                type="number" 
                min="1"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Budget estimé (DT)</label>
              <input 
                id="rfq-budget"
                name="budget"
                type="number" 
                placeholder="Optionnel"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Date limite souhaitée</label>
              <input 
                id="rfq-deadline"
                name="deadline"
                type="date" 
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Description détaillée</label>
              <textarea 
                id="rfq-description"
                name="description"
                required
                rows={4}
                placeholder="Spécifiez les caractéristiques techniques, la provenance, le conditionnement..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '12px 32px', borderRadius: '8px', border: 'none', 
                background: '#E31E24', color: '#fff', fontWeight: 900, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Envoi...' : <><Send size={18} /> Publier la demande</>}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
