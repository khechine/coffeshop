import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions, TextInput,
  Modal, Platform, useColorScheme, Animated,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

// Fallback for LinearGradient if module resolution fails temporarily
let LinearGradient: any = View;
try {
  const GradientModule = require('expo-linear-gradient');
  LinearGradient = GradientModule.LinearGradient;
} catch (e) {
  console.warn('LinearGradient module not found, using fallback View');
}

const { width } = Dimensions.get('window');
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000';

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
  accent: '#10b981',
  gold: '#fbbf24',
  indigo: '#6366f1',
};

interface CartItem { id: string; name: string; price: number; quantity: number; vendor: any; isBundle?: boolean; image?: string; }

type ViewMode = 'PRODUCTS' | 'VENDORS' | 'PACKS';

export default function MarketplaceScreen() {
  const scheme = useColorScheme();
  const T = DARK; // Force dark luxury as per user request/mockup

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('PRODUCTS');
  
  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // UI State
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED' | 'STOCKED'>('ALL');

  // Derived
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const fetchData = async () => {
    try {
      const [prodData, vendorData, bundleData, catData] = await Promise.all([
        ApiService.get('/management/marketplace/products'),
        ApiService.get('/management/marketplace/vendors'),
        ApiService.get('/management/marketplace/bundles'),
        ApiService.get('/management/marketplace/categories'),
      ]);
      setProducts(prodData || []);
      setVendors(vendorData || []);
      setBundles(bundleData || []);
      setCategories(catData || []);
    } catch (e) {
      console.warn('Marketplace fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    AuthService.getSession().then(s => setStoreId(s.storeId));
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // --- Actions ---
  const handleAddToCart = (p: any, isBundle = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const minQty = isBundle ? 1 : Number(p.minOrderQty || 1);
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { 
        id: p.id, 
        name: p.name, 
        price: parseFloat(p.price), 
        quantity: minQty, 
        vendor: p.vendor,
        isBundle,
        image: p.image
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);
    try {
      const session = await AuthService.getSession();
      const sId = session.storeId;
      if (!sId) throw new Error("Store identity lost");

      const vendorGroups: Record<string, CartItem[]> = {};
      cartItems.forEach(item => {
        const vId = item.vendor?.id || 'EXTERNAL';
        if (!vendorGroups[vId]) vendorGroups[vId] = [];
        vendorGroups[vId].push(item);
      });

      for (const [vendorId, items] of Object.entries(vendorGroups)) {
        const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
        await ApiService.post('/management/orders', {
          storeId: sId,
          vendorId: vendorId === 'EXTERNAL' ? null : vendorId,
          total,
          items: items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            productId: i.isBundle ? undefined : i.id,
            bundleId: i.isBundle ? i.id : undefined
          }))
        });
      }

      setCartItems([]);
      setCartOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Commandée !", "Vos commandes ont été transmises aux fournisseurs.");
    } catch (e) {
      Alert.alert("❌ Erreur", "Impossible de valider la commande.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    if (!storeId) return;
    try {
      const res = await ApiService.get(`/management/orders/${storeId}`);
      const sorted = (res || []).sort((a: any, b: any) => {
        const priorities: any = { PENDING: 1, DELIVERING: 2, SHIPPED: 3, DELIVERED: 4, STOCKED: 5 };
        const p1 = priorities[a.status] || 99;
        const p2 = priorities[b.status] || 99;
        if (p1 !== p2) return p1 - p2;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setMyOrders(sorted);
      setOrdersOpen(true);
    } catch(e) { console.warn(e); }
  };

  const validerReception = async (orderId: string) => {
    try {
      await ApiService.post(`/management/orders/${orderId}/receive`, {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMyOrders(myOrders.map(o => o.id === orderId ? { ...o, status: 'STOCKED' } : o));
      Alert.alert("Succès", "Commande réceptionnée et stock mis à jour.");
    } catch (e) { Alert.alert("Erreur", "Impossible de valider la réception"); }
  };

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.vendor?.companyName?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, activeCategory]);

  const filteredBundles = useMemo(() => {
    return bundles.filter(b => b.name?.toLowerCase().includes(search.toLowerCase()) || b.vendor?.companyName?.toLowerCase().includes(search.toLowerCase()));
  }, [bundles, search]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => v.companyName?.toLowerCase().includes(search.toLowerCase()) || v.city?.toLowerCase().includes(search.toLowerCase()));
  }, [vendors, search]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  // --- Helper Icons ---
  const getProductIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('café')) return '☕';
    if (n.includes('lait')) return '🥛';
    if (n.includes('cup') || n.includes('gobelet')) return '🥤';
    return '📦';
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: T.cardBorder }]}>
         <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.headerTitle}>Marketplace</Text>
            <Text style={styles.headerSub}>Solutions B2B Premium</Text>
         </View>
         <View style={{ flexDirection: 'row', gap: 10 }}>
             <TouchableOpacity 
                style={[styles.cartTrigger, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', width: 'auto', paddingHorizontal: 15 }]}
                onPress={fetchMyOrders}
             >
                <Text style={{ color: '#6366f1', fontSize: 11, fontWeight: '800' }}>Mes Cmds</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                style={[styles.cartTrigger, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                onPress={() => setCartOpen(true)}
             >
                <FontAwesome name="shopping-basket" size={20} color={T.accent} />
                {cartCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: T.accent }]}>
                      <Text style={styles.badgeText}>{cartCount}</Text>
                    </View>
                )}
             </TouchableOpacity>
         </View>
      </View>

      {/* ── SEARCH & TABS ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
            <FontAwesome name="search" size={16} color={T.muted} style={{ marginRight: 12 }} />
            <TextInput 
                placeholder="Rechercher produits, vendeurs..."
                placeholderTextColor={T.muted}
                style={[styles.searchInput, { color: T.text }]}
                value={search}
                onChangeText={setSearch}
            />
          </View>

          <View style={styles.tabBar}>
              {[
                { id: 'PRODUCTS', label: 'Produits', icon: 'th-large' },
                { id: 'VENDORS', label: 'Vendeurs', icon: 'building' },
                { id: 'PACKS', label: 'Packs', icon: 'bolt' }
              ].map(tab => (
                <TouchableOpacity 
                    key={tab.id}
                    style={[styles.tab, viewMode === tab.id && styles.activeTab]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode(tab.id as ViewMode); }}
                >
                    <FontAwesome name={tab.icon as any} size={14} color={viewMode === tab.id ? T.gold : T.muted} />
                    <Text style={[styles.tabText, { color: viewMode === tab.id ? '#fff' : T.muted }]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
          </View>
      </View>

      {/* ── MAIN CONTENT ── */}
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}
      >
        {viewMode === 'PRODUCTS' && (
          <>
            {/* Horizontal Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 25 }}>
               <TouchableOpacity 
                  onPress={() => setActiveCategory('all')}
                  style={[styles.catChip, activeCategory === 'all' && styles.catChipActive]}
               >
                  <Text style={[styles.catChipText, activeCategory === 'all' && styles.catChipTextActive]}>Tout</Text>
               </TouchableOpacity>
               {categories.map(cat => (
                 <TouchableOpacity 
                   key={cat.id}
                   onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat.id); }}
                   style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
                 >
                   {cat.icon && <Text style={{ marginRight: 6 }}>{cat.icon}</Text>}
                   <Text style={[styles.catChipText, activeCategory === cat.id && styles.catChipTextActive]}>{cat.name}</Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>

            {/* Banner Section */}
            {!search && activeCategory === 'all' && (
              <TouchableOpacity style={styles.heroBanner}>
                <Image source={{ uri: BANNER_IMAGE }} style={styles.heroImg} />
                <LinearGradient colors={['transparent', 'rgba(10,15,30,0.9)']} style={styles.heroGradient}>
                   <View style={styles.heroTag}><Text style={styles.heroTagText}>SÉLECTIONNE PRO</Text></View>
                   <Text style={styles.heroTitle}>Grains de Café Premium</Text>
                   <Text style={styles.heroPrice}>À partir de 45.000 DT / KG</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.grid}>
              {filteredProducts.map((p, i) => (
                <TouchableOpacity key={p.id} style={styles.premiumCard} onPress={() => setSelectedProduct(p)}>
                  <View style={styles.cardImgContainer}>
                    {p.image ? (
                        <Image source={{ uri: p.image }} style={styles.cardImg} />
                    ) : (
                        <Text style={{ fontSize: 40 }}>{getProductIcon(p.name || p.productStandard?.name)}</Text>
                    )}
                    {p.isFlashSale && <View style={styles.flashBadge}><Text style={styles.flashBadgeText}>FLASH</Text></View>}
                    {p.isFeatured && <View style={styles.featBadge}><Text style={styles.featBadgeText}>ELITE</Text></View>}
                  </View>
                  <View style={styles.cardInfo}>
                     <Text style={styles.cardVendor} numberOfLines={1}>{p.vendor?.companyName?.toUpperCase()}</Text>
                     <Text style={styles.cardTitle} numberOfLines={1}>{p.name || p.productStandard?.name || 'Produit'}</Text>
                     <View style={styles.cardFooter}>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                          <Text style={styles.cardPrice}>{parseFloat(p.price).toFixed(3)}</Text>
                          <Text style={styles.cardUnit}>DT / {p.unit || 'unit'}</Text>
                        </View>
                        <TouchableOpacity 
                           style={styles.addBtn}
                           onPress={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                        >
                           <FontAwesome name="plus" size={12} color="#fff" />
                        </TouchableOpacity>
                     </View>
                     <View style={styles.moqRow}>
                        <FontAwesome name="cube" size={10} color={T.muted} />
                        <Text style={styles.moqText}>Min. {p.minOrderQty}</Text>
                     </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {viewMode === 'VENDORS' && (
           <View style={{ gap: 15 }}>
              {filteredVendors.map(v => (
                <TouchableOpacity key={v.id} style={styles.vendorRow} onPress={() => setSelectedVendor(v)}>
                   <View style={styles.vendorAvatar}>
                      <Text style={{ fontSize: 24, fontWeight: '900' }}>🏪</Text>
                   </View>
                   <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                      <Text style={styles.vendorRowName}>{v.companyName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', gap: 5 }}>
                        <FontAwesome name="map-marker" size={12} color={T.muted} />
                        <Text style={styles.vendorRowCity}>{v.city || 'Tunisie'}</Text>
                      </View>
                   </View>
                   <View style={styles.vendorStats}>
                      <Text style={styles.statsValue}>{v._count?.vendorProducts || 0}</Text>
                      <Text style={styles.statsLabel}>Produits</Text>
                   </View>
                </TouchableOpacity>
              ))}
           </View>
        )}

        {viewMode === 'PACKS' && (
          <View style={{ gap: 20 }}>
             {filteredBundles.map(b => (
                <TouchableOpacity key={b.id} style={styles.packCard} onPress={() => setSelectedBundle(b)}>
                   <Image source={{ uri: b.image || BANNER_IMAGE }} style={styles.packImg} />
                   <View style={styles.packPriceTag}>
                      <Text style={styles.packPriceText}>{parseFloat(b.price).toFixed(3)} DT</Text>
                   </View>
                   <View style={styles.packBody}>
                      <Text style={styles.packVendor}>{b.vendor?.companyName}</Text>
                      <Text style={styles.packTitle}>{b.name}</Text>
                      <View style={styles.packRow}>
                         <View style={styles.packDiscount}>
                            <Text style={styles.discountText}>ÉCO. {b.discountPercent}%</Text>
                         </View>
                         <Text style={styles.packItemsCount}>{b.items?.length} Produits inclus</Text>
                      </View>
                   </View>
                </TouchableOpacity>
             ))}
          </View>
        )}
      </ScrollView>

      {/* ── CART FOOTER ── */}
      {cartCount > 0 && !cartOpen && (
          <TouchableOpacity style={styles.cartBar} onPress={() => setCartOpen(true)}>
             <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                <View style={styles.cartBarBadge}><Text style={styles.cartBarBadgeText}>{cartCount}</Text></View>
                <Text style={styles.cartBarText}>Voir le panier</Text>
             </View>
             <Text style={styles.cartBarTotal}>{cartTotal.toFixed(3)} DT</Text>
          </TouchableOpacity>
      )}

      {/* ── MODALS (Bundle, Product, Vendor) ── */}
      {/* ... keeping simplified for this turn to ensure stability, but with premium styles ... */}
      <Modal visible={!!selectedBundle} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '85%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalSheetTitle}>Détails du Pack</Text>
                      <TouchableOpacity onPress={() => setSelectedBundle(null)}><FontAwesome name="times-circle" size={24} color={T.muted} /></TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{ padding: 25 }}>
                      <Image source={{ uri: selectedBundle?.image || BANNER_IMAGE }} style={styles.modalBundleImg} />
                      <Text style={styles.modalBundleName}>{selectedBundle?.name}</Text>
                      <Text style={styles.modalBundleDesc}>{selectedBundle?.description}</Text>
                      
                      <Text style={styles.modalSectionTitle}>PRODUITS INCLUS</Text>
                      {selectedBundle?.items?.map((item: any, i: number) => (
                        <View key={i} style={styles.bundleItemRow}>
                           <Text style={styles.bundleItemName}>{item.vendorProduct?.name || item.vendorProduct?.productStandard?.name || 'Produit sans nom'}</Text>
                           <Text style={styles.bundleItemQty}>x {item.quantity}</Text>
                        </View>
                      ))}

                      <TouchableOpacity 
                         style={styles.modalPrimaryBtn}
                         onPress={() => { handleAddToCart(selectedBundle, true); setSelectedBundle(null); }}
                      >
                         <Text style={styles.modalBtnText}>Acheter le Pack ({parseFloat(selectedBundle?.price || 0).toFixed(3)} DT)</Text>
                      </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* Product Modal */}
      <Modal visible={!!selectedProduct} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '80%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalSheetTitle}>Détails du Produit</Text>
                      <TouchableOpacity onPress={() => setSelectedProduct(null)}><FontAwesome name="times-circle" size={24} color={T.muted} /></TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{ padding: 25 }}>
                      <View style={{ alignItems: 'center', marginBottom: 20 }}>
                          {selectedProduct?.image ? (
                             <Image source={{ uri: selectedProduct.image }} style={styles.modalBundleImg} />
                          ) : (
                             <View style={[styles.modalBundleImg, { backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' }]}>
                               <Text style={{ fontSize: 60 }}>{getProductIcon(selectedProduct?.name || selectedProduct?.productStandard?.name)}</Text>
                             </View>
                          )}
                      </View>
                      <Text style={styles.modalBundleName}>{selectedProduct?.name || selectedProduct?.productStandard?.name}</Text>
                      <Text style={styles.cardVendor}>{selectedProduct?.vendor?.companyName}</Text>
                      <Text style={styles.modalBundleDesc}>{selectedProduct?.description || selectedProduct?.productStandard?.description || 'Aucune description fournie pour ce produit et ses caractéristiques de qualité.'}</Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'transparent' }}>
                         <Text style={{ color: T.subtext, fontSize: 16 }}>Prix Unitaire</Text>
                         <Text style={{ color: T.gold, fontSize: 18, fontWeight: '900' }}>{parseFloat(selectedProduct?.price || 0).toFixed(3)} DT / {selectedProduct?.unit || selectedProduct?.productStandard?.unit || 'unité'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'transparent' }}>
                         <Text style={{ color: T.subtext, fontSize: 16 }}>MOQ (Quantité minimum)</Text>
                         <Text style={{ color: T.text, fontSize: 16, fontWeight: '700' }}>{selectedProduct?.minOrderQty || 1}</Text>
                      </View>

                      <TouchableOpacity 
                         style={styles.modalPrimaryBtn}
                         onPress={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                      >
                         <Text style={styles.modalBtnText}>Ajouter au panier</Text>
                      </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* Vendor Modal */}
      <Modal visible={!!selectedVendor} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '80%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalSheetTitle}>Profil du Fournisseur</Text>
                      <TouchableOpacity onPress={() => setSelectedVendor(null)}><FontAwesome name="times-circle" size={24} color={T.muted} /></TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{ padding: 25 }}>
                      <View style={{ alignItems: 'center', marginBottom: 30, backgroundColor: 'transparent' }}>
                          <View style={[styles.vendorAvatar, { width: 100, height: 100, borderRadius: 30, marginBottom: 15 }]}>
                             <Text style={{ fontSize: 40 }}>🏪</Text>
                          </View>
                          <Text style={styles.modalBundleName}>{selectedVendor?.companyName}</Text>
                          <Text style={{ color: T.indigo, fontSize: 16, fontWeight: '700', marginTop: 5 }}>{selectedVendor?.city || 'Tunisie'}</Text>
                      </View>
                      
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 20, marginBottom: 20 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent', marginBottom: 10 }}>
                             <Text style={{ color: T.subtext }}>Catalogue visible</Text>
                             <Text style={{ color: T.accent, fontWeight: '800' }}>{selectedVendor?._count?.vendorProducts || 0} produits</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                             <Text style={{ color: T.subtext }}>Certification</Text>
                             <Text style={{ color: T.accent, fontWeight: '800' }}>Partenaire Rachma</Text>
                          </View>
                      </View>

                      <TouchableOpacity 
                         style={styles.modalPrimaryBtn}
                         onPress={() => { 
                           const v = selectedVendor;
                           setSelectedVendor(null);
                           setSearch(v?.companyName || '');
                           setViewMode('PRODUCTS');
                         }}
                      >
                         <Text style={styles.modalBtnText}>Voir son catalogue complet</Text>
                      </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={cartOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '80%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalSheetTitle}>Votre Panier 🛒</Text>
                      <TouchableOpacity onPress={() => setCartOpen(false)}><FontAwesome name="times" size={24} color={T.muted} /></TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{ padding: 20 }}>
                     {cartItems.map(item => (
                       <View key={item.id} style={styles.cartRow}>
                          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                             <Text style={styles.cartItemName}>{item.name}</Text>
                             <Text style={styles.cartItemSub}>{item.vendor?.companyName}</Text>
                          </View>
                          <View style={styles.cartQtyControl}>
                             <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qBtn}><FontAwesome name="minus" color="#fff" size={10} /></TouchableOpacity>
                             <Text style={styles.qText}>{item.quantity}</Text>
                             <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={[styles.qBtn, { backgroundColor: T.accent }]}><FontAwesome name="plus" color="#fff" size={10} /></TouchableOpacity>
                          </View>
                          <Text style={styles.cartRowTotal}>{(item.price * item.quantity).toFixed(3)} DT</Text>
                       </View>
                     ))}
                  </ScrollView>
                  <View style={styles.cartFooter}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'transparent' }}>
                         <Text style={styles.totalLbl}>Total à payer</Text>
                         <Text style={styles.totalVal}>{cartTotal.toFixed(3)} DT</Text>
                      </View>
                      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                         <Text style={styles.checkoutText}>Confirmer la commande</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* ── ORDERS MODAL ── */}
      <Modal visible={ordersOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { backgroundColor: T.bg, padding: 0, height: '90%' }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: T.cardBorder, paddingTop: 20 }]}>
                      <Text style={[styles.modalTitle, { color: T.text }]}>Historique Commandes</Text>
                      <TouchableOpacity style={styles.closeBtn} onPress={() => setOrdersOpen(false)}>
                          <FontAwesome name="times" size={20} color={T.text} />
                      </TouchableOpacity>
                  </View>
                  
                  {/* Filter Bar */}
                  <View style={{ flexDirection: 'row', padding: 15, gap: 8, backgroundColor: 'transparent' }}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {[
                            { id: 'ALL', label: 'Toutes' },
                            { id: 'PENDING', label: 'En attente' },
                            { id: 'DELIVERED', label: 'À réceptionner' },
                            { id: 'STOCKED', label: 'Dernières' }
                          ].map(f => (
                              <TouchableOpacity 
                                  key={f.id}
                                  onPress={() => setOrderFilter(f.id as any)}
                                  style={{
                                      backgroundColor: orderFilter === f.id ? T.accent : 'rgba(255,255,255,0.05)',
                                      paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginRight: 8,
                                      borderWidth: 1, borderColor: orderFilter === f.id ? T.accent : 'rgba(255,255,255,0.1)'
                                  }}
                              >
                                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{f.label}</Text>
                              </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>

                  <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                      {(() => {
                          const filtered = myOrders.filter(o => {
                              if (orderFilter === 'ALL') return true;
                              if (orderFilter === 'PENDING') return ['PENDING', 'DELIVERING', 'SHIPPED'].includes(o.status);
                              return o.status === orderFilter;
                          });

                          if (filtered.length === 0) {
                              return <Text style={{ color: T.subtext, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }}>Aucune commande trouvée.</Text>;
                          }

                          return filtered.map(o => (
                              <View key={o.id} style={{ backgroundColor: T.card, padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: T.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                      <View style={{ backgroundColor: 'transparent' }}>
                                          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Commande #{o.id.substring(0,8).toUpperCase()}</Text>
                                          <Text style={{ color: T.subtext, fontSize: 10, fontWeight: '700' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</Text>
                                      </View>
                                      <View style={{ backgroundColor: o.status === 'DELIVERED' ? 'rgba(245,158,11,0.1)' : o.status === 'STOCKED' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' }}>
                                          <Text style={{ color: o.status === 'DELIVERED' ? '#f59e0b' : o.status === 'STOCKED' ? '#10b981' : '#6366f1', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{o.status}</Text>
                                      </View>
                                  </View>
                                  
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, backgroundColor: 'transparent' }}>
                                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                                          <FontAwesome name="building" size={14} color={T.subtext} />
                                      </View>
                                      <Text style={{ color: T.text, fontSize: 13, fontWeight: '700' }}>{o.supplier?.name || o.vendor?.companyName || 'Fournisseur'}</Text>
                                  </View>

                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' }}>
                                      <Text style={{ color: T.accent, fontWeight: '950', fontSize: 18 }}>{Number(o.total || 0).toFixed(3)} DT</Text>
                                      {o.status === 'DELIVERED' && (
                                          <TouchableOpacity 
                                              style={{ backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }}
                                              onPress={() => validerReception(o.id)}
                                          >
                                              <FontAwesome name="check-circle" size={14} color="#fff" />
                                              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>VALIDER</Text>
                                          </TouchableOpacity>
                                      )}
                                  </View>
                              </View>
                          ));
                      })()}
                  </ScrollView>
              </View>
          </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingBottom: 15, paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1 
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSub: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  cartTrigger: { 
    width: 44, height: 44, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1 
  },
  badge: { 
    position: 'absolute', top: -5, right: -5, 
    minWidth: 18, height: 18, borderRadius: 9, 
    justifyContent: 'center', alignItems: 'center', zIndex: 10 
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', height: 50, 
    borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, marginBottom: 20 
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  tabBar: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', gap: 8 
  },
  activeTab: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  tabText: { fontSize: 12, fontWeight: '800' },
  catChip: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, marginRight: 10 
  },
  catChipActive: { backgroundColor: '#10b981' },
  catChipText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  catChipTextActive: { color: '#fff' },
  heroBanner: { width: '100%', height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 25 },
  heroImg: { width: '100%', height: '100%', position: 'absolute' },
  heroGradient: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  heroTag: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 8 },
  heroTagText: { fontSize: 9, fontWeight: '900', color: '#000' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroPrice: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  premiumCard: { width: (width - 55) / 2, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardImgContainer: { height: 110, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  flashBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  flashBadgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  featBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#6366f1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  featBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  cardInfo: { padding: 12, backgroundColor: 'transparent' },
  cardVendor: { color: '#6366f1', fontSize: 9, fontWeight: '900' },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '800', marginVertical: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'transparent' },
  cardPrice: { color: '#fbbf24', fontSize: 17, fontWeight: '950' },
  cardUnit: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  addBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  moqRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: 'transparent' },
  moqText: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  vendorRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  vendorAvatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  vendorRowName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  vendorRowCity: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  vendorStats: { alignItems: 'flex-end', backgroundColor: 'transparent' },
  statsValue: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  statsLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  packCard: { width: '100%', borderRadius: 25, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  packImg: { width: '100%', height: 160 },
  packPriceTag: { position: 'absolute', top: 15, right: 15, backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  packPriceText: { color: '#fbbf24', fontWeight: '950', fontSize: 16 },
  packBody: { padding: 20, backgroundColor: 'transparent' },
  packVendor: { color: '#6366f1', fontSize: 10, fontWeight: '900' },
  packTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 5 },
  packRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, backgroundColor: 'transparent' },
  packDiscount: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
  packItemsCount: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  cartBar: { 
    position: 'absolute', bottom: 30, left: 20, right: 20, height: 65, 
    borderRadius: 20, backgroundColor: '#10b981', paddingHorizontal: 20, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10
  },
  cartBarBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cartBarBadgeText: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  cartBarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cartBarTotal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#0a0f1e', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalSheetTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalBundleImg: { width: '100%', height: 200, borderRadius: 20, marginBottom: 20 },
  modalBundleName: { color: '#fff', fontSize: 24, fontWeight: '900' },
  modalBundleDesc: { color: '#94a3b8', fontSize: 14, marginVertical: 15, lineHeight: 20 },
  modalSectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  bundleItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  bundleItemName: { color: '#fff', fontWeight: '700' },
  bundleItemQty: { color: '#6366f1', fontWeight: '900' },
  modalPrimaryBtn: { backgroundColor: '#10b981', height: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'transparent' },
  cartItemName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cartItemSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  cartQtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 15, backgroundColor: 'rgba(148,163,184,0.1)', padding: 5, borderRadius: 10 },
  qBtn: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  qText: { color: '#fff', fontWeight: '900' },
  cartRowTotal: { color: '#fbbf24', fontSize: 15, fontWeight: '900', minWidth: 80, textAlign: 'right' },
  cartFooter: { padding: 25, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.1)' },
  totalLbl: { color: '#64748b', fontSize: 14, fontWeight: '700' },
  totalVal: { color: '#fff', fontSize: 24, fontWeight: '950' },
  checkoutBtn: { backgroundColor: '#10b981', height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
