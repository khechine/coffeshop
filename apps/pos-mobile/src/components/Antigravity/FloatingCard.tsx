import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { TouchableWithoutFeedback, TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { usePOSStore } from '../../store/posStore';
import { TallyGrid } from './TallyGrid';
import { GlassPanel } from './GlassPanel';

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
    scale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onLongPress?.();
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Derived icon based on name if default ☕ is used
  const displayIcon = useMemo(() => {
    if (icon !== '☕') return icon;
    const low = name.toLowerCase();
    if (low.includes('jus')) return '🧃';
    if (low.includes('eau') || low.includes('soda')) return '🥤';
    if (low.includes('thé') || low.includes('the')) return '🫖';
    if (low.includes('viennoiserie') || low.includes('croissant')) return '🥐';
    if (low.includes('chicha')) return '💨';
    return icon;
  }, [name, icon]);

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
      >
        <Animated.View style={[
          styles.cardContainer, 
          animatedStyle,
        ]}>
          <GlassPanel intensity={isSelected ? 60 : 35} style={[
            styles.card,
            isSelected && styles.cardSelected
          ]}>
            <View style={styles.topRow}>
              <Text style={styles.icon}>{displayIcon}</Text>
              {isSelected && !onLongPress && (
                <View style={styles.miniBadge}>
                  <Text style={styles.miniBadgeText}>{qty}</Text>
                </View>
              )}
            </View>
            <Text style={styles.name} numberOfLines={2}>{name.toUpperCase()}</Text>
            <Text style={styles.price}>{price.toFixed(3)} <Text style={{ fontSize: 9, opacity: 0.7 }}>DT</Text></Text>
            
            {isSelected && onLongPress && (
              <View style={styles.activeControls}>
                <TouchableOpacity 
                   onPress={() => {
                     if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                     onLongPress();
                   }}
                   hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                   style={styles.actionButtonMinus}
                >
                  <Text style={styles.actionText}>-</Text>
                </TouchableOpacity>

                {onToggleTakeaway && (
                  <TouchableOpacity 
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onToggleTakeaway();
                    }}
                    style={styles.actionButtonTakeaway}
                  >
                    <Text style={{ fontSize: 16 }}>{takeawayQty > 0 ? '🛍️' : '🏠'}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.tallyContainer}>
                  <TallyGrid count={qty} theme={theme} themeMode={themeMode} takeawayQty={takeawayQty} />
                </View>
              </View>
            )}
          </GlassPanel>
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
  cardContainer: {
    borderRadius: theme.shapes.radiusLg,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.shapes.radiusLg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    borderWidth: 1,
    borderColor: 'rgba(242, 232, 218, 0.08)',
    ...(theme.shadows.floating as any),
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 132, 70, 0.08)',
    borderColor: 'rgba(212, 132, 70, 0.4)',
    minHeight: 190,
    ...(theme.shadows.glow as any),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: '100%',
  },
  activeControls: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  actionButtonMinus: {
    position: 'absolute',
    top: -110,
    left: -10,
    backgroundColor: theme.colors.danger,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
    zIndex: 20,
  },
  actionButtonTakeaway: {
    position: 'absolute',
    top: -110,
    right: -10,
    backgroundColor: theme.colors.surface,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.caramel,
    zIndex: 20,
  },
  tallyContainer: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  actionText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: -2
  },
  icon: {
    fontSize: 32,
    marginBottom: 2,
  },
  name: {
    color: theme.colors.cream,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  price: {
    color: theme.colors.caramel,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  miniBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: theme.colors.caramel,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniBadgeText: {
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: '900',
  }
});
