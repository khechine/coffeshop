import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Plus, Clock, CheckCircle, PackageSearch, AlertCircle } from 'lucide-react-native';
import { SpecialOrderForm } from './SpecialOrderForm';

// Mock data
const MOCK_ORDERS = [
  { id: '1', orderNumber: 'CMD-2024-0042', productName: 'Gâteau Forêt Noire x1', clientName: 'Ahmed Ben Ali', totalPrice: 45.0, depositAmount: 20.0, deliveryDate: new Date().toISOString(), status: 'READY' },
  { id: '2', orderNumber: 'CMD-2024-0041', productName: 'Miniardises 1kg x2', clientName: 'Fatma Cherif', totalPrice: 28.0, depositAmount: 10.0, deliveryDate: new Date().toISOString(), status: 'IN_PROGRESS' },
];

export const SpecialOrdersScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('Aujourdhui');
  
  // Real app: fetch from API
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const handleSaveOrder = (newOrderData: any) => {
    // API call to save order... Simulate here
    const newOrder = {
      id: Math.random().toString(),
      orderNumber: `CMD-${Date.now().toString().slice(-4)}`,
      productName: newOrderData.productName,
      clientName: newOrderData.clientName,
      totalPrice: newOrderData.totalPrice,
      depositAmount: newOrderData.depositAmount,
      deliveryDate: newOrderData.deliveryDate.toISOString(),
      status: 'PENDING'
    };
    setOrders([newOrder, ...orders]);
    setShowForm(false);
  };

  if (showForm) {
    return <SpecialOrderForm onBack={() => setShowForm(false)} onSave={handleSaveOrder} />;
  }

  const tabs = ['Aujourdhui', 'En attente', 'En préparation', 'Toutes'];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'READY': return '#10b981';
      case 'DELIVERED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'PENDING': return 'EN ATTENTE';
      case 'IN_PROGRESS': return 'EN PRÉPARATION';
      case 'READY': return 'PRÊTE';
      case 'DELIVERED': return 'LIVRÉE';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📋 Commandes Spéciales</Text>
          <View style={styles.urgentBadge}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.urgentText}>3 commandes à livrer aujourd'hui</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.newBtnText}>Nouvelle Commande</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>🎂 {item.productName}</Text>
                <Text style={styles.clientName}>👤 {item.clientName}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.dateText}>📅 Auj. 14:00</Text>
                <Text style={styles.priceText}>Total: {item.totalPrice.toFixed(3)} DT</Text>
                <Text style={styles.depositText}>Acompte: {item.depositAmount.toFixed(3)} DT</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.actionBtn}>
                <PackageSearch size={16} color="#4b5563" />
                <Text style={styles.actionBtnText}>Voir Détails</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryActionBtn}>
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.primaryActionBtnText}>
                  {item.status === 'READY' ? 'Marquer Livrée' : 'Marquer Prête'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start' },
  urgentText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  newBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 8 },
  tabBtnActive: { borderBottomColor: '#3b82f6' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#3b82f6' },

  listContent: { padding: 24 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#4b5563', letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  clientName: { fontSize: 15, color: '#6b7280' },
  dateText: { fontSize: 15, fontWeight: 'bold', color: '#d97706', marginBottom: 8 },
  priceText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  depositText: { fontSize: 13, color: '#10b981', fontWeight: '600', marginTop: 4 },

  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: '#4b5563', fontWeight: 'bold', marginLeft: 8 },
  primaryActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  primaryActionBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 }
});
