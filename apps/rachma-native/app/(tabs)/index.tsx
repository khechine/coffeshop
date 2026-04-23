import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [storeId, setStoreId] = useState('1');
  const router = useRouter();

  // Load the real storeId from secure storage
  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) setStoreId(session.storeId);
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
    fetchData();
  }, []);

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

  const stats = data || { totalSales: 0, orderCount: 0, lowStockCount: 0, totalExpenses: 0 };

  return (
    <ScrollView 
      style={styles.outerContainer} 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeTitle}>Bonjour, Mehdi</Text>
          <Text style={styles.subtitle}>Voici vos performances du jour</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
          <FontAwesome name="user-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* KPI Section */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, styles.glassCard]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <FontAwesome name="line-chart" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.kpiLabel}>Chiffre d'Aff.</Text>
          <Text style={styles.kpiValue}>{stats.totalSales?.toLocaleString()} DT</Text>
          <Text style={styles.kpiTrend}>+5% ce mois</Text>
        </View>

        <View style={[styles.kpiCard, styles.glassCard]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <FontAwesome name="shopping-cart" size={18} color={Colors.secondary} />
          </View>
          <Text style={styles.kpiLabel}>Commandes</Text>
          <Text style={styles.kpiValue}>{stats.orderCount || 0}</Text>
          <Text style={[styles.kpiTrend, { color: Colors.secondary }]}>Total Ventes</Text>
        </View>
      </View>

      {/* Large Featured Card */}
      <View style={[styles.featuredCard, styles.glassCard]}>
        <View style={styles.featuredHeader}>
          <Text style={styles.featuredTitle}>Performance & Alertes</Text>
          <TouchableOpacity onPress={onRefresh}>
            <FontAwesome name="refresh" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statRow}>
          <View>
            <Text style={styles.statLabel}>Dépenses</Text>
            <Text style={styles.statValue}>{stats.totalExpenses?.toLocaleString() || 0} DT</Text>
          </View>
          <View style={styles.statDivider} />
          <View>
            <Text style={styles.statLabel}>Alertes Stock</Text>
            <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.lowStockCount || 0}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Actions Rapides</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll}>
        <TouchableOpacity style={[styles.actionBtn, styles.glassCard]}>
          <FontAwesome name="plus" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>Produit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.glassCard]}
          onPress={() => router.push('/scanner')}
        >
          <FontAwesome name="qrcode" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.glassCard]}>
          <FontAwesome name="history" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>Historique</Text>
        </TouchableOpacity>
      </ScrollView>

    </ScrollView>
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
});
