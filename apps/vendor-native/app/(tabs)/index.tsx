import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Modal, BackHandler, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAlert } from '@/components/AlertContext';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  // Load the real vendorId from secure storage
  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.user?.vendorId) setVendorId(session.user.vendorId);
      if (session?.user) setUser(session.user);
    });
  }, []);

  // Handle Android Back Button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Quitter l\'application', 'Voulez-vous vraiment quitter Rachma Vendor ?', [
          { text: 'Annuler', style: 'cancel', onPress: () => {} },
          { text: 'Quitter', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true; // prevent default
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
        AuthService.clearSession().then(() => {
          router.replace('/login');
        });
      }
      return;
    }

    showAlert({
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await AuthService.clearSession();
            router.replace('/login');
          },
        },
      ]
    });
  };

  const fetchData = async (vid: string) => {
    try {
      const summary = await ApiService.get(`/management/vendor/summary/${vid}`);
      
      try {
        const notifs = await ApiService.get(`/management/vendor/notifications/${vid}`);
        const storedKeys = await AsyncStorage.getItem(`readNotifications_${vid}`);
        const parsedKeys = storedKeys ? JSON.parse(storedKeys) : [];
        setReadNotifIds(parsedKeys);
        setNotifications(notifs || []);
      } catch(e) { console.warn("Failed to fetch notifications:", e); }
      
      // Check for new orders
      if (lastOrderCount > 0 && summary.orderCount > lastOrderCount) {
        showAlert({
          title: "🛒 Nouvelle Commande !",
          message: "Vous avez reçu une nouvelle commande sur la Marketplace.",
          type: 'success'
        });
      }
      
      setLastOrderCount(summary.orderCount);
      setData(summary);
    } catch (error) {
      console.warn("Failed to fetch vendor dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchData(vendorId);
      // Auto-refresh every 30s for notifications
      const interval = setInterval(() => fetchData(vendorId), 30000);
      return () => clearInterval(interval);
    }
  }, [vendorId]);

  const onRefresh = () => {
    if (vendorId) {
      setRefreshing(true);
      fetchData(vendorId);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Chargement de votre espace vendeur...</Text>
      </View>
    );
  }

  const stats = data || { totalRevenue: 0, pendingOrders: 0, activeProducts: 0, walletBalance: 0, orderCount: 0, topClients: [] };

  const fmtMoney = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v).toLocaleString('fr-TN', { minimumFractionDigits: 2 }) : '0.000');
  const fmtInt = (v: any) => (v != null ? Number(v) : 0);

  const handleMarkAllAsRead = async () => {
    if (!vendorId) return;
    const allIds = notifications.map(n => n.id);
    await AsyncStorage.setItem(`readNotifications_${vendorId}`, JSON.stringify(allIds));
    setReadNotifIds(allIds);
  };
  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  return (
    <View style={styles.outerContainer}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
        contentContainerStyle={styles.container}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeTitle}>Espace Vendeur 👋</Text>
            <Text style={styles.subtitle}>{user?.vendorName || 'Votre Entreprise'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', gap: 15 }}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifications(true)}>
              <FontAwesome name="bell" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
              <FontAwesome name="sign-out" size={24} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Section - Finance */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.glassCard]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <FontAwesome name="money" size={18} color="#f59e0b" />
            </View>
            <Text style={styles.kpiLabel}>CA Total</Text>
            <Text style={styles.kpiValue}>{fmtMoney(stats.totalRevenue)} DT</Text>
            <Text style={[styles.kpiTrend, { color: '#f59e0b' }]}>Toutes ventes</Text>
          </View>

          <View style={[styles.kpiCard, styles.glassCard]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
              <FontAwesome name="credit-card" size={18} color="#8b5cf6" />
            </View>
            <Text style={styles.kpiLabel}>Wallet</Text>
            <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>{fmtMoney(stats.walletBalance)} DT</Text>
            <Text style={[styles.kpiTrend, { color: '#8b5cf6' }]}>Solde dispo.</Text>
          </View>
        </View>

        {/* Actionable KPIs - Operations */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity 
            style={[styles.kpiCard, styles.actionCard]} 
            onPress={() => router.push('/orders')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59,130,246,0.18)' }]}>
              <FontAwesome name="truck" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.kpiLabel}>Commandes</Text>
            <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>{fmtInt(stats.pendingOrders)}</Text>
            <View style={{flexDirection:'row', alignItems:'center', backgroundColor: 'transparent'}}>
                <Text style={[styles.kpiTrend, { color: '#3b82f6', marginRight: 4 }]}>En attente</Text>
                <FontAwesome name="chevron-right" size={10} color="#3b82f6" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.kpiCard, styles.actionCard]} 
            onPress={() => router.push('/products')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16,185,129,0.18)' }]}>
              <FontAwesome name="cubes" size={18} color="#10b981" />
            </View>
            <Text style={styles.kpiLabel}>Produits</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>{fmtInt(stats.activeProducts)}</Text>
            <View style={{flexDirection:'row', alignItems:'center', backgroundColor: 'transparent'}}>
                <Text style={[styles.kpiTrend, { color: '#10b981', marginRight: 4 }]}>Gérer le stock</Text>
                <FontAwesome name="chevron-right" size={10} color="#10b981" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Management Menu */}
        <Text style={styles.sectionTitle}>Gestion Catalogue & Ventes</Text>
        <View style={styles.mgmtGrid}>
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/bundles')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <FontAwesome name="gift" size={20} color="#10b981" />
            </View>
            <Text style={styles.mgmtCardTitle}>PACKS B2B</Text>
            <Text style={styles.mgmtCardSub}>Offres groupées</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/wallet')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <FontAwesome name="google-wallet" size={18} color="#8b5cf6" />
            </View>
            <Text style={styles.mgmtCardTitle}>MON WALLET</Text>
            <Text style={styles.mgmtCardSub}>Finance & Retraits</Text>
          </TouchableOpacity>
        </View>

        {/* Top Clients */}
        {stats.topClients?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Meilleurs Clients (Magasins)</Text>
            <View style={[styles.analyticsCard, styles.glassCard]}>
              {stats.topClients.map((c: any, i: number) => (
                <View key={i} style={styles.rankRow}>
                  <Text style={styles.rankNum}>#{i + 1}</Text>
                  <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={styles.rankName}>{c.name}</Text>
                    <Text style={styles.rankSub}>Total achats: {fmtMoney(c.total)} DT</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color="rgba(255,255,255,0.2)" />
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Notifications</Text>
                    <TouchableOpacity onPress={() => setShowNotifications(false)}>
                        <FontAwesome name="times" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllReadBtn} onPress={handleMarkAllAsRead}>
                        <FontAwesome name="check-square-o" size={14} color={Colors.primary} />
                        <Text style={styles.markAllReadText}>Tout marquer comme lu</Text>
                    </TouchableOpacity>
                )}
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {notifications.length === 0 ? (
                        <Text style={{color: '#94a3b8', textAlign: 'center', marginTop: 30}}>Aucune notification.</Text>
                    ) : (
                        notifications.map((n, idx) => {
                            const isRead = readNotifIds.includes(n.id);
                            return (
                                <TouchableOpacity 
                                    key={idx} 
                                    style={[styles.notifItem, isRead && { opacity: 0.6 }]}
                                    onPress={() => {
                                        if (!isRead) {
                                            const newIds = [...readNotifIds, n.id];
                                            setReadNotifIds(newIds);
                                            AsyncStorage.setItem('@notifications_read', JSON.stringify(newIds)).catch(() => {});
                                        }
                                        setShowNotifications(false);
                                        if (n.type === 'ORDER' || n.title.toLowerCase().includes('commande') || n.title.toLowerCase().includes('réception') || n.type === 'SUCCESS') {
                                            router.push('/(tabs)/orders');
                                        } else if (n.title.toLowerCase().includes('solde') || n.title.toLowerCase().includes('wallet')) {
                                            router.push('/(tabs)/wallet');
                                        }
                                    }}
                                >
                                    <View style={[styles.notifIconBox, n.type === 'STOCK' ? {backgroundColor:'rgba(239, 68, 68, 0.15)'} : n.type === 'SUCCESS' ? {backgroundColor:'rgba(16, 185, 129, 0.15)'} : {backgroundColor:'rgba(59, 130, 246, 0.15)'}]}>
                                        <FontAwesome name={n.type === 'STOCK' ? 'warning' : n.type === 'SUCCESS' ? 'check' : 'shopping-cart'} size={16} color={n.type === 'STOCK' ? '#ef4444' : n.type === 'SUCCESS' ? '#10b981' : '#3b82f6'} />
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                        <Text style={[styles.notifTitle, !isRead && { fontWeight: '800', color: '#fff' }]}>{n.title}</Text>
                                        <Text style={styles.notifMessage}>{n.message}</Text>
                                        <Text style={styles.notifDate}>{new Date(n.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    {!isRead && <View style={styles.unreadDot} />}
                                </TouchableOpacity>
                            );
                        })
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
  loadingText: {
    color: '#94a3b8',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  outerContainer: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  container: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    backgroundColor: 'transparent',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  profileBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 4,
  },
  kpiTrend: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  featuredCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  seeMore: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 15,
  },
  actionScroll: {
    backgroundColor: 'transparent',
  },
  actionBtn: {
    width: 100,
    height: 90,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 8,
  },

  // Management Grid Styles
  mgmtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  mgmtCard: {
    width: '47%',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  mgmtIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mgmtCardTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  mgmtCardSub: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0a101f',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '92%',
    paddingTop: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  modalBody: {
    padding: 20,
  },
  crudPlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  addItemBtnFull: {
    backgroundColor: Colors.primary,
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
  },

  // ── Analytics (Owner) ──────────────────────────────────────────
  profitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 18,
    marginTop: 10,
  },
  profitLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  profitSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  analyticsCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  analyticsHeader: {
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  analyticsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  topVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  topVendorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  topVendorName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  topVendorRevenue: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  crownBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'transparent',
  },
  rankNum: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    width: 30,
  },
  rankName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  rankSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rankBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  notifBtn: {
    position: 'relative',
    padding: 5,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0a0f1e',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  markAllReadText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  notifItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 10,
    alignItems: 'center',
  },
  notifIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  notifTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notifMessage: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  notifDate: {
    color: '#64748b',
    fontSize: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: 10,
  },
});

