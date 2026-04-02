import React, { useMemo } from 'react';
import { TouchableWithoutFeedback, TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { usePOSStore } from '../../store/posStore';

interface FloatingCardProps {
  name: string;
  price: number;
  qty: number;
  icon?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  name,
  price,
  qty,
  icon = '☕',
  onPress,
  onLongPress
}) => {
  const { theme } = usePOSStore();
  const scale = useSharedValue(1);
  const isSelected = qty > 0;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
      >
        <Animated.View style={[
          styles.card, 
          animatedStyle,
          isSelected && styles.cardSelected
        ]}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <Text style={styles.price}>{price.toFixed(3)} DT</Text>
          
          {isSelected && (
            <>
              {onLongPress && (
                <TouchableOpacity 
                  onPress={onLongPress}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: -10,
                    backgroundColor: theme.colors.danger,
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: theme.colors.background,
                    zIndex: 10,
                    elevation: 5
                  }}
                >
                  <Text style={{ color: theme.colors.background, fontSize: 22, fontWeight: '900', lineHeight: 24, marginTop: -2 }}>-</Text>
                </TouchableOpacity>
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{qty}</Text>
              </View>
            </>
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  wrapper: {
    width: '33.33%',
    padding: 6,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.shapes.radiusLg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...(theme.shadows.floating as any),
  },
  cardSelected: {
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.caramel,
    ...(theme.shadows.glow as any),
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  name: {
    color: theme.colors.cream,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  price: {
    color: theme.colors.caramel,
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.softOrange,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  badgeText: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: '900',
  }
});
