import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Product } from '../store/useCartStore';
import { Coffee, Droplets, Wind, CupSoda, Info } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth * 0.65) / 3 - 16; // 65% for products, 3 columns

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const renderIcon = () => {
    switch (product.icon) {
      case 'coffee':
        return <Coffee color="#fff" size={32} />;
      case 'droplet':
        return <Droplets color="#fff" size={32} />;
      case 'wind':
        return <Wind color="#fff" size={32} />;
      case 'cup-soda':
        return <CupSoda color="#fff" size={32} />;
      default:
        return <Info color="#fff" size={32} />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: product.color, width: cardWidth }]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      {renderIcon()}
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{product.price.toFixed(3)} DT</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 120,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  price: {
    color: '#rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
});
