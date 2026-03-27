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

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '12px',
    border: '1.5px solid #E2E8F0', fontSize: '15px', outline: 'none',
    background: '#F8FAFC', boxSizing: 'border-box'
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569',
    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Paramètres Entreprise</h1>
        <p style={{ margin: '4px 0 0', color: '#64748B' }}>Gérez les informations de votre profil Marketplace</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── PÔLES D'ACTIVITÉ ── */}
          <div className="card" style={{ padding: '32px', border: '2px solid #7C3AED20' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Pôle d'Activité</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Définissez le type de votre activité sur la plateforme</p>
              </div>
            </div>

            {activityPoles.length === 0 ? (
              <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                Aucun pôle d'activité défini. Contactez l'administrateur pour en ajouter.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {activityPoles.map(pole => (
                  <label key={pole.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                    borderRadius: '16px', border: '2px solid',
                    borderColor: selectedPoleId === pole.id ? '#7C3AED' : '#E2E8F0',
                    background: selectedPoleId === pole.id ? '#F5F3FF' : '#fff',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="activityPole"
                      value={pole.id}
                      checked={selectedPoleId === pole.id}
                      onChange={() => setSelectedPoleId(pole.id)}
                      style={{ accentColor: '#7C3AED', width: '18px', height: '18px' }}
                    />
                    {pole.icon && <span style={{ fontSize: '20px' }}>{pole.icon}</span>}
                    <span style={{ fontWeight: 700, color: selectedPoleId === pole.id ? '#6D28D9' : '#1E293B' }}>
                      {pole.name}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <button onClick={handleSavePole} disabled={isPending} className="btn btn-primary" style={{ background: '#7C3AED', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isPending ? 'Enregistrement...' : <><Save size={16} /> Enregistrer mon pôle d'activité</>}
            </button>
          </div>

          {/* ── CATÉGORIES MARKETPLACE ── */}
          <div className="card" style={{ padding: '32px', border: '2px solid #6366F120' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Spécialités Marketplace</h2>
              <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: 700 }}>{selectedCategories.length} sélectionnée(s)</div>
            </div>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
              Cochez les catégories de produits que vous fournissez.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {portalData.allCategories?.map((cat: any) => (
                <label key={cat.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                  borderRadius: '14px', border: '1.5px solid',
                  borderColor: selectedCategories.includes(cat.id) ? '#6366F1' : '#E2E8F0',
                  background: selectedCategories.includes(cat.id) ? '#EEF2FF' : '#fff',
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#6366F1' }}
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleToggleCategory(cat.id)}
                  />
                  {cat.icon && <span>{cat.icon}</span>}
                  <span style={{ fontWeight: 700, color: selectedCategories.includes(cat.id) ? '#4F46E5' : '#1E293B' }}>{cat.name}</span>
                </label>
              ))}
            </div>
            <button onClick={handleSaveCategories} disabled={isPending} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isPending ? 'Mise à jour...' : <><Save size={16} /> Sauvegarder les spécialités</>}
            </button>
          </div>

          {/* ── INFOS ENTREPRISE ── */}
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div style={{ width: 56, height: 56, background: '#4F46E5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Building2 size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Informations Générales</h2>
                <span className="badge green" style={{ marginTop: '4px' }}>Compte Vérifié ✓</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Nom de l'Entreprise</label>
                <input style={fieldStyle} defaultValue={portalData.companyName} />
              </div>
              <div>
                <label style={labelStyle}>Description Marketplace</label>
                <textarea style={{ ...fieldStyle, minHeight: '90px', resize: 'vertical' }} defaultValue={portalData.description || ''} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input style={fieldStyle} defaultValue={portalData.phone} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input style={fieldStyle} defaultValue={portalData.city} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Adresse</label>
                <input style={fieldStyle} defaultValue={portalData.address} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '8px' }}>Sauvegarder</button>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div>
          <div style={{ background: '#EEF2FF', padding: '24px', borderRadius: '20px', position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B', marginBottom: '16px' }}>Statut du Profil</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>Statut :</span>
                <span style={{ fontWeight: 800, color: '#10B981' }}>{portalData.status}</span>
              </div>
              {selectedPoleId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748B' }}>Pôle :</span>
                  <span style={{ fontWeight: 800, color: '#7C3AED' }}>
                    {activityPoles.find(p => p.id === selectedPoleId)?.icon} {activityPoles.find(p => p.id === selectedPoleId)?.name}
                  </span>
                </div>
              )}
              {globalUnits.length > 0 && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase' }}>Unités disponibles</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {globalUnits.map(u => (
                      <span key={u.id} style={{ padding: '3px 10px', background: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', border: '1px solid #E2E8F0' }}>
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
