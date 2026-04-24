// Named export used by our custom screens
export const Colors = {
  primary: '#10b981',
  secondary: '#3b82f6',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  // Theme sub-objects (also used as default export for Themed component)
  light: {
    text: '#11181C',
    background: '#f1f5f9',
    tint: '#10b981',
    tabIconDefault: '#687076',
    tabIconSelected: '#10b981',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0a0f1e',
    tint: '#10b981',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#10b981',
  },
  glass: {
    white: 'rgba(255, 255, 255, 0.05)',
    green: 'rgba(16, 185, 129, 0.1)',
    blue: 'rgba(59, 130, 246, 0.1)',
  },
};

// Default export expected by the Themed component
export default Colors;
