import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function MarketplaceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const data = await ApiService.get('/management/marketplace/products');
      setProducts(data || []);
      
      // Extract unique vendors for the horizontal scroll
      const uniqueVendors = Array.from(new Set(data.map((p: any) => p.vendor?.id)))
        .map(id => data.find((p: any) => p.vendor?.id === id)?.vendor);
      
      setVendors(uniqueVendors);
    } catch (error) {
      console.warn("Failed to fetch marketplace data:", error);
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
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollBody}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marché B2B</Text>
        <TouchableOpacity style={styles.cartBtn}>
          <FontAwesome name="shopping-basket" size={20} color={Colors.primary} />
          <View style={styles.badge}><Text style={styles.badgeText}>0</Text></View>
        </TouchableOpacity>
      </View>

      {/* Featured Vendors */}
      <Text style={styles.sectionTitle}>Fournisseurs Disponibles</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vendorScroll}>
        {vendors.map((vendor, i) => (
          <TouchableOpacity key={i} style={[styles.vendorCard, styles.glassCard]}>
            <View style={styles.vendorLogoPlaceholder}>
              <Text style={{ fontSize: 24 }}>🏢</Text>
            </View>
            <Text style={styles.vendorName} numberOfLines={1}>{vendor.companyName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Categories */}
      <Text style={styles.sectionTitle}>Nouveautés & Offres</Text>
      <View style={styles.productGrid}>
        {products.map((product, i) => (
          <TouchableOpacity key={i} style={[styles.productCard, styles.glassCard]}>
            <Text style={styles.productIcon}>📦</Text>
            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.productPrice}>{product.price?.toLocaleString()} DT</Text>
            <Text style={styles.productVendor}>{product.vendor?.companyName}</Text>
            <TouchableOpacity style={styles.addBtn}>
              <FontAwesome name="plus" size={12} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  scrollBody: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  cartBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 15,
  },
  vendorScroll: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  vendorCard: {
    width: 130,
    padding: 15,
    borderRadius: 24,
    marginRight: 15,
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  vendorLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  vendorName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  productCard: {
    width: '47%',
    padding: 15,
    borderRadius: 24,
    alignItems: 'flex-start',
  },
  productIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  productName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  productPrice: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 14,
  },
  productVendor: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  addBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
