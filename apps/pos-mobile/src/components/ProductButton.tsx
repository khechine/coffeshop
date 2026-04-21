import React, { useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated } from 'react-native';
import { usePOSStore, Product } from '../store/posStore';
import { GlassPanel } from './Antigravity/GlassPanel';

interface ProductButtonProps {
  product: Product;
}

// ─── DYNAMIC CATEGORY COLOR PALETTE ───────────────────────
const CATEGORY_PALETTE: Record<string, string> = {
  'cafés':    '#6F4E37',
  'café':     '#6F4E37',
  'cafes':    '#6F4E37',
  'jus':      '#F97316',
  'boissons': '#0EA5E9',
  'gâteaux':  '#EC4899',
  'gateaux':  '#EC4899',
  'pizzas':   '#EF4444',
  'pizza':    '#EF4444',
  'chicha':   '#9333EA',
  'jeux':     '#F59E0B',
  'autres':   '#64748B',
};

const FALLBACK_COLORS = [
  '#A1887F', '#8D6E63', '#795548', '#6D4C41',
  '#5D4037', '#4E342E', '#3E2723', '#212121'
];

function getCategoryColor(categoryName?: string | null): string {
  if (!categoryName) return FALLBACK_COLORS[0];
  const key = categoryName.toLowerCase().trim();
  if (CATEGORY_PALETTE[key]) return CATEGORY_PALETTE[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export const ProductButton: React.FC<ProductButtonProps> = ({ product }) => {
  const { cart, addToCart, removeFromCart, activeTable } = usePOSStore();
  const quantity = cart[product.id] || 0;
  
  const scale = useRef(new Animated.Value(1)).current;
  const bgColor = getCategoryColor(product.categoryName);

  const handlePress = () => {
    addToCart(product.id);
    
    // Simple native Animated bounce
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleLongPress = () => {
    if (quantity > 0) {
      removeFromCart(product.id);
      
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 50, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
    }
  };

  return (
    <Animated.View style={[
      styles.container, 
      { 
        transform: [{ scale: scale }]
      }
    ]}>
      <GlassPanel intensity={40} style={[styles.glass, { backgroundColor: bgColor + '40' }]}>
        <Pressable 
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={300}
          style={({ pressed }) => [
            styles.pressable,
            pressed && Platform.OS === 'web' ? { opacity: 0.8 } : {}
          ]}
        >
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.price}>{product.price.toFixed(3)} DT</Text>
          
          {!activeTable && quantity > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>x{quantity}</Text>
            </View>
          )}
        </Pressable>
      </GlassPanel>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    minWidth: '30%', 
    height: 130, 
    borderRadius: 20, 
    margin: 6, 
    overflow: 'hidden'
  },
  glass: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pressable: { 
    flex: 1, 
    padding: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 20
  },
  name: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFF', 
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  price: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: 'rgba(255, 255, 255, 0.85)', 
    marginTop: 6 
  },
  badge: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: '#EF4444', 
    borderRadius: 24, 
    minWidth: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 5,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, 
    shadowRadius: 3
  },
  badgeText: { 
    color: '#FFF', 
    fontWeight: '900', 
    fontSize: 14 
  }
});
