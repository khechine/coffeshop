import { Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

export const AntigravityThemeLight: ITheme = {
  colors: {
    // Backgrounds (Light Mode)
    background: '#FAF7F2',      // Warm Off-White / Cream
    surface: '#FFFFFF',         // Pure White for cards
    surfaceLight: '#F3E9DD',    // Soft beige for highlights
    
    // Accents & Warm tones
    caramel: '#D48446',         // Primary CTA stays consistent
    cream: '#4A3728',           // Dark Espresso for primary text
    creamMuted: 'rgba(74, 55, 40, 0.5)', // Muted text
    softOrange: '#E67E22',      // Slightly deeper orange for visibility
    
    // Status
    success: '#059669',
    danger: '#DC2626',
    
    // Glassmorphism overlays
    glassBg: 'rgba(255, 255, 255, 0.7)', 
    glassBorder: 'rgba(212, 132, 70, 0.15)',
  },
  
  shapes: {
    radiusSm: 12,
    radiusMd: 16,
    radiusLg: 24,
    radiusXl: 32,
  },
  
  shadows: {
    floating: Platform.select({
      ios: {
        shadowColor: 'rgba(74, 55, 40, 0.2)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 16px rgba(74, 55, 40, 0.1)',
      }
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#D48446',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 0 12px rgba(212, 132, 70, 0.3)',
      }
    })
  }
};
