import { Platform } from 'react-native';
import { ITheme } from './ThemeInterface';

export const NeonFoodTheme: ITheme = {
  colors: {
    // High-contrast Fast Food Vibes
    background: '#0A0908',      // Absolute Black-Brown
    surface: '#1A1110',         // Deep charred wood
    surfaceLight: '#2D1816',    // Warm highlight
    
    // Electric Accents
    caramel: '#FF4D00',         // Electric Burger Orange (Primary)
    cream: '#FFFFFF',           // Pure White text for high visibility
    creamMuted: 'rgba(255, 255, 255, 0.6)', 
    softOrange: '#FFCC00',      // Electric Mustard Yellow
    
    // Status
    success: '#00FF9C',         // Neon Mint
    danger: '#FF003C',          // Neon Crimson
    
    // Neon Overlays
    glassBg: 'rgba(10, 9, 8, 0.8)', 
    glassBorder: 'rgba(255, 77, 0, 0.3)',
  },
  
  shapes: {
    // Slightly more rounded for a friendly "food" look
    radiusSm: 14,
    radiusMd: 18,
    radiusLg: 28,
    radiusXl: 40,
  },
  
  shadows: {
    floating: Platform.select({
      ios: {
        shadowColor: '#FF4D00',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 10px 20px rgba(255, 77, 0, 0.3)',
      }
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#FFCC00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 0 20px rgba(255, 204, 0, 0.8)',
      }
    })
  }
};
