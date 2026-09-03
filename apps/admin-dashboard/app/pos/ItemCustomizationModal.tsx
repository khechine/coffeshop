'use client';

import React, { useState } from 'react';
import { X, Check, Plus, Coffee, Sparkles, Flame, ShieldAlert, Utensils, Zap } from 'lucide-react';

export interface CustomizationOption {
  id: string;
  name: string;
  category: 'MILK' | 'SUGAR' | 'SYRUP' | 'EXTRAS' | 'TEMP' | 'FOOD';
  price: number;
}

const AVAILABLE_OPTIONS: CustomizationOption[] = [
  // Lait
  { id: 'milk_oat', name: "Lait d'Avoine", category: 'MILK', price: 0.500 },
  { id: 'milk_almond', name: "Lait d'Amande", category: 'MILK', price: 0.500 },
  { id: 'milk_skim', name: "Lait Écrémé", category: 'MILK', price: 0.000 },
  { id: 'milk_none', name: "Sans Lait", category: 'MILK', price: 0.000 },

  // Sucre
  { id: 'sugar_none', name: "Sans Sucre (0%)", category: 'SUGAR', price: 0.000 },
  { id: 'sugar_half', name: "Peu Sucré (50%)", category: 'SUGAR', price: 0.000 },
  { id: 'sugar_normal', name: "Sucre Normal (100%)", category: 'SUGAR', price: 0.000 },

  // Sirops
  { id: 'syrup_vanilla', name: "Sirop Vanille", category: 'SYRUP', price: 0.300 },
  { id: 'syrup_caramel', name: "Sirop Caramel", category: 'SYRUP', price: 0.300 },
  { id: 'syrup_hazelnut', name: "Sirop Noisette", category: 'SYRUP', price: 0.300 },

  // Extras
  { id: 'extra_whipped', name: "Chantilly", category: 'EXTRAS', price: 0.400 },
  { id: 'extra_shot', name: "Double Shot Expresso", category: 'EXTRAS', price: 1.000 },
  { id: 'extra_cheese', name: "Extra Fromage", category: 'EXTRAS', price: 0.500 },

  // Temperature / Cuisson
  { id: 'temp_hot', name: "Chaud", category: 'TEMP', price: 0.000 },
  { id: 'temp_iced', name: "Avec Glaçons", category: 'TEMP', price: 0.000 },
  { id: 'temp_no_ice', name: "Sans Glaçons", category: 'TEMP', price: 0.000 },
  { id: 'food_heated', name: "Bien Chaud / Chauffe", category: 'FOOD', price: 0.000 },
];

interface Props {
  product: { id: string; name: string; price: number; category?: string };
  initialOptions?: string[];
  initialNotes?: string;
  onSave: (options: string[], notes: string, extraPrice: number) => void;
  onClose: () => void;
}

export function ItemCustomizationModal({ product, initialOptions = [], initialNotes = '', onSave, onClose }: Props) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(initialOptions);
  const [notes, setNotes] = useState<string>(initialNotes);

  const toggleOption = (option: CustomizationOption) => {
    setSelectedOptionIds(prev => {
      // If MILK, SUGAR or TEMP, allow single choice per category or toggle off
      if (['MILK', 'SUGAR', 'TEMP'].includes(option.category)) {
        const otherCategoryOptionIds = AVAILABLE_OPTIONS
          .filter(o => o.category === option.category && o.id !== option.id)
          .map(o => o.id);
        const filtered = prev.filter(id => !otherCategoryOptionIds.includes(id));
        return filtered.includes(option.id) ? filtered.filter(id => id !== option.id) : [...filtered, option.id];
      }
      // Multiple selection allowed for SYRUP, EXTRAS, FOOD
      return prev.includes(option.id) ? prev.filter(id => id !== option.id) : [...prev, option.id];
    });
  };

  const selectedOptionsList = AVAILABLE_OPTIONS.filter(o => selectedOptionIds.includes(o.id));
  const extraPrice = selectedOptionsList.reduce((sum, o) => sum + o.price, 0);
  const finalUnitPrice = product.price + extraPrice;

  const handleApply = () => {
    const formattedOptionNames = selectedOptionsList.map(o => o.price > 0 ? `${o.name} (+${o.price.toFixed(3)} DT)` : o.name);
    onSave(formattedOptionNames, notes, extraPrice);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        backgroundColor: '#1E293B',
        color: '#F8FAFC',
        width: '100%',
        maxWidth: 560,
        borderRadius: 24,
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#FFF' }}>
              ⚙️ Personnaliser : {product.name}
            </h2>
            <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>
              Prix de base : {product.price.toFixed(3)} DT
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Options Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Lait */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🥛 Type de Lait
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVAILABLE_OPTIONS.filter(o => o.category === 'MILK').map(opt => {
                const active = selectedOptionIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `2px solid ${active ? '#3B82F6' : '#334155'}`,
                      backgroundColor: active ? '#2563EB22' : '#0F172A',
                      color: active ? '#60A5FA' : '#94A3B8',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {active && <Check size={14} />}
                    {opt.name} {opt.price > 0 && `(+${opt.price.toFixed(3)} DT)`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sucre */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#EC4899', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🍬 Niveau de Sucre
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVAILABLE_OPTIONS.filter(o => o.category === 'SUGAR').map(opt => {
                const active = selectedOptionIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `2px solid ${active ? '#EC4899' : '#334155'}`,
                      backgroundColor: active ? '#EC489922' : '#0F172A',
                      color: active ? '#F472B6' : '#94A3B8',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {active && <Check size={14} />}
                    {opt.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sirops & Extras */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ✨ Sirops & Suppléments
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVAILABLE_OPTIONS.filter(o => ['SYRUP', 'EXTRAS'].includes(o.category)).map(opt => {
                const active = selectedOptionIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `2px solid ${active ? '#10B981' : '#334155'}`,
                      backgroundColor: active ? '#10B98122' : '#0F172A',
                      color: active ? '#34D399' : '#94A3B8',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {active && <Check size={14} />}
                    {opt.name} {opt.price > 0 && `(+${opt.price.toFixed(3)} DT)`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Température & Food */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#6366F1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ❄️ Température & Cuisson
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVAILABLE_OPTIONS.filter(o => ['TEMP', 'FOOD'].includes(o.category)).map(opt => {
                const active = selectedOptionIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `2px solid ${active ? '#6366F1' : '#334155'}`,
                      backgroundColor: active ? '#6366F122' : '#0F172A',
                      color: active ? '#818CF8' : '#94A3B8',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {active && <Check size={14} />}
                    {opt.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions libres */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📝 Note / Instruction Cuisine
            </div>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: En tasse à emporter, très chaud, sans couvercle..."
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                border: '1px solid #334155',
                backgroundColor: '#0F172A',
                color: '#FFF',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#0F172A',
          borderTop: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Prix Unitaire Ajusté :</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>
              {finalUnitPrice.toFixed(3)} DT
            </div>
          </div>
          <button
            onClick={handleApply}
            style={{
              height: 48,
              padding: '0 28px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFF',
              fontSize: 15,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Check size={18} /> Valider les Options
          </button>
        </div>
      </div>
    </div>
  );
}
