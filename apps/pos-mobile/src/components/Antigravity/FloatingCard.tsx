import React, { useMemo } from 'react';
import { TouchableWithoutFeedback, TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { usePOSStore } from '../../store/posStore';
import { TallyGrid } from './TallyGrid';

interface FloatingCardProps {
  id: string; // Add id
  name: string;
  price: number;
  qty: number;
  takeawayQty?: number;
  icon?: string;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleTakeaway?: () => void;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  id,
  name,
  price,
  qty,
  takeawayQty = 0,
  icon = '☕',
  onPress,
  onLongPress,
  onToggleTakeaway
}) => {
  const { theme, themeMode } = usePOSStore();
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
                <>
                  <TouchableOpacity 
                    onPress={onLongPress}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    style={styles.actionButtonLeft}
                  >
                    <Text style={styles.actionText}>-</Text>
                  </TouchableOpacity>

                  {onToggleTakeaway && (
                    <TouchableOpacity 
                      onPress={onToggleTakeaway}
                      style={styles.actionButtonRight}
                    >
                      <Text style={{ fontSize: 16 }}>{takeawayQty > 0 ? '🛍️' : '🏠'}</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ width: '100%', paddingHorizontal: 4 }}>
                    <TallyGrid count={qty} theme={theme} themeMode={themeMode} takeawayQty={takeawayQty} />
                  </View>
                </>
              )}
              {!onLongPress && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{qty}</Text>
                </View>
              )}
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
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...(theme.shadows.floating as any),
  },
  cardSelected: {
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.caramel,
    minHeight: 180, // Expand to show grid
    ...(theme.shadows.glow as any),
  },
  actionButtonLeft: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: theme.colors.danger,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
    zIndex: 10,
    elevation: 5
  },
  actionButtonRight: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: theme.colors.surface,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.caramel,
    zIndex: 10,
    elevation: 5
  },
  actionText: {
    color: theme.colors.background,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: -2
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
