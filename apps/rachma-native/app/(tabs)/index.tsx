import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Modal, BackHandler } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useFocusEffect } from 'expo-router';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [storeId, setStoreId] = useState('1');
  const [activeMgmt, setActiveMgmt] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Load the real storeId from secure storage
  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) setStoreId(session.storeId);
      if (session?.user) setUser(session.user);
    });
  }, []);

  // Handle Android Back Button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Quitter l\'application', 'Voulez-vous vraiment quitter Rachma ?', [
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

    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
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
    );
  };

  const fetchData = async () => {
    try {
      const summary = await ApiService.get(`/management/reports/summary/${storeId}`);
      setData(summary);
    } catch (error) {
      console.warn("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchData();
  }, [storeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  const stats = data || { totalSales: 0, orderCount: 0, lowStockCount: 0, totalExpenses: 0, weeklySales: 0, activeStaff: 0, margin: 0 };
  const isOwner = user?.role === 'STORE_OWNER' || user?.role === 'SUPERADMIN';

  const fmtMoney = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v).toFixed(2) : '0.00');
  const fmtInt = (v: any) => (v != null ? Number(v) : 0);

  return (
    <View style={styles.outerContainer}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.container}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeTitle}>Bonjour, {user?.name || 'Manager'} 👋</Text>
            <Text style={styles.subtitle}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* ── SECTION: ALERTES PRIORITAIRES ─────────────────────── */}
        {stats.lowStockCount > 0 && (
          <TouchableOpacity 
            style={[styles.alertBanner, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}
            onPress={() => router.push('/stocks?tab=MATERIALS')}
          >
            <View style={[styles.iconBox, { backgroundColor: Colors.danger, marginBottom: 0, width: 32, height: 32 }]}>
              <FontAwesome name="warning" size={14} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12, backgroundColor: 'transparent' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Alerte Stock Bas</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>{stats.lowStockCount} article(s) nécessitent votre attention.</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#475569" />
          </TouchableOpacity>
        )}

        {/* ── SECTION: FINANCE & PERFORMANCE ────────────────────── */}
        <Text style={styles.sectionTitle}>Performance Financière</Text>
        <View style={styles.kpiGrid}>
          {/* CA Journalier */}
          <View style={[styles.kpiCard, styles.glassCard]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <FontAwesome name="line-chart" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.kpiLabel}>Chiffre d'Aff.</Text>
            <Text style={styles.kpiValue} numberOfLines={1}>{fmtMoney(stats.totalSales)} DT</Text>
            <Text style={styles.kpiTrend}> Aujourd'hui</Text>
          </View>
 
          {/* Commandes */}
          <View style={[styles.kpiCard, styles.glassCard]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <FontAwesome name="shopping-cart" size={18} color={Colors.secondary} />
            </View>
            <Text style={styles.kpiLabel}>Commandes</Text>
            <Text style={styles.kpiValue}>{fmtInt(stats.orderCount)}</Text>
            <Text style={[styles.kpiTrend, { color: Colors.secondary }]}>Total Ventes</Text>
          </View>
 
          {/* CA Semaine – Owner only */}
          {isOwner && (
            <View style={[styles.kpiCard, styles.glassCard]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(168,85,247,0.12)' }]}>
                <FontAwesome name="calendar" size={18} color="#a855f7" />
              </View>
              <Text style={styles.kpiLabel}>Cette Semaine</Text>
              <Text style={[styles.kpiValue, { color: '#a855f7' }]} numberOfLines={1}>{fmtMoney(stats.weeklySales)} DT</Text>
              <Text style={[styles.kpiTrend, { color: '#a855f7' }]}>7 derniers jours</Text>
            </View>
          )}
 
          {/* Dépenses – Owner only */}
          {isOwner && (
            <View style={[styles.kpiCard, styles.glassCard]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <FontAwesome name="minus-circle" size={18} color={Colors.danger} />
              </View>
              <Text style={styles.kpiLabel}>Dépenses</Text>
              <Text style={[styles.kpiValue, { color: Colors.danger }]} numberOfLines={1}>{fmtMoney(stats.totalExpenses)} DT</Text>
              <Text style={[styles.kpiTrend, { color: Colors.danger }]}>Journalier</Text>
            </View>
          )}
        </View>

        {/* ── SECTION: ANALYTIQUES AVANCÉES (OWNER) ───────────── */}
        {isOwner && (
          <View style={{ marginTop: 10, marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Analyse Détaillée</Text>
            
            {/* Profit Net Banner */}
            <View style={[styles.profitBanner, {
              backgroundColor: stats.netProfit >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
              borderColor: stats.netProfit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              marginTop: 10,
            }]}>
              <View style={{ backgroundColor: 'transparent' }}>
                <Text style={styles.profitLabel}>Profit Net Estimé</Text>
                <Text style={[styles.profitValue, { color: stats.netProfit >= 0 ? Colors.primary : Colors.danger }]}>
                  {fmtMoney(stats.netProfit ?? stats.totalSales - stats.totalExpenses)} DT
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: 'transparent' }}>
                   <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stats.netProfit >= 0 ? Colors.primary : Colors.danger, marginRight: 6 }} />
                   <Text style={[styles.profitSub, { color: '#94a3b8' }]}>Marge: {stats.totalSales > 0 ? ((1 - stats.totalExpenses/stats.totalSales)*100).toFixed(0) : 0}%</Text>
                </View>
              </View>
              <FontAwesome
                name={stats.netProfit >= 0 ? 'line-chart' : 'warning'}
                size={32}
                color={stats.netProfit >= 0 ? Colors.primary : Colors.danger}
                style={{ opacity: 0.5 }}
              />
            </View>

            {/* Top Stats Scrollable list or Grid */}
            <View style={{ gap: 12 }}>
                {stats.topVendor && (
                  <View style={[styles.analyticsCard, styles.glassCard, { padding: 15 }]}>
                    <View style={styles.topVendorRow}>
                      <View style={[styles.topVendorAvatar, { backgroundColor: 'rgba(251,191,36,0.1)' }]}>
                        <FontAwesome name="trophy" size={20} color="#fbbf24" />
                      </View>
                      <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                        <Text style={[styles.kpiLabel, { marginBottom: 2 }]}>Meilleur Vendeur</Text>
                        <Text style={styles.topVendorName}>{stats.topVendor.name}</Text>
                        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>{fmtMoney(stats.topVendor.revenue)} DT générés</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', backgroundColor: 'transparent' }}>
                        <Text style={{ color: '#fbbf24', fontSize: 16, fontWeight: '900' }}>{stats.topVendor.count}</Text>
                        <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '700' }}>TICKETS</Text>
                      </View>
                    </View>
                  </View>
                )}

                {stats.topProducts?.length > 0 && (
                  <View style={[styles.analyticsCard, styles.glassCard]}>
                    <View style={styles.analyticsHeader}>
                      <Text style={styles.analyticsTitle}>Top 3 Produits</Text>
                    </View>
                    {stats.topProducts.slice(0, 3).map((p: any, i: number) => (
                      <View key={i} style={[styles.rankRow, i === 2 && { borderBottomWidth: 0 }]}>
                        <Text style={styles.rankNum}>{i + 1}</Text>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                          <Text style={styles.rankName}>{p.name}</Text>
                          <Text style={styles.rankSub}>{fmtMoney(p.revenue)} DT CA</Text>
                        </View>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>{p.qty} ventes</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
            </View>
          </View>
        )}

        {/* ── SECTION: CENTRE DE GESTION ───────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Centre de Gestion</Text>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800' }}>{isOwner ? 'ACCÈS TOTAL' : 'ACCÈS LIMITÉ'}</Text>
          </View>
        </View>

        <View style={styles.mgmtGrid}>
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/stocks?tab=PRODUCTS')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <FontAwesome name="archive" size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.mgmtCardTitle}>PRODUITS</Text>
            <Text style={styles.mgmtCardSub}>Catalogue & Prix</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/stocks?tab=MATERIALS')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <FontAwesome name="bar-chart" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.mgmtCardTitle}>STOCKS</Text>
            <Text style={styles.mgmtCardSub}>Inventaire & Recettes</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/marketplace')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <FontAwesome name="shopping-basket" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.mgmtCardTitle}>B2B MARCHÉ</Text>
            <Text style={styles.mgmtCardSub}>Commandes Fournisseurs</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/suppliers')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <FontAwesome name="handshake-o" size={18} color={Colors.danger} />
            </View>
            <Text style={styles.mgmtCardTitle}>PARTENAIRES</Text>
            <Text style={styles.mgmtCardSub}>Mes Fournisseurs</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/history')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <FontAwesome name="history" size={20} color="#a855f7" />
            </View>
            <Text style={styles.mgmtCardTitle}>VENTES</Text>
            <Text style={styles.mgmtCardSub}>Historique & Clôtures</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard]}
            onPress={() => router.push('/scanner')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}>
              <FontAwesome name="qrcode" size={20} color="#94a3b8" />
            </View>
            <Text style={styles.mgmtCardTitle}>SCANNER</Text>
            <Text style={styles.mgmtCardSub}>Inventaire Rapide</Text>
          </TouchableOpacity>

          {isOwner && (
            <>
              <TouchableOpacity 
                style={[styles.mgmtCard, styles.glassCard]}
                onPress={() => router.push('/metrics')}
              >
                <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <FontAwesome name="line-chart" size={20} color="#38bdf8" />
                </View>
                <Text style={styles.mgmtCardTitle}>MÉTRIQUES</Text>
                <Text style={styles.mgmtCardSub}>Analyses & Rapports</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.mgmtCard, styles.glassCard]}
                onPress={() => router.push('/terminals')}
              >
                <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <FontAwesome name="desktop" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.mgmtCardTitle}>CAISSES</Text>
                <Text style={styles.mgmtCardSub}>Terminaux & Codes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mgmtCard, styles.glassCard]}
                onPress={() => router.push('/team')}
              >
                <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                  <FontAwesome name="users" size={20} color="#ec4899" />
                </View>
                <Text style={styles.mgmtCardTitle}>ÉQUIPE</Text>
                <Text style={styles.mgmtCardSub}>Staff & Rôles</Text>
              </TouchableOpacity>
            </>
          )}
        </View>



        <View style={{ height: 40 }} />

      </ScrollView>

      {/* CRUD Modal */}
      <Modal visible={!!activeMgmt} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveMgmt(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gestion {activeMgmt}</Text>
              <TouchableOpacity onPress={() => setActiveMgmt(null)}>
                <FontAwesome name="times-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.crudPlaceholder}>
                <FontAwesome name="gears" size={48} color="rgba(255,255,255,0.05)" />
                <Text style={{ color: '#94a3b8', marginTop: 15, textAlign: 'center' }}>
                  L\'interface {activeMgmt} est en cours de synchronisation...
                </Text>
                <TouchableOpacity style={styles.addItemBtnFull}>
                    <Text style={{ color: '#fff', fontWeight: '800' }}>Cloud Manager</Text>
                </TouchableOpacity>
              </View>
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
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  kpiCard: {
    width: '48%',
    padding: 16,
    borderRadius: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 25,
  },
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
    elevation: 10,
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

