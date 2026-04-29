import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Modal, BackHandler, useWindowDimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import i18n from '../../locales/i18n';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
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
        Alert.alert(i18n.t('dashboard.exitTitle'), i18n.t('dashboard.exitConfirm'), [
          { text: i18n.t('pos.cancel'), style: 'cancel', onPress: () => {} },
          { text: i18n.t('dashboard.exit'), style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true; // prevent default
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const fetchData = async () => {
    if (!storeId) return;
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
        <Text style={styles.loadingText}>{i18n.t('dashboard.loading')}</Text>
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
        contentContainerStyle={[styles.container, isTablet && styles.tabletContainer]}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeTitle}>{i18n.t('dashboard.welcome', { name: user?.name || i18n.t('dashboard.manager') })}</Text>
            <Text style={styles.subtitle}>{i18n.t('dashboard.progression')}</Text>
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
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{i18n.t('dashboard.lowStockAlert')}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>{i18n.t('dashboard.stockAttention', { count: stats.lowStockCount })}</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#475569" />
          </TouchableOpacity>
        )}

        {/* ── SECTION: PERFORMANCE FINANCIÈRE (REFINED) ── */}
        <View style={[styles.screenshotMetrics, isTablet && styles.tabletMetrics]}>
          {/* Aujourd'hui - Large Card */}
          <LinearGradient colors={['#7c3aed', '#6d28d9']} style={[styles.todayCard, isTablet && styles.tabletTodayCard]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
              <Text style={styles.screenCardTitle}>{i18n.t('dashboard.today')}</Text>
              <Text style={styles.screenCardDate}>{new Date().toLocaleDateString(i18n.locale === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' })}</Text>
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
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' }}>{i18n.t('dashboard.tickets').toUpperCase()}</Text>
                  <Text style={styles.todayCount}>{fmtInt(stats.orderCount)}</Text>
                </View>
                <FontAwesome name="shopping-bag" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.screenGrid, isTablet && styles.tabletScreenGrid]}>
            {/* Hier */}
            <LinearGradient colors={['#475569', '#334155']} style={[styles.screenSmallCard, isTablet && styles.tabletSmallCard]}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>{i18n.t('dashboard.yesterday')}</Text>
                 <Text style={styles.screenSmallDate}>{(new Date().getDate() - 1)}/{new Date().getMonth() + 1}</Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.yesterdaySales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.yesterdayOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>{i18n.t('dashboard.tickets')}</Text></Text>
               </View>
            </LinearGradient>

            {/* Cette Semaine */}
            <LinearGradient colors={['#0891b2', '#0e7490']} style={[styles.screenSmallCard, isTablet && styles.tabletSmallCard]}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>{i18n.t('dashboard.week')}</Text>
                 <Text style={styles.screenSmallDate}></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.weeklySales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.weeklyOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>{i18n.t('dashboard.tickets')}</Text></Text>
               </View>
            </LinearGradient>

            {/* Ce Mois */}
            <LinearGradient colors={['#0d9488', '#0f766e']} style={[styles.screenSmallCard, isTablet && styles.tabletSmallCard]}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>{i18n.t('dashboard.month')}</Text>
                 <Text style={styles.screenSmallDate}>{new Date().toLocaleDateString(i18n.locale === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long' })}</Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.monthlySales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.monthlyOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>{i18n.t('dashboard.tickets')}</Text></Text>
               </View>
            </LinearGradient>

            {/* Total Cumulé */}
            <LinearGradient colors={['#ea580c', '#c2410c']} style={[styles.screenSmallCard, isTablet && styles.tabletSmallCard]}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                 <Text style={styles.screenSmallLabel}>{i18n.t('dashboard.totalAllTime')}</Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallValue}>{fmtMoney(stats.allTimeSales || 0)} <Text style={styles.screenSmallCurrency}>DT</Text></Text>
               </View>
               <View style={styles.screenSmallRow}>
                  <Text style={styles.screenSmallCount}>{fmtInt(stats.allTimeOrderCount || 0)} <Text style={{fontSize:9, opacity:0.6}}>{i18n.t('dashboard.tickets')}</Text></Text>
               </View>
            </LinearGradient>
          </View>
        </View>

        {/* ── SECTION: CENTRE DE GESTION ───────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{i18n.t('dashboard.managementCenter')}</Text>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800' }}>{isOwner ? i18n.t('dashboard.fullAccess') : i18n.t('dashboard.limitedAccess')}</Text>
          </View>
        </View>

        <View style={styles.mgmtGrid}>
          {[
            { id: 'products', route: '/stocks?tab=PRODUCTS', icon: 'archive', color: Colors.secondary, title: 'dashboard.products', sub: 'dashboard.productsSub' },
            { id: 'stocks', route: '/stocks?tab=MATERIALS', icon: 'bar-chart', color: Colors.primary, title: 'dashboard.stocks', sub: 'dashboard.stocksSub' },
            { id: 'marketplace', route: '/marketplace', icon: 'shopping-basket', color: Colors.warning, title: 'dashboard.b2bMarket', sub: 'dashboard.b2bMarketSub' },
            { id: 'partners', route: '/suppliers', icon: 'handshake-o', color: Colors.danger, title: 'dashboard.partners', sub: 'dashboard.partnersSub' },
            { id: 'sales', route: '/history', icon: 'history', color: '#a855f7', title: 'dashboard.sales', sub: 'dashboard.salesSub' },
            { id: 'live', route: '/rachma', icon: 'bolt', color: Colors.primary, title: 'nav.live', sub: 'dashboard.liveSub' },
            { id: 'scanner', route: '/scanner', icon: 'qrcode', color: '#94a3b8', title: 'dashboard.scanner', sub: 'dashboard.scannerSub' },
            ...(isOwner ? [
              { id: 'metrics', route: '/metrics', icon: 'line-chart', color: '#38bdf8', title: 'nav.metrics', sub: 'dashboard.metricsSub' },
              { id: 'terminals', route: '/terminals', icon: 'desktop', color: Colors.primary, title: 'dashboard.terminals', sub: 'dashboard.terminalsSub' },
              { id: 'team', route: '/team', icon: 'users', color: '#ec4899', title: 'dashboard.team', sub: 'dashboard.teamSub' }
            ] : [])
          ].map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={[styles.mgmtCard, styles.glassCard, isTablet && styles.tabletMgmtCard, { borderLeftColor: item.color, borderLeftWidth: 3 }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.mgmtIconCircle, { backgroundColor: `${item.color}15` }]}>
                <FontAwesome name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.mgmtCardTitle}>{i18n.t(item.title).toUpperCase()}</Text>
              <Text style={styles.mgmtCardSub}>{i18n.t(item.sub)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SECTION: CHARTS ── */}
        <View style={[isTablet && { flexDirection: 'row', gap: 20, marginTop: 20 }]}>
          <View style={[styles.chartContainer, isTablet && { flex: 1 }]}>
            <Text style={styles.chartTitle}>{i18n.t('dashboard.ticketVolume')}</Text>
            <View style={styles.chartArea}>
              <View style={styles.chartBars}>
                  {(stats.weeklyOrderHistory || [0, 0, 0, 0, 0, 0, 0]).map((val: number, i: number) => (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.bar, { height: Math.max(8, val * 25), backgroundColor: '#10b981', opacity: 0.8 }]} />
                      <Text style={styles.barLabel}>{i18n.t('dashboard.daysShort').split(',')[i]}</Text>
                    </View>
                  ))}
              </View>
            </View>
          </View>

          <View style={[styles.chartContainer, isTablet && { flex: 1 }]}>
            <Text style={styles.chartTitle}>{i18n.t('dashboard.revenueVolume')}</Text>
            <View style={styles.chartArea}>
              <View style={styles.chartBars}>
                  {(stats.weeklySalesHistory || [0, 0, 0, 0, 0, 0, 0]).map((val: any, i: number) => {
                    const numVal = typeof val === 'object' ? val.total : val;
                    const maxVal = Math.max(...(stats.weeklySalesHistory?.map((h:any) => typeof h === 'object' ? h.total : h) || [100]));
                    return (
                      <View key={i} style={styles.barCol}>
                        <View style={[styles.bar, { height: Math.max(8, (numVal / maxVal) * 100), backgroundColor: '#6366f1', opacity: 0.8 }]} />
                        <Text style={styles.barLabel}>{i18n.t('dashboard.daysVeryShort').split(',')[i]}</Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION: ANALYTIQUES AVANCÉES (OWNER) ───────────── */}
        {isOwner && (
          <View style={{ marginTop: 10, marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>{i18n.t('dashboard.detailedAnalysis')}</Text>
            
            <View style={[isTablet && { flexDirection: 'row', gap: 20 }]}>
              {/* Profit Net Banner */}
              <View style={[styles.profitBanner, isTablet && { flex: 1 }, {
                backgroundColor: stats.netProfit >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                borderColor: stats.netProfit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              }]}>
                <View style={{ backgroundColor: 'transparent' }}>
                  <Text style={styles.profitLabel}>{i18n.t('dashboard.netProfit')}</Text>
                  <Text style={[styles.profitValue, { color: stats.netProfit >= 0 ? Colors.primary : Colors.danger }]}>
                    {fmtMoney(stats.netProfit ?? stats.totalSales - stats.totalExpenses)} DT
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: 'transparent' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stats.netProfit >= 0 ? Colors.primary : Colors.danger, marginRight: 6 }} />
                    <Text style={[styles.profitSub, { color: '#94a3b8' }]}>{i18n.t('dashboard.margin')}: {stats.totalSales > 0 ? ((1 - stats.totalExpenses/stats.totalSales)*100).toFixed(0) : 0}%</Text>
                  </View>
                </View>
                <FontAwesome
                  name={stats.netProfit >= 0 ? 'line-chart' : 'warning'}
                  size={32}
                  color={stats.netProfit >= 0 ? Colors.primary : Colors.danger}
                  style={{ opacity: 0.5 }}
                />
              </View>

              <View style={[isTablet && { flex: 2, flexDirection: 'row', gap: 20 }]}>
                {stats.topStaff?.length > 0 && (
                  <View style={[styles.analyticsCard, styles.glassCard, { flex: 1, marginBottom: 0 }]}>
                    <View style={styles.analyticsHeader}>
                      <Text style={styles.analyticsTitle}>{i18n.t('dashboard.staffPerformance')}</Text>
                    </View>
                    {stats.topStaff.slice(0, 3).map((s: any, i: number) => (
                      <View key={i} style={[styles.rankRow, i === 2 && { borderBottomWidth: 0 }]}>
                        <View style={[styles.rankNumBox, { backgroundColor: i === 0 ? 'rgba(16,185,129,0.1)' : 'transparent' }]}>
                          <Text style={[styles.rankNum, i === 0 && { color: Colors.primary }]}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                          <Text style={styles.rankName}>{s.name}</Text>
                          <Text style={styles.rankSub}>{fmtMoney(s.revenue)} DT</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {stats.topProducts?.length > 0 && (
                  <View style={[styles.analyticsCard, styles.glassCard, { flex: 1, marginBottom: 0 }]}>
                    <View style={styles.analyticsHeader}>
                      <Text style={styles.analyticsTitle}>{i18n.t('dashboard.bestProducts')}</Text>
                    </View>
                    {stats.topProducts.slice(0, 3).map((p: any, i: number) => (
                      <View key={i} style={[styles.rankRow, i === 2 && { borderBottomWidth: 0 }]}>
                        <Text style={styles.rankNum}>{i + 1}</Text>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                          <Text style={styles.rankName}>{i18n.locale === 'ar' && p.nameAr ? p.nameAr : p.name}</Text>
                          <Text style={styles.rankSub}>{fmtMoney(p.revenue)} {i18n.t('dashboard.revenueLabel')}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // raised to move menu higher
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
  // ── Tablet layout overrides ────────────────────────────────────
  tabletContainer: {
    paddingHorizontal: 40,
  },
  tabletMetrics: {
    flexDirection: 'row',
    gap: 20,
  },
  tabletTodayCard: {
    flex: 1,
    marginBottom: 0,
  },
  tabletScreenGrid: {
    flex: 2,
  },
  tabletSmallCard: {
    width: '23.5%',
  },
  tabletMgmtCard: {
    width: '18.5%',
  },
});

