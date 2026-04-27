import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Modal, BackHandler } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [storeId, setStoreId] = useState('1');
  const [activeMgmt, setActiveMgmt] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [appMode, setAppMode] = useState<'RACHMA' | 'FULL'>('FULL');
  const router = useRouter();

  // Load the real storeId from secure storage
  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) setStoreId(session.storeId);
      if (session?.user) setUser(session.user);
    });
    AuthService.getAppMode().then(setAppMode);
  }, []);

  // Handle Android Back Button
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'web') return;

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
            <Text style={styles.welcomeTitle}>Bienvenue, {user?.name || 'Manager'}</Text>
            <Text style={styles.subtitle}>Votre Progression</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', gap: 10 }}>
            <TouchableOpacity style={styles.iconCircleHeader} onPress={() => router.push('/metrics')}>
              <FontAwesome name="line-chart" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
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

        {/* ── SECTION: PERFORMANCE FINANCIÈRE (REFINED) ── */}
        <View style={styles.screenshotMetrics}>
          {/* Aujourd'hui - Large Card */}
          <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.todayCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
              <Text style={styles.screenCardTitle}>Aujourd'hui</Text>
              <Text style={styles.screenCardDate}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, backgroundColor: 'transparent', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                <View style={styles.moneyIconCircle}>
                   <FontAwesome name="eur" size={10} color="#7c3aed" />
                </View>
                <Text style={styles.todayValue}>{fmtMoney(stats.totalSales)} <Text style={styles.todayCurrency}>DT</Text></Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                <View style={{ marginRight: 8, alignItems: 'flex-end', backgroundColor: 'transparent' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' }}>TICKETS</Text>
                  <Text style={styles.todayCount}>{fmtInt(stats.orderCount)}</Text>
                </View>
                <FontAwesome name="shopping-bag" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
          </LinearGradient>

          <View style={styles.screenGrid}>
            {/* Hier */}
            <LinearGradient colors={['#475569', '#334155']} style={styles.screenSmallCard}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>Hier</Text>
                 <Text style={styles.screenSmallDate}>{(new Date().getDate() - 1)}/{new Date().getMonth() + 1}</Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.yesterdaySales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.yesterdayOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>tickets</Text></Text>
               </View>
            </LinearGradient>

            {/* Cette Semaine */}
            <LinearGradient colors={['#0891b2', '#0e7490']} style={styles.screenSmallCard}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>Semaine</Text>
                 <Text style={styles.screenSmallDate}>depuis le 17</Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.weeklySales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.weeklyOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>tickets</Text></Text>
               </View>
            </LinearGradient>

            {/* Ce Mois */}
            <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.screenSmallCard}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>Ce Mois</Text>
                 <Text style={styles.screenSmallDate}>{new Date().toLocaleDateString('fr-FR', { month: 'long' })}</Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.monthlySales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.monthlyOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>tickets</Text></Text>
               </View>
            </LinearGradient>

            {/* Total Cumulé */}
            <LinearGradient colors={['#ea580c', '#c2410c']} style={styles.screenSmallCard}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>Total Cumulé</Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.allTimeSales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.allTimeOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>tickets</Text></Text>
               </View>
            </LinearGradient>
          </View>
        </View>

        {/* ── SECTION: CHARTS (REFINED) ────────────────────────── */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Volume des tickets (7 jours)</Text>
          <View style={styles.chartArea}>
             <View style={styles.chartBars}>
                {(stats.weeklyOrderHistory || [0, 0, 0, 1, 0, 3, 2]).map((val: number, i: number) => (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.bar, { height: Math.max(8, val * 25), backgroundColor: '#10b981', opacity: 0.8 }]} />
                    <Text style={styles.barLabel}>{'Lun,Mar,Mer,Jeu,Ven,Sam,Dim'.split(',')[i]}</Text>
                  </View>
                ))}
             </View>
             <View style={styles.chartLegend}>
                <View style={{ backgroundColor: '#10b981', width: 6, height: 6, borderRadius: 3, marginRight: 6 }} />
                <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>Nombre de tickets</Text>
             </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Chiffre d'affaires (7 jours)</Text>
          <View style={styles.chartArea}>
             <View style={styles.chartBars}>
                {(stats.weeklySalesHistory || [100, 250, 150, 420, 300, 580, 425]).map((val: any, i: number) => {
                  const numVal = typeof val === 'object' ? val.total : val;
                  const maxVal = Math.max(...(stats.weeklySalesHistory?.map((h:any) => typeof h === 'object' ? h.total : h) || [600]));
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.bar, { height: Math.max(8, (numVal / maxVal) * 100), backgroundColor: '#6366f1', opacity: 0.8 }]} />
                      <Text style={styles.barLabel}>{'L,M,M,J,V,S,D'.split(',')[i]}</Text>
                    </View>
                  );
                })}
             </View>
          </View>
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
                {stats.topStaff?.length > 0 && (
                  <View style={[styles.analyticsCard, styles.glassCard]}>
                    <View style={styles.analyticsHeader}>
                      <Text style={styles.analyticsTitle}>Performance Staff</Text>
                    </View>
                    {(stats.topStaff || [
                      { name: 'Haythem', revenue: 992.8 },
                      { name: 'Ali', revenue: 290.5 },
                    ]).slice(0, 3).map((s: any, i: number) => (
                      <View key={i} style={[styles.rankRow, i === 2 && { borderBottomWidth: 0 }]}>
                        <View style={[styles.rankNumBox, { backgroundColor: i === 0 ? 'rgba(16,185,129,0.1)' : 'transparent' }]}>
                          <Text style={[styles.rankNum, i === 0 && { color: Colors.primary }]}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                          <Text style={styles.rankName}>{s.name}</Text>
                          <Text style={styles.rankSub}>{fmtMoney(s.revenue)} DT</Text>
                        </View>
                        {i === 0 && <FontAwesome name="trophy" size={14} color="#fbbf24" />}
                      </View>
                    ))}
                  </View>
                )}

                {(stats.topProducts?.length > 0 || true) && (
                  <View style={[styles.analyticsCard, styles.glassCard]}>
                    <View style={styles.analyticsHeader}>
                      <Text style={styles.analyticsTitle}>Meilleurs Produits</Text>
                    </View>
                    {(stats.topProducts?.length ? stats.topProducts : [
                      { name: 'Americano', qty: 128, revenue: 448.0 },
                      { name: 'Café crème', qty: 68, revenue: 204.0 },
                      { name: 'Cappuccino', qty: 51, revenue: 222.5 },
                    ]).slice(0, 3).map((p: any, i: number) => (
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
            style={[styles.mgmtCard, styles.glassCard, { borderLeftColor: Colors.secondary, borderLeftWidth: 3 }]}
            onPress={() => router.push('/stocks?tab=PRODUCTS')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <FontAwesome name="archive" size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.mgmtCardTitle}>PRODUITS</Text>
            <Text style={styles.mgmtCardSub}>Catalogue & Prix</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard, { borderLeftColor: Colors.primary, borderLeftWidth: 3 }]}
            onPress={() => router.push('/stocks?tab=MATERIALS')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <FontAwesome name="bar-chart" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.mgmtCardTitle}>STOCKS</Text>
            <Text style={styles.mgmtCardSub}>Inventaire & Recettes</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard, { borderLeftColor: Colors.warning, borderLeftWidth: 3 }]}
            onPress={() => router.push('/marketplace')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <FontAwesome name="shopping-basket" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.mgmtCardTitle}>B2B MARCHÉ</Text>
            <Text style={styles.mgmtCardSub}>Commandes Fournisseurs</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard, { borderLeftColor: Colors.danger, borderLeftWidth: 3 }]}
            onPress={() => router.push('/suppliers')}
          >
            <View style={[styles.mgmtIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <FontAwesome name="handshake-o" size={18} color={Colors.danger} />
            </View>
            <Text style={styles.mgmtCardTitle}>PARTENAIRES</Text>
            <Text style={styles.mgmtCardSub}>Mes Fournisseurs</Text>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mgmtCard, styles.glassCard, { borderLeftColor: '#a855f7', borderLeftWidth: 3 }]}
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
  rankNumBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankNum: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
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
  // ── Screenshot Styles ──
  screenshotMetrics: {
    marginBottom: 25,
  },
  todayCard: {
    padding: 22,
    borderRadius: 24,
    marginBottom: 15,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  screenCardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    opacity: 0.9,
  },
  screenCardDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  todayValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  todayCurrency: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '600',
  },
  todayCount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  moneyIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  screenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  screenSmallCard: {
    width: '48%',
    padding: 16,
    borderRadius: 22,
    minHeight: 115,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  screenSmallLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '800',
  },
  screenSmallDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  screenSmallRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    backgroundColor: 'transparent',
    gap: 4,
  },
  screenSmallValue: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  screenSmallCurrency: {
    fontSize: 10,
    opacity: 0.7,
  },
  screenSmallCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 26,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 20,
  },
  chartArea: {
    backgroundColor: 'transparent',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: 'transparent',
  },
  barCol: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  bar: {
    width: 22,
    borderRadius: 6,
  },
  barLabel: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'transparent',
  },
  iconCircleHeader: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});

