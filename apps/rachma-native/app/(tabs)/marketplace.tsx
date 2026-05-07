import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, TextInput,
  Modal, Platform, useColorScheme, Animated, useWindowDimensions,
  View, Text,
} from 'react-native';
import { Colors } from '@/constants/Colors';

import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import i18n from '../../locales/i18n';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';

// Fallback for LinearGradient if module resolution fails temporarily
let LinearGradient: any = View;
try {
  const GradientModule = require('expo-linear-gradient');
  LinearGradient = GradientModule.LinearGradient;
} catch (e) {
  console.warn('LinearGradient module not found, using fallback View');
}

const BANNER_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000';

// ---------- theme tokens ----------
const LIGHT_B2B = {
  bg: '#f4f4f7',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  text: '#1f2937',
  subtext: '#4b5563',
  muted: '#94a3b8',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  accent: '#E31E24', // Branded Red
  gold: '#f59e0b',
  indigo: '#6366f1',
};

const DARK = LIGHT_B2B; // Defaulting to light for this professional B2B mode

interface CartItem { id: string; name: string; price: number; quantity: number; vendor: any; isBundle?: boolean; image?: string; minQty: number; }

type ViewMode = 'PRODUCTS' | 'VENDORS' | 'PACKS';

export default function MarketplaceScreen() {
  const scheme = useColorScheme();
  const T = LIGHT_B2B; 

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const numCols = isTablet ? 3 : 2;
  const cardWidth = (width - 40 - (numCols - 1) * 15) / numCols;

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

  // 📍 Location & Radius
  const [radius, setRadius] = useState<number>(5); // Rayon par défaut: 5km
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const openVendor = (v: any) => { setVendorTab('HOME'); setSelectedVendor(v); };

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'STOCKED'>('ALL');
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [vendorTab, setVendorTab] = useState<'HOME' | 'PRODUCTS' | 'PROFILE'>('HOME');

  const [rfqForm, setRfqForm] = useState({ product: '', qty: '', description: '', deadline: '' });
  const [tradeMessages, setTradeMessages] = useState<any[]>([]);

  // Sync with global radius
  useFocusEffect(
    React.useCallback(() => {
      AuthService.getSearchRadius().then(setRadius);
    }, [])
  );

  useEffect(() => {
    if (messagesOpen) {
      AuthService.getSession().then(session => {
        if (session?.storeId) {
           ApiService.get(`/management/marketplace/messages?storeId=${session.storeId}`)
             .then(data => setTradeMessages(data || []))
             .catch(e => console.warn('Messages fetch error', e));
        }
      });
    }
  }, [messagesOpen]);

  // Derived
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const fetchLocation = async (sId?: string) => {
    try {
      // Priorité 1: Position du Coffee Shop (depuis le serveur)
      if (sId) {
        const store = await ApiService.get(`/management/stores/${sId}`);
        if (store?.lat && store?.lng) {
          const storeCoords = { lat: parseFloat(store.lat), lng: parseFloat(store.lng) };
          setLocation(storeCoords);
          return storeCoords;
        }
      }

      // Priorité 2: Position GPS du terminal (fallback)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          console.warn('Location permission denied');
          return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(coords);
      return coords;
    } catch (e) {
      console.warn('Fetch location error:', e);
      return null;
    }
  };

  const fetchData = async (currentLoc?: {lat: number, lng: number}, currentRad?: number) => {
    try {
      const loc = currentLoc || location;
      const rad = currentRad || radius;
      const query = loc ? `?lat=${loc.lat}&lng=${loc.lng}&radius=${rad}` : '';
      
      const [prodData, vendorData, bundleData, catData] = await Promise.all([
        ApiService.get(`/management/marketplace/products${query}`),
        ApiService.get(`/management/marketplace/vendors${query}`),
        ApiService.get(`/management/marketplace/bundles${query}`),
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
    const init = async () => {
      const session = await AuthService.getSession();
      setStoreId(session.storeId);
      const loc = await fetchLocation(session.storeId || undefined);
      fetchData(loc || undefined);
    };
    init();
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
        image: p.image,
        minQty: minQty
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = item.quantity + delta;
        // Enforce MOQ: don't allow decrease below minQty
        if (delta < 0 && nextQty < item.minQty) {
          return item;
        }
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
    let sId = storeId;
    if (!sId) {
      const session = await AuthService.getSession();
      sId = session?.storeId;
      if (sId) setStoreId(sId);
    }
    if (!sId) {
      Alert.alert(i18n.t('auth.errorTitle'), i18n.t('marketplace.errorIdentity'));
      return;
    }
    try {
      const res = await ApiService.get(`/management/orders/${sId}`);
      const sorted = (res || []).sort((a: any, b: any) => {
        // Active orders first: DELIVERED (waiting for reception) > SHIPPED > CONFIRMED > PENDING > STOCKED > CANCELLED
        const priorities: any = { DELIVERED: 1, SHIPPED: 2, CONFIRMED: 3, PENDING: 4, STOCKED: 5, CANCELLED: 6 };
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
    } catch (e) { Alert.alert(i18n.t('auth.errorTitle'), i18n.t('marketplace.errorValidate')); }
  };

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.vendor?.companyName?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory || p.subcategoryId === activeCategory || p.category?.id === activeCategory;
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
    <View style={{ flex: 1, backgroundColor: '#f4f4f7' }}>
      
      {/* ── MADE-IN-CHINA STYLE HEADER ── */}
      <View style={{ backgroundColor: '#E31E24', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ flex: 1, height: 45, backgroundColor: '#fff', borderRadius: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
                <TouchableOpacity onPress={() => setViewMode(viewMode === 'PRODUCTS' ? 'VENDORS' : 'PRODUCTS')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRightWidth: 1, borderRightColor: '#e5e7eb', paddingRight: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#E31E24' }}>{viewMode === 'PRODUCTS' ? 'Produits' : 'Usines'}</Text>
                    <FontAwesome name="caret-down" size={12} color="#E31E24" />
                </TouchableOpacity>
                <TextInput 
                    placeholder="Rechercher B2B..."
                    placeholderTextColor="#94a3b8"
                    style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#000' }}
                    value={search}
                    onChangeText={setSearch}
                />
                <TouchableOpacity onPress={() => setFiltersOpen(true)}>
                    <FontAwesome name="sliders" size={18} color="#94a3b8" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setMessagesOpen(true)} style={{ position: 'relative' }}>
                <FontAwesome name="commenting-o" size={24} color="#fff" />
                <View style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#E31E24', fontSize: 10, fontWeight: '900' }}>3</Text>
                </View>
            </TouchableOpacity>
          </View>
      </View>

      {/* ── TRUST BANNERS ── */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name="shield" size={14} color="#fff" />
              </View>
              <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#1f2937' }}>Fournisseur Audité</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>Vérifiés sur site</Text>
              </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name="check-circle" size={14} color="#fff" />
              </View>
              <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#1f2937' }}>Secured Trading</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>Protection Escrow</Text>
              </View>
          </View>
      </View>

      {/* ── RADIUS SELECTION BAR ── */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FontAwesome name="map-marker" size={14} color="#E31E24" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1f2937' }}>Rayon de sourcing :</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#E31E24' }}>{radius === 500 ? 'National' : `${radius} km`}</Text>
          </View>
          <TouchableOpacity onPress={() => setFiltersOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#E31E24' }}>Modifier</Text>
              <FontAwesome name="pencil" size={10} color="#E31E24" />
          </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31E24" />}
      >
        {/* ── RANKINGS SECTION (CLASSEMENTS) ── */}
        {products.length > 0 && (
          <View style={{ backgroundColor: '#fff', margin: 15, borderRadius: 15, padding: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#1f2937' }}>Classements</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>Rendez vos achats efficaces</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                      { 
                        label: 'Plus Populaire', 
                        tag: `${Math.floor(Math.random() * 500 + 100)}+ Popularité`, 
                        color: '#E31E24',
                        product: products[0]
                      },
                      { 
                        label: 'Nouveautés', 
                        tag: `${Math.floor(Math.random() * 50 + 10)}+ Vues`, 
                        color: '#6366f1',
                        product: [...products].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                      },
                      { 
                        label: 'Pionniers', 
                        tag: `${Math.floor(Math.random() * 30 + 70)}% en Hausse`, 
                        color: '#10b981',
                        product: products[products.length - 1]
                      }
                  ].map((item, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 8 }}
                        onPress={() => setSelectedProduct(item.product)}
                      >
                          <View style={{ height: 80, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                              {item.product?.image ? (
                                <Image source={{ uri: item.product.image }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 30 }}>{getProductIcon(item.product?.name)}</Text></View>
                              )}
                          </View>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: item.color, marginBottom: 2 }}>{item.label}</Text>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#1f2937', marginBottom: 2 }}>
                            {parseFloat(item.product?.price || 0).toFixed(2)} - {(parseFloat(item.product?.price || 0) * 1.2).toFixed(2)} DT
                          </Text>
                          <Text style={{ fontSize: 8, color: '#94a3b8' }}>{item.tag}</Text>
                      </TouchableOpacity>
                  ))}
              </View>
          </View>
        )}


        {/* ── B2B QUICK CATEGORIES ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', padding: 15, marginHorizontal: 15, borderRadius: 15, marginBottom: 15 }}>
            {[
                { n: 'Catégories', i: 'th-large', c: '#ef4444', a: () => setViewMode('PRODUCTS') },
                { n: 'Perspectives', i: 'thumb-tack', c: '#f59e0b', a: () => Alert.alert("Perspectives", "Tendances B2B bientôt disponibles.") },
                { n: 'Guide Début', i: 'lightbulb-o', c: '#10b981', a: () => Alert.alert("Guide", "Comment sourcer efficacement sur Rachma.") },
                { n: 'Usines', i: 'industry', c: '#6366f1', a: () => { setViewMode('VENDORS'); setSearch('Usine'); } }
            ].map((cat, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={{ width: '25%', alignItems: 'center', gap: 8 }}
                  onPress={cat.a}
                >
                    <View style={{ width: 45, height: 45, borderRadius: 22.5, backgroundColor: `${cat.c}10`, alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesome name={cat.i as any} size={20} color={cat.c} />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#4b5563' }}>{cat.n}</Text>
                </TouchableOpacity>
            ))}
        </View>



        {viewMode === 'PRODUCTS' && (
          <>
            {/* ── PROXIMITY SECTION ── */}
            {!search && activeCategory === 'all' && vendors.length > 0 && (
               <View style={{ marginBottom: 35, backgroundColor: 'transparent' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20, backgroundColor: 'transparent' }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' }}>
                        <FontAwesome name="map-o" size={18} color={T.accent} />
                        <Text style={{ color: T.text, fontSize: 18, fontWeight: '900' }}>Fournisseurs à proximité</Text>
                     </View>
                     <TouchableOpacity onPress={() => setViewMode('VENDORS')}>
                        <Text style={{ color: T.accent, fontSize: 12, fontWeight: '800' }}>Voir tout</Text>
                     </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingHorizontal: 20 }}>
                     {vendors.slice(0, 5).map(v => (
                        <TouchableOpacity key={v.id} style={{ width: 220, backgroundColor: T.card, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: T.cardBorder }} onPress={() => openVendor(v)}>
                           <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                                 <Text style={{ fontSize: 20 }}>🏪</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                 <Text style={{ color: T.text, fontSize: 14, fontWeight: '900' }} numberOfLines={1}>{v.companyName}</Text>
                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <FontAwesome name="location-arrow" size={10} color={T.accent} />
                                    <Text style={{ color: T.accent, fontSize: 11, fontWeight: '800' }}>{Math.floor(Math.random() * 15 + 2)} km</Text>
                                 </View>
                              </View>
                           </View>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' }}>
                              <View style={{ flexDirection: 'row', gap: 2 }}>
                                 {[1,2,3,4,5].map(s => <FontAwesome key={s} name="star" size={10} color={T.gold} />)}
                              </View>
                              <Text style={{ color: T.muted, fontSize: 10, fontWeight: '800' }}>{v._count?.vendorProducts || 0} produits</Text>
                           </View>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
               </View>
            )}

            {/* B2B Categories Scroll */}
            <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 15 }}>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 25, paddingVertical: 12 }}>
                  <TouchableOpacity 
                     onPress={() => setActiveCategory('all')}
                     style={{ alignItems: 'center' }}
                  >
                     <Text style={{ color: activeCategory === 'all' ? '#E31E24' : '#64748b', fontSize: 15, fontWeight: activeCategory === 'all' ? '900' : '600' }}>Tout</Text>
                     {activeCategory === 'all' && (
                        <View style={{ height: 3, backgroundColor: '#E31E24', borderRadius: 2, marginTop: 4, width: '100%' }} />
                     )}
                  </TouchableOpacity>
                  {categories.map(cat => (
                      <TouchableOpacity 
                        key={cat.id}
                        onPress={() => setActiveCategory(cat.id)}
                        style={{ alignItems: 'center' }}
                      >
                        <Text style={{ color: activeCategory === cat.id ? '#E31E24' : '#64748b', fontSize: 15, fontWeight: activeCategory === cat.id ? '900' : '600' }}>{cat.name}</Text>
                        {activeCategory === cat.id && (
                           <View style={{ height: 3, backgroundColor: '#E31E24', borderRadius: 2, marginTop: 4, width: '100%' }} />
                        )}
                      </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>

            {/* Featured Packs */}
            {bundles.length > 0 && !search && activeCategory === 'all' && (
               <View style={{ marginBottom: 30, backgroundColor: 'transparent' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20, backgroundColor: 'transparent' }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' }}>
                        <FontAwesome name="bolt" size={18} color={T.gold} />
                        <Text style={{ color: T.text, fontSize: 18, fontWeight: '900' }}>Packs Industriels</Text>
                     </View>
                     <TouchableOpacity onPress={() => setViewMode('PACKS')}>
                        <Text style={{ color: T.gold, fontSize: 12, fontWeight: '800' }}>Voir tout</Text>
                     </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingHorizontal: 20 }}>
                     {bundles.map(b => {
                        const discount = b.discountPercent || Math.floor(Math.random() * 20 + 5);
                        return (
                        <TouchableOpacity key={b.id} style={styles.featuredPackCard} onPress={() => setSelectedBundle(b)}>
                           <Image source={{ uri: b.image || BANNER_IMAGE }} style={styles.featuredPackImg} />
                           <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#E31E24', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                               <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>-{discount}%</Text>
                           </View>
                           <LinearGradient colors={['transparent', 'rgba(10,15,30,0.95)']} style={styles.featuredPackGradient}>
                              <Text style={styles.featuredPackTitle} numberOfLines={1}>{b.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={{ color: '#94a3b8', fontSize: 11, textDecorationLine: 'line-through', fontWeight: '800' }}>{((parseFloat(b.price) * 100) / (100 - discount)).toFixed(2)}</Text>
                                  <Text style={styles.featuredPackPrice}>{parseFloat(b.price).toFixed(2)} DT</Text>
                              </View>
                           </LinearGradient>
                        </TouchableOpacity>
                     )})}
                  </ScrollView>
               </View>
            )}

            {/* ── SPECIAL B2B COLLECTIONS ── */}
            {!search && activeCategory === 'all' && (
               <View style={{ marginBottom: 30 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                     {/* Made in Tunisia */}
                     <TouchableOpacity 
                        style={{ width: 280, height: 160, borderRadius: 20, overflow: 'hidden', padding: 20, justifyContent: 'flex-end', backgroundColor: '#FFF1F2' }}
                        onPress={() => { setSearch('tunisia'); }}
                     >
                        <View style={{ position: 'absolute', right: -10, top: -10, opacity: 0.15 }}>
                           <Text style={{ fontSize: 120 }}>🇹🇳</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                           <Text style={{ fontSize: 16 }}>🇹🇳</Text>
                           <Text style={{ color: '#E31E24', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>MADE IN TUNISIA</Text>
                        </View>
                        <Text style={{ color: '#111827', fontSize: 20, fontWeight: '900', marginBottom: 5 }}>Soutenons nos producteurs locaux</Text>
                        <Text style={{ color: '#E31E24', fontWeight: '800', fontSize: 12 }}>Explorer →</Text>
                     </TouchableOpacity>

                     {/* Bio & Local */}
                     <TouchableOpacity 
                        style={{ width: 280, height: 160, borderRadius: 20, overflow: 'hidden', padding: 20, justifyContent: 'flex-end', backgroundColor: '#F0FDF4' }}
                        onPress={() => { setSearch('bio'); }}
                     >
                        <View style={{ position: 'absolute', right: -10, bottom: -20, opacity: 0.15 }}>
                           <Text style={{ fontSize: 120 }}>🌱</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                           <Text style={{ fontSize: 16 }}>🌱</Text>
                           <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>BIO & LOCAL</Text>
                        </View>
                        <Text style={{ color: '#111827', fontSize: 20, fontWeight: '900', marginBottom: 5 }}>Sourcing Responsable Tunisie</Text>
                        <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 12 }}>Explorer →</Text>
                     </TouchableOpacity>
                  </ScrollView>
               </View>
            )}

            {/* ── PARRAINEZ UN PRO (REFERRAL) ── */}
            {!search && (
               <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                  <LinearGradient colors={['#4F46E5', '#7C3AED']} style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}>
                      <FontAwesome name="users" size={80} color="#fff" style={{ position: 'absolute', right: -10, top: -10, opacity: 0.15 }} />
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 5 }}>Parrainez un Pro</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 15, maxWidth: '80%', lineHeight: 18 }}>
                         Invitez un confrère sur ElKassa et profitez d'avantages exclusifs sur vos achats B2B.
                      </Text>
                      <TouchableOpacity 
                         style={{ backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                         onPress={async () => {
                             try {
                                 const Share = require('react-native').Share;
                                 await Share.share({
                                     message: 'Rejoins le réseau B2B ElKassa et obtiens des prix grossistes ! Utilise mon code : PRO-' + Math.floor(Math.random()*10000)
                                 });
                             } catch(e) {}
                         }}
                      >
                         <Text style={{ color: '#4F46E5', fontWeight: '900', fontSize: 13 }}>Inviter maintenant</Text>
                      </TouchableOpacity>
                  </LinearGradient>
               </View>
            )}

            <View style={{ paddingHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {filteredProducts.map((p) => (
                <TouchableOpacity key={p.id} style={{ width: (width - 40) / 2, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 5 }} onPress={() => setSelectedProduct(p)}>
                  <View style={{ height: 160, backgroundColor: '#f9fafb' }}>
                    {p.image ? <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 60 }}>{getProductIcon(p.name)}</Text></View>}
                  </View>
                  <View style={{ padding: 10 }}>
                     <Text style={{ color: '#E31E24', fontSize: 16, fontWeight: '900' }}>{parseFloat(p.price).toFixed(2)} - {(parseFloat(p.price) * 1.2).toFixed(2)} DT</Text>
                     <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{p.minQty || 1} pièces (MOQ)</Text>
                     <Text style={{ color: '#1f2937', fontSize: 12, fontWeight: '600', marginTop: 4 }} numberOfLines={2}>{p.name}</Text>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                        <FontAwesome name="shield" size={10} color="#fbbf24" />
                        <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700' }}>Audited Supplier</Text>
                     </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* RFQ Floating Hook */}
            {!search && (
              <TouchableOpacity 
                style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: 'rgba(227,30,36,0.1)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(227,30,36,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onPress={() => setRfqOpen(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E31E24', fontWeight: '900', fontSize: 16 }}>Besoin d'un prix spécifique ?</Text>
                  <Text style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>Diffusez un RFQ à tous les fournisseurs du pays.</Text>
                </View>
                <FontAwesome name="paper-plane" size={24} color="#E31E24" />
              </TouchableOpacity>
            )}
          </>
        )}

        {viewMode === 'VENDORS' && (
           <View style={{ paddingHorizontal: 20, gap: 15 }}>
              {filteredVendors.map(v => (
                <TouchableOpacity key={v.id} style={styles.vendorRow} onPress={() => openVendor(v)}>
                   <View style={styles.vendorAvatar}><Text style={{ fontSize: 24 }}>🏪</Text></View>
                   <View style={{ flex: 1 }}>
                      <Text style={styles.vendorRowName}>{v.companyName}</Text>
                      <Text style={styles.vendorRowCity}>{v.city || 'Tunisie'}</Text>
                   </View>
                   <FontAwesome name="chevron-right" size={14} color={T.muted} />
                </TouchableOpacity>
              ))}
           </View>
        )}

        {viewMode === 'PACKS' && (
          <View style={{ paddingHorizontal: 20, gap: 20 }}>
             {filteredBundles.map(b => (
                <TouchableOpacity key={b.id} style={styles.packCard} onPress={() => setSelectedBundle(b)}>
                   <Image source={{ uri: b.image || BANNER_IMAGE }} style={styles.packImg} />
                   <View style={styles.packBody}>
                      <Text style={styles.packTitle}>{b.name}</Text>
                      <Text style={styles.packPriceText}>{parseFloat(b.price).toFixed(3)} DT</Text>
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
                <Text style={styles.cartBarText}>{i18n.t('marketplace.viewCart')}</Text>
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
                      <Text style={styles.modalSheetTitle}>{i18n.t('marketplace.packDetails')}</Text>
                      <TouchableOpacity onPress={() => setSelectedBundle(null)}><FontAwesome name="times-circle" size={24} color={T.muted} /></TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{ padding: 25 }}>
                      <Image source={{ uri: selectedBundle?.image || BANNER_IMAGE }} style={styles.modalBundleImg} />
                      <Text style={styles.modalBundleName}>{selectedBundle?.name}</Text>
                      <Text style={styles.modalBundleDesc}>{selectedBundle?.description}</Text>
                      
                      <Text style={styles.modalSectionTitle}>{i18n.t('marketplace.productsIncluded')}</Text>
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
                         <Text style={styles.modalBtnText}>{i18n.t('marketplace.buyPack', { price: parseFloat(selectedBundle?.price || 0).toFixed(3) })}</Text>
                      </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>


      <Modal visible={!!selectedProduct} animationType="slide" transparent>

          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '95%' }}>
                  <View style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, flexDirection: 'row', gap: 15 }}>
                      <TouchableOpacity onPress={() => setSelectedProduct(null)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                          <FontAwesome name="chevron-left" size={18} color="#fff" />
                      </TouchableOpacity>
                  </View>
                  <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, flexDirection: 'row', gap: 15 }}>
                      <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}><FontAwesome name="search" size={18} color="#fff" /></TouchableOpacity>
                      <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}><FontAwesome name="heart-o" size={18} color="#fff" /></TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                      <View style={{ height: 350, backgroundColor: '#f3f4f6' }}>
                          {selectedProduct?.image ? (
                             <Image source={{ uri: selectedProduct.image }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                             <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 100 }}>{getProductIcon(selectedProduct?.name || '')}</Text>
                             </View>
                          )}
                          <View style={{ position: 'absolute', bottom: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                              <Text style={{ color: '#fff', fontSize: 10 }}>Photos 1/6</Text>
                          </View>
                      </View>

                      <View style={{ padding: 20 }}>
                          <View style={{ flexDirection: 'row', gap: 20, marginBottom: 15 }}>
                              <View>
                                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>{parseFloat(selectedProduct?.price || 0).toFixed(2)} DT</Text>
                                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>10-99 Unités</Text>
                              </View>
                              <View>
                                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>{(parseFloat(selectedProduct?.price || 0) * 0.85).toFixed(2)} DT</Text>
                                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>≥100 Unités</Text>
                              </View>
                          </View>

                          <View style={{ backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                              <FontAwesome name="shield" size={16} color="#10b981" />
                              <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '900' }}>Secured Trading</Text>
                              <FontAwesome name="info-circle" size={14} color="#10b981" />
                          </View>

                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', lineHeight: 22 }}>{selectedProduct?.name}</Text>

                          {/* Supplier Card (PDP Style) */}
                          <View style={{ marginTop: 25, padding: 20, backgroundColor: '#f8fafc', borderRadius: 15, borderWidth: 1, borderColor: '#f1f5f9' }}>
                              <TouchableOpacity onPress={() => { setSelectedVendor(selectedProduct?.vendor as any); setSelectedProduct(null); }}>
                                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1e40af', textDecorationLine: 'underline', marginBottom: 10 }}>{selectedProduct?.vendor?.companyName}</Text>
                              </TouchableOpacity>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                      <FontAwesome name="diamond" size={14} color="#6366f1" />
                                      <FontAwesome name="shield" size={14} color="#fbbf24" />
                                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#4b5563', marginLeft: 5 }}>Membre depuis 2 ans</Text>
                                  </View>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#000' }}>5.0/5</Text>
                                  <View style={{ flexDirection: 'row', gap: 2 }}>
                                      {[1,2,3,4,5].map(i => <FontAwesome key={i} name="star" size={12} color="#fbbf24" />)}
                                  </View>
                                  <FontAwesome name="chevron-right" size={10} color="#94a3b8" style={{ marginLeft: 5 }} />
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <FontAwesome name="map-marker" size={14} color="#64748b" />
                                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>Tunis, Tunisie</Text>
                              </View>
                          </View>

                          <View style={{ height: 120 }} />
                      </View>
                  </ScrollView>

                  {/* Sticky Bottom Actions */}
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 }}>
                      <TouchableOpacity 
                        style={{ alignItems: 'center', gap: 4, width: 60 }}
                        onPress={() => setMessagesOpen(true)}
                      >
                          <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' }}>
                            <FontAwesome name="commenting-o" size={24} color="#0ea5e9" />
                          </View>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#0ea5e9' }}>Discuter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => setRfqOpen(true)}
                      >
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#000' }}>Envoyer demande</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, height: 50, borderRadius: 25, backgroundColor: '#E31E24', alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                      >
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Commander</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>


      {/* Vendor Modal */}
      <Modal visible={!!selectedVendor} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '80%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalSheetTitle}>{i18n.t('marketplace.vendorProfile')}</Text>
                      <TouchableOpacity onPress={() => setSelectedVendor(null)}><FontAwesome name="times-circle" size={24} color={T.muted} /></TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{ padding: 0 }}>
                      <View style={{ height: 160, width: '100%', position: 'relative' }}>
                        <Image 
                          source={{ uri: selectedVendor?.customization?.bannerUrl || BANNER_IMAGE }} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <LinearGradient colors={['transparent', 'rgba(10,15,30,0.8)']} style={{ position: 'absolute', inset: 0 }} />
                        <View style={{ position: 'absolute', bottom: -30, left: 20, width: 70, height: 70, borderRadius: 15, backgroundColor: '#fff', padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}>
                           {selectedVendor?.customization?.logoUrl ? (
                             <Image source={{ uri: selectedVendor.customization.logoUrl }} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                           ) : (
                             <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 30 }}>🏪</Text></View>
                           )}
                        </View>
                      </View>

                      <View style={{ padding: 25, paddingTop: 45, backgroundColor: 'transparent' }}>
                          <Text style={styles.modalBundleName}>{selectedVendor?.companyName}</Text>
                          
                          {/* Vendor Tabs */}
                          <View style={{ flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', marginBottom: 20, marginTop: 10 }}>
                             {['HOME', 'PRODUCTS', 'PROFILE'].map(t => (
                               <TouchableOpacity 
                                 key={t} 
                                 onPress={() => setVendorTab(t as any)}
                                 style={{ paddingBottom: 10, borderBottomWidth: vendorTab === t ? 3 : 0, borderBottomColor: T.accent }}
                               >
                                 <Text style={{ color: vendorTab === t ? '#fff' : T.muted, fontWeight: '800', fontSize: 13 }}>{t}</Text>
                               </TouchableOpacity>
                             ))}
                          </View>

                          {vendorTab === 'HOME' && (
                             <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'transparent' }}>
                                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                     <FontAwesome name="map-marker" size={12} color={T.subtext} />
                                     <Text style={{ color: T.subtext, fontSize: 13, fontWeight: '700' }}>{selectedVendor?.city || i18n.t('marketplace.tunisia')}</Text>
                                   </View>
                                   <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.muted }} />
                                   <Text style={{ color: T.accent, fontSize: 13, fontWeight: '800' }}>Vendeur Certifié</Text>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, backgroundColor: 'transparent' }}>
                                   <View style={{ flex: 1, backgroundColor: 'rgba(99,102,241,0.1)', padding: 12, borderRadius: 12, alignItems: 'center' }}>
                                      <FontAwesome name="shield" size={16} color="#6366f1" />
                                      <Text style={{ color: '#6366f1', fontSize: 10, fontWeight: '900', marginTop: 4 }}>DIAMOND</Text>
                                   </View>
                                   <View style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 12, alignItems: 'center' }}>
                                      <FontAwesome name="check-square-o" size={16} color="#ef4444" />
                                      <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '900', marginTop: 4 }}>AUDITÉ</Text>
                                   </View>
                                   <View style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: 12, alignItems: 'center' }}>
                                      <FontAwesome name="star" size={16} color="#10b981" />
                                      <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '900', marginTop: 4 }}>4.8 RATING</Text>
                                   </View>
                                </View>
                                
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginVertical: 25 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent', marginBottom: 15 }}>
                                       <Text style={{ color: T.subtext, fontSize: 14 }}>{i18n.t('marketplace.catalogVisible')}</Text>
                                       <Text style={{ color: T.text, fontWeight: '800' }}>{selectedVendor?._count?.vendorProducts || 0} produits</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                                       <Text style={{ color: T.subtext, fontSize: 14 }}>Membre depuis</Text>
                                       <Text style={{ color: T.text, fontWeight: '800' }}>2024</Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                   style={[styles.modalPrimaryBtn, { backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}
                                   onPress={() => setVendorTab('PRODUCTS')}
                                >
                                   <Text style={styles.modalBtnText}>{i18n.t('marketplace.viewFullCatalog')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                   style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15 }}
                                   onPress={() => Alert.alert("Audit", "Chargement du rapport d'audit complet (SGS/TÜV)...")}
                                >
                                   <FontAwesome name="file-text-o" size={14} color={T.accent} />
                                   <Text style={{ color: T.accent, fontWeight: '700', fontSize: 13 }}>Voir le Rapport d'Audit</Text>
                                </TouchableOpacity>
                             </>
                          )}

                          {vendorTab === 'PRODUCTS' && (
                             <View style={{ gap: 15 }}>
                                {products.filter(p => p.vendorId === selectedVendor?.id).map(p => (
                                   <TouchableOpacity key={p.id} style={[styles.premiumCard, { width: '100%', flexDirection: 'row', height: 100 }]} onPress={() => setSelectedProduct(p)}>
                                      <Image source={{ uri: p.image || BANNER_IMAGE }} style={{ width: 100, height: '100%' }} />
                                      <View style={{ padding: 10, flex: 1 }}>
                                         <Text style={{ color: T.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{p.name}</Text>
                                         <Text style={{ color: T.gold, fontSize: 16, fontWeight: '900', marginTop: 5 }}>{parseFloat(p.price).toFixed(3)} DT</Text>
                                         <Text style={{ color: T.muted, fontSize: 10 }}>Min: {p.minOrderQty} {p.unit}</Text>
                                      </View>
                                   </TouchableOpacity>
                                ))}
                             </View>
                          )}

                          {vendorTab === 'PROFILE' && (
                             <View style={{ gap: 20 }}>
                                <Text style={{ color: T.subtext, lineHeight: 20 }}>{selectedVendor?.description || "Description de l'entreprise non disponible. Ce fournisseur est spécialisé dans l'industrie du café et des équipements de restauration."}</Text>
                                <View style={{ padding: 15, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                   <Text style={{ color: T.text, fontWeight: '800', marginBottom: 10 }}>Certifications</Text>
                                   <View style={{ flexDirection: 'row', gap: 10 }}>
                                      <View style={{ padding: 6, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 4 }}><Text style={{ color: '#10b981', fontSize: 10 }}>ISO 9001</Text></View>
                                      <View style={{ padding: 6, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 4 }}><Text style={{ color: '#10b981', fontSize: 10 }}>HACCP</Text></View>
                                   </View>
                                </View>
                             </View>
                          )}

                          <TouchableOpacity 
                             style={[styles.modalPrimaryBtn, { marginTop: 25 }]}
                             onPress={() => {
                               Alert.alert("Contact", "Lancer une discussion TradeMessager avec ce fournisseur ?");
                             }}
                          >
                             <Text style={styles.modalBtnText}>Contacter le Fournisseur</Text>
                          </TouchableOpacity>
                      </View>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* ── FILTER MODAL ── */}
      <Modal visible={filtersOpen} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '50%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalSheetTitle}>{i18n.t('marketplace.filters')}</Text>
                      <TouchableOpacity onPress={() => setFiltersOpen(false)}><FontAwesome name="times-circle" size={24} color={T.muted} /></TouchableOpacity>
                  </View>
                  <View style={{ padding: 25, backgroundColor: 'transparent' }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15 }}>{i18n.t('marketplace.searchRadius')}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: 'transparent' }}>
                          {[5, 10, 20, 50, 100, 500].map(r => (
                              <TouchableOpacity 
                                  key={r}
                                  onPress={() => { setRadius(r); fetchData(undefined, r); }}
                                  style={{
                                      paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12,
                                      backgroundColor: radius === r ? T.accent : 'rgba(255,255,255,0.05)',
                                      borderWidth: 1, borderColor: radius === r ? T.accent : T.cardBorder
                                  }}
                              >
                                  <Text style={{ color: radius === r ? '#fff' : T.muted, fontWeight: '700' }}>{r} km</Text>
                              </TouchableOpacity>
                          ))}
                      </View>
                      
                      <View style={{ marginTop: 30, backgroundColor: 'transparent' }}>
                          <Text style={{ color: T.subtext, fontSize: 13 }}>
                             📍 {location ? i18n.t('marketplace.activePos', { lat: location?.lat?.toFixed(2), lng: location?.lng?.toFixed(2) }) : 'Position non détectée'}
                          </Text>
                          <TouchableOpacity onPress={() => fetchLocation()} style={{ marginTop: 10 }}>
                              <Text style={{ color: T.indigo, fontWeight: '700' }}>{i18n.t('marketplace.updatePosition')}</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
              </View>
          </View>
      </Modal>

      {/* ── CART MODAL ── */}
      <Modal visible={cartOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '80%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalSheetTitle}>{i18n.t('marketplace.yourCart')}</Text>
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
                             {item.quantity > item.minQty ? (
                               <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qBtn}>
                                 <FontAwesome name="minus" color="#fff" size={10} />
                               </TouchableOpacity>
                             ) : (
                               <TouchableOpacity onPress={() => removeFromCart(item.id)} style={[styles.qBtn, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                                 <FontAwesome name="trash" color="#ef4444" size={10} />
                               </TouchableOpacity>
                             )}
                             <Text style={styles.qText}>{item.quantity}</Text>
                             <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={[styles.qBtn, { backgroundColor: T.accent }]}><FontAwesome name="plus" color="#fff" size={10} /></TouchableOpacity>
                          </View>
                          <Text style={styles.cartRowTotal}>{(item.price * item.quantity).toFixed(3)} DT</Text>
                       </View>
                     ))}
                  </ScrollView>
                  <View style={styles.cartFooter}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'transparent' }}>
                      <Text style={styles.totalLbl}>{i18n.t('marketplace.totalToPay')}</Text>
                         <Text style={styles.totalVal}>{cartTotal.toFixed(3)} DT</Text>
                      </View>
                      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                         <Text style={styles.checkoutText}>{i18n.t('marketplace.confirmOrder')}</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* ── ORDERS MODAL ── */}
      <Modal visible={ordersOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { backgroundColor: T.bg, padding: 0, height: '92%' }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: T.cardBorder, paddingTop: 20 }]}>
                      <View style={{ backgroundColor: 'transparent' }}>
                          <Text style={[styles.modalTitle, { color: T.text }]}>{i18n.t('marketplace.myB2BOrders')}</Text>
                          <Text style={{ color: T.subtext, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{myOrders.length} commande(s) au total</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'transparent' }}>
                          <TouchableOpacity 
                              style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.04)' }]} 
                              onPress={fetchMyOrders}
                          >
                              <FontAwesome name="refresh" size={16} color={T.accent} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.closeBtn} onPress={() => setOrdersOpen(false)}>
                              <FontAwesome name="times" size={20} color={T.text} />
                          </TouchableOpacity>
                      </View>
                  </View>
                  
                  {/* Filter Bar */}
                  <View style={{ padding: 15, backgroundColor: 'transparent' }}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                          {[
                            { id: 'ALL',       label: i18n.t('marketplace.allOrders'),          color: '#94a3b8' },
                            { id: 'ACTIVE',    label: i18n.t('marketplace.activeOrders'),        color: '#f59e0b' },
                            { id: 'DELIVERED', label: i18n.t('marketplace.toReceive'),  color: '#10b981' },
                            { id: 'STOCKED',   label: i18n.t('marketplace.finalizedOrders'),      color: '#6366f1' },
                          ].map(f => (
                              <TouchableOpacity 
                                  key={f.id}
                                  onPress={() => setOrderFilter(f.id as any)}
                                  style={{
                                      backgroundColor: orderFilter === f.id ? `${f.color}22` : 'rgba(255,255,255,0.04)',
                                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                                      borderWidth: 1, borderColor: orderFilter === f.id ? f.color : 'rgba(255,255,255,0.08)',
                                      flexDirection: 'row', alignItems: 'center', gap: 6
                                  }}
                              >
                                  <Text style={{ color: orderFilter === f.id ? f.color : T.subtext, fontSize: 12, fontWeight: '800' }}>{f.label}</Text>
                                  <View style={{ backgroundColor: f.color, minWidth: 17, height: 17, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
                                          {f.id === 'ALL' ? myOrders.length :
                                           f.id === 'ACTIVE' ? myOrders.filter(o => ['PENDING','CONFIRMED','SHIPPED'].includes(o.status)).length :
                                           myOrders.filter(o => o.status === f.id).length}
                                      </Text>
                                  </View>
                              </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>

                  <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                      {(() => {
                          const filtered = myOrders.filter(o => {
                              if (orderFilter === 'ALL') return true;
                              if (orderFilter === 'ACTIVE') return ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERING'].includes(o.status);
                              return o.status === orderFilter;
                          });

                          if (filtered.length === 0) {
                              return <Text style={{ color: T.subtext, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }}>{i18n.t('marketplace.noOrders')}</Text>;
                          }

                          return filtered.map(o => (
                              <TouchableOpacity 
                                  key={o.id} 
                                  onPress={() => setViewingOrder(o)}
                                  activeOpacity={0.7}
                                  style={{ backgroundColor: T.card, padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: T.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 }}
                              >
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                      <View style={{ backgroundColor: 'transparent' }}>
                                          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Commande #{o.id.substring(o.id.length - 6).toUpperCase()}</Text>
                                          <Text style={{ color: T.subtext, fontSize: 10, fontWeight: '700' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</Text>
                                      </View>
                                      <View style={{ backgroundColor: o.status === 'DELIVERED' ? 'rgba(245,158,11,0.1)' : o.status === 'STOCKED' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' }}>
                                          <Text style={{ color: o.status === 'DELIVERED' ? '#f59e0b' : o.status === 'STOCKED' ? '#10b981' : '#6366f1', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{o.status}</Text>
                                      </View>
                                  </View>
                                  
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, backgroundColor: 'transparent' }}>
                                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                                          <FontAwesome name="building" size={14} color={T.subtext} />
                                      </View>
                                      <Text style={{ color: T.text, fontSize: 13, fontWeight: '700' }}>{o.supplier?.name || o.vendor?.companyName || i18n.t('marketplace.vendorFallback')}</Text>
                                  </View>

                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' }}>
                                      <View style={{ backgroundColor: 'transparent' }}>
                                          <Text style={{ color: T.accent, fontWeight: '900', fontSize: 18 }}>{Number(o.total || 0).toFixed(3)} DT</Text>
                                          {o.settlement && (
                                              <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '800', marginTop: 2 }}>
                                                  Frais Marketplace: -{Number(o.settlement.commissionAmount).toFixed(3)} DT
                                              </Text>
                                          )}
                                      </View>
                                      {o.status === 'DELIVERED' && (
                                          <TouchableOpacity 
                                              style={{ backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }}
                                              onPress={() => validerReception(o.id)}
                                          >
                                              <FontAwesome name="check-circle" size={14} color="#fff" />
                                              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{i18n.t('marketplace.validate')}</Text>
                                          </TouchableOpacity>
                                      )}
                                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                                          <FontAwesome name="chevron-right" size={10} color={T.subtext} />
                                      </View>
                                  </View>
                              </TouchableOpacity>
                          ));
                      })()}
                  </ScrollView>
              </View>
          </View>
      </Modal>

      <Modal visible={rfqOpen} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <TouchableOpacity onPress={() => setRfqOpen(false)}><FontAwesome name="close" size={24} color="#64748b" /></TouchableOpacity>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937' }}>Envoyer demande</Text>
                      <View style={{ width: 24 }} />
                  </View>
                  <ScrollView contentContainerStyle={{ padding: 20 }}>
                      <Text style={{ fontSize: 15, color: '#1f2937', marginBottom: 15 }}>À: {selectedProduct?.vendor?.companyName || 'Fournisseur Vérifié'}</Text>
                      
                      {selectedProduct && (
                        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20, backgroundColor: '#f9fafb', padding: 10, borderRadius: 10 }}>
                            <View style={{ width: 60, height: 60, backgroundColor: '#eee', borderRadius: 8 }}>
                                {selectedProduct.image && <Image source={{ uri: selectedProduct.image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />}
                            </View>
                            <Text style={{ flex: 1, fontSize: 13, color: '#4b5563', fontWeight: '600' }} numberOfLines={2}>{selectedProduct.name}</Text>
                        </View>
                      )}

                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>Sélectionnez des modèles pour une demande rapide :</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                          {[
                              "Besoin d'un Prix de Gros", "Besoin d'Échantillons",
                              "Commande Min.", "Besoin de Catalogues"
                          ].map(opt => (
                              <TouchableOpacity 
                                key={opt} 
                                style={{ width: '48%', padding: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, alignItems: 'center' }}
                                onPress={() => setRfqForm({...rfqForm, description: (rfqForm.description || '') + opt + '. '})}
                              >
                                  <Text style={{ fontSize: 12, color: '#4b5563', fontWeight: '600' }}>{opt}</Text>
                              </TouchableOpacity>
                          ))}
                      </View>

                      <View style={{ position: 'relative', marginBottom: 20 }}>
                          <TextInput 
                            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 15, height: 200, textAlignVertical: 'top', fontSize: 14, color: '#1f2937' }}
                            placeholder="Veuillez m'envoyer un devis sur ce produit..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            value={rfqForm.description}
                            onChangeText={(v) => setRfqForm({...rfqForm, description: v})}
                          />
                          <Text style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 11, color: '#94a3b8' }}>{rfqForm.description?.length || 0}/4000</Text>
                      </View>

                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 30 }}>
                          <FontAwesome name="paperclip" size={18} color="#4b5563" />
                          <Text style={{ fontSize: 14, color: '#4b5563', fontWeight: '600' }}>Ajouter des Pièces Jointes</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={{ backgroundColor: '#E31E24', height: 55, borderRadius: 27.5, alignItems: 'center', justifyContent: 'center' }}
                        onPress={async () => {
                          if (!rfqForm.description) {
                              Alert.alert("Erreur", "Veuillez préciser votre demande.");
                              return;
                          }
                          try {
                              const session = await AuthService.getSession();
                              await ApiService.post('/management/marketplace/rfq', {
                                  storeId: session.storeId,
                                  productId: selectedProduct?.id,
                                  vendorId: selectedProduct?.vendor?.id,
                                  description: rfqForm.description
                              });
                              Alert.alert("Succès", "Votre demande RFQ a été envoyée au réseau de fournisseurs.");
                              setRfqOpen(false);
                              setRfqForm({ ...rfqForm, description: '' });
                          } catch (e) {
                              Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi.");
                          }
                        }}
                      >
                         <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Envoyer</Text>
                      </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* ── TRADEMESSAGER (INBOX) MODAL ── */}
      <Modal visible={messagesOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '90%', backgroundColor: T.bg, padding: 0 }]}>
                  <View style={[styles.modalHeader, { paddingHorizontal: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                      <View>
                          <Text style={[styles.modalSheetTitle, { color: '#fff' }]}>TradeMessager</Text>
                          <Text style={{ color: '#6366f1', fontSize: 11, fontWeight: '800' }}>VOTRE BOÎTE DE NÉGOCIATION</Text>
                      </View>
                      <TouchableOpacity onPress={() => setMessagesOpen(false)}><FontAwesome name="times" size={24} color={T.muted} /></TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={{ padding: 0 }}>
                      {tradeMessages.length > 0 ? tradeMessages.map((chat: any) => (
                        <TouchableOpacity 
                           key={chat.id} 
                           style={{ padding: 20, flexDirection: 'row', gap: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)', backgroundColor: chat.unread ? 'rgba(99,102,241,0.03)' : 'transparent' }}
                           onPress={() => Alert.alert("TradeMessager", "Ouverture de la discussion B2B...")}
                        >
                           <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                              <FontAwesome name="building-o" size={20} color={chat.unread ? '#6366f1' : T.muted} />
                           </View>
                           <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                 <Text style={{ color: T.text, fontWeight: '800', fontSize: 15 }}>{chat.vendor}</Text>
                                 <Text style={{ color: T.muted, fontSize: 11 }}>{chat.time}</Text>
                              </View>
                              <Text style={{ color: chat.unread ? T.text : T.subtext, fontSize: 13 }} numberOfLines={1}>{chat.lastMsg}</Text>
                           </View>
                           {chat.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E31E24', alignSelf: 'center' }} />}
                        </TouchableOpacity>
                      )) : (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <FontAwesome name="inbox" size={40} color={T.muted} style={{ marginBottom: 15 }} />
                            <Text style={{ color: T.text, fontSize: 16, fontWeight: '800' }}>Aucun message</Text>
                            <Text style={{ color: T.subtext, textAlign: 'center', marginTop: 10 }}>Vos négociations avec les usines et grossistes apparaîtront ici.</Text>
                        </View>
                      )}
                      
                      <View style={{ padding: 40, alignItems: 'center' }}>
                         <FontAwesome name="lock" size={16} color={T.muted} />
                         <Text style={{ color: T.muted, fontSize: 11, marginTop: 8, textAlign: 'center' }}>Vos discussions professionnelles sont chiffrées et sécurisées.</Text>
                      </View>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* Order Detail Modal */}
      <Modal visible={!!viewingOrder} transparent animationType="slide" onRequestClose={() => setViewingOrder(null)}>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '85%' }]}>
                  <View style={styles.modalHeader}>
                      <View>
                          <Text style={styles.modalSheetTitle}>{i18n.t('marketplace.orderDetails')}</Text>
                          <Text style={{ color: T.subtext, fontSize: 12, fontWeight: '700' }}>#{viewingOrder?.id.toUpperCase()}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setViewingOrder(null)}>
                          <FontAwesome name="times-circle" size={24} color={T.subtext} />
                      </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={{ padding: 25 }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                          <Text style={{ color: T.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 }}>{i18n.t('marketplace.supplierLabel')}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                  <FontAwesome name="building" size={18} color="#6366f1" />
                              </View>
                              <View>
                                  <Text style={{ color: T.text, fontSize: 18, fontWeight: '900' }}>{viewingOrder?.supplier?.name || viewingOrder?.vendor?.companyName}</Text>
                                  <Text style={{ color: T.subtext, fontSize: 12, fontWeight: '700' }}>{i18n.t('marketplace.b2bMarketLabel')}</Text>
                              </View>
                          </View>
                      </View>

                      <Text style={styles.modalSectionTitle}>{i18n.t('marketplace.orderedItems')}</Text>
                      {viewingOrder?.items?.map((item: any, idx: number) => (
                          <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                              <View style={{ flex: 1 }}>
                                  <Text style={{ color: T.text, fontSize: 15, fontWeight: '800' }}>{item.stockItem?.name || item.name || "Produit inconnu"}</Text>
                                  <Text style={{ color: T.subtext, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{item.quantity} x {Number(item.price).toFixed(3)} DT</Text>
                              </View>
                              <Text style={{ color: T.accent, fontSize: 15, fontWeight: '900' }}>{(item.quantity * item.price).toFixed(3)} DT</Text>
                          </View>
                      ))}

                      <View style={{ marginTop: 30, padding: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                              <Text style={{ color: T.subtext, fontWeight: '700' }}>{i18n.t('marketplace.totalItems')}</Text>
                              <Text style={{ color: T.text, fontWeight: '800' }}>{Number(viewingOrder?.total || 0).toFixed(3)} DT</Text>
                          </View>
                          {viewingOrder?.settlement && (
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                                  <Text style={{ color: '#ef4444', fontWeight: '700' }}>{i18n.t('marketplace.marketplaceFees')}</Text>
                                  <Text style={{ color: '#ef4444', fontWeight: '800' }}>-{Number(viewingOrder.settlement.commissionAmount).toFixed(3)} DT</Text>
                              </View>
                          )}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                              <Text style={{ color: T.text, fontSize: 18, fontWeight: '900' }}>{i18n.t('marketplace.netToPay')}</Text>
                              <Text style={{ color: T.accent, fontSize: 22, fontWeight: '900', textAlign: 'right' }}>{Number(viewingOrder?.total || 0).toFixed(3)} DT</Text>
                          </View>
                      </View>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* Advanced Filters Modal */}
      <Modal visible={filtersOpen} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%', padding: 25 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#1f2937' }}>Filtres Avancés</Text>
                      <TouchableOpacity onPress={() => setFiltersOpen(false)}><FontAwesome name="close" size={24} color="#64748b" /></TouchableOpacity>
                  </View>
                  
                  <ScrollView>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 15 }}>Rayon de Recherche (Proximité)</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 }}>
                          {[5, 10, 25, 50, 100, 500].map(r => (
                              <TouchableOpacity 
                                  key={r}
                                  onPress={() => { setRadius(r); fetchData(undefined, r); }}
                                  style={{ paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: radius === r ? '#E31E24' : '#e5e7eb', backgroundColor: radius === r ? '#FEF2F2' : '#fff' }}
                              >
                                  <Text style={{ color: radius === r ? '#E31E24' : '#4b5563', fontWeight: '700' }}>
                                      {r === 500 ? 'National' : `${r} km`}
                                  </Text>
                              </TouchableOpacity>
                          ))}
                      </View>

                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 15 }}>Prix (DT)</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                          <TextInput placeholder="Min" style={{ flex: 1, height: 45, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 15 }} keyboardType="numeric" />
                          <Text style={{ color: '#94a3b8' }}>-</Text>
                          <TextInput placeholder="Max" style={{ flex: 1, height: 45, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 15 }} keyboardType="numeric" />
                      </View>

                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 15 }}>Note Fournisseur</Text>
                      <View style={{ gap: 10, marginBottom: 30 }}>
                          {[4, 3, 2].map(star => (
                              <TouchableOpacity key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' }}>
                                      {/* Fake Radio */}
                                  </View>
                                  <View style={{ flexDirection: 'row' }}>
                                      {[1,2,3,4,5].map(s => <FontAwesome key={s} name="star" size={14} color={s <= star ? '#f59e0b' : '#e5e7eb'} />)}
                                  </View>
                                  <Text style={{ color: '#4b5563', fontWeight: '600' }}>& plus</Text>
                              </TouchableOpacity>
                          ))}
                      </View>
                  </ScrollView>

                  <View style={{ flexDirection: 'row', gap: 15, marginTop: 'auto' }}>
                      <TouchableOpacity 
                          style={{ flex: 1, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}
                      >
                          <Text style={{ color: '#4b5563', fontWeight: '800' }}>Réinitialiser</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          style={{ flex: 1, height: 50, borderRadius: 25, backgroundColor: '#E31E24', alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => setFiltersOpen(false)}
                      >
                          <Text style={{ color: '#fff', fontWeight: '800' }}>Appliquer</Text>
                      </TouchableOpacity>
                  </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 6,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabCountBadge: {
    backgroundColor: 'rgba(148,163,184,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
  },
  catChip: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, marginRight: 10 
  },
  catChipActive: { backgroundColor: '#10b981' },
  catChipText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  catChipTextActive: { color: '#fff' },
  // ── Featured Pack Styles ──
  featuredPackCard: {
    width: 220,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featuredPackImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredPackGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    padding: 15,
    justifyContent: 'flex-end',
  },
  featuredPackTag: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  featuredPackTitle: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  featuredPackPrice: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '900',
  },
  featuredPackDiscount: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  
  heroBanner: { 
    width: '100%', height: 180, borderRadius: 25, 
    overflow: 'hidden', marginBottom: 30, elevation: 10 
  },
  heroImg: { width: '100%', height: '100%', position: 'absolute' },
  heroGradient: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  heroTag: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 8 },
  heroTagText: { fontSize: 9, fontWeight: '900', color: '#000' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroPrice: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  premiumCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  cardImgContainer: { height: 110, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  flashBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  flashBadgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  featBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#6366f1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  featBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  cardInfo: { padding: 12, backgroundColor: 'transparent' },
  cardVendor: { color: '#6366f1', fontSize: 9, fontWeight: '900' },
  cardTitle: { color: '#1f2937', fontSize: 13, fontWeight: '800', marginVertical: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'transparent' },
  cardPrice: { color: '#fbbf24', fontSize: 17, fontWeight: '900' },
  cardUnit: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  addBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#E31E24', alignItems: 'center', justifyContent: 'center' },
  moqRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: 'transparent' },
  moqText: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  vendorRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb' },
  vendorAvatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  vendorRowName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  vendorRowCity: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  vendorStats: { alignItems: 'flex-end', backgroundColor: 'transparent' },
  statsValue: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  statsLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  packCard: { width: '100%', borderRadius: 25, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  packImg: { width: '100%', height: 160 },
  packPriceTag: { position: 'absolute', top: 15, right: 15, backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  packPriceText: { color: '#fbbf24', fontWeight: '900', fontSize: 16 },
  packBody: { padding: 20, backgroundColor: 'transparent' },
  packVendor: { color: '#6366f1', fontSize: 10, fontWeight: '900' },
  packTitle: { color: '#1f2937', fontSize: 18, fontWeight: '800', marginTop: 5 },
  packRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, backgroundColor: 'transparent' },
  packDiscount: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
  packItemsCount: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  cartBar: { 
    position: 'absolute', bottom: 30, left: 20, right: 20, height: 65, 
    borderRadius: 20, backgroundColor: '#E31E24', paddingHorizontal: 20, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#E31E24', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10
  },
  cartBarBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cartBarBadgeText: { color: '#E31E24', fontSize: 12, fontWeight: '900' },
  cartBarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cartBarTotal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: '#e5e7eb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalSheetTitle: { color: '#1f2937', fontSize: 18, fontWeight: '900' },
  modalBundleImg: { width: '100%', height: 200, borderRadius: 20, marginBottom: 20 },
  modalBundleName: { color: '#1f2937', fontSize: 24, fontWeight: '900' },
  modalBundleDesc: { color: '#94a3b8', fontSize: 14, marginVertical: 15, lineHeight: 20 },
  modalSectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  bundleItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  bundleItemName: { color: '#1f2937', fontWeight: '700' },
  bundleItemQty: { color: '#6366f1', fontWeight: '900' },
  modalPrimaryBtn: { backgroundColor: '#E31E24', height: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'transparent' },
  cartItemName: { color: '#1f2937', fontSize: 15, fontWeight: '800' },
  cartItemSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  cartQtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 15, backgroundColor: 'rgba(148,163,184,0.1)', padding: 5, borderRadius: 10 },
  qBtn: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  qText: { color: '#fff', fontWeight: '900' },
  cartRowTotal: { color: '#fbbf24', fontSize: 15, fontWeight: '900', minWidth: 80, textAlign: 'right' },
  cartFooter: { padding: 25, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.1)' },
  totalLbl: { color: '#64748b', fontSize: 14, fontWeight: '700' },
  totalVal: { color: '#1f2937', fontSize: 24, fontWeight: '900' },
  checkoutBtn: { backgroundColor: '#E31E24', height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    borderWidth: 1,
    borderRadius: 15,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
