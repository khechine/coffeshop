import { Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

export const VendorThemeLight: ITheme = {
  colors: {
    // Pure light backgrounds (Clean Pro Look)
    background: '#F9F9F9',    // Very light grey / white
    surface: '#FFFFFF',       // White card
    surfaceLight: '#F0F0F0',  // Light grey for hover / subtle highlights

    // Professional accent system
    caramel: '#7C3AED',       // Solid Purple (Primary)
    cream: '#1F2937',         // Dark text (Slate 800)
    creamMuted: '#6B7280',    // Muted text (Slate 500)
    softOrange: '#0EA5E9',    // Solid Cyan for secondary

    // Status
    success: '#10B981',
    danger: '#EF4444',

    // Overlays
    glassBg: 'rgba(255, 255, 255, 0.9)',
    glassBorder: 'rgba(0, 0, 0, 0.05)', 
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 0 12px rgba(124, 58, 237, 0.2)',
      }
    }),
  },
};
