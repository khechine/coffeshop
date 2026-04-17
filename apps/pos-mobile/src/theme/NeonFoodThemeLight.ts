import { Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

export const NeonFoodThemeLight: ITheme = {
  colors: {
    // Backgrounds (Light Mode)
    background: '#FFFFFF',      // Clean white
    surface: '#F8F9FA',         // Ultra-light grey
    surfaceLight: '#FFE8E0',    // Soft neon orange highlight
    
    // Electric Accents
    caramel: '#FF4D00',         // Electric Burger Orange (Primary)
    cream: '#1A1110',           // Deep charred wood for text
    creamMuted: 'rgba(26, 17, 16, 0.5)', 
    softOrange: '#FFCC00',      // Electric Mustard Yellow
    
    // Status
    success: '#00B36B',         // Darker neon mint
    danger: '#FF003C',          // Neon Crimson
    
    // Neon Overlays
    glassBg: 'rgba(255, 255, 255, 0.85)', 
    glassBorder: 'rgba(255, 77, 0, 0.2)',
  },
  
  shapes: {
    radiusSm: 14,
    radiusMd: 18,
    radiusLg: 28,
    radiusXl: 40,
  },
  
  shadows: {
    floating: Platform.select({
      ios: {
        shadowColor: '#FF4D00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 16px rgba(255, 77, 0, 0.15)',
      }
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#FFCC00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 0 15px rgba(255, 204, 0, 0.5)',
      }
    })
  }
};
