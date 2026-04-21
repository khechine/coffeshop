import { StyleSheet, Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

export const AntigravityTheme: ITheme = {
  colors: {
    // Backgrounds (Dark Mode dominant)
    // Backgrounds (Dark Mode dominant)
    background: '#0D0B0A',      // Pure Obsidian Espresso
    surface: '#151210',         // Rich Charcoal 
    surfaceLight: '#231E1B',    // Highlight Surface
    
    // Accents & Warm tones
    caramel: '#D48446',         // Liquid Gold / Caramel
    cream: '#F2E8DA',           // Warm Silky Cream
    creamMuted: 'rgba(242, 232, 218, 0.5)', // Muted Silk
    softOrange: '#E67E22',      // Deep Saffron / Warnings
    
    // Status
    success: '#10B981',
    danger: '#F43F5E',
    
    // Glassmorphism overlays
    glassBg: 'rgba(21, 18, 16, 0.75)', 
    glassBorder: 'rgba(242, 232, 218, 0.08)',
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
