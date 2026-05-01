'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Trash2, Edit3, X, Check, Image, Eye, EyeOff, MoveUp, MoveDown, Layout, Zap } from 'lucide-react';
import { upsertMarketplaceBannerAction, deleteMarketplaceBannerAction } from '../../../actions';

const POSITIONS = [
  { value: 'HERO', label: 'Bannière Héro (Principale)', desc: 'Grande bannière à gauche de la page', color: '#4F46E5' },
  { value: 'SIDEBAR_1', label: 'Côté Haut', desc: 'Petite bannière côté droit (haute)', color: '#10B981' },
  { value: 'SIDEBAR_2', label: 'Côté Bas', desc: 'Petite bannière côté droit (basse)', color: '#F59E0B' },
  { value: 'ADS_1', label: 'Pub Horizontale #1', desc: 'Bannière pleine largeur entre les sections', color: '#EF4444' },
  { value: 'ADS_2', label: 'Pub Horizontale #2', desc: 'Bannière pleine largeur avant les catégories', color: '#8B5CF6' },
];

const BANNER_DEFAULTS = {
  title: '',
  subtitle: '',
  buttonText: 'Découvrir',
  buttonLink: '#',
  imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600',
  position: 'HERO',
  bgColor: '#1E1B4B',
  badgeText: 'OFFRE EXCLUSIVE',
  isActive: true,
  sortOrder: 0,
};

