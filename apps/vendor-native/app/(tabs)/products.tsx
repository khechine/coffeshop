import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams } from 'expo-router';

export default function ProductsScreen() {
  const { tab } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'PROMOTIONS'>((tab as any) || 'CATALOG');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // CRUD States
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('0.000');
  const [formMinQty, setFormMinQty] = useState('1');
  const [formStock, setFormStock] = useState('IN_STOCK'); // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  const [formFeatured, setFormFeatured] = useState(false);
  const [formFlash, setFormFlash] = useState(false);

  const fetchData = async (vid: string) => {
    try {
      const data = await ApiService.get(`/management/marketplace/products?vendorId=${vid}`);
      setProducts(data || []);
    } catch (error) {
      console.error("Failed to fetch vendor products:", error);
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

  const handleSaveItem = async () => {
    if (!formName) return Alert.alert("Erreur", "Le nom est requis.");
    try {
      const payload = {
        name: formName,
        price: Number(formPrice),
        minOrderQty: Number(formMinQty),
        stockStatus: formStock,
        isFeatured: formFeatured,
        isFlashSale: formFlash,
        vendorId,
      };

      if (editingItem) {
        await ApiService.put(`/management/marketplace/products/${editingItem.id}`, payload);
      } else {
        await ApiService.post('/management/marketplace/products', payload);
      }
      
      setIsItemModalVisible(false);
      onRefresh();
    } catch (error) {
      Alert.alert("Erreur", "Sauvegarde impossible.");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'PROMOTIONS') return matchesSearch && (p.isFeatured || p.isFlashSale);
    return matchesSearch;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Catalogue Produits</Text>
        <TouchableOpacity style={styles.addIconBtn} onPress={() => { setEditingItem(null); setFormName(''); setFormPrice('0.000'); setIsItemModalVisible(true); }}>
          <FontAwesome name="plus-circle" size={28} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'CATALOG' && styles.activeTab]} onPress={() => setActiveTab('CATALOG')}>
          <Text style={[styles.tabText, activeTab === 'CATALOG' && styles.activeTabText]}>Tout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'PROMOTIONS' && styles.activeTab]} onPress={() => setActiveTab('PROMOTIONS')}>
          <Text style={[styles.tabText, activeTab === 'PROMOTIONS' && styles.activeTabText]}>Promotions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <FontAwesome name="search" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
        <TextInput 
          placeholder="Chercher un produit..." 
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        {filteredProducts.map((p, idx) => (
          <TouchableOpacity key={idx} style={[styles.itemRow, styles.glassCard]} onPress={() => {
            setEditingItem(p);
            setFormName(p.name);
            setFormPrice(String(p.price));
            setFormMinQty(String(p.minOrderQty));
            setFormStock(p.stockStatus);
            setFormFeatured(p.isFeatured);
            setFormFlash(p.isFlashSale);
            setIsItemModalVisible(true);
          }}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.itemName}>{p.name}</Text>
              <Text style={styles.itemRef}>{Number(p.price).toFixed(3)} DT — Min: {p.minOrderQty}</Text>
              <View style={{ flexDirection: 'row', gap: 5, marginTop: 5, backgroundColor: 'transparent' }}>
                {p.isFeatured && <View style={styles.tagFeatured}><Text style={styles.tagText}>Featured</Text></View>}
                {p.isFlashSale && <View style={styles.tagFlash}><Text style={styles.tagText}>Flash</Text></View>}
              </View>
            </View>
            <View style={[styles.stockBadge, { borderColor: p.stockStatus === 'IN_STOCK' ? '#10b981' : '#f59e0b' }]}>
               <Text style={[styles.stockText, { color: p.stockStatus === 'IN_STOCK' ? '#10b981' : '#f59e0b' }]}>{p.stockStatus}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {filteredProducts.length === 0 && <Text style={styles.emptyText}>Aucun produit trouvé.</Text>}
      </ScrollView>

      {/* Product Editor Modal */}
      <Modal visible={isItemModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editingItem ? 'Modifier' : 'Nouveau'} Produit</Text>
                    <TouchableOpacity onPress={() => setIsItemModalVisible(false)}><FontAwesome name="times" size={20} color="#fff" /></TouchableOpacity>
                </View>
                <ScrollView style={{ padding: 20 }}>
                    <Text style={styles.inputLabel}>Nom du produit</Text>
                    <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} placeholder="Nom..." placeholderTextColor="#475569" />
                    
                    <View style={{ flexDirection: 'row', gap: 15, backgroundColor: 'transparent' }}>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                            <Text style={styles.inputLabel}>Prix de vente (DT)</Text>
                            <TextInput style={styles.modalInput} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" placeholder="0.000" placeholderTextColor="#475569" />
                        </View>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                            <Text style={styles.inputLabel}>Commande Min.</Text>
                            <TextInput style={styles.modalInput} value={formMinQty} onChangeText={setFormMinQty} keyboardType="numeric" placeholder="1" placeholderTextColor="#475569" />
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>État du stock</Text>
                    <View style={styles.stockToggleRow}>
                        {['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map(s => (
                            <TouchableOpacity key={s} style={[styles.stockToggleBtn, formStock === s && styles.stockToggleActive]} onPress={() => setFormStock(s)}>
                                <Text style={[styles.stockToggleText, formStock === s && { color: '#fff' }]}>{s.replace('_', ' ')}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Mettre en avant (Featured)</Text>
                        <TouchableOpacity onPress={() => setFormFeatured(!formFeatured)}>
                            <FontAwesome name={formFeatured ? "toggle-on" : "toggle-off"} size={28} color={formFeatured ? "#f59e0b" : "#475569"} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Vente Flash</Text>
                        <TouchableOpacity onPress={() => setFormFlash(!formFlash)}>
                            <FontAwesome name={formFlash ? "toggle-on" : "toggle-off"} size={28} color={formFlash ? "#ef4444" : "#475569"} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
                        <Text style={styles.saveBtnText}>Enregistrer le produit</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addIconBtn: {
    backgroundColor: 'transparent',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#f59e0b',
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
    paddingBottom: 100,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
    marginBottom: 12,
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  itemRef: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  tagFeatured: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tagFlash: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  tagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '900',
  },
  emptyText: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalSheet: {
    backgroundColor: '#0a0f1e',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 5,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    height: 55,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  stockToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  stockToggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stockToggleActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  stockToggleText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  switchLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#f59e0b',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
