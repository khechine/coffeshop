'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Coffee, Utensils, Croissant, Cake, CupSoda,
  CheckCircle2, ChevronRight, ChevronLeft, PackageCheck,
  ShieldCheck, HelpCircle, Sparkles, Building2, Store,
  Check, ArrowRight, Layers, Receipt, Zap, BookOpen,
  Award, ArrowUpRight
} from 'lucide-react';
import { BUSINESS_TYPES, DATA_PACKS } from '../../lib/data-packs';
import { completeSetupAction } from '../../actions';

interface SetupWizardProps {
  storeName: string;
  initialIndustry?: string;
}

export default function SetupWizard({ storeName, initialIndustry = 'COFFEE_SHOP' }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(initialIndustry);
  const [installPack, setInstallPack] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Données fiscales (Formulaire Étape 3)
  const [fiscalData, setFiscalData] = useState({
    matriculeFiscal: '',
    commercialName: storeName || '',
    establishmentReference: '000',
    imdf: '',
    governorate: 'Tunis',
  });

  const activePack = DATA_PACKS[selectedIndustry] || DATA_PACKS['COFFEE_SHOP'];

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await completeSetupAction({
        industry: selectedIndustry,
        installDataPack: installPack,
        matriculeFiscal: fiscalData.matriculeFiscal,
        commercialName: fiscalData.commercialName,
        establishmentReference: fiscalData.establishmentReference,
        imdf: fiscalData.imdf,
        governorate: fiscalData.governorate,
      });
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Une erreur est survenue lors de la sauvegarde.');
      setIsSubmitting(false);
    }
  };

  const TUNISIAN_GOVERNORATES = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Bizerte', 'Zaghouan',
    'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
    'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Médenine', 'Tataouine', 'Béja', 'Jendouba', 'Le Kef', 'Siliana'
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
      color: '#F8FAFC',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Decorative Glow Background Effects */}
      <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '20%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,72,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      {/* Header Container */}
      <div style={{ maxWidth: '840px', width: '100%', marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818CF8', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 800, marginBottom: '16px' }}>
          <Sparkles size={16} /> ASSISTANT D'INITIALISATION METIER ELKASSA
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 8px 0', color: '#FFFFFF' }}>
          Configuration de votre boutique
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '15px', margin: 0, fontWeight: 500 }}>
          Personnalisez l'expérience <span style={{ color: '#818CF8', fontWeight: 700 }}>{storeName || 'Boutique'}</span> en 4 étapes rapides.
        </p>
      </div>

      {/* Step Indicator Bar */}
      <div style={{ maxWidth: '840px', width: '100%', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {/* Progress Bar Track */}
          <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '3px', background: 'rgba(255, 255, 255, 0.1)', zIndex: 0 }} />
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            width: step === 1 ? '0%' : step === 2 ? '26%' : step === 3 ? '53%' : '80%',
            height: '3px',
            background: 'linear-gradient(90deg, #6366F1, #EC4899)',
            transition: 'width 0.4s ease',
            zIndex: 0
          }} />

          {[
            { num: 1, label: 'Métier', icon: Store },
            { num: 2, label: 'Pack Données', icon: Layers },
            { num: 3, label: 'Fiscalité', icon: Receipt },
            { num: 4, label: 'Guide Solution', icon: BookOpen },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                onClick={() => isDone && setStep(s.num)}
                style={{
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isDone ? 'pointer' : 'default',
                  gap: '8px'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDone
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : isActive
                      ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
                      : 'rgba(30, 41, 59, 0.9)',
                  border: isActive ? '2px solid #818CF8' : isDone ? '2px solid #34D399' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.5)' : 'none',
                  color: isDone || isActive ? '#FFF' : '#64748B',
                  fontWeight: 800,
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}>
                  {isDone ? <Check size={20} /> : <Icon size={18} />}
                </div>
                <span style={{ fontSize: '12px', fontWeight: isActive ? 800 : 500, color: isActive ? '#F8FAFC' : isDone ? '#A7F3D0' : '#64748B' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Glassmorphic Card Container */}
      <div style={{
        maxWidth: '840px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        boxSizing: 'border-box'
      }}>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── STEP 1: METIER SELECTION ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#F8FAFC' }}>
              Étape 1 : Sélectionnez votre domaine d'activité
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
              Cette sélection adaptera l'interface POS, les modules recommandés et les catégories de produits.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {BUSINESS_TYPES.map((bt) => {
                const isSelected = selectedIndustry === bt.industry;
                return (
                  <div
                    key={bt.industry}
                    onClick={() => setSelectedIndustry(bt.industry)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      border: isSelected ? '2px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      boxShadow: isSelected ? '0 8px 24px rgba(99, 102, 241, 0.25)' : 'none'
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#6366F1', color: '#FFF', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} />
                      </div>
                    )}
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{bt.icon}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>{bt.label}</div>
                    <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.4 }}>{bt.description}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  color: '#FFF',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                }}
              >
                Suivant : Pack de démarrage <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: DATA PACK INSTALLATION ── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#F8FAFC' }}>
                  Étape 2 : Pack de démarrage prédéfini
                </h2>
                <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
                  Installez automatiquement des catégories, matières premières et produits adaptés.
                </p>
              </div>
              <span style={{ fontSize: '28px' }}>{activePack.icon}</span>
            </div>

            {/* Toggle Card */}
            <div style={{
              background: installPack ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.5)',
              border: installPack ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              cursor: 'pointer'
            }} onClick={() => setInstallPack(!installPack)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: installPack ? '#10B981' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <PackageCheck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#F8FAFC' }}>
                    Installer le pack initial "{activePack.label}"
                  </div>
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                    {installPack ? 'Inclus : Catégories + Ingrédients + Produits prêtes à l\'emploi' : 'Désactivé : Votre base restera vierge'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={installPack}
                onChange={(e) => setInstallPack(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#10B981', cursor: 'pointer' }}
              />
            </div>

            {/* Preview of items inside the pack */}
            {installPack && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '28px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#818CF8', margin: '0 0 16px 0' }}>
                  Aperçu du contenu du pack ({activePack.products.length} produits • {activePack.stockItems.length} matières premières)
                </h3>

                {/* Categories Pills */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Catégories incluses :</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {activePack.categories.map((c) => (
                      <span key={c.name} style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>{c.icon}</span> {c.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sample Products Table Preview */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Exemples de produits (Prix en DT) :</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                    {activePack.products.slice(0, 6).map((p) => (
                      <div key={p.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0' }}>{p.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#34D399' }}>{p.price.toFixed(3)} DT</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#F8FAFC', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronLeft size={18} /> Retour
              </button>
              <button
                onClick={() => setStep(3)}
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#FFF', border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}
              >
                Suivant : Données Fiscales <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: FISCAL & LEGAL DATA FORM ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#F8FAFC' }}>
              Étape 3 : Informations Légales & Fiscales (Optionnel)
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
              Indiquez votre matricule fiscal pour activer l'émission de tickets de caisse conformes NACEF.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Nom commercial de la boutique
                </label>
                <input
                  type="text"
                  value={fiscalData.commercialName}
                  onChange={(e) => setFiscalData({ ...fiscalData, commercialName: e.target.value })}
                  placeholder="Ex: El Kassa Café"
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 14px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Matricule Fiscal (NIF)
                </label>
                <input
                  type="text"
                  value={fiscalData.matriculeFiscal}
                  onChange={(e) => setFiscalData({ ...fiscalData, matriculeFiscal: e.target.value })}
                  placeholder="Ex: 1234567A"
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 14px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Gouvernorat
                </label>
                <select
                  value={fiscalData.governorate}
                  onChange={(e) => setFiscalData({ ...fiscalData, governorate: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 14px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                >
                  {TUNISIAN_GOVERNORATES.map((g) => (
                    <option key={g} value={g} style={{ background: '#0F172A', color: '#FFF' }}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Code Établissement (3 chiffres)
                </label>
                <input
                  type="text"
                  value={fiscalData.establishmentReference}
                  onChange={(e) => setFiscalData({ ...fiscalData, establishmentReference: e.target.value })}
                  placeholder="000 (Principal)"
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 14px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Fiscal info alert */}
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '28px' }}>
              <ShieldCheck size={22} color="#818CF8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                <strong style={{ color: '#818CF8' }}>Conformité Fiscale NACEF :</strong> Vous pourrez ajuster ou compléter vos identifiants fiscaux à tout moment dans <span style={{ color: '#FFF', fontWeight: 700 }}>Paramètres → NACEF</span>.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(2)}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#F8FAFC', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronLeft size={18} /> Retour
              </button>
              <button
                onClick={() => setStep(4)}
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#FFF', border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}
              >
                Suivant : Guide des fonctionnalités <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: DYNAMIC FEATURE GUIDE ── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#F8FAFC' }}>
              Étape 4 : Découvrez vos outils de gestion
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
              Voici un aperçu des modules puissants prêts pour votre activité.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { title: 'Caisse Tactile (POS)', icon: Coffee, color: '#818CF8', desc: 'Saisie rapide des commandes sur place ou à emporter, plan de salle et impression tickets' },
                { title: 'Écran Cuisine (KDS)', icon: Zap, color: '#F43F5E', desc: 'Gestion en temps réel des commandes envoyées en cuisine ou bar' },
                { title: 'Stock & Emballages (BOM)', icon: Layers, color: '#34D399', desc: 'Nomenclatures produits, déduction automatique des emballages à emporter (gobelets, couvercles) et alertes seuil bas' },
                { title: 'Marketplace B2B', icon: Store, color: '#F59E0B', desc: 'Commandez vos matières premières et emballages directement auprès des fournisseurs' },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${feat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feat.color, marginBottom: '12px' }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>{feat.title}</div>
                    <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.4 }}>{feat.desc}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setStep(3)}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#F8FAFC', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronLeft size={18} /> Retour
              </button>

              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFF',
                  border: 'none',
                  padding: '16px 36px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '16px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? (
                  <>Initialisation en cours...</>
                ) : (
                  <>Lancer ma boutique <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
