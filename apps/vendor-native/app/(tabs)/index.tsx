import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAlert } from '@/components/AlertContext';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const router = useRouter();
  const { showAlert } = useAlert();

  // Load the real vendorId from secure storage
  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.user?.vendorId) setVendorId(session.user.vendorId);
      if (session?.user) setUser(session.user);
    });
  }, []);

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
          <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* KPI Section */}
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
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <FontAwesome name="clock-o" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.kpiLabel}>En attente</Text>
            <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>{fmtInt(stats.pendingOrders)}</Text>
            <Text style={[styles.kpiTrend, { color: '#3b82f6' }]}>Commandes</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.glassCard]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <FontAwesome name="cubes" size={18} color="#10b981" />
            </View>
            <Text style={styles.kpiLabel}>Produits</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>{fmtInt(stats.activeProducts)}</Text>
            <Text style={[styles.kpiTrend, { color: '#10b981' }]}>Actifs</Text>
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

        {/* Management Menu */}
        <Text style={styles.sectionTitle}>Gestion Catalogue & Ventes</Text>
        <View style={styles.mgmtGrid}>
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/products')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <FontAwesome name="archive" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.mgmtCardTitle}>PRODUITS</Text>
            <Text style={styles.mgmtCardSub}>Catalogue & Prix</Text>
          </TouchableOpacity>
 
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
            onPress={() => router.push('/orders')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <FontAwesome name="truck" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.mgmtCardTitle}>COMMANDES</Text>
            <Text style={styles.mgmtCardSub}>Suivi livraisons</Text>
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
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
});

