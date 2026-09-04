'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, LayoutGrid, Coffee, Zap, ShoppingCart,
  CheckCircle2, ChevronRight, ChevronLeft, X, Sparkles,
  HelpCircle, ArrowUpRight, BookOpen, Layers
} from 'lucide-react';

export default function OnboardingHelper() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Vérifie si le guide a déjà été fermé lors d'une session précédente
    const hasSeenGuide = localStorage.getItem('elkassa_guide_seen');
    if (!hasSeenGuide) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('elkassa_guide_seen', 'true');
  };

  const handleReopen = () => {
    setIsOpen(true);
  };

  const STEPS = [
    {
      id: 'products',
      title: '1. Produits, Fiches Techniques & Emballages',
      icon: Package,
      color: '#6366F1',
      description: 'Créez votre catalogue de produits, définissez les prix et les taux de TVA. Associez des fiches techniques (BOM) pour déduire automatiquement les matières premières (café, lait) ET les emballages à emporter (gobelets, couvercles, sacs kraft) selon le mode de service !',
      link: '/admin/products',
      linkLabel: 'Ouvrir la gestion des produits & BOM',
    },
    {
      id: 'tables',
      title: '2. Configurer le plan de salle & tables',
      icon: LayoutGrid,
      color: '#EC4899',
      description: 'Concevez votre plan de salle interactif avec l\'éditeur visuel. Organisez vos tables par zones (Terrasse, Salle Principale, Étage) avec numérotation automatique intelligente sans doublons.',
      link: '/admin/tables',
      linkLabel: 'Éditer le plan de salle & tables',
    },
    {
      id: 'pos',
      title: '3. Prise de commande & Caisse POS',
      icon: Coffee,
      color: '#10B981',
      description: 'Accédez à la caisse tactile POS pour encaisser rapidement vos clients, attribuer les commandes aux tables occupées, imprimer les tickets de caisse et enregistrer les paiements.',
      link: '/pos',
      linkLabel: 'Ouvrir la Caisse POS',
    },
    {
      id: 'kds',
      title: '4. Écran Cuisine & Bar (KDS)',
      icon: Zap,
      color: '#F59E0B',
      description: 'Visualisez les commandes envoyées par les serveurs ou la caisse en temps réel sur l\'écran cuisine. Validez la préparation des plats et avertissez le personnel de salle dès que c\'est prêt.',
      link: '/admin/kds',
      linkLabel: 'Consulter l\'écran KDS Cuisine',
    },
    {
      id: 'marketplace',
      title: '5. Sourcing & Marketplace B2B',
      icon: ShoppingCart,
      color: '#8B5CF6',
      description: 'Approvisionnez votre établissement en matières premières (grains de café, lait, viandes, légumes, emballages...) directement auprès des fournisseurs certifiés avec tarification de gros.',
      link: '/marketplace',
      linkLabel: 'Explorer la Marketplace B2B',
    },
  ];

  const currentStep = STEPS[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <>
      {/* ── FLOATING LAUNCHER BUTTON (Bottom Right) ── */}
      {!isOpen && (
        <button
          onClick={handleReopen}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9990,
            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '100px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Sparkles size={18} color="#FDE047" />
          <span>💡 Guide Rapide</span>
        </button>
      )}

      {/* ── MODAL BACKDROP & OVERLAY ── */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          {/* Modal Container */}
          <div style={{
            maxWidth: '680px',
            width: '100%',
            background: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            color: '#F8FAFC',
            boxSizing: 'border-box'
          }}>
            {/* Close Button */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94A3B8',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} />
            </button>

            {/* Header Badge & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818CF8', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              <BookOpen size={16} /> Guide des Fonctionnalités ElKassa
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 20px 0', letterSpacing: '-0.5px' }}>
              Découverte interactive de votre plateforme
            </h2>

            {/* Stepper Navigation Pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {STEPS.map((s, idx) => {
                const isActive = idx === activeStep;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(idx)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: isActive ? `2px solid ${s.color}` : '1px solid rgba(255,255,255,0.08)',
                      background: isActive ? `${s.color}20` : 'rgba(15, 23, 42, 0.6)',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      fontSize: '13px',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>Étape {idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Feature Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: `1px solid ${currentStep.color}40`,
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '28px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: `${currentStep.color}25`,
                  color: currentStep.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <StepIcon size={26} />
                </div>

                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                    {currentStep.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                    {currentStep.description}
                  </p>
                </div>
              </div>

              {/* Direct Action Link */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link
                  href={currentStep.link}
                  onClick={handleClose}
                  style={{
                    background: currentStep.color,
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: `0 4px 14px ${currentStep.color}40`
                  }}
                >
                  {currentStep.linkLabel} <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>

            {/* Modal Controls Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: activeStep === 0 ? '#475569' : '#F8FAFC',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ChevronLeft size={16} /> Précédent
              </button>

              <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
                {activeStep + 1} sur {STEPS.length}
              </div>

              {activeStep < STEPS.length - 1 ? (
                <button
                  onClick={() => setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  Suivant <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Compris ! <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
