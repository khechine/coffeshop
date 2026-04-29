import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, FlatList,
  Text as RNText, View as RNView, Modal, Vibration, Platform, Image, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/components/AlertContext';
import i18n from '../../locales/i18n';
import { SocketService } from '@/services/socket';
import { soundService } from '@/services/sound';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
type Product = {
  id: string; name: string; price: number;
  category: string; icon: string;
  image?: string;
};
type Cart = Record<string, number>; // productId -> qty
const TAX_RATE = 0.19;

// ────────────────────────────────────────────────
// POS Screen
// ────────────────────────────────────────────────
export default function PosScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const { tableId } = useLocalSearchParams<{ tableId?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [cartOpen, setCartOpen] = useState(false);
  const [storeId, setStoreId] = useState('1');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    AuthService.getSession().then(s => { 
      if (s?.storeId) setStoreId(s.storeId); 
      if (s?.user) setUser(s.user);
    });
  }, []);

  // Load products
  useEffect(() => {
    async function load() {
      try {
        const raw = await ApiService.get(`/products?storeId=${storeId}`);
        const mapped: Product[] = (raw || []).map((p: any) => {
          let icon = '📦';
          const cat = p.categoryName || '';
          if (cat.toLowerCase().includes('café')) icon = '☕';
          else if (cat.toLowerCase().includes('boisson')) icon = '🥤';
          else if (cat.toLowerCase().includes('thé')) icon = '🍃';
          else if (cat.toLowerCase().includes('pâtisserie')) icon = '🥐';
          else if (cat.toLowerCase().includes('chicha')) icon = '💨';
          else if (cat.toLowerCase().includes('sandwich')) icon = '🥪';
          else if (cat.toLowerCase().includes('crêpe')) icon = '🥞';
          else if (cat.toLowerCase().includes('jus')) icon = '🍹';
          else if (cat.toLowerCase().includes('eau')) icon = '💧';
          else if (cat.toLowerCase().includes('plat')) icon = '🍛';
          else if (cat.toLowerCase().includes('dessert')) icon = '🍰';
          else if (cat.toLowerCase().includes('pizza')) icon = '🍕';
          return { 
            id: p.id, 
            name: p.name,
            nameAr: p.nameAr,
            price: Number(p.price), 
            category: cat || i18n.t('pos.categoryGeneral'), 
            icon: p.icon || icon,
            image: p.image 
          };
        });
        setProducts(mapped);
        await AsyncStorage.setItem(`pos_products_${storeId}`, JSON.stringify(mapped));
      } catch {
        const cached = await AsyncStorage.getItem(`pos_products_${storeId}`);
        if (cached) setProducts(JSON.parse(cached));
      }
    }
    load();
  }, [storeId]);

  // Load saved cart (pos_cart OR table_cart)
  useEffect(() => {
    async function loadCart() {
      if (tableId) {
        const c = await AsyncStorage.getItem(`rachma_table_carts_${storeId}`);
        if (c) {
          const parsed = JSON.parse(c);
          if (parsed[tableId] && parsed[tableId].cart) {
            setCart(parsed[tableId].cart);
          } else {
            setCart({});
          }
        }
      } else {
        const c = await AsyncStorage.getItem(`pos_cart_${storeId}`);
        if (c) setCart(JSON.parse(c));
      }
    }
    loadCart();
  }, [storeId, tableId]);

  const saveCart = async (newCart: Cart) => {
    if (tableId) {
      let total = 0;
      Object.entries(newCart).forEach(([id, qty]) => {
        const p = products.find(prod => prod.id === id);
        if (p) total += (p.price * qty);
      });
      const c = await AsyncStorage.getItem(`rachma_table_carts_${storeId}`);
      let parsed = c ? JSON.parse(c) : {};
      parsed[tableId] = { cart: newCart, total };
      await AsyncStorage.setItem(`rachma_table_carts_${storeId}`, JSON.stringify(parsed));
    } else {
      await AsyncStorage.setItem(`pos_cart_${storeId}`, JSON.stringify(newCart));
    }
  };

  const addToCart = (id: string) => {
    const product = products.find(p => p.id === id);
    const updated = { ...cart, [id]: (cart[id] || 0) + 1 };
    setCart(updated); saveCart(updated); Vibration.vibrate(8);
    soundService.play('tap');

    // Emit live event
    SocketService.emitRachmaAction({
      storeId,
      action: 'add',
      productId: id,
      productName: product?.name || 'Produit',
      price: Number(product?.price || 0),
      tableName: tableId || undefined,
      baristaName: user?.name || user?.id || 'POS',
      timestamp: new Date().toISOString()
    });
  };

  const removeFromCart = (id: string) => {
    const product = products.find(p => p.id === id);
    const updated = { ...cart };
    const lastQty = updated[id] || 0;
    if (updated[id] > 1) updated[id]--;
    else delete updated[id];
    setCart(updated); saveCart(updated);
    soundService.play('tap');

    if (lastQty > 0) {
      // Emit live event (undo/remove)
      SocketService.emitRachmaAction({
        storeId,
        action: 'undo',
        productId: id,
        productName: product?.name || 'Produit',
        price: Number(product?.price || 0),
        tableName: tableId || undefined,
        baristaName: user?.name || user?.id || 'POS',
        timestamp: new Date().toISOString()
      });
    }
  };

  const clearCart = () => { setCart({}); saveCart({}); };

  const handleLock = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(i18n.t('pos.lockCashRegister'))) {
        AuthService.getSession().then(session => {
          if (session.user && (session.user.role === 'STORE_OWNER' || session.user.role === 'SUPERADMIN')) {
            AuthService.clearSession().then(() => router.replace('/login'));
          } else {
            AuthService.clearUser().then(() => router.replace('/unlock'));
          }
        });
      }
      return;
    }

    showAlert({
      title: i18n.t('pos.closeSession'),
      message: i18n.t('pos.lockCashRegister'),
      type: 'warning',
      buttons: [
        { text: i18n.t('pos.cancel'), style: 'cancel' },
        { 
          text: i18n.t('pos.close'), 
          style: 'destructive', 
          onPress: async () => {
             const session = await AuthService.getSession();
             if (session.user && (session.user.role === 'STORE_OWNER' || session.user.role === 'SUPERADMIN')) {
               await AuthService.clearSession();
               router.replace('/login');
             } else {
               await AuthService.clearUser();
               router.replace('/unlock');
             }
          }
        }
      ]
    });
  };

  // ── Totals ──
  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    product: products.find(p => p.id === id)!, qty,
  })).filter(i => !!i.product);

  const subtotalTTC = cartItems.reduce((acc, i) => acc + i.product.price * i.qty, 0);
  const totalTax = subtotalTTC * (TAX_RATE / (1 + TAX_RATE));
  const totalHT = subtotalTTC - totalTax;
  const cartQty = Object.values(cart).reduce((a, b) => a + b, 0);

  const saveTicketToHistory = async (apiSale: any, tblId: string | null) => {
    const newTicket = {
      id: apiSale.fiscalNumber || apiSale.id, // Official fiscal number
      dbId: apiSale.id,
      signature: apiSale.signature,
      tableId: tblId,
      totalTTC: subtotalTTC,
      items: cartItems.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty
      })),
      timestamp: apiSale.createdAt || Date.now()
    };
    const c = await AsyncStorage.getItem(`tickets_history_${storeId}`);
    let history = c ? JSON.parse(c) : [];
    history.unshift(newTicket);
    if (history.length > 100) history.pop(); // Keep only last 100 tickets
    await AsyncStorage.setItem(`tickets_history_${storeId}`, JSON.stringify(history));
  };

  const checkout = async () => {
    if (cartItems.length === 0) {
      showAlert({
        title: i18n.t('pos.emptyCart'),
        message: i18n.t('pos.addProductsFirst'),
        type: 'info'
      });
      return;
    }
    showAlert({
      title: i18n.t('pos.checkoutConfirmTitle'),
      message: i18n.t('pos.checkoutConfirmMsg', { total: subtotalTTC.toFixed(3) }) + `\n${cartQty} ${i18n.t('pos.items')}`,
      type: 'info',
      buttons: [
        { text: i18n.t('pos.cancel'), style: 'cancel' },
        {
          text: i18n.t('pos.validate') + ' ✓',
          onPress: async () => {
            try {
              const session = await AuthService.getSession();
              const payload = {
                storeId: storeId,
                total: subtotalTTC,
                baristaId: session?.user?.id,
                takenById: session?.user?.id,
                terminalId: session?.terminalId,
                mode: 'NORMAL',
                items: cartItems.map(item => ({
                  productId: item.product.id,
                  quantity: item.qty,
                  price: item.product.price
                }))
              };
              const apiSale = await ApiService.post('/sales', payload);
              if (!apiSale || !apiSale.id) throw new Error('API Reject');
              await saveTicketToHistory(apiSale, null);
              clearCart();
              soundService.play('success');
              setCartOpen(false);
              showAlert({
                title: i18n.t('pos.successCheckout'),
                message: i18n.t('pos.ticketGenerated', { fiscalNumber: apiSale.fiscalNumber }),
                type: 'success'
              });
            } catch (e) {
              showAlert({
                title: i18n.t('pos.errorSync'),
                message: i18n.t('pos.errorSyncMsg'),
                type: 'error'
              });
            }
          },
        },
      ]
    });
  };

  const checkoutTable = async () => {
    if (cartItems.length === 0) return;
    if (Platform.OS === 'web') {
       if (window.confirm(`${i18n.t('pos.checkoutConfirmTitle')} ${tableId}\nTotal : ${subtotalTTC.toFixed(3)} DT TTC`)) {
          try {
            const session = await AuthService.getSession();
            const payload = {
              storeId: storeId, total: subtotalTTC, baristaId: session?.user?.id, mode: 'NORMAL',
              items: cartItems.map(item => ({ productId: item.product.id, quantity: item.qty, price: item.product.price }))
            };
            const apiSale = await ApiService.post('/sales', payload);
            await saveTicketToHistory(apiSale, tableId || null);
            const c = await AsyncStorage.getItem(`rachma_table_carts_${storeId}`);
            let parsed = c ? JSON.parse(c) : {};
            delete parsed[tableId!];
            await AsyncStorage.setItem(`rachma_table_carts_${storeId}`, JSON.stringify(parsed));
            setCart({});
            soundService.play('success');
            setCartOpen(false);
            router.push('/(tabs)/tables');
          } catch(e) {
            window.alert(i18n.t('pos.errorSyncMsg'));
          }
       }
       return;
    }
    showAlert({
      title: `${i18n.t('pos.checkoutConfirmTitle')} ${tableId}`,
      message: `Total : ${subtotalTTC.toFixed(3)} DT TTC`,
      type: 'info',
      buttons: [
        { text: i18n.t('pos.cancel'), style: 'cancel' },
        {
          text: i18n.t('pos.checkout') + ' ✓',
          onPress: async () => {
            try {
              const session = await AuthService.getSession();
              const payload = {
                storeId: storeId, total: subtotalTTC, baristaId: session?.user?.id, mode: 'NORMAL',
                items: cartItems.map(item => ({ productId: item.product.id, quantity: item.qty, price: item.product.price }))
              };
              const apiSale = await ApiService.post('/sales', payload);
              await saveTicketToHistory(apiSale, tableId || null);
              const c = await AsyncStorage.getItem(`rachma_table_carts_${storeId}`);
              let parsed = c ? JSON.parse(c) : {};
              delete parsed[tableId!];
              await AsyncStorage.setItem(`rachma_table_carts_${storeId}`, JSON.stringify(parsed));
              setCart({});
              soundService.play('success');
              setCartOpen(false);
              showAlert({
                title: i18n.t('pos.successCheckout'),
                message: `Ticket: ${apiSale.fiscalNumber}`,
                type: 'success'
              });
              router.push('/(tabs)/tables');
            } catch (e) {
              showAlert({
                title: i18n.t('pos.errorSync'),
                message: i18n.t('pos.errorSyncMsg'),
                type: 'error'
              });
            }
          },
        },
      ]
    });
  };

  // ── Categories ──
  const categories = useMemo(() => ['ALL', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const filtered = useMemo(() => activeCategory === 'ALL' ? products : products.filter(p => p.category === activeCategory), [products, activeCategory]);

  const renderCartContent = () => (
    <RNView style={[styles.cartSheet, isTablet && styles.tabletCartSheet]}>
      {/* Sheet header */}
      <RNView style={styles.cartHeader}>
        <RNText style={styles.cartTitle}>{tableId ? `🛒 ${i18n.t('pos.bill')} ${tableId}` : `🛒 ${i18n.t('pos.cart')}`}</RNText>
        {!isTablet && (
          <TouchableOpacity onPress={() => setCartOpen(false)}>
            <FontAwesome name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </RNView>

      {/* Cart items */}
      <ScrollView style={styles.cartItems} contentContainerStyle={{ paddingBottom: 20 }}>
        {cartItems.length === 0 && (
          <RNText style={styles.emptyCartText}>{i18n.t('pos.emptyCart')}</RNText>
        )}
        {cartItems.map(({ product, qty }) => (
          <RNView key={product.id} style={styles.cartRow}>
            <RNView style={styles.cartRowInfo}>
              <RNText style={styles.cartItemName}>{product.icon} {i18n.locale === 'ar' && (product as any).nameAr ? (product as any).nameAr : product.name}</RNText>
              <RNText style={styles.cartItemSub}>{qty} × {product.price.toFixed(3)} DT</RNText>
            </RNView>
            <RNText style={styles.cartItemTotal}>{(product.price * qty).toFixed(3)}</RNText>
            <RNView style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(product.id)}>
                <RNText style={styles.qtyBtnText}>−</RNText>
              </TouchableOpacity>
              <RNText style={styles.qtyNum}>{qty}</RNText>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(product.id)}>
                <RNText style={styles.qtyBtnText}>+</RNText>
              </TouchableOpacity>
            </RNView>
          </RNView>
        ))}
      </ScrollView>

      {/* Totals */}
      {cartItems.length > 0 && (
        <RNView style={styles.totalsBox}>
          <RNView style={styles.totalRow}>
            <RNText style={styles.totalLabel}>{i18n.t('pos.ht')}</RNText>
            <RNText style={styles.totalValue}>{totalHT.toFixed(3)} DT</RNText>
          </RNView>
          <RNView style={styles.totalRow}>
            <RNText style={styles.totalLabel}>{i18n.t('pos.tva')}</RNText>
            <RNText style={styles.totalValue}>{totalTax.toFixed(3)} DT</RNText>
          </RNView>
          <RNView style={[styles.totalRow, styles.totalRowBig]}>
            <RNText style={styles.totalBigLabel}>{i18n.t('pos.totalTtc')}</RNText>
            <RNText style={styles.totalBigValue}>{subtotalTTC.toFixed(3)} DT</RNText>
          </RNView>
        </RNView>
      )}

      {/* Actions */}
      <RNView style={styles.cartActions}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
          <FontAwesome name="trash" size={18} color={Colors.danger} />
        </TouchableOpacity>
        {tableId ? (
          <>
            <TouchableOpacity style={styles.saveTableBtn} onPress={() => { Vibration.vibrate(20); if(!isTablet) setCartOpen(false); }}>
              <FontAwesome name="save" size={18} color="#ffffff" />
              <RNText style={styles.checkoutText}>{i18n.t('pos.save')}</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkoutTableBtn} onPress={checkoutTable}>
              <FontAwesome name="check" size={18} color="#ffffff" />
              <RNText style={styles.checkoutText}>{i18n.t('pos.checkout')}</RNText>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.checkoutBtn} onPress={checkout}>
            <FontAwesome name="check" size={18} color="#ffffff" />
            <RNText style={styles.checkoutText}>{i18n.t('pos.checkout')}</RNText>
          </TouchableOpacity>
        )}
      </RNView>
    </RNView>
  );

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      {/* ── Main POS Area ── */}
      <View style={[styles.mainArea, isTablet && styles.tabletMainArea]}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12), paddingBottom: 15 }]}>
          {tableId ? (
             <TouchableOpacity onPress={() => router.push('/(tabs)/tables')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
               <FontAwesome name="arrow-left" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
               <Text style={styles.headerTitle}>{tableId}</Text>
             </TouchableOpacity>
          ) : (
             <Text style={styles.headerTitle}>{i18n.t('pos.pointOfSale')}</Text>
          )}
          <TouchableOpacity onPress={handleLock} style={styles.lockBtn}>
            <FontAwesome name="lock" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* ── Categories ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesBar} contentContainerStyle={{ paddingVertical: 10 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <RNText style={[styles.catBtnText, activeCategory === cat && styles.catBtnTextActive]}>
                {cat === 'ALL' ? i18n.t('pos.categoryAll') : cat}
              </RNText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Product Grid ── */}
        <FlatList
          data={filtered}
          numColumns={isTablet ? 4 : 2}
          key={isTablet ? 'tab' : 'mob'}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.productGrid, isTablet && styles.tabletProductGrid]}
          renderItem={({ item }) => {
            const qty = cart[item.id] || 0;
            return (
              <TouchableOpacity
                style={[styles.productCard, qty > 0 && styles.productCardActive]}
                onPress={() => addToCart(item.id)}
                activeOpacity={0.85}
              >
                {item.image ? (
                  <Image source={{ uri: ApiService.getFileUrl(item.image) || undefined }} style={styles.productImage} />
                ) : (
                  <RNText style={styles.productEmoji}>{item.icon}</RNText>
                )}
                <RNText style={styles.productName} numberOfLines={2}>{i18n.locale === 'ar' && (item as any).nameAr ? (item as any).nameAr : item.name}</RNText>
                <RNText style={styles.productPrice}>{item.price.toFixed(3)} DT</RNText>
                {qty > 0 && (
                  <RNView style={styles.qtyBadge}>
                    <RNText style={styles.qtyBadgeText}>{qty}</RNText>
                  </RNView>
                )}
              </TouchableOpacity>
            );
          }}
        />

        {/* ── Cart FAB (Mobile Only) ── */}
        {!isTablet && (
          <TouchableOpacity
            style={[styles.cartFab, cartQty === 0 && { opacity: 0.5 }]}
            onPress={() => setCartOpen(true)}
            activeOpacity={0.85}
          >
            <FontAwesome name="shopping-basket" size={24} color="#ffffff" />
            {cartQty > 0 && (
              <RNView style={styles.fabBadge}>
                <RNText style={styles.fabBadgeText}>{cartQty}</RNText>
              </RNView>
            )}
            {subtotalTTC > 0 && (
              <RNText style={styles.fabTotal}>{subtotalTTC.toFixed(3)} DT</RNText>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Cart Sidebar (Tablet Only) ── */}
      {isTablet && (
        <View style={styles.sidebar}>
          {renderCartContent()}
        </View>
      )}

      {/* ── Cart Bottom Sheet (Mobile Only) ── */}
      {!isTablet && (
        <Modal visible={cartOpen} animationType="slide" transparent>
          <RNView style={styles.cartOverlay}>
            <TouchableOpacity style={styles.cartBackdrop} onPress={() => setCartOpen(false)} />
            {renderCartContent()}
          </RNView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  tabletContainer: { flexDirection: 'row' },
  
  mainArea: { flex: 1 },
  tabletMainArea: { flex: 3, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },

  sidebar: { flex: 1.2, backgroundColor: '#0a0f1e' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#ffffff', fontSize: 18, fontWeight: '800',
  },
  lockBtn: {
    padding: 5,
  },

  // Categories
  categoriesBar: {
    height: 70,
    flexGrow: 0, 
    flexShrink: 0,
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.06)', 
    backgroundColor: 'transparent',
  },
  catBtn: {
    height: 42,
    paddingHorizontal: 20, 
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21, 
    marginRight: 12,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { color: '#94a3b8', fontWeight: '800', fontSize: 14 },
  catBtnTextActive: { color: '#ffffff' },

  // Product grid
  productGrid: { padding: 10, paddingBottom: 160 },
  tabletProductGrid: { paddingBottom: 40 },
  productCard: {
    flex: 1, margin: 5, borderRadius: 20, padding: 16,
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-start', minHeight: 120,
  },
  productCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  productImage: {
    width: '100%', height: 70, borderRadius: 12, marginBottom: 8, resizeMode: 'cover',
  },
  productEmoji: { fontSize: 28, marginBottom: 8 },
  productName: { color: '#ffffff', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  productPrice: { color: Colors.primary, fontWeight: '800', fontSize: 13 },
  qtyBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.primary, borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  qtyBadgeText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },

  // FAB
  cartFab: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: Colors.primary, borderRadius: 20, height: 62,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  fabBadge: {
    backgroundColor: '#ffffff', borderRadius: 10,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  fabBadgeText: { color: Colors.primary, fontWeight: '900', fontSize: 12 },
  fabTotal: { color: '#ffffff', fontWeight: '800', fontSize: 15 },

  // Cart sheet
  cartOverlay: { flex: 1, justifyContent: 'flex-end' },
  cartBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  cartSheet: {
    backgroundColor: '#0a0f1e', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '85%', paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  tabletCartSheet: {
    flex: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderLeftWidth: 1,
    maxHeight: '100%', paddingBottom: 0,
  },
  cartHeader: {
    backgroundColor: '#111827',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  cartTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  cartItems: { maxHeight: 300 },
  emptyCartText: { color: '#94a3b8', textAlign: 'center', padding: 30 },
  cartRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cartRowInfo: { flex: 1 },
  cartItemName: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  cartItemSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  cartItemTotal: { color: Colors.primary, fontWeight: '800', fontSize: 15, marginRight: 12 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 16 },
  qtyNum: { color: '#ffffff', fontWeight: '800', fontSize: 15, minWidth: 20, textAlign: 'center' },

  // Totals
  totalsBox: {
    padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRowBig: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  totalLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  totalValue: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  totalBigLabel: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  totalBigValue: { color: Colors.primary, fontSize: 22, fontWeight: '900' },

  // Actions
  cartActions: {
    flexDirection: 'row', padding: 20, gap: 12,
  },
  clearBtn: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  checkoutBtn: {
    flex: 2, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  checkoutTableBtn: {
    flex: 1.5, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  saveTableBtn: {
    flex: 1.5, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  checkoutText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
});

