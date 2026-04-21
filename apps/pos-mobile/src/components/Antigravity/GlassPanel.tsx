import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { usePOSStore } from '../../store/posStore';
import { GlassyTheme } from '../../theme/GlassyTheme';

interface GlassPanelProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  intensity = 50,
  style,
  ...props 
}) => {
  const { theme } = usePOSStore();

  // Fallback for Web or unsupported platforms where BlurView might be heavy
  if (Platform.OS === 'web') {
    return (
      <View style={[
        styles.container, 
        { borderRadius: theme.shapes.radiusLg, borderColor: theme.colors.glassBorder },
        { backgroundColor: theme.colors.background + 'D9' }, // 85% opacity
        style
      ]} {...props}>
        {children}
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      { borderRadius: theme.shapes.radiusLg, borderColor: theme.colors.glassBorder },
      style
    ]} {...props}>
      <BlurView 
        intensity={intensity} 
        tint="dark" 
        style={StyleSheet.absoluteFill} 
      />
      {/* Subtle overlay to ensure readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.glassBg }]} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 0.8,
  }
});
