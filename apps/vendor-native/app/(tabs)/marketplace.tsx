import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions, TextInput,
  Modal, Platform, useColorScheme,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000';

const CATEGORIES = [
  { id: 'all', name: 'Tout', icon: 'th-large' },
  { id: 'coffee', name: 'Café', icon: 'coffee' },
  { id: 'equipment', name: 'Matériel', icon: 'wrench' },
  { id: 'milk', name: 'Lait', icon: 'tint' },
  { id: 'packaging', name: 'Emballage', icon: 'cube' },
];

// ---------- theme tokens ----------
const DARK = {
  bg: '#0a0f1e',
  card: 'rgba(16,20,35,0.85)',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  subtext: '#94a3b8',
  muted: '#64748b',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.08)',
  sectionBg: 'rgba(255,255,255,0.03)',
};
const LIGHT = {
  bg: '#f1f5f9',
  card: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.07)',
  text: '#0f172a',
  subtext: '#475569',
  muted: '#94a3b8',
  inputBg: '#ffffff',
  inputBorder: 'rgba(0,0,0,0.1)',
  sectionBg: 'rgba(0,0,0,0.03)',
};

interface CartItem { product: any; qty: number; }

export default function MarketplaceScreen() {
  const scheme = useColorScheme();
  const T = scheme === 'dark' ? DARK : LIGHT;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Derived
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + parseFloat(i.product.price || 0) * i.qty, 0);

  const fetchData = async () => {
    try {
      const [prodData, bundlesData] = await Promise.all([
        ApiService.get('/management/marketplace/products'),
        ApiService.get('/management/marketplace/bundles').catch(() => []) // Fallback if endpoint doesn't exist yet
      ]);
      
      setProducts(prodData || []);
      setBundles(bundlesData || []);

      const seen = new Set<any>();
      const v: any[] = [];
      (prodData || []).forEach((p: any) => {
        if (p.vendor?.id && !seen.has(p.vendor.id)) { seen.add(p.vendor.id); v.push(p.vendor); }
      });
      setVendors(v);
    } catch (e) {
      console.warn('Marketplace fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatPrice = (price: any) => {
    const v = parseFloat(price);
    return isNaN(v) ? '0.00' : v.toFixed(2);
  };

  const getProductIcon = (name: any) => {
    const n = (name || '').toLowerCase();
    if (n.includes('café') || n.includes('grain') || n.includes('cafe')) return '☕';
    if (n.includes('lait')) return '🥛';
    if (n.includes('gobelet') || n.includes('verre') || n.includes('cup')) return '🥤';
    if (n.includes('serviette')) return '🧻';
    if (n.includes('sucre')) return '🍬';
    if (n.includes('pack') || n.includes('kit')) return '🎁';
    return '📦';
  };

  const handleAddToCart = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.product.id === productId);
      if (idx < 0) return prev;
      const next = [...prev];
      if (next[idx].qty > 1) {
        next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
      } else {
        next.splice(idx, 1);
      }
      return next;
    });
  };

  const filteredProducts = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const matchesSearch = name.includes((search || '').toLowerCase());
    const matchesCat = selectedCategory === 'all' || category === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const businessPacks = bundles.length > 0 ? bundles : products.filter(p => {
    const n = (p.name || '').toLowerCase();
    return n.includes('pack') || n.includes('kit');
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>

      {/* ── MAIN SCROLL ── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: T.bg }}
        contentContainerStyle={[styles.scrollBody]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={[styles.title, { color: T.text }]}>Marché B2B</Text>
            <Text style={[styles.subtitle, { color: T.muted }]}>Trouvez vos fournitures</Text>
          </View>
          <TouchableOpacity
            style={[styles.cartBtn, { backgroundColor: T.inputBg, borderColor: T.cardBorder }]}
            onPress={() => { Haptics.selectionAsync(); setCartOpen(true); }}
          >
            <FontAwesome name="shopping-basket" size={20} color={Colors.primary} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
          <FontAwesome name="search" size={16} color={T.muted} style={{ marginRight: 12 }} />
          <TextInput
            placeholder="Café, machines, emballages..."
            placeholderTextColor={T.muted}
            style={[styles.searchInput, { color: T.text }]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <FontAwesome name="times-circle" size={16} color={T.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Banner */}
        <TouchableOpacity style={styles.featuredBanner}>
          <Image source={{ uri: BANNER_IMAGE }} style={styles.bannerImg} />
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerTagContainer}>
              <Text style={styles.bannerTag}>🔥 OFFRE SPÉCIALE</Text>
            </View>
            <Text style={styles.bannerTitle}>Grains de Café Artisanaux</Text>
            <Text style={styles.bannerSub}>-20% sur la gamme El Kassa</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Découvrir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28 }} contentContainerStyle={{ paddingRight: 20 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catChip,
                { backgroundColor: T.inputBg, borderColor: T.cardBorder },
                selectedCategory === cat.id && styles.catChipActive,
              ]}
              onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat.id); }}
            >
              <FontAwesome name={cat.icon as any} size={14} color={selectedCategory === cat.id ? '#fff' : T.subtext} style={{ marginRight: 8 }} />
              <Text style={[styles.catText, { color: selectedCategory === cat.id ? '#fff' : T.subtext }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Packs Business */}
        {!search && businessPacks.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.sectionTitle, { color: T.text }]}>Packs Business 🎁</Text>
              <TouchableOpacity><Text style={styles.seeAll}>Voir packs</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }} contentContainerStyle={{ paddingRight: 20 }}>
              {businessPacks.map((pack, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.packCard, { backgroundColor: scheme === 'dark' ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.2)' }]}
                  onPress={() => setSelectedProduct(pack)}
                >
                  <View style={[styles.packIconContainer, { backgroundColor: T.inputBg, overflow: 'hidden' }]}>
                    {pack.images?.length > 0 ? (
                      <Image source={{ uri: ApiService.getFileUrl(pack.images[0]) || undefined }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    ) : (
                      <Text style={{ fontSize: 32 }}>🎁</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={[styles.packName, { color: T.text }]} numberOfLines={1}>{pack.name}</Text>
                    <Text style={styles.packPrice}>{formatPrice(pack.price)} DT</Text>
                    <TouchableOpacity
                      style={styles.packAddBtn}
                      onPress={() => handleAddToCart(pack)}
                    >
                      <Text style={styles.packAddBtnText}>+ Ajouter</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Fournisseurs */}
        {!search && vendors.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.sectionTitle, { color: T.text }]}>Fournisseurs Vedettes</Text>
              <TouchableOpacity><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }} contentContainerStyle={{ paddingRight: 20 }}>
              {vendors.map((vendor, i) => (
                <TouchableOpacity key={i} style={[styles.vendorCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                  <View style={[styles.vendorLogoPlaceholder, { backgroundColor: T.inputBg }]}>
                    <Text style={{ fontSize: 24 }}>✨</Text>
                  </View>
                  <Text style={[styles.vendorName, { color: T.text }]} numberOfLines={1}>{vendor.companyName}</Text>
                  <View style={[styles.ratingRow, { backgroundColor: 'transparent' }]}>
                    <FontAwesome name="star" size={10} color="#fbbf24" />
                    <Text style={[styles.vendorRating, { color: T.subtext }]}>4.9 (120)</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Product Grid */}
        <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>{search ? 'Résultats' : 'Derniers Arrivages'}</Text>
          {!search && <TouchableOpacity><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>}
        </View>

        {filteredProducts.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: T.inputBg }]}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={[styles.emptyText, { color: T.muted }]}>Aucun produit trouvé</Text>
          </View>
        )}

        <View style={styles.productGrid}>
          {filteredProducts.map((product, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.productCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}
              onPress={() => setSelectedProduct(product)}
            >
              <View style={[styles.productImagePlaceholder, { backgroundColor: T.sectionBg, overflow: 'hidden' }]}>
                {product.images?.length > 0 ? (
                  <Image source={{ uri: ApiService.getFileUrl(product.images[0]) || undefined }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <Text style={styles.productIcon}>{getProductIcon(product.name)}</Text>
                )}
              </View>
              <View style={{ padding: 12, backgroundColor: 'transparent' }}>
                <Text style={[styles.productName, { color: T.text }]} numberOfLines={1}>{product.name}</Text>
                <Text style={[styles.productVendor, { color: T.muted }]}>{product.vendor?.companyName || '—'}</Text>
                <View style={[styles.priceRow, { backgroundColor: 'transparent' }]}>
                  <Text style={styles.productPrice}>{formatPrice(product.price)} DT</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                  >
                    <FontAwesome name="plus" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── PRODUCT DETAIL MODAL ── */}
      <Modal visible={!!selectedProduct} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSelectedProduct(null)} />
          <View style={[styles.modalSheet, { backgroundColor: T.bg, borderColor: T.cardBorder }]}>
            {selectedProduct && (
              <>
                <View style={[styles.modalHeader, { borderBottomColor: T.cardBorder }]}>
                  <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 15 }}>
                    <Text style={[styles.modalTitle, { color: T.text }]} numberOfLines={2}>{selectedProduct.name}</Text>
                    <Text style={[styles.modalSub, { color: T.muted }]}>{selectedProduct.vendor?.companyName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <FontAwesome name="times-circle" size={24} color={T.muted} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <View style={[styles.modalImagePlaceholder, { backgroundColor: T.sectionBg, overflow: 'hidden' }]}>
                    {selectedProduct.images?.length > 0 ? (
                      <Image source={{ uri: ApiService.getFileUrl(selectedProduct.images[0]) || undefined }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    ) : (
                      <Text style={{ fontSize: 70 }}>{getProductIcon(selectedProduct.name)}</Text>
                    )}
                  </View>
                  <Text style={[styles.modalDescTitle, { color: T.text }]}>Description</Text>
                  <Text style={[styles.modalDesc, { color: T.subtext }]}>
                    Produit de haute qualité sélectionné pour les professionnels de la restauration.
                    Idéal pour vos besoins professionnels quotidiens.
                  </Text>
                  <View style={[styles.modalPriceContainer, { backgroundColor: T.sectionBg }]}>
                    <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                      <Text style={[styles.modalPriceLabel, { color: T.muted }]}>Prix Unitaire</Text>
                      <Text style={styles.modalPrice}>{formatPrice(selectedProduct.price)} DT</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.modalBuyBtn}
                      onPress={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                    >
                      <Text style={styles.modalBuyBtnText}>Ajouter au panier</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── CART MODAL ── */}
      <Modal visible={cartOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setCartOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: T.bg, borderColor: T.cardBorder, height: '80%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: T.cardBorder }]}>
              <View style={{ backgroundColor: 'transparent' }}>
                <Text style={[styles.modalTitle, { color: T.text }]}>Mon Panier 🛒</Text>
                <Text style={[styles.modalSub, { color: T.muted }]}>{cartCount} article{cartCount > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => setCartOpen(false)}>
                <FontAwesome name="times-circle" size={24} color={T.muted} />
              </TouchableOpacity>
            </View>

            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={{ fontSize: 50, marginBottom: 16 }}>🛒</Text>
                <Text style={[styles.emptyText, { color: T.muted }]}>Votre panier est vide</Text>
                <TouchableOpacity
                  style={[styles.continueBtn, { borderColor: Colors.primary }]}
                  onPress={() => setCartOpen(false)}
                >
                  <Text style={[styles.continueBtnText, { color: Colors.primary }]}>Continuer mes achats</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  {cartItems.map((item, i) => (
                    <View key={i} style={[styles.cartItem, { backgroundColor: T.sectionBg, borderColor: T.cardBorder }]}>
                      <View style={[styles.cartItemIcon, { backgroundColor: T.inputBg, overflow: 'hidden' }]}>
                        {item.product.images?.length > 0 ? (
                          <Image source={{ uri: ApiService.getFileUrl(item.product.images[0]) || undefined }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                        ) : (
                          <Text style={{ fontSize: 28 }}>{getProductIcon(item.product.name)}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 12, backgroundColor: 'transparent' }}>
                        <Text style={[styles.cartItemName, { color: T.text }]} numberOfLines={1}>{item.product.name}</Text>
                        <Text style={styles.cartItemPrice}>{formatPrice(item.product.price)} DT</Text>
                      </View>
                      <View style={[styles.qtyRow, { backgroundColor: 'transparent' }]}>
                        <TouchableOpacity
                          style={[styles.qtyBtn, { backgroundColor: T.inputBg }]}
                          onPress={() => handleRemoveFromCart(item.product.id)}
                        >
                          <FontAwesome name="minus" size={10} color={T.text} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: T.text }]}>{item.qty}</Text>
                        <TouchableOpacity
                          style={[styles.qtyBtn, { backgroundColor: Colors.primary }]}
                          onPress={() => handleAddToCart(item.product)}
                        >
                          <FontAwesome name="plus" size={10} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={[styles.cartFooter, { backgroundColor: T.bg, borderTopColor: T.cardBorder }]}>
                  <View style={{ backgroundColor: 'transparent' }}>
                    <Text style={[styles.totalLabel, { color: T.muted }]}>Total</Text>
                    <Text style={styles.totalAmount}>{cartTotal.toFixed(2)} DT</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setCartOpen(false); }}
                  >
                    <Text style={styles.orderBtnText}>Commander</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollBody: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, fontWeight: '600' },
  cartBtn: {
    width: 50, height: 50, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#ef4444', borderRadius: 12,
    minWidth: 22, height: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 15,
    height: 55, marginBottom: 25, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  featuredBanner: { width: '100%', height: 210, borderRadius: 26, overflow: 'hidden', marginBottom: 28 },
  bannerImg: { width: '100%', height: '100%', position: 'absolute' },
  bannerOverlay: { padding: 24, justifyContent: 'center', height: '100%', backgroundColor: 'rgba(0,0,0,0.45)' },
  bannerTagContainer: { backgroundColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  bannerTag: { color: '#10b981', fontWeight: '800', fontSize: 10 },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  bannerSub: { color: '#cbd5e1', fontSize: 13, marginTop: 4, fontWeight: '600' },
  bannerBtn: { backgroundColor: '#fff', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 14, marginTop: 16, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 18, marginRight: 12, borderWidth: 1 },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontWeight: '700', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '900' },
  seeAll: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  packCard: { width: 270, height: 110, borderRadius: 22, marginRight: 14, flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1 },
  packIconContainer: { width: 76, height: 82, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  packName: { fontWeight: '800', fontSize: 15, marginBottom: 3 },
  packPrice: { color: '#10b981', fontWeight: '900', fontSize: 18 },
  packAddBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
  packAddBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  vendorCard: { width: 145, padding: 18, borderRadius: 26, marginRight: 14, alignItems: 'center', borderWidth: 1 },
  vendorLogoPlaceholder: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  vendorName: { fontWeight: '800', fontSize: 13, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  vendorRating: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  productCard: { width: (width - 54) / 2, borderRadius: 26, overflow: 'hidden', borderWidth: 1 },
  productImagePlaceholder: { height: 130, alignItems: 'center', justifyContent: 'center' },
  productIcon: { fontSize: 50 },
  productName: { fontWeight: '800', fontSize: 14, marginBottom: 2 },
  productVendor: { fontSize: 11, fontWeight: '600', marginBottom: 9 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { color: Colors.primary, fontWeight: '900', fontSize: 17 },
  addBtn: { backgroundColor: Colors.primary, width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  emptyState: { borderRadius: 20, padding: 40, alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' },
  modalSheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, height: '75%', borderTopWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 26, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalSub: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  modalImagePlaceholder: { height: 180, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  modalDescTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  modalPriceContainer: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, marginBottom: 40 },
  modalPriceLabel: { fontSize: 11, fontWeight: '700' },
  modalPrice: { color: Colors.primary, fontSize: 24, fontWeight: '900' },
  modalBuyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 26, paddingVertical: 16, borderRadius: 18, elevation: 6 },
  modalBuyBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  // Cart
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  continueBtn: { marginTop: 20, borderWidth: 1.5, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16 },
  continueBtnText: { fontWeight: '800', fontSize: 14 },
  cartItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1 },
  cartItemIcon: { width: 55, height: 55, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cartItemName: { fontWeight: '700', fontSize: 14 },
  cartItemPrice: { color: Colors.primary, fontWeight: '900', fontSize: 15, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontWeight: '900', fontSize: 16, minWidth: 22, textAlign: 'center' },
  cartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderTopWidth: 1 },
  totalLabel: { fontSize: 12, fontWeight: '700' },
  totalAmount: { color: Colors.primary, fontSize: 26, fontWeight: '900' },
  orderBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, elevation: 8 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
