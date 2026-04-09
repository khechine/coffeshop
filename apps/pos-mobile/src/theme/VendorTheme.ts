import { Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

// B2B Pro — Tamagui style (pure dark, subtle glass, neon accents)
export const VendorTheme: ITheme = {
  colors: {
    // Pure dark backgrounds (Tamagui signature)
    background: '#050505',    // Near true black
    surface: '#151515',       // Very dark grey card
    surfaceLight: '#232323',  // Hover / pressed state / subtle highlights

    // Neon accent system
    caramel: '#BD34FE',       // Neon Violet/Pink for primary actions
    cream: '#EDEDED',         // Text primary (soft bright white)
    creamMuted: '#8A8A8A',    // Text secondary (soft grey)
    softOrange: '#00E2FF',    // Neon Cyan for highlights / secondary

    // Status
    success: '#22C55E',
    danger: '#F87171',

    // Glassmorphism overlays
    glassBg: 'rgba(21, 21, 21, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.08)', // Extremely subtle white border
  },

  shapes: {
    radiusSm: 10,
    radiusMd: 18,
    radiusLg: 24,
    radiusXl: 32,
  },

  shadows: {
    floating: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
      }
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#BD34FE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 0 24px rgba(189, 52, 254, 0.35)',
      }
    }),
  },
};
