import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function StocksScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const storeId = '1';

  const fetchData = async () => {
    try {
      // For the stocks view, we group by category
      const [catData, stockData] = await Promise.all([
        ApiService.get(`/management/categories/${storeId}`),
        ApiService.get(`/management/stock/${storeId}`)
      ]);

      // Calculate totals per category for display
      const mapped = catData.map((cat: any) => {
        const items = stockData.filter((s: any) => s.categoryId === cat.id);
        return {
          ...cat,
          itemCount: items.length,
          totalQty: items.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0)
        };
      });

      setCategories(mapped);
    } catch (error) {
      console.warn("Failed to fetch stocks:", error);
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

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <FontAwesome name="search" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
        <TextInput 
          placeholder="Rechercher une catégorie..." 
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.sectionTitle}>Catégories d'Inventaire</Text>
        
        <View style={styles.grid}>
          {filteredCategories.length > 0 ? filteredCategories.map((cat, i) => (
            <TouchableOpacity key={i} style={[styles.gridCard, styles.glassCard]}>
              <Text style={styles.cardIcon}>{cat.icon || '📦'}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>{cat.name}</Text>
              <Text style={styles.cardStock}>{cat.itemCount} articles</Text>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune catégorie trouvée.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.addItemBtn}>
          <FontAwesome name="plus" size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.addItemText}>Nouvelle Catégorie</Text>
        </TouchableOpacity>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  scrollBody: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  gridCard: {
    width: '47%',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  cardStock: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  addItemBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    height: 55,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  addItemText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
});
