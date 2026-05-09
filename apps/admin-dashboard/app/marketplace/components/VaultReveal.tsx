'use client';

import React from 'react';
import { useVault, VaultLevel } from '../VaultContext';
import { Lock } from 'lucide-react';

interface VaultRevealProps {
  vendorId: string;
  levelRequired: VaultLevel;
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function VaultReveal({ 
  vendorId, 
  levelRequired, 
  children, 
  placeholder, 
  className,
  style 
}: VaultRevealProps) {
  const { level } = useVault(vendorId);
  const isLocked = level < levelRequired;

  const message = levelRequired === 2 
    ? "Ajoutez un produit au panier pour révéler l'identité" 
    : "Passez commande pour débloquer le contact direct";

  return (
    <div 
      className={className} 
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
      }}
      title={isLocked ? message : ""}
    >
      <div style={{ 
        filter: isLocked ? 'blur(10px)' : 'none', 
        userSelect: isLocked ? 'none' : 'auto', 
        opacity: isLocked ? 0.5 : 1,
        transition: 'all 0.8s ease-out'
      }}>
        {isLocked && placeholder ? placeholder : children}
      </div>

      {isLocked && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(2px)',
          borderRadius: 'inherit',
          zIndex: 10,
          transition: 'opacity 0.5s ease'
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: '50%', 
            padding: '6px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #F3F4F6'
          }}>
            <Lock size={14} color="#E31E24" fill="#FEF2F2" />
          </div>
        </div>
      )}
    </div>
  );
}

