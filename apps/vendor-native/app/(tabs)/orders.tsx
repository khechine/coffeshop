import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams } from 'expo-router';

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchData = async (vid: string) => {
    try {
      const data = await ApiService.get(`/management/vendor/orders/${vid}`);
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch vendor orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.user?.vendorId) {
        setVendorId(session.user.vendorId);
        fetchData(session.user.vendorId);
      }
    });
  }, []);

  const onRefresh = () => {
    if (vendorId) {
      setRefreshing(true);
      fetchData(vendorId);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await ApiService.put(`/management/vendor/orders/${orderId}/status`, { status });
      onRefresh();
      setSelectedOrder(null);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const getStatusLabel = (s: string) => {
    switch(s) {
      case 'PENDING': return 'En attente';
      case 'DELIVERING': return 'Livraison';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      default: return s;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Commandes Reçues</Text>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['PENDING', 'DELIVERING', 'COMPLETED', 'CANCELLED'].map((tab: any) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{getStatusLabel(tab)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        {filteredOrders.map((order, idx) => (
          <TouchableOpacity key={idx} style={[styles.orderCard, styles.glassCard]} onPress={() => setSelectedOrder(order)}>
            <View style={styles.orderHeader}>
              <View style={{ backgroundColor: 'transparent' }}>
                <Text style={styles.storeName}>{order.store?.name || 'Magasin inconnu'}</Text>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('fr-FR')} — {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.orderTotal}>{Number(order.total || 0).toFixed(3)} DT</Text>
            </View>
            <View style={styles.itemSummary}>
              <Text style={styles.itemCount}>{order.items?.length || 0} article(s)</Text>
              <FontAwesome name="chevron-right" size={12} color="#475569" />
            </View>
          </TouchableOpacity>
        ))}
        {filteredOrders.length === 0 && <Text style={styles.emptyText}>Aucune commande {getStatusLabel(activeTab).toLowerCase()}.</Text>}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                    <View style={{ backgroundColor: 'transparent' }}>
                         <Text style={styles.modalTitle}>Commande #{selectedOrder?.id?.slice(-6).toUpperCase()}</Text>
                         <Text style={styles.modalSub}>{selectedOrder?.store?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedOrder(null)}><FontAwesome name="times" size={20} color="#fff" /></TouchableOpacity>
                </View>
                <ScrollView style={{ padding: 20 }}>
                    <Text style={styles.label}>Articles commandés</Text>
                    {selectedOrder?.items?.map((item: any, i: number) => (
                        <View key={i} style={styles.itemRow}>
                            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                <Text style={styles.itemName}>{item.name || item.stockItem?.name || 'Produit inconnu'}</Text>
                                <Text style={styles.itemSub}>{Number(item.quantity)} x {Number(item.price || 0).toFixed(3)} DT</Text>
                            </View>
                            <Text style={styles.itemTotal}>{(Number(item.quantity) * Number(item.price || 0)).toFixed(3)} DT</Text>
                        </View>
                    ))}

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Commande</Text>
                        <Text style={styles.totalValue}>{Number(selectedOrder?.total || 0).toFixed(3)} DT</Text>
                    </View>

                    {selectedOrder?.status === 'PENDING' && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(selectedOrder.id, 'DELIVERING')}>
                            <Text style={styles.actionBtnText}>Confirmer & Livrer</Text>
                        </TouchableOpacity>
                    )}

                    {selectedOrder?.status === 'DELIVERING' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}>
                            <Text style={styles.actionBtnText}>Marquer comme Livré</Text>
                        </TouchableOpacity>
                    )}

                    {['PENDING', 'DELIVERING'].includes(selectedOrder?.status) && (
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}>
                            <Text style={styles.cancelBtnText}>Annuler la commande</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  tabContainer: {
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activeTab: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#f59e0b',
  },
  scrollBody: {
    paddingBottom: 100,
  },
  orderCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 15,
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 15,
  },
  storeName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  orderDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
  orderTotal: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '900',
  },
  itemSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  itemCount: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalSheet: {
    backgroundColor: '#0a0f1e',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 15,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    backgroundColor: 'transparent',
  },
  itemName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  itemTotal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    color: '#f59e0b',
    fontSize: 22,
    fontWeight: '900',
  },
  actionBtn: {
    backgroundColor: '#f59e0b',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
