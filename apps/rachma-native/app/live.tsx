import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SocketService } from '@/services/socket';
import { AuthService } from '@/services/auth';

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

      if (payload.type === 'sale_completed' && payload.data?.total) {
        setTodayTotal((prev) => prev + Number(payload.data.total));
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
    if (event.type === 'rachma_tap') {
      const actionText = event.data.action === 'add' ? 'a ajouté' : 'a retiré';
      return <Text style={styles.eventText}><Text style={styles.bold}>{event.data.baristaId}</Text> {actionText} un produit <Text style={styles.dim}>(Rachma)</Text></Text>;
    }
    if (event.type === 'sale_completed') {
      return <Text style={styles.eventText}>Vente encaissée pour <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{Number(event.data.total).toFixed(3)} DT</Text> <Text style={styles.dim}>#{event.data.fiscalNumber || event.data.id?.substring(0,6)}</Text></Text>;
    }
    return <Text style={styles.eventText}>Activité enregistrée</Text>;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Live Dashboard</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.subtitle}>{isConnected ? 'En direct' : 'Déconnecté'}</Text>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>ENCAISSÉ (LIVE)</Text>
          <Text style={styles.statValue}>+ {todayTotal.toFixed(3)} DT</Text>
        </View>
      </View>

      {/* Feed */}
      <Text style={styles.sectionTitle}>FLUX D'ACTIVITÉ</Text>
      <ScrollView style={styles.feed} contentContainerStyle={{ paddingBottom: 50 }}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color="#6366f1" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyText}>En attente d'activité...</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              {renderEventIcon(event.type)}
              <View style={{ flex: 1 }}>
                {renderEventDescription(event)}
                <Text style={styles.timeText}>{event.timestamp.toLocaleTimeString('fr-FR')}</Text>
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
  statsBar: {
    padding: 20,
  },
  statCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  statLabel: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  feed: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  eventText: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  dim: {
    color: '#64748b',
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
