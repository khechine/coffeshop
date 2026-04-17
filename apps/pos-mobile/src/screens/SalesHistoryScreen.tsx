import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Modal } from 'react-native';
import { usePOSStore } from '../store/posStore';
import { GlassPanel } from '../components/Antigravity/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export function SalesHistoryScreen({ storeId }: { storeId: string }) {
  const { theme } = usePOSStore();
  const [sales, setSales] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedBarista, setSelectedBarista] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'ALL' | 'NORMAL' | 'RACHMA'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      let endDateParam = "";
      
      if (timeFilter === 'YESTERDAY') {
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        endDateParam = `&endDate=${endDate.toISOString()}`;
      } else if (timeFilter === 'WEEK') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeFilter === 'MONTH') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeFilter === 'ALL') {
        startDate = new Date(0); // Epoch
      }

      let url = `${API_URL}/sales/history/${storeId}?startDate=${startDate.toISOString()}${endDateParam}`;
      if (selectedBarista) url += `&baristaId=${selectedBarista}`;
      if (selectedMode !== 'ALL') url += `&mode=${selectedMode}`;

      const res = await fetch(url);
      if (res.ok) setSales(await res.json());
      
      const staffRes = await fetch(`${API_URL}/sales/management/staff/${storeId}`);
      if (staffRes.ok) setStaff(await staffRes.json());
    } catch (e) {
      console.error('History fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [storeId, selectedBarista, selectedMode, timeFilter]);

  const stats = useMemo(() => {
    const total = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const normal = sales.filter(s => s.mode === 'NORMAL').reduce((acc, s) => acc + Number(s.total), 0);
    const rachma = sales.filter(s => s.mode === 'RACHMA').reduce((acc, s) => acc + Number(s.total), 0);
    return { total, normal, rachma, count: sales.length };
  }, [sales]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 20 },
    title: { fontSize: 24, fontWeight: '900', color: theme.colors.cream, marginBottom: 4 },
    subtitle: { fontSize: 13, color: theme.colors.caramel, textTransform: 'uppercase', letterSpacing: 1 },
    
    filterScroll: { paddingHorizontal: 20, marginBottom: 15 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surface, marginRight: 8, borderWidth: 1, borderColor: theme.colors.glassBorder },
    chipActive: { backgroundColor: theme.colors.caramel, borderColor: theme.colors.caramel },
    chipText: { color: theme.colors.creamMuted, fontSize: 12, fontWeight: '700' },
    chipTextActive: { color: theme.colors.background },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
    statCard: { flex: 1, padding: 15, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.glassBorder },
    statLabel: { fontSize: 10, color: theme.colors.creamMuted, fontWeight: '800', marginBottom: 5, textTransform: 'uppercase' },
    statValue: { fontSize: 15, fontWeight: '900', color: theme.colors.cream },

    saleItem: { 
      backgroundColor: theme.colors.surface, marginHorizontal: 20, marginBottom: 10, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: theme.colors.glassBorder
    },
    saleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    saleBarista: { fontSize: 14, fontWeight: '800', color: theme.colors.cream },
    saleTime: { fontSize: 11, color: theme.colors.creamMuted },
    saleMode: { fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
    salePrice: { fontSize: 17, fontWeight: '900', color: theme.colors.caramel },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    itemName: { fontSize: 12, color: theme.colors.creamMuted },
    itemQty: { fontSize: 12, color: theme.colors.cream, fontWeight: '700' }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rapports & Ventes</Text>
        <Text style={styles.subtitle}>Suivi par vendeur & mode</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 40 }}>
        {(['TODAY', 'YESTERDAY', 'WEEK', 'ALL'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.chip, timeFilter === f && styles.chipActive]} onPress={() => setTimeFilter(f)}>
            <Text style={[styles.chipText, timeFilter === f && styles.chipTextActive]}>
              {f === 'TODAY' ? "Aujourd'hui" : f === 'YESTERDAY' ? "Hier" : f === 'WEEK' ? "7 Jours" : "Tout"}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ width: 20 }} />
        {(['ALL', 'NORMAL', 'RACHMA'] as const).map(m => (
          <TouchableOpacity key={m} style={[styles.chip, selectedMode === m && styles.chipActive, { borderColor: theme.colors.softOrange }]} onPress={() => setSelectedMode(m)}>
            <Text style={[styles.chipText, selectedMode === m && styles.chipTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity style={[styles.chip, !selectedBarista && styles.chipActive]} onPress={() => setSelectedBarista(null)}>
          <Text style={[styles.chipText, !selectedBarista && styles.chipTextActive]}>Tous les vendeurs</Text>
        </TouchableOpacity>
        {staff.map(s => (
          <TouchableOpacity key={s.id} style={[styles.chip, selectedBarista === s.id && styles.chipActive]} onPress={() => setSelectedBarista(s.id)}>
            <Text style={[styles.chipText, selectedBarista === s.id && styles.chipTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{stats.total.toFixed(3)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rachma</Text>
          <Text style={[styles.statValue, { color: theme.colors.softOrange }]}>{stats.rachma.toFixed(3)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Nombre</Text>
          <Text style={styles.statValue}>{stats.count}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.caramel} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {sales.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.colors.creamMuted, marginTop: 40 }}>Aucune vente trouvée</Text>
          ) : (
            sales.map(sale => (
              <View key={sale.id} style={styles.saleItem}>
                <View style={styles.saleHeader}>
                  <View>
                    <Text style={styles.saleBarista}>{sale.barista?.name || 'Inconnu'}</Text>
                    <Text style={styles.saleTime}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(sale.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.saleMode, { 
                      backgroundColor: sale.mode === 'RACHMA' ? `${theme.colors.softOrange}20` : `${theme.colors.caramel}20`,
                      color: sale.mode === 'RACHMA' ? theme.colors.softOrange : theme.colors.caramel
                    }]}>{sale.mode}</Text>
                    <Text style={styles.salePrice}>{Number(sale.total).toFixed(3)} DT</Text>
                  </View>
                </View>
                
                {sale.items?.map((item: any, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.product?.name || 'Produit inconnu'}</Text>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
