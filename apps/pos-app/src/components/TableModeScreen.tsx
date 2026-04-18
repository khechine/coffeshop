import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTableStore } from '../store/useTableStore';
import { mockProducts } from '../data/mockProducts';
import { ProductCard } from './ProductCard';
import { User, UserPlus, Trash2 } from 'lucide-react-native';
import { CustomerSearch, Customer } from './CustomerSearch';
import { CheckoutModal } from './CheckoutModal';

const { width } = Dimensions.get('window');

// Mock Tables
const MOCK_TABLES = Array.from({ length: 10 }, (_, i) => ({
  id: `t${i + 1}`, label: `Table ${i + 1}`
}));

export const TableModeScreen: React.FC = () => {
  const { 
    tables, activeTableId, setActiveTable, initTable, 
    addToTableCart, removeFromTableCart, updateTableItemQuantity, 
    clearTableCart, setTableCustomer, getActiveTable, getTableTotal 
  } = useTableStore();

  const [activeCategory, setActiveCategory] = useState('Tous');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Initialize tables
  useEffect(() => {
    MOCK_TABLES.forEach(t => initTable(t.id, t.label));
    if (!activeTableId) setActiveTable(MOCK_TABLES[0].id);
  }, []);

  const activeTable = getActiveTable();
  const total = activeTableId ? getTableTotal(activeTableId) : 0;

  const categories = ['Tous', 'Café', 'Boissons', 'Chicha', 'Snacks'];
  const filteredProducts = mockProducts; // Would filter by activeCategory in real app

  const handleCheckoutConfirm = (method: string, type: string, discount: number) => {
    alert(`Encaissé: ${method} | ${type} | Remise: ${discount/1000} DT`);
    if (activeTableId) clearTableCart(activeTableId);
    setShowCheckout(false);
  };

  return (
    <View style={styles.container}>
      
      {/* LEFT COLUMN: TABLES */}
      <View style={styles.colTables}>
        <Text style={styles.sectionHeader}>Salles</Text>
        <ScrollView contentContainerStyle={styles.tablesList}>
          {MOCK_TABLES.map(t => {
            const tableState = tables[t.id];
            const isOccupied = tableState && tableState.items.length > 0;
            const isActive = activeTableId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tableBtn, isActive && styles.tableBtnActive]}
                onPress={() => setActiveTable(t.id)}
              >
                <View style={[styles.statusDot, isOccupied ? styles.bgRed : styles.bgGreen]} />
                <Text style={[styles.tableText, isActive && styles.tableTextActive]}>
                  {t.label}
                </Text>
                {isOccupied && <Text style={styles.tableTotal}>{getTableTotal(t.id).toFixed(1)} DT</Text>}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* MID COLUMN: TICKET */}
      <View style={styles.colTicket}>
        {activeTable ? (
          <>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>{activeTable.label}</Text>
              
              <TouchableOpacity style={styles.customerBtn} onPress={() => setShowCustomerSearch(true)}>
                {activeTable.customer ? (
                  <View style={styles.customerRow}>
                    <User size={18} color="#d97706" />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.customerName}>{activeTable.customer.name}</Text>
                      <Text style={styles.customerPoints}>{activeTable.customer.loyaltyPoints} pts</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.customerRow}>
                    <UserPlus size={18} color="#6b7280" />
                    <Text style={styles.addCustomerText}>Associer Client</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.ticketItemsList}>
              {activeTable.items.map((item, idx) => (
                <View key={item.id} style={styles.ticketItem}>
                  <Text style={styles.itemIndex}>{idx + 1}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{item.price.toFixed(3)}</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromTableCart(activeTableId!, item.id)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToTableCart(activeTableId!, item)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {activeTable.items.length === 0 && (
                <Text style={styles.emptyText}>Table vide</Text>
              )}
            </ScrollView>

            <View style={styles.ticketFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>{total.toFixed(3)} DT</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.trashBtn} onPress={() => clearTableCart(activeTableId!)}>
                  <Trash2 size={24} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.payBtn, total === 0 && { opacity: 0.5 }]} 
                  disabled={total === 0}
                  onPress={() => setShowCheckout(true)}
                >
                  <Text style={styles.payBtnText}>ENCAISSER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af' }}>Sélectionnez une table</Text>
          </View>
        )}
      </View>

      {/* RIGHT COLUMN: CATALOGUE */}
      <View style={styles.colCatalog}>
        <View style={styles.catalogHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroller}>
            {categories.map(c => (
              <TouchableOpacity key={c} style={[styles.tabBtn, activeCategory === c && styles.tabBtnActive]} onPress={() => setActiveCategory(c)}>
                <Text style={[styles.tabText, activeCategory === c && styles.tabTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={p => p.id}
          numColumns={width > 1024 ? 4 : 3}
          contentContainerStyle={styles.productsGrid}
          renderItem={({ item }) => (
            <ProductCard 
              product={item} 
              onPress={() => activeTableId && addToTableCart(activeTableId, item)} 
            />
          )}
        />
      </View>

      {/* Modals */}
      <CustomerSearch 
        visible={showCustomerSearch} 
        onClose={() => setShowCustomerSearch(false)}
        onSelect={(c) => activeTableId && setTableCustomer(activeTableId, c)}
      />
      
      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleCheckoutConfirm}
        total={total}
        customer={activeTable?.customer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f3f4f6' },
  sectionHeader: { padding: 16, fontSize: 18, fontWeight: 'bold', color: '#374151', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  
  colTables: { width: 140, backgroundColor: '#fff', borderRightWidth: 1, borderColor: '#e5e7eb' },
  tablesList: { flexGrow: 1 },
  tableBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  tableBtnActive: { backgroundColor: '#fef3c7', borderLeftWidth: 4, borderLeftColor: '#d97706' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  bgGreen: { backgroundColor: '#10b981' },
  bgRed: { backgroundColor: '#ef4444' },
  tableText: { fontSize: 15, fontWeight: '600', color: '#4b5563', flex: 1 },
  tableTextActive: { color: '#92400e', fontWeight: 'bold' },
  tableTotal: { fontSize: 11, color: '#6b7280', fontWeight: 'bold' },

  colTicket: { flex: 1.5, backgroundColor: '#fff', borderRightWidth: 1, borderColor: '#e5e7eb', flexDirection: 'column' },
  ticketHeader: { padding: 16, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  ticketTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 12 },
  customerBtn: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  customerName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  customerPoints: { fontSize: 12, color: '#d97706', fontWeight: 'bold' },
  addCustomerText: { fontSize: 14, color: '#6b7280', marginLeft: 8, fontWeight: '500' },
  
  ticketItemsList: { flex: 1, padding: 16 },
  ticketItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  itemIndex: { width: 24, fontSize: 14, color: '#9ca3af', fontWeight: 'bold' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  itemPrice: { fontSize: 13, color: '#6b7280' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  qtyValue: { fontSize: 16, fontWeight: 'bold', width: 24, textAlign: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },

  ticketFooter: { padding: 16, backgroundColor: '#f9fafb', borderTopWidth: 1, borderColor: '#e5e7eb' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 18, fontWeight: '900', color: '#374151' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#d97706' },
  actionRow: { flexDirection: 'row', gap: 12 },
  trashBtn: { padding: 16, backgroundColor: '#fee2e2', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  payBtn: { flex: 1, backgroundColor: '#10b981', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  colCatalog: { flex: 2.5, backgroundColor: '#f9fafb' },
  catalogHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 0 },
  tabsScroller: { flexDirection: 'row', marginBottom: 16 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#3e2723' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#6b7280' },
  tabTextActive: { color: '#3e2723' },
  productsGrid: { padding: 16 }
});
