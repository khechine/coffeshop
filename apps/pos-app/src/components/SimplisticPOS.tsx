import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { mockProducts } from '../data/mockProducts';
import { useCartStore } from '../store/useCartStore';
import { Plus, RefreshCcw, Banknote, Coffee } from 'lucide-react-native';

const { width, height: screenHeight } = Dimensions.get('window');
const isMobile = width < 768;
const numColumns = isMobile ? 2 : 4;
const itemMargin = isMobile ? 12 : 16;

export const SimplisticPOS: React.FC = () => {
  const { items, addToCart, clearCart, total } = useCartStore();

  const getQuantity = (id: string) => {
    const item = items.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  const handleFinishSession = () => {
    if (items.length === 0) return;
    const summary = items
      .map((i) => `${i.name}: x${i.quantity}`)
      .join('\n');
    alert(`Fin de Session!\n\n${summary}\n\nTOTAL: ${total.toFixed(3)} DT`);
    clearCart();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mode Comptage Rapide</Text>
          <Text style={styles.headerSubtitle}>Appuyez sur n'importe quel produit pour ajouter +1</Text>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={clearCart}>
          <RefreshCcw color="#ef4444" size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockProducts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const quantity = getQuantity(item.id);
          return (
            <TouchableOpacity 
              style={[styles.productCounter, { borderColor: item.color }]} 
              onPress={() => addToCart(item)}
              activeOpacity={0.6}
            >
              <View style={[styles.colorBar, { backgroundColor: item.color }]} />
              <View style={styles.counterContent}>
                <Text style={styles.productName}>{item.name}</Text>
                <View style={styles.quantityDisplay}>
                  <Text style={styles.qtyText}>{quantity}</Text>
                </View>
                <View style={[styles.tapIndicator, { backgroundColor: item.color + '20' }]}>
                  <Plus color={item.color} size={28} />
                  <Text style={[styles.tapText, { color: item.color }]}>AJOUTER</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.bigButton, items.length === 0 && styles.disabledBigButton]} 
          onPress={handleFinishSession}
          disabled={items.length === 0}
        >
          <View style={styles.bigButtonSide}>
            <Banknote color="#fff" size={40} />
          </View>
          <View style={styles.bigButtonMain}>
            <Text style={styles.bigButtonLabel}>CLÔTURER LA SESSION</Text>
            <Text style={styles.bigButtonTotal}>{total.toFixed(3)} DT</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: isMobile ? 20 : 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: isMobile ? 22 : 28,
    fontWeight: '900',
    color: '#3e2723',
  },
  headerSubtitle: {
    fontSize: isMobile ? 13 : 16,
    color: '#6b7280',
    marginTop: 4,
  },
  resetBtn: {
    padding: isMobile ? 8 : 12,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
  },
  listContainer: {
    padding: 16,
  },
  productCounter: {
    backgroundColor: '#fff',
    flex: 1,
    height: isMobile ? 160 : 220,
    margin: isMobile ? 6 : 10,
    borderRadius: isMobile ? 20 : 30,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  colorBar: {
    height: isMobile ? 8 : 12,
    width: '100%',
  },
  counterContent: {
    flex: 1,
    padding: isMobile ? 12 : 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: isMobile ? 16 : 22,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
  },
  quantityDisplay: {
    backgroundColor: '#f3f4f6',
    width: isMobile ? 50 : 70,
    height: isMobile ? 50 : 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: isMobile ? 2 : 4,
    borderColor: '#fff',
  },
  qtyText: {
    fontSize: isMobile ? 24 : 32,
    fontWeight: '900',
    color: '#3e2723',
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 10 : 16,
    paddingVertical: isMobile ? 4 : 8,
    borderRadius: 20,
  },
  tapText: {
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  footer: {
    padding: isMobile ? 16 : 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  bigButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    height: isMobile ? 70 : 110,
    borderRadius: isMobile ? 20 : 35,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  disabledBigButton: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0.1,
  },
  bigButtonSide: {
    paddingHorizontal: isMobile ? 15 : 25,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  bigButtonMain: {
    flex: 1,
    paddingHorizontal: isMobile ? 15 : 25,
  },
  bigButtonLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: isMobile ? 12 : 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  bigButtonTotal: {
    color: '#fff',
    fontSize: isMobile ? 24 : 38,
    fontWeight: '900',
  },
});