export default function BannersClient({ banners: initialBanners }: { banners: any[] }) {
  const [banners, setBanners] = useState<any[]>(initialBanners);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [form, setForm] = useState<any>(BANNER_DEFAULTS);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  const openCreate = () => {
    setEditingBanner(null);
    setForm(BANNER_DEFAULTS);
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditingBanner(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      buttonText: b.buttonText || '',
      buttonLink: b.buttonLink || '',
      imageUrl: b.imageUrl,
      position: b.position,
      bgColor: b.bgColor || '#1E1B4B',
      badgeText: b.badgeText || '',
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      await upsertMarketplaceBannerAction(editingBanner ? { id: editingBanner.id, ...form } : form);
      window.location.reload();
    });
  };

  const handleDelete = (id: string) => {
    setDeleting(id);
    startTransition(async () => {
      await deleteMarketplaceBannerAction(id);
      window.location.reload();
    });
  };

  const byPosition = POSITIONS.reduce((acc, pos) => {
    acc[pos.value] = banners.filter(b => b.position === pos.value);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 950, color: '#0F172A', margin: 0 }}>
            🎯 Gestion des Bannières
          </h1>
          <p style={{ color: '#64748B', fontWeight: 600, marginTop: 8 }}>
            Contrôlez les bannières promotionnelles affichées sur la page Marketplace.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
            color: '#fff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 16,
            fontWeight: 800,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(79,70,229,0.4)',
          }}
        >
          <Plus size={20} /> Nouvelle Bannière
        </button>
      </div>

      {/* Position Groups */}
      {POSITIONS.map(pos => (
        <div key={pos.value} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: pos.color }} />
            <div>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1E293B' }}>{pos.label}</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginLeft: 12 }}>{pos.desc}</span>
            </div>
            <span style={{ marginLeft: 'auto', background: pos.color + '20', color: pos.color, fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 100 }}>
              {byPosition[pos.value]?.length || 0} bannière{byPosition[pos.value]?.length !== 1 ? 's' : ''}
            </span>
          </div>

          {byPosition[pos.value]?.length === 0 ? (
            <div
              onClick={openCreate}
              style={{ border: '2px dashed #E2E8F0', borderRadius: 20, padding: '32px', textAlign: 'center', cursor: 'pointer', color: '#94A3B8', fontWeight: 700, transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = pos.color)}
              onMouseOut={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              <Plus size={24} style={{ margin: '0 auto 8px' }} />
              Ajouter une bannière {pos.label}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 20 }}>
              {byPosition[pos.value]?.map(banner => (
                <div key={banner.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: `1px solid ${banner.isActive ? '#E2E8F0' : '#FEE2E2'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  {/* Preview */}
                  <div style={{ height: 140, position: 'relative', background: banner.bgColor || '#1E1B4B' }}>
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {banner.badgeText && (
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: 900, padding: '3px 10px', borderRadius: 100, width: 'fit-content', marginBottom: 8, letterSpacing: 1 }}>
                          {banner.badgeText}
                        </span>
                      )}
                      <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{banner.title || 'Sans titre'}</div>
                      {banner.subtitle && <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>{banner.subtitle}</div>}
                    </div>
                    {!banner.isActive && (
                      <div style={{ position: 'absolute', top: 12, right: 12, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 8 }}>
                        INACTIF
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Ordre: #{banner.sortOrder}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{pos.label}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => openEdit(banner)}
                        style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Edit3 size={14} /> Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        disabled={deleting === banner.id}
                        style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div style={{ background: '#fff', borderRadius: 32, width: '100%', maxWidth: 820, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            {/* Modal Header */}
            <div style={{ padding: '32px 40px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 950, color: '#0F172A', margin: 0 }}>
                  {editingBanner ? 'Modifier la Bannière' : 'Nouvelle Bannière'}
                </h2>
                <p style={{ color: '#64748B', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  Les modifications seront visibles immédiatement sur la page Marketplace.
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Position *</label>
                  <select
                    value={form.position}
                    onChange={e => setForm({ ...form, position: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: 14, outline: 'none' }}
                  >
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Titre *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Équipez Votre Café comme un Pro"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Sous-titre</label>
                  <textarea
                    value={form.subtitle}
                    onChange={e => setForm({ ...form, subtitle: e.target.value })}
                    rows={3}
                    placeholder="Description courte et percutante..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 600, fontSize: 14, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Bouton</label>
                    <input
                      value={form.buttonText}
                      onChange={e => setForm({ ...form, buttonText: e.target.value })}
                      placeholder="Ex: Découvrir"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Badge</label>
                    <input
                      value={form.badgeText}
                      onChange={e => setForm({ ...form, badgeText: e.target.value })}
                      placeholder="Ex: OFFRE EXCLUSIVE"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Couleur BG</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} style={{ width: 48, height: 48, borderRadius: 12, border: '1px solid #E2E8F0', cursor: 'pointer', padding: 2 }} />
                      <input value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Ordre</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: form.isActive ? '#F0FDF4' : '#FEF2F2', borderRadius: 16, cursor: 'pointer' }} onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                  <div style={{ width: 48, height: 28, background: form.isActive ? '#10B981' : '#CBD5E1', borderRadius: 100, position: 'relative', transition: 'all 0.2s' }}>
                    <div style={{ position: 'absolute', top: 4, left: form.isActive ? 24 : 4, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </div>
                  <span style={{ fontWeight: 800, color: form.isActive ? '#059669' : '#EF4444' }}>
                    {form.isActive ? 'Bannière Active (visible)' : 'Bannière Inactive (masquée)'}
                  </span>
                </div>
              </div>

              {/* Right Column - Image + Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>URL de l'Image *</label>
                  <input
                    value={form.imageUrl}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 600, fontSize: 13, outline: 'none' }}
                  />
                  <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 6 }}>
                    💡 Utilisez Unsplash, Cloudinary, ou l'URL de votre CDN. Résolution recommandée: 1600×600px
                  </p>
                </div>

                {/* Live Preview */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Aperçu en Direct</label>
                  <div style={{ height: 220, borderRadius: 20, overflow: 'hidden', position: 'relative', background: form.bgColor || '#1E1B4B', border: '1px solid #E2E8F0' }}>
                    {form.imageUrl && (
                      <img src={form.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} alt="preview" onError={(e: any) => { e.target.style.display = 'none'; }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {form.badgeText && (
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: 900, padding: '4px 12px', borderRadius: 100, width: 'fit-content', marginBottom: 12, letterSpacing: 1, backdropFilter: 'blur(4px)' }}>
                          {form.badgeText}
                        </span>
                      )}
                      <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {form.title || 'Titre de la Bannière'}
                      </div>
                      {form.subtitle && (
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                          {form.subtitle}
                        </div>
                      )}
                      {form.buttonText && (
                        <button style={{ background: '#fff', color: '#1E1B4B', border: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 900, fontSize: 12, width: 'fit-content', cursor: 'pointer' }}>
                          {form.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Presets d'Images Rapides</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600', label: '☕ Café' },
                      { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1600', label: '🍴 Resto' },
                      { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600', label: '🏪 Bistro' },
                    ].map(preset => (
                      <button
                        key={preset.url}
                        onClick={() => setForm({ ...form, imageUrl: preset.url })}
                        style={{
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: form.imageUrl === preset.url ? '2px solid #4F46E5' : '2px solid transparent',
                          cursor: 'pointer',
                          background: 'none',
                          padding: 0,
                          position: 'relative',
                        }}
                      >
                        <img src={preset.url} style={{ width: '100%', height: 60, objectFit: 'cover' }} alt={preset.label} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px', textAlign: 'center' }}>
                          {preset.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '24px 40px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '14px 28px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#64748B' }}>
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title || !form.imageUrl}
                style={{
                  padding: '14px 32px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 10px 25px -5px rgba(79,70,229,0.4)',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                <Check size={18} />
                {isPending ? 'Enregistrement...' : editingBanner ? 'Enregistrer les modifications' : 'Créer la Bannière'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
