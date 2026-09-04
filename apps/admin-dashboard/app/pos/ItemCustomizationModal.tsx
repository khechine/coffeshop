'use client';

import React, { useState } from 'react';
import { X, Check, Plus, Coffee, Sparkles, Flame, Utensils, CupSoda, ShoppingBag } from 'lucide-react';

export interface CustomizationOption {
  id: string;
  name: string;
  category: 'MILK' | 'SUGAR' | 'SYRUP' | 'EXTRAS' | 'TEMP' | 'FOOD';
  price: number;
  stockItemName?: string; // Nom de la matière première associée en stock
}

const ALL_CUSTOMIZATION_OPTIONS: CustomizationOption[] = [
  // Lait (Boissons)
  { id: 'milk_oat', name: "Lait d'Avoine", category: 'MILK', price: 0.500, stockItemName: "Lait d'avoine" },
  { id: 'milk_almond', name: "Lait d'Amande", category: 'MILK', price: 0.500, stockItemName: "Lait d'amande" },
  { id: 'milk_skim', name: "Lait Écrémé", category: 'MILK', price: 0.000 },
  { id: 'milk_none', name: "Sans Lait", category: 'MILK', price: 0.000 },

  // Sucre (Boissons & Desserts)
  { id: 'sugar_none', name: "Sans Sucre (0%)", category: 'SUGAR', price: 0.000 },
  { id: 'sugar_half', name: "Peu Sucré (50%)", category: 'SUGAR', price: 0.000 },
  { id: 'sugar_normal', name: "Sucre Normal (100%)", category: 'SUGAR', price: 0.000 },

  // Sirops & Suppléments Boissons
  { id: 'syrup_vanilla', name: "Sirop Vanille", category: 'SYRUP', price: 0.300, stockItemName: "Sirop de vanille" },
  { id: 'syrup_caramel', name: "Sirop Caramel", category: 'SYRUP', price: 0.300, stockItemName: "Sirop de caramel" },
  { id: 'syrup_hazelnut', name: "Sirop Noisette", category: 'SYRUP', price: 0.300, stockItemName: "Sirop de noisette" },
  { id: 'extra_whipped', name: "Chantilly", category: 'EXTRAS', price: 0.400, stockItemName: "Crème fraîche" },
  { id: 'extra_shot', name: "Double Shot Expresso", category: 'EXTRAS', price: 1.000, stockItemName: "Café espresso (grains)" },

  // Suppléments Restauration / Food
  { id: 'extra_cheese', name: "Extra Fromage", category: 'EXTRAS', price: 0.500, stockItemName: "Fromage râpé" },
  { id: 'extra_sauce', name: "Sauce Piquante / Harissa", category: 'EXTRAS', price: 0.300, stockItemName: "Harissa" },

  // Température / Cuisson
  { id: 'temp_hot', name: "Chaud", category: 'TEMP', price: 0.000 },
  { id: 'temp_iced', name: "Avec Glaçons", category: 'TEMP', price: 0.000 },
  { id: 'temp_no_ice', name: "Sans Glaçons", category: 'TEMP', price: 0.000 },
  { id: 'food_heated', name: "Bien Chaud / Chauffe", category: 'FOOD', price: 0.000 },
];

interface Props {
  product: { id: string; name: string; price: number; category?: any };
  initialOptions?: string[];
  initialNotes?: string;
  onSave: (options: string[], notes: string, extraPrice: number) => void;
  onClose: () => void;
}

