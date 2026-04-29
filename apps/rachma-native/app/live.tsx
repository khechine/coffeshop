import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { View, Text } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SocketService } from '@/services/socket';
import { AuthService } from '@/services/auth';
import i18n from '../locales/i18n';

type LiveEvent = {
  id: string;
  type: 'rachma_tap' | 'sale_completed' | 'table_updated';
  timestamp: Date;
  data: any;
};

export default function LiveDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [ongoingTotal, setOngoingTotal] = useState(0);

  useEffect(() => {
    AuthService.getSession().then((session) => {
      if (session.storeId) {
        setStoreId(session.storeId);
        SocketService.joinStore(session.storeId);
        setIsConnected(true); // Assuming optimistic connection
      }
    });

    const handleLiveActivity = (payload: any) => {
      const newEvent: LiveEvent = {
        id: Math.random().toString(36).substring(7),
        type: payload.type,
        timestamp: new Date(),
        data: payload.data || payload,
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events

      if ((payload.type === 'rachma_tap' || payload.type === 'table_updated') && payload.price) {
        const amt = Number(payload.price);
        if (!isNaN(amt)) {
          setOngoingTotal(prev => prev + (payload.action === 'add' ? amt : -amt));
        }
      }

      if (payload.type === 'sale_completed' && payload.data) {
        const totalRaw = payload.data.total;
        let amountToAdd = 0;
        if (typeof totalRaw === 'number') amountToAdd = totalRaw;
        else if (typeof totalRaw === 'string') amountToAdd = Number(totalRaw);
        else if (totalRaw && typeof totalRaw === 'object' && totalRaw.d) {
          if (typeof totalRaw.toString === 'function' && !totalRaw.toString().includes('object')) {
            amountToAdd = Number(totalRaw.toString());
          } else {
            amountToAdd = Number(totalRaw.d.join('')) / Math.pow(10, totalRaw.e || 1);
          }
        }
        
        if (!isNaN(amountToAdd) && amountToAdd > 0) {
          setTodayTotal((prev) => prev + amountToAdd);
          // Assuming the batch was completed, reset ongoing total
          setOngoingTotal(0); 
        }
      }
    };

    SocketService.on('live_activity', handleLiveActivity);

    return () => {
      SocketService.off('live_activity', handleLiveActivity);
      if (storeId) SocketService.leaveStore(storeId);
    };
  }, [storeId]);

  const renderEventIcon = (type: string) => {
    switch (type) {
      case 'rachma_tap': return <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}><FontAwesome name="hand-pointer-o" size={16} color="#10b981" /></View>;
      case 'sale_completed': return <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}><FontAwesome name="money" size={16} color="#6366f1" /></View>;
      case 'table_updated': return <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}><FontAwesome name="cutlery" size={16} color="#f59e0b" /></View>;
      default: return <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}><FontAwesome name="bell" size={16} color="#fff" /></View>;
    }
  };

  const renderEventDescription = (event: LiveEvent) => {
    if (event.type === 'rachma_tap' || event.type === 'table_updated') {
      const actionText = event.data.action === 'add' ? i18n.t('live.added') : i18n.t('live.removed');
      const displayName = i18n.locale === 'ar' && event.data.productNameAr ? event.data.productNameAr : event.data.productName;
      const productName = displayName ? ` ${displayName}` : ` ${i18n.t('live.product')}`;
      const takeawayText = event.data.isTakeaway ? ` ${i18n.t('live.takeaway')}` : '';
      const modeContext = event.type === 'table_updated' ? `(${event.data.tableName})` : i18n.t('live.rachma');
      return <Text style={styles.eventText}><Text style={styles.bold}>{event.data.baristaName || event.data.baristaId}</Text> {actionText}<Text style={{ fontWeight: 'bold', color: '#f8fafc' }}>{productName}</Text>{takeawayText} <Text style={styles.dim}>{modeContext}</Text></Text>;
    }
    if (event.type === 'sale_completed') {
      return <Text style={styles.eventText}>{i18n.t('live.saleCompleted')} <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{Number(event.data.total).toFixed(3)} DT</Text> <Text style={styles.dim}>#{event.data.fiscalNumber || event.data.id?.substring(0,6)}</Text></Text>;
    }
    return <Text style={styles.eventText}>{i18n.t('live.recordedActivity')}</Text>;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={16} color="#94a3b8" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.title}>{i18n.t('live.liveTracker')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.dot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.statusText}>{isConnected ? i18n.t('live.connected') : i18n.t('live.disconnected')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{i18n.t('live.totalLive')}</Text>
          <Text style={[styles.kpiValue, { color: '#10b981' }]}>+ {todayTotal.toFixed(3)} DT</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{i18n.t('live.ongoingLive')}</Text>
          <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>+ {ongoingTotal.toFixed(3)} DT</Text>
        </View>
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>{i18n.t('live.activityFeed')}</Text>
        <View style={styles.activityBadge}>
          <Text style={styles.activityBadgeText}>{events.length} {i18n.t('live.recordedActivity')}</Text>
        </View>
      </View>

      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="feed" size={48} color="rgba(255,255,255,0.05)" />
            <Text style={styles.emptyText}>{i18n.t('live.waitingActivity')}</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              {renderEventIcon(event.type)}
              <View style={{ flex: 1 }}>
                {renderEventDescription(event)}
                <Text style={styles.timeText}>{event.timestamp.toLocaleTimeString(i18n.locale === 'ar' ? 'ar-TN' : 'fr-FR')}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  activityBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityBadgeText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '800',
  },
  feed: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    marginTop: 15,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  eventText: {
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  dim: {
    color: '#64748b',
  },
  timeText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});
