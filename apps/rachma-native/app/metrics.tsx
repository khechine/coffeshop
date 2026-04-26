import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  RefreshControl,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';

const { width } = Dimensions.get('window');

const Colors = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  background: '#0a0f1e',
  surface: '#111827',
  text: '#ffffff',
  textSecondary: '#94a3b8',
};

export default function MetricsScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const session = await AuthService.getSession();
      if (session.user?.storeId) setStoreId(session.user.storeId);
    };
    loadUser();
  }, []);

  const fetchData = async () => {
    if (!storeId) return;
    try {
      const summary = await ApiService.get(`/management/reports/summary/${storeId}`);
      setData(summary);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
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

  const fmtMoney = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0,00');

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Calcul des analyses...</Text>
      </View>
    );
  }

  const stats = data || {};
  const maxWeekly = Math.max(...(stats.weeklySalesHistory?.map((h: any) => h.total) || [1000]));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Rapports & Métriques',
        headerTransparent: true,
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900' }
      }} />
      
      <LinearGradient colors={['#1e293b', '#0a0f1e']} style={StyleSheet.absoluteFill} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <View style={{ height: 100 }} />

        {/* ── SECTOR: REVENUE VS EXPENSES ──────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flux de Trésorerie</Text>
          <Text style={styles.sectionSub}>Aperçu du jour</Text>
        </View>

        <View style={styles.mainMetricsGrid}>
           <View style={[styles.mainMetricCard, { borderLeftColor: Colors.primary, borderLeftWidth: 4 }]}>
              <Text style={styles.metricLabel}>Chiffre d'Affaires</Text>
              <Text style={[styles.metricValue, { color: Colors.primary }]}>{fmtMoney(stats.totalSales)} <Text style={styles.currency}>DT</Text></Text>
           </View>
           <View style={[styles.mainMetricCard, { borderLeftColor: Colors.danger, borderLeftWidth: 4 }]}>
              <Text style={styles.metricLabel}>Dépenses</Text>
              <Text style={[styles.metricValue, { color: Colors.danger }]}>{fmtMoney(stats.totalExpenses)} <Text style={styles.currency}>DT</Text></Text>
           </View>
        </View>

        {/* ── SECTION: PERFORMANCE STAFF ────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="users" size={16} color={Colors.secondary} />
            <Text style={styles.cardTitle}>Performance des Vendeurs</Text>
          </View>
          {stats.topStaff?.map((staff: any, i: number) => {
            const maxRev = stats.topStaff[0].revenue;
            const percentage = (staff.revenue / maxRev) * 100;
            return (
              <View key={i} style={styles.staffRow}>
                 <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffAmount}>{fmtMoney(staff.revenue)} DT</Text>
                 </View>
                 <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: i === 0 ? Colors.primary : Colors.secondary }]} />
                 </View>
              </View>
            );
          })}
        </View>

        {/* ── SECTION: TOP PRODUCTS ───────────────────────────── */}
        <View style={styles.card}>
           <View style={styles.cardHeader}>
             <FontAwesome name="star" size={16} color={Colors.warning} />
             <Text style={styles.cardTitle}>Meilleurs Articles (CA)</Text>
           </View>
           <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 2 }]}>Produit</Text>
              <Text style={[styles.th, { textAlign: 'center' }]}>Ventes</Text>
              <Text style={[styles.th, { textAlign: 'right' }]}>Total</Text>
           </View>
           {stats.topProducts?.slice(0, 5).map((p: any, i: number) => (
             <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2, color: '#fff', fontWeight: 'bold' }]}>{p.name}</Text>
                <Text style={[styles.td, { textAlign: 'center' }]}>{p.qty}</Text>
                <Text style={[styles.td, { textAlign: 'right', color: Colors.primary }]}>{fmtMoney(p.revenue)}</Text>
             </View>
           ))}
        </View>

        {/* ── SECTION: PROFIT MARGIN ──────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitleSmall}>Efficacité Opérationnelle</Text>
          <View style={styles.marginInfo}>
              <View>
                 <Text style={styles.marginLabel}>Marge Opérationnelle</Text>
                 <Text style={styles.marginValue}>
                    {stats.totalSales > 0 ? ((1 - stats.totalExpenses / stats.totalSales) * 100).toFixed(1) : 0}%
                 </Text>
              </View>
              <FontAwesome name="pie-chart" size={40} color={Colors.primary} style={{ opacity: 0.5 }} />
          </View>
          <Text style={styles.marginSub}>Ratio entre CA et dépenses journalières (achats stock, frais).</Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 15,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  sectionSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  mainMetricsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  mainMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  currency: {
    fontSize: 12,
    opacity: 0.7,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  cardTitleSmall: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 15,
  },
  staffRow: {
    marginBottom: 15,
  },
  staffInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  staffName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  staffAmount: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  tableHead: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10,
  },
  th: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  td: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  marginInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  marginValue: {
    color: Colors.primary,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  marginSub: {
    color: '#4b5563',
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  }
});
