import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const fetchData = async (vid: string) => {
    try {
      const data = await ApiService.get(`/management/vendor/wallet/${vid}`);
      setWallet(data);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.user?.vendorId) {
        setVendorId(session.user.vendorId);
        fetchData(session.user.vendorId);
      }
    });
  }, []);

  const onRefresh = () => {
    if (vendorId) {
      setRefreshing(true);
      fetchData(vendorId);
    }
  };

  const handleWithdraw = () => {
    Alert.alert("Demande de retrait", "Votre demande a été envoyée à l'administration. Délai moyen: 48h.");
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const transactions = wallet?.transactions || [];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Espace Finance</Text>

      <ScrollView contentContainerStyle={styles.scrollBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        <View style={[styles.balanceCard, styles.glassCard]}>
            <Text style={styles.balanceLabel}>Solde Disponible</Text>
            <Text style={styles.balanceValue}>{Number(wallet?.balance || 0).toFixed(3)} DT</Text>
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
                <Text style={styles.withdrawBtnText}>Demander un retrait</Text>
            </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Transactions Récentes</Text>
        {transactions.map((tx: any, idx: number) => (
          <View key={idx} style={[styles.transactionRow, styles.glassCard]}>
            <View style={[styles.iconBox, { backgroundColor: tx.amount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                <FontAwesome name={tx.amount > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={tx.amount > 0 ? '#10b981' : '#ef4444'} />
            </View>
            <View style={{ flex: 1, backgroundColor: 'transparent', marginLeft: 12 }}>
                <Text style={styles.txTitle}>{tx.description || tx.type}</Text>
                <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('fr-FR')} — {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.amount > 0 ? '#10b981' : '#ef4444' }]}>
                {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(3)} DT
            </Text>
          </View>
        ))}
        {transactions.length === 0 && <Text style={styles.emptyText}>Aucune transaction répertoriée.</Text>}
        <View style={{ height: 100 }} />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  scrollBody: {
    paddingBottom: 100,
  },
  balanceCard: {
    padding: 25,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 30,
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  balanceValue: {
    color: '#f59e0b',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  withdrawBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 20,
  },
  withdrawBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  emptyText: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
  },
});

