import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAlert } from '@/components/AlertContext';

type OrderTab = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderTab>('PENDING');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { showAlert } = useAlert();

  const fetchData = async (vid: string) => {
    try {
      const data = await ApiService.get(`/management/vendor/orders/${vid}`);
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch vendor orders:', error);
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
    if (vendorId) { setRefreshing(true); fetchData(vendorId); }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await ApiService.put(`/management/vendor/orders/${orderId}/status`, { status: newStatus });
      setSelectedOrder(null);
      onRefresh();
    } catch (error) {
      showAlert({ title: 'Erreur', message: 'Impossible de mettre à jour le statut.', type: 'error' });
    }
  };

  const confirmAction = (orderId: string, newStatus: string, message: string) => {
    showAlert({
      title: 'Confirmation',
      message,
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'default', onPress: () => handleUpdateStatus(orderId, newStatus) }
      ]
    });
  };

  const TABS: { key: OrderTab; label: string; icon: string; color: string }[] = [
    { key: 'PENDING',   label: 'Nouvelles',   icon: 'clock-o',        color: '#f59e0b' },
    { key: 'CONFIRMED', label: 'Acceptées',   icon: 'check-circle',   color: '#6366f1' },
    { key: 'SHIPPED',   label: 'Expédiées',   icon: 'truck',          color: '#3b82f6' },
    { key: 'DELIVERED', label: 'Livrées',     icon: 'cube',           color: '#10b981' },
    { key: 'CANCELLED', label: 'Annulées',    icon: 'times-circle',   color: '#ef4444' },
  ];

  const STATUS_LABELS: Record<string, string> = {
    PENDING:   '🕐 En attente',
    CONFIRMED: '✅ Acceptée',
    SHIPPED:   '🚚 Expédiée',
    DELIVERED: '📦 Livrée',
    CANCELLED: '❌ Annulée',
    STOCKED:   '✔ En stock',
  };

  const getItemName = (item: any) =>
    item.name || item.stockItem?.name || 'Produit inconnu';

  const filteredOrders = orders.filter(o => o.status === activeTab);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const activeTabMeta = TABS.find(t => t.key === activeTab)!;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Mes Commandes</Text>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8 }}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { backgroundColor: `${tab.color}22`, borderColor: tab.color, borderWidth: 1 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <FontAwesome name={tab.icon as any} size={12} color={activeTab === tab.key ? tab.color : '#475569'} />
            <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color }]}>{tab.label}</Text>
            {orders.filter(o => o.status === tab.key).length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: tab.color }]}>
                <Text style={styles.tabBadgeText}>{orders.filter(o => o.status === tab.key).length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
      >
        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome name={activeTabMeta.icon as any} size={40} color="#1e293b" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyText}>Aucune commande {activeTabMeta.label.toLowerCase()}</Text>
          </View>
        )}
        {filteredOrders.map((order, idx) => (
          <TouchableOpacity key={idx} style={styles.orderCard} onPress={() => setSelectedOrder(order)}>
            <View style={styles.cardTop}>
              <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                <Text style={styles.storeName}>{order.store?.name || 'Café inconnu'}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')} — {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[styles.orderTotal, { color: activeTabMeta.color }]}>
                {Number(order.total || 0).toFixed(3)} DT
              </Text>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.itemCount}>{order.items?.length || 0} article(s)</Text>
              <FontAwesome name="chevron-right" size={12} color="#475569" />
            </View>

            {/* Quick action for PENDING */}
            {order.status === 'PENDING' && (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' }]}
                  onPress={() => confirmAction(order.id, 'CANCELLED', 'Refuser cette commande ?')}
                >
                  <FontAwesome name="times" size={12} color="#ef4444" />
                  <Text style={[styles.quickBtnText, { color: '#ef4444' }]}>Refuser</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: '#6366f1', flex: 2 }]}
                  onPress={() => confirmAction(order.id, 'CONFIRMED', 'Accepter et préparer cette commande ?')}
                >
                  <FontAwesome name="check" size={12} color="#6366f1" />
                  <Text style={[styles.quickBtnText, { color: '#6366f1' }]}>Accepter</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ backgroundColor: 'transparent' }}>
                <Text style={styles.modalTitle}>Commande #{selectedOrder?.id?.slice(-6).toUpperCase()}</Text>
                <Text style={styles.modalSub}>{selectedOrder?.store?.name} — {selectedOrder?.store?.city}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <FontAwesome name="times" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Status badge */}
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Statut actuel</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: selectedOrder?.status === 'PENDING' ? 'rgba(245,158,11,0.15)' :
                    selectedOrder?.status === 'CONFIRMED' ? 'rgba(99,102,241,0.15)' :
                    selectedOrder?.status === 'SHIPPED' ? 'rgba(59,130,246,0.15)' :
                    selectedOrder?.status === 'DELIVERED' ? 'rgba(16,185,129,0.15)' :
                    'rgba(239,68,68,0.15)'
                }]}>
                  <Text style={[styles.statusText, {
                    color: selectedOrder?.status === 'PENDING' ? '#f59e0b' :
                      selectedOrder?.status === 'CONFIRMED' ? '#6366f1' :
                      selectedOrder?.status === 'SHIPPED' ? '#3b82f6' :
                      selectedOrder?.status === 'DELIVERED' ? '#10b981' :
                      '#ef4444'
                  }]}>
                    {STATUS_LABELS[selectedOrder?.status] || selectedOrder?.status}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <Text style={styles.sectionLabel}>ARTICLES COMMANDÉS</Text>
              {selectedOrder?.items?.map((item: any, i: number) => (
                <View key={i} style={styles.itemRow}>
                  <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={styles.itemName}>{getItemName(item)}</Text>
                    <Text style={styles.itemSub}>{Number(item.quantity)} x {Number(item.price || 0).toFixed(3)} DT</Text>
                  </View>
                  <Text style={styles.itemTotal}>{(Number(item.quantity) * Number(item.price || 0)).toFixed(3)} DT</Text>
                </View>
              ))}

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Commande</Text>
                <Text style={styles.totalValue}>{Number(selectedOrder?.total || 0).toFixed(3)} DT</Text>
              </View>

              {/* Action buttons based on status */}
              {selectedOrder?.status === 'PENDING' && (
                <View style={{ gap: 12, marginTop: 25 }}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => confirmAction(selectedOrder.id, 'CONFIRMED', 'Accepter et préparer cette commande ?')}>
                    <FontAwesome name="check-circle" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>✅ Accepter la commande</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmAction(selectedOrder.id, 'CANCELLED', 'Refuser définitivement cette commande ?')}>
                    <Text style={styles.cancelBtnText}>❌ Refuser la commande</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedOrder?.status === 'CONFIRMED' && (
                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 25, backgroundColor: '#3b82f6' }]} onPress={() => confirmAction(selectedOrder.id, 'SHIPPED', 'Marquer comme expédiée ? La livraison est en route.')}>
                  <FontAwesome name="truck" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>🚚 Expédier la commande</Text>
                </TouchableOpacity>
              )}

              {selectedOrder?.status === 'SHIPPED' && (
                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 25, backgroundColor: '#10b981' }]} onPress={() => confirmAction(selectedOrder.id, 'DELIVERED', 'Confirmer que la marchandise a été remise au client ?')}>
                  <FontAwesome name="cube" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>📦 Confirmer la livraison</Text>
                </TouchableOpacity>
              )}

              {selectedOrder?.status === 'DELIVERED' && (
                <View style={[styles.infoBox, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                  <FontAwesome name="info-circle" size={16} color="#10b981" />
                  <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700', flex: 1 }}>
                    En attente de confirmation de réception par le café. La commission sera déduite à ce moment.
                  </Text>
                </View>
              )}

              {selectedOrder?.status === 'STOCKED' && (
                <View style={[styles.infoBox, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }]}>
                  <FontAwesome name="check-square-o" size={16} color="#6366f1" />
                  <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '700', flex: 1 }}>
                    Commande finalisée. La commission a été déduite de votre wallet.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#0a0f1e', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#0a0f1e', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
  sectionTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', marginBottom: 20, letterSpacing: 0.5 },
  scrollBody: { paddingBottom: 100 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)', position: 'relative'
  },
  tabText: { color: '#475569', fontSize: 12, fontWeight: '800' },
  tabBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', zIndex: 10
  },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#475569', textAlign: 'center', fontSize: 14, fontStyle: 'italic' },
  orderCard: {
    backgroundColor: 'rgba(16,20,35,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24, padding: 20, marginBottom: 15
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent', marginBottom: 15 },
  storeName: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  orderDate: { color: '#64748b', fontSize: 11, marginTop: 4 },
  orderTotal: { fontSize: 18, fontWeight: '900' },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'transparent', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
  },
  itemCount: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1
  },
  quickBtnText: { fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0a0f1e', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    height: '85%', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)'
  },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  modalSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusLabel: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: '#374151', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', backgroundColor: 'transparent'
  },
  itemName: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  itemSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  itemTotal: { color: '#f59e0b', fontSize: 14, fontWeight: '900' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, padding: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16
  },
  totalLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  totalValue: { color: '#f59e0b', fontSize: 24, fontWeight: '900' },
  primaryBtn: {
    backgroundColor: '#6366f1', height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cancelBtn: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  cancelBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginTop: 25, padding: 16, borderRadius: 16, borderWidth: 1
  },
});
