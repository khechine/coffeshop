import React, { useMemo } from 'react';
import { TouchableWithoutFeedback, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { usePOSStore } from '../../store/posStore';

interface RachmaButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger';
}

export const RachmaButton: React.FC<RachmaButtonProps> = ({ 
  label, 
  onPress,
  variant = 'primary'
}) => {
  const { theme } = usePOSStore();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 12, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const isPrimary = variant === 'primary';
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableWithoutFeedback 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[
        styles.button, 
        isPrimary ? styles.primary : styles.danger,
        animatedStyle
      ]}>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: theme.shapes.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    ...(theme.shadows.floating as any),
  },
  primary: {
    backgroundColor: theme.colors.caramel,
    ...(theme.shadows.glow as any),
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  label: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
