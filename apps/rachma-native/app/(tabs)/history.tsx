import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import i18n from '../../locales/i18n';

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [storeId, setStoreId] = useState('');
  const [activeTab, setActiveTab] = useState<'SALES' | 'REPORTS'>('SALES');

  const fetchData = async (currentStoreId: string) => {
    try {
      // In a real app, we would fetch sales or reports based on activeTab
      // For now, let's fetch a summary or mock some history
      const data = await ApiService.get(`/management/reports/summary/${currentStoreId}`);
      // Since the API doesn't have a direct "all sales" for mobile management yet, we'll use the summary to show daily totals
      const chartData = data?.chart || [];
      // Filter out days with 0 sales so we only see actual history
      setHistory(chartData.filter((item: any) => Number(item.total || 0) > 0));
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) {
        setStoreId(session.storeId);
        fetchData(session.storeId);
      }
    });
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(storeId);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('history.salesAndReports')}</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'SALES' && styles.activeTab]}
          onPress={() => setActiveTab('SALES')}
        >
          <Text style={[styles.tabText, activeTab === 'SALES' && styles.activeTabText]}>{i18n.t('history.historyTab')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'REPORTS' && styles.activeTab]}
          onPress={() => setActiveTab('REPORTS')}
        >
          <Text style={[styles.tabText, activeTab === 'REPORTS' && styles.activeTabText]}>{i18n.t('history.zReportsTab')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {history.length > 0 ? history.map((item, idx) => (
          <View key={idx} style={[styles.historyCard, styles.glassCard]}>
            <View style={styles.cardInfo}>
                <View style={styles.dateBox}>
                   <Text style={styles.day}>{new Date(item.date).getDate()}</Text>
                   <Text style={styles.month}>{new Date(item.date).toLocaleString(i18n.locale, { month: 'short' }).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={styles.cardTitle}>{i18n.t('history.salesOf', { date: new Date(item.date).toLocaleDateString(i18n.locale) })}</Text>
                    <Text style={styles.cardSub}>{i18n.t('history.validatedBySystem')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', backgroundColor: 'transparent' }}>
                    <Text style={styles.cardAmount}>{Number(item.total || 0).toFixed(3)} DT</Text>
                    <Text style={styles.cardStatus}>{i18n.t('history.completed')}</Text>
                </View>
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}>
             <FontAwesome name="history" size={64} color="rgba(255,255,255,0.05)" />
             <Text style={styles.emptyText}>{i18n.t('history.emptyHistory')}</Text>
          </View>
        )}
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
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 5,
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#a855f7',
  },
  scrollBody: {
    paddingBottom: 40,
  },
  historyCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 15,
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
  },
  dateBox: {
      width: 50,
      height: 55,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.03)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
  },
  day: { color: '#fff', fontSize: 18, fontWeight: '800' },
  month: { color: Colors.secondary, fontSize: 10, fontWeight: '700' },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  cardAmount: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cardStatus: { color: '#10b981', fontSize: 9, fontWeight: '800', marginTop: 4 },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});
