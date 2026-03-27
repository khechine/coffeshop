// apps/pos-app/src/components/Cart.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { Trash2, Plus, Minus, CreditCard, Banknote } from 'lucide-react-native';

export const Cart: React.FC = () => {
  const { items, total, addToCart, removeFromCart, clearCart } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) return;
    // Here we would sync with API or Local Database for offline mode
    alert(`Enregistré localement! Total: ${total.toFixed(3)} DT`);
    clearCart();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Facture Actuelle</Text>
        <TouchableOpacity onPress={clearCart}>
          <Trash2 color="#ef4444" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(3)} DT</Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity style={styles.btnSm} onPress={() => removeFromCart(item.id)}>
                <Minus size={16} color="#4b5563" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity style={styles.btnSm} onPress={() => addToCart(item)}>
                <Plus size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Le panier est vide</Text>}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{total.toFixed(3)} DT</Text>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutBtn, items.length === 0 && styles.checkoutBtnDisabled]} 
          onPress={handleCheckout}
          disabled={items.length === 0}
        >
          <Banknote color="#fff" size={24} style={{ marginRight: 8 }} />
          <Text style={styles.checkoutBtnText}>Payer & Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnSm: {
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  quantity: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
  },
  footer: {
    padding: 20,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
  },
  checkoutBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