export function ItemCustomizationModal({ product, initialOptions = [], initialNotes = '', onSave, onClose }: Props) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(initialOptions);
  const [notes, setNotes] = useState<string>(initialNotes);

  // Détection du type de produit pour adapter l'affichage dynamiquement
  const prodName = (product.name || '').toLowerCase();
  const catName = (typeof product.category === 'string' ? product.category : product.category?.name || '').toLowerCase();

  const isFood = catName.includes('snack') || catName.includes('plat') || catName.includes('sandwich') || catName.includes('burger') || catName.includes('pizza') || catName.includes('salade') || catName.includes('couscous') || catName.includes('entree') || catName.includes('menu') || prodName.includes('sandwich') || prodName.includes('couscous') || prodName.includes('salade') || prodName.includes('brick');
  
  const isDrink = !isFood || catName.includes('boisson') || catName.includes('café') || catName.includes('thé') || catName.includes('jus') || catName.includes('smoothie') || prodName.includes('espresso') || prodName.includes('cappuccino') || prodName.includes('latte') || prodName.includes('thé') || prodName.includes('jus') || prodName.includes('eau');

  const showMilk = isDrink && !prodName.includes('eau') && !prodName.includes('jus d\'orange');
  const showSugar = isDrink || catName.includes('dessert') || catName.includes('pâtisserie');
  const showSyrupExtras = isDrink;
  const showFoodExtras = isFood;
  const showTemp = isDrink;
  const showFoodHeating = isFood;

  const toggleOption = (option: CustomizationOption) => {
    setSelectedOptionIds(prev => {
      // Pour MILK, SUGAR ou TEMP, sélection unique par catégorie
      if (['MILK', 'SUGAR', 'TEMP'].includes(option.category)) {
        const otherCategoryOptionIds = ALL_CUSTOMIZATION_OPTIONS
          .filter(o => o.category === option.category && o.id !== option.id)
          .map(o => o.id);
        const filtered = prev.filter(id => !otherCategoryOptionIds.includes(id));
        return filtered.includes(option.id) ? filtered.filter(id => id !== option.id) : [...filtered, option.id];
      }
      // Sélection multiple pour SYRUP, EXTRAS, FOOD
      return prev.includes(option.id) ? prev.filter(id => id !== option.id) : [...prev, option.id];
    });
  };

  const selectedOptionsList = ALL_CUSTOMIZATION_OPTIONS.filter(o => selectedOptionIds.includes(o.id));
  const extraPrice = selectedOptionsList.reduce((sum, o) => sum + o.price, 0);
  const finalUnitPrice = Number(product.price || 0) + extraPrice;

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
        maxWidth: 580,
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
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️ Personnaliser :</span> <span style={{ color: '#818CF8' }}>{product.name}</span>
            </h2>
            <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>
              Prix de base : {Number(product.price || 0).toFixed(3)} DT
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
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* 🥛 Type de Lait */}
          {showMilk && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🥛 Type de Lait
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_CUSTOMIZATION_OPTIONS.filter(o => o.category === 'MILK').map(opt => {
                  const active = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `2px solid ${active ? '#3B82F6' : '#334155'}`,
                        backgroundColor: active ? '#2563EB25' : '#0F172A',
                        color: active ? '#60A5FA' : '#CBD5E1',
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
          )}

          {/* 🍬 Niveau de Sucre */}
          {showSugar && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#EC4899', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🍬 Niveau de Sucre
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_CUSTOMIZATION_OPTIONS.filter(o => o.category === 'SUGAR').map(opt => {
                  const active = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `2px solid ${active ? '#EC4899' : '#334155'}`,
                        backgroundColor: active ? '#EC489925' : '#0F172A',
                        color: active ? '#F472B6' : '#CBD5E1',
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
          )}

          {/* ✨ Sirops & Suppléments Boissons */}
          {showSyrupExtras && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✨ Sirops & Suppléments
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_CUSTOMIZATION_OPTIONS.filter(o => ['SYRUP', 'EXTRAS'].includes(o.category) && !['extra_cheese', 'extra_sauce'].includes(o.id)).map(opt => {
                  const active = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `2px solid ${active ? '#10B981' : '#334155'}`,
                        backgroundColor: active ? '#10B98125' : '#0F172A',
                        color: active ? '#34D399' : '#CBD5E1',
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
          )}

          {/* 🍔 Suppléments Restauration */}
          {showFoodExtras && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🍔 Suppléments Gourmands
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_CUSTOMIZATION_OPTIONS.filter(o => ['extra_cheese', 'extra_sauce'].includes(o.id)).map(opt => {
                  const active = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `2px solid ${active ? '#10B981' : '#334155'}`,
                        backgroundColor: active ? '#10B98125' : '#0F172A',
                        color: active ? '#34D399' : '#CBD5E1',
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
          )}

          {/* ❄️ Température Boissons */}
          {showTemp && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#818CF8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ❄️ Température & Glaçons
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_CUSTOMIZATION_OPTIONS.filter(o => o.category === 'TEMP').map(opt => {
                  const active = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `2px solid ${active ? '#818CF8' : '#334155'}`,
                        backgroundColor: active ? '#818CF825' : '#0F172A',
                        color: active ? '#A5B4FC' : '#CBD5E1',
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
          )}

          {/* 🔥 Température / Cuisson Plats */}
          {showFoodHeating && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F43F5E', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔥 Cuisson & Chauffage
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_CUSTOMIZATION_OPTIONS.filter(o => o.category === 'FOOD').map(opt => {
                  const active = selectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `2px solid ${active ? '#F43F5E' : '#334155'}`,
                        backgroundColor: active ? '#F43F5E25' : '#0F172A',
                        color: active ? '#FDA4AF' : '#CBD5E1',
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
          )}

          {/* 📝 Instructions / Notes Cuisine */}
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
                padding: 14,
                borderRadius: 12,
                border: '1px solid #334155',
                backgroundColor: '#0F172A',
                color: '#FFF',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none'
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
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Prix Unitaire Ajusté :</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>
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
