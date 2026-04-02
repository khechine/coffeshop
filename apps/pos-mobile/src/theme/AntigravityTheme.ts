import { StyleSheet, Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

export const AntigravityTheme: ITheme = {
  colors: {
    // Backgrounds (Dark Mode dominant)
    background: '#120F0E',      // Deep Espresso
    surface: '#1A1614',         // Lighter Espresso for cards
    surfaceLight: '#2C1B18',    // Highlight Espresso
    
    // Accents & Warm tones
    caramel: '#D48446',         // Primary CTA, Highlights
    cream: '#F5E6D3',           // Text primary
    creamMuted: 'rgba(245, 230, 211, 0.6)', // Text secondary
    softOrange: '#FF9F43',      // Warnings, Badges
    
    // Status
    success: '#059669',
    danger: '#EF4444',
    
    // Glassmorphism overlays
    glassBg: 'rgba(26, 22, 20, 0.6)', 
    glassBorder: 'rgba(245, 230, 211, 0.1)',
  },
  
  shapes: {
    radiusSm: 12,
    radiusMd: 16,
    radiusLg: 24,
    radiusXl: 32,
  },
  
  shadows: {
    // Levitation effect
    floating: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
      }
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#D48446',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 0 16px rgba(212, 132, 70, 0.6)',
      }
    })
  }
};
