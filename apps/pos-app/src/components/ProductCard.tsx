import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions, View } from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { Product } from '../types';
import { Coffee, Droplets, Wind, CupSoda, Info } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;
const cardWidth = isMobile ? (screenWidth - 40) / 2 : (screenWidth * 0.65) / 3 - 16;

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { items } = useCartStore();
  const quantity = items.find((i: any) => i.id === product.id)?.quantity || 0;


  const renderIcon = () => {
    switch (product.icon) {
      case 'coffee': return <Coffee color="#fff" size={32} />;
      case 'droplet': return <Droplets color="#fff" size={32} />;
      case 'wind': return <Wind color="#fff" size={32} />;
      case 'cup-soda': return <CupSoda color="#fff" size={32} />;
      default: return <Info color="#fff" size={32} />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: product.color || '#3e2723', width: cardWidth }]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      {renderIcon()}
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{product.price.toFixed(3)} DT</Text>
      
      {quantity > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>x{quantity}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 140,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  name: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  price: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  }
});

