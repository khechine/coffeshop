'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { getConfirmedVendorIds } from '../actions';

export type VaultLevel = 1 | 2 | 3;

interface VaultContextType {
  getVaultLevel: (vendorId: string) => VaultLevel;
  unlockedVendorIds: string[];
  refreshUnlockedVendors: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { cart } = useCart();
  const [unlockedVendorIds, setUnlockedVendorIds] = useState<string[]>([]);

  const refreshUnlockedVendors = async () => {
    try {
      const ids = await getConfirmedVendorIds();
      setUnlockedVendorIds(ids);
    } catch (e) {
      console.error('Failed to fetch unlocked vendors:', e);
    }
  };

  useEffect(() => {
    refreshUnlockedVendors();
  }, []);

  const getVaultLevel = (vendorId: string | null | undefined): VaultLevel => {
    if (!vendorId) return 1;

    // Stade 3 : Commande Confirmée
    if (unlockedVendorIds.includes(vendorId)) {
      return 3;
    }

    // Stade 2 : Présent dans le panier
    const isInCart = cart.some(item => item.vendor?.id === vendorId);
    if (isInCart) {
      return 2;
    }

    // Stade 1 : Profil (Login requis - Valeur par défaut)
    return 1;
  };

  return (
    <VaultContext.Provider value={{ getVaultLevel, unlockedVendorIds, refreshUnlockedVendors }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(vendorId?: string | null, isPremium: boolean = false) {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }

  const level = vendorId ? context.getVaultLevel(vendorId) : 1;

  // Identity is visible if level >= 2 OR if vendor is Premium (Stade 1)
  const identityVisible = level >= 2 || isPremium;

  return {
    level,
    identityVisible,
    isNameVisible: identityVisible,
    isLogoVisible: identityVisible,
    isContactVisible: level >= 3,
    maskName: (name: string) => identityVisible ? name : "Fournisseur Vérifié",
    maskLogo: (logo: string | null | undefined) => identityVisible ? logo : null,
    maskCity: (city: string | null | undefined) => identityVisible ? (city || 'Tunisie') : 'Ville masquée',
    ...context
  };
}

