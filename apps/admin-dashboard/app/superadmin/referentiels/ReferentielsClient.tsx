'use client';

import React, { useState, useTransition } from 'react';
import { Ruler, Tag, ShoppingBag, Briefcase, Plus, Trash2, CheckCircle } from 'lucide-react';
import {
  createGlobalUnit, deleteGlobalUnit,
  createProductCategoryAction, deleteProductCategoryAction,
  createMarketplaceCategoryAction, deleteMarketplaceCategoryAction,
  createActivityPole, deleteActivityPole,
} from '../../actions';

type Item = { id: string; name: string; icon?: string | null };

const ACTIVITY_ICONS = ['☕', '🍵', '🥐', '🍕', '🍔', '🥗', '🍺', '🍰', '🧁', '🌮', '🍜', '🥩'];
const DEFAULT_UNITS = ['unité', 'kg', 'g', 'L', 'mL', 'pcs', 'sachet', 'boite', 'palette', 'carton'];

function Section({
  icon: Icon,
  title,
  color,
  items,
  onCreate,
  onDelete,
  isPending,
  extras,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  items: Item[];
  onCreate: (name: string, icon?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isPending: boolean;
  extras?: React.ReactNode;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate(name.trim(), icon || undefined);
    setName('');
    setIcon('');
  };

  const field: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
    fontSize: '14px', outline: 'none', flex: 1, boxSizing: 'border-box'
  };

  return (
    <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 40, height: 40, background: color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 900, color: '#1E293B', fontSize: '15px' }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>{items.length} entrées</div>
        </div>
      </div>

      {/* Add form */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {extras && <>{extras}</>}
          <input style={field} value={name} onChange={e => setName(e.target.value)} placeholder="Nom..." required />
          <button type="submit" disabled={isPending} style={{
            padding: '10px 18px', background: '#1E293B', color: '#fff', border: 'none',
            borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}>
            <Plus size={14} /> Ajouter
          </button>
        </form>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#CBD5E1', fontSize: '13px', fontWeight: 600 }}>
          Aucune entrée
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px 24px' }}>
          {items.map(item => (
            <span key={item.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px 6px 14px', borderRadius: '100px',
              background: '#F1F5F9', fontWeight: 700, fontSize: '13px', color: '#334155'
            }}>
              {item.icon && <span>{item.icon}</span>}
              {item.name}
              <button onClick={() => onDelete(item.id)} disabled={isPending} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1',
                padding: '0', display: 'flex', alignItems: 'center',
                transition: 'color 0.2s'
              }}
                onMouseOver={e => (e.currentTarget.style.color = '#EF4444')}
                onMouseOut={e => (e.currentTarget.style.color = '#CBD5E1')}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReferentielsClient({
  units, categories, marketplaceCategories, activityPoles
}: {
  units: Item[];
  categories: Item[];
  marketplaceCategories: Item[];
  activityPoles: Item[];
}) {
  const [isPending, startTransition] = useTransition();
  const [localUnits, setLocalUnits] = useState(units);
  const [localCats, setLocalCats] = useState(categories);
  const [localMktCats, setLocalMktCats] = useState(marketplaceCategories);
  const [localPoles, setLocalPoles] = useState(activityPoles);
  const [selectedIcon, setSelectedIcon] = useState('☕');

  const wrap = (fn: () => Promise<void>) => startTransition(async () => { await fn(); });

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Référentiels Globaux</h1>
        <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '14px' }}>
          Gérez les listes partagées utilisées par tous les établissements de la plateforme.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ACTIVITY POLES */}
        <Section
          icon={Briefcase}
          title="Pôles d'activité"
          color="linear-gradient(135deg,#7C3AED,#6D28D9)"
          items={localPoles}
          isPending={isPending}
          extras={
            <select
              value={selectedIcon}
              onChange={e => setSelectedIcon(e.target.value)}
              style={{ padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '18px', cursor: 'pointer' }}
            >
              {ACTIVITY_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          }
          onCreate={async (name) => {
            await createActivityPole({ name, icon: selectedIcon });
            const fresh = await fetch('/api/referentiels?type=poles').then(r => r.json());
            setLocalPoles(fresh);
          }}
          onDelete={async (id) => {
            await deleteActivityPole(id);
            setLocalPoles(p => p.filter(x => x.id !== id));
          }}
        />

        {/* GLOBAL UNITS */}
        <Section
          icon={Ruler}
          title="Unités de Mesure"
          color="linear-gradient(135deg,#4F46E5,#6366F1)"
          items={localUnits}
          isPending={isPending}
          onCreate={async (name) => {
            await createGlobalUnit(name);
            const fresh = await fetch('/api/units').then(r => r.json());
            setLocalUnits(fresh);
          }}
          onDelete={async (id) => {
            await deleteGlobalUnit(id);
            setLocalUnits(u => u.filter(x => x.id !== id));
          }}
        >
          {/* Quick add chips */}
        </Section>

        {/* PRODUCT CATEGORIES */}
        <Section
          icon={Tag}
          title="Catégories Produits (POS)"
          color="linear-gradient(135deg,#F59E0B,#D97706)"
          items={localCats}
          isPending={isPending}
          onCreate={async (name) => {
            await createProductCategoryAction(name);
            const fresh = await fetch('/api/referentiels?type=categories').then(r => r.json());
            setLocalCats(fresh);
          }}
          onDelete={async (id) => {
            await deleteProductCategoryAction(id);
            setLocalCats(c => c.filter(x => x.id !== id));
          }}
        />

        {/* MARKETPLACE CATEGORIES */}
        <Section
          icon={ShoppingBag}
          title="Catégories Marketplace B2B"
          color="linear-gradient(135deg,#10B981,#059669)"
          items={localMktCats}
          isPending={isPending}
          onCreate={async (name) => {
            await createMarketplaceCategoryAction({ name });
            const fresh = await fetch('/api/referentiels?type=marketplace').then(r => r.json());
            setLocalMktCats(fresh);
          }}
          onDelete={async (id) => {
            await deleteMarketplaceCategoryAction(id);
            setLocalMktCats(c => c.filter(x => x.id !== id));
          }}
        />
      </div>
    </div>
  );
}
