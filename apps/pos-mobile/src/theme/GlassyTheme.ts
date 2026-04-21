import { Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

export const GlassyTheme: ITheme = {
  colors: {
    // Backgrounds (Cinematic Coffee Theme)
    background: '#120F0E',      // Dark Espresso
    surface: 'rgba(255, 243, 224, 0.08)', // Frosted Warm Glass
    surfaceLight: 'rgba(212, 132, 70, 0.15)', // Highlighted Caramel Glass
    
    // Accents (Warm & Tasty)
    caramel: '#D48446',         // Classic Caramel (Primary Accent)
    cream: '#F5E6D3',           // Soft Cream text
    creamMuted: 'rgba(245, 230, 211, 0.5)',
    softOrange: '#E67E22',      // Burnt Orange
    
    // Status
    success: '#059669',
    danger: '#B91C1C',
    
    // Glassmorphism specific
    glassBg: 'rgba(18, 15, 14, 0.2)', // Darker tint for contrast
    glassBorder: 'rgba(212, 132, 70, 0.25)', // Golden/Caramel border
  },
  
  shapes: {
    radiusSm: 14,
    radiusMd: 20,
    radiusLg: 28,
    radiusXl: 40,
  },
  
  shadows: {
    floating: Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
      }
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#D48446',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 0 24px rgba(212, 132, 70, 0.4)',
      }
    })
  }
};
