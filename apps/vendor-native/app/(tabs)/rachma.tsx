import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View as RNView,
  Text as RNText, Vibration, RefreshControl, Alert, Platform, Modal, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useRouter } from 'expo-router';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
type Packaging = { id: string; name: string; icon: string };
type Product = {
  id: string; name: string; price: number;
  category: string; icon: string; takeaway: boolean;
  packagings: Packaging[];
};
type LogEntry = string; // 'sale' | 'loss' | 'sale:PKG_ID'
type Logs = Record<string, LogEntry[]>;

const SOUND_PROFILES = {
  modern: {
    name: 'Moderne',
    sale: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    loss: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    pkg: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3',
    undo: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
  },
  classic: {
    name: 'Caisse (Retro)',
    sale: 'https://assets.mixkit.co/active_storage/sfx/1077/1077-preview.mp3',
    loss: 'https://assets.mixkit.co/active_storage/sfx/1083/1083-preview.mp3',
    pkg: 'https://assets.mixkit.co/active_storage/sfx/1079/1079-preview.mp3',
    undo: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
  },
  minimal: {
    name: 'Discret (Vibrations)',
    sale: null, loss: null, pkg: null, undo: null
  }
};

const SLOT_COUNT = 20;

// ────────────────────────────────────────────────
// POS Screen
// ────────────────────────────────────────────────
export default function RachmaScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<Logs>({});
  const [mode, setMode] = useState<'sale' | 'loss'>('sale');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState('1');
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [serverHistory, setServerHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundProfile, setSoundProfile] = useState<keyof typeof SOUND_PROFILES>('modern');
  const [user, setUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');

  useEffect(() => {
    AuthService.getSession().then(s => { 
      if (s?.storeId) setStoreId(s.storeId); 
      if (s?.user) {
        setUser(s.user);
        setEditName(s.user.name || '');
        setEditPin(s.user.pinCode || '');
      }
    });
    AsyncStorage.getItem('rachma_sound_enabled').then(v => {
      if (v !== null) setSoundEnabled(v === 'true');
    });
    AsyncStorage.getItem('rachma_sound_profile').then(v => {
      if (v !== null && v in SOUND_PROFILES) setSoundProfile(v as any);
    });
  }, [storeId]);

  // Load persisted logs
  useEffect(() => {
    AsyncStorage.getItem(`rachma_logs_${storeId}`).then(saved => {
      if (saved) setLogs(JSON.parse(saved));
    });
  }, [storeId]);

  // Sync products from API
  const syncProducts = useCallback(async () => {
    try {
      const raw = await ApiService.get(`/products?storeId=${storeId}`);
      const mapped: Product[] = (raw || []).map((p: any) => {
        let icon = '📦';
        const cat = p.categoryName || '';
        if (cat.toLowerCase().includes('café') || cat.toLowerCase().includes('coffee')) icon = '☕';
        else if (cat.toLowerCase().includes('boisson') || cat.toLowerCase().includes('drink')) icon = '🥤';
        else if (cat.toLowerCase().includes('thé')) icon = '🍃';
        else if (cat.toLowerCase().includes('pâtisserie') || cat.toLowerCase().includes('food')) icon = '🥐';
        else if (cat.toLowerCase().includes('chicha')) icon = '💨';
        return {
          id: p.id, name: p.name, price: p.price,
          category: cat || 'Général', icon, takeaway: p.takeaway ?? true,
          packagings: p.packagings || [],
        };
      });
      setProducts(mapped);
      await AsyncStorage.setItem(`rachma_products_${storeId}`, JSON.stringify(mapped));
    } catch (e) {
      // Fallback to cached
      const cached = await AsyncStorage.getItem(`rachma_products_${storeId}`);
      if (cached) setProducts(JSON.parse(cached));
    } finally {
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => { syncProducts(); }, [storeId]);

  const saveLogs = useCallback((newLogs: Logs) => {
    AsyncStorage.setItem(`rachma_logs_${storeId}`, JSON.stringify(newLogs));
  }, [storeId]);

  // ── Feedback logic ──
  const playFeedback = useCallback(async (type: 'sale' | 'loss' | 'pkg' | 'undo') => {
    if (!soundEnabled) return;

    // 1. Haptics (Immediate)
    Haptics.impactAsync(
      type === 'sale' ? Haptics.ImpactFeedbackStyle.Medium :
      type === 'loss' ? Haptics.ImpactFeedbackStyle.Heavy :
      Haptics.ImpactFeedbackStyle.Light
    );
    
    // 2. Audio (Async)
    try {
      const url = SOUND_PROFILES[soundProfile][type];
      if (url) {
        const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
        // Auto-unload from memory after play
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
        });
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }, [soundEnabled, soundProfile]);

  // ── Profile Logic ──
  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    try {
      const resp = await ApiService.post('/auth/update-profile', {
        id: user.id,
        name: editName,
        pinCode: editPin
      });
      if (resp) {
        const updatedUser = { ...user, name: editName, pinCode: editPin };
        await AuthService.setUser(updatedUser);
        setUser(updatedUser);
        Alert.alert('Succès', 'Profil mis à jour !');
        setSettingsOpen(false);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const toggleSound = async () => {
    const val = !soundEnabled;
    setSoundEnabled(val);
    await AsyncStorage.setItem('rachma_sound_enabled', String(val));
    if (val) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Tap: add a sale or packaging sale ──
  const handleAdd = (productId: string, pkgId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let logType: LogEntry = mode;
    if (mode === 'sale' && pkgId && product.takeaway) logType = `sale:${pkgId}`;
    const updated = { ...logs, [productId]: [...(logs[productId] || []), logType] };
    setLogs(updated);
    saveLogs(updated);
    playFeedback(pkgId ? 'pkg' : (mode === 'sale' ? 'sale' : 'loss'));
  };

  // ── Long press: undo last entry ──
  const handleUndo = (productId: string) => {
    const existing = logs[productId] || [];
    if (!existing.length) return;
    const updated = { ...logs, [productId]: existing.slice(0, -1) };
    setLogs(updated);
    saveLogs(updated);
    playFeedback('undo');
  };

  const handleLock = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous verrouiller la caisse ?')) {
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

    Alert.alert(
      'Fermer la session',
      'Voulez-vous verrouiller la caisse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Fermer', 
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
    );
  };

  const fetchHistory = async () => {
    try {
      const session = await AuthService.getSession();
      const baristaId = session.user?.id;
      if (!baristaId) return;

      const data = await ApiService.get(`/sales/history/${storeId}?baristaId=${baristaId}`);
      setServerHistory(data);

      // Calcul des stats
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let d = 0, w = 0, m = 0;
      data.forEach((s: any) => {
        const date = new Date(s.createdAt);
        const amt = Number(s.total || 0);
        if (s.isVoid) return;
        if (date >= startOfDay) d += amt;
        if (date >= startOfWeek) w += amt;
        if (date >= startOfMonth) m += amt;
      });
      setStats({ today: d, week: w, month: m });
    } catch (e) {
      console.error("Failed to fetch history:", e);
    }
  };

  const handleOpenHistory = () => {
    fetchHistory();
    setHistoryOpen(true);
  };

  const processBatch = async () => {
    try {
      const session = await AuthService.getSession();
      const items: any[] = [];
      let calculatedTotal = 0;
      Object.entries(logs).forEach(([productId, productLogs]) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const saleCount = productLogs.filter((l: any) => l?.startsWith('sale')).length;
        if (saleCount > 0) {
          items.push({ productId: productId, quantity: saleCount, price: product.price });
          calculatedTotal += (saleCount * product.price);
        }
      });
      
      if (items.length > 0) {
        const payload = {
          storeId,
          total: calculatedTotal,
          baristaId: session?.user?.id,
          takenById: session?.user?.id,
          terminalId: session?.terminalId,
          mode: 'RACHMA',
          items,
          sessionId: 'BATCH-' + Date.now()
        };
        const apiSale = await ApiService.post('/sales', payload);
        if (!apiSale || !apiSale.id) throw new Error('API Sync Failed');
        if (Platform.OS !== 'web') {
          Alert.alert('✅ Lot Clôturé', `Synchronisé avec le serveur fiscal.\nSéquence: ${apiSale.fiscalNumber}`);
        } else {
          window.alert(`✅ Lot Clôturé. Séquence: ${apiSale.fiscalNumber}`);
        }
      }
      
      setLogs({}); saveLogs({}); setReportOpen(false);
    } catch(e) {
      if (Platform.OS !== 'web') {
        Alert.alert('❌ Erreur', 'Impossible de synchroniser le lot. Vérifiez la connexion.');
      } else {
        window.alert('Erreur: Impossible de synchroniser le lot.');
      }
    }
  };

  const handleClearBatch = () => {
    if (Object.keys(logs).length === 0) return;
    if (Platform.OS === 'web') {
       if (window.confirm('Voulez-vous synchroniser avec le serveur et clôturer ce lot ?')) {
          processBatch();
       }
       return;
    }
    Alert.alert('Clôturer le lot', 'Voulez-vous synchroniser et vider la grille ?', [
       {text: 'Annuler', style: 'cancel'},
       {text: 'Synchroniser', style: 'destructive', onPress: processBatch}
    ]);
  };

  // ── Compute total sold ──
  const totalSold = Object.values(logs).flat().filter(e => e?.startsWith('sale')).length;

  const reportItems = Object.entries(logs).map(([productId, productLogs]) => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    const soldCount = productLogs.filter(e => e?.startsWith('sale')).length;
    const lostCount = productLogs.filter(e => e === 'loss').length;
    if (soldCount === 0 && lostCount === 0) return null;
    return { product, soldCount, lostCount };
  }).filter(Boolean);

  const packagingTotalsList = Object.values(
    Object.values(logs).flat().reduce((acc, log) => {
      if (log?.startsWith('sale:')) {
        const pkgId = log.split(':')[1];
        if (!acc[pkgId]) {
          const pkg = products.flatMap(p => p.packagings).find(p => p.id === pkgId);
          acc[pkgId] = { count: 0, name: pkg?.name || 'Inconnu', icon: pkg?.icon || '📦' };
        }
        acc[pkgId].count += 1;
      }
      return acc;
    }, {} as Record<string, {count: number, name: string, icon: string}>)
  );

  const totalSoldSession = reportItems.reduce((acc, item) => acc + (item?.soldCount || 0), 0);
  const totalLostSession = reportItems.reduce((acc, item) => acc + (item?.lostCount || 0), 0);
  const grandTotal = reportItems.reduce((acc, item) => acc + ((item?.soldCount || 0) * (item?.product.price || 0)), 0);

  // ── Category list ──
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  // ── Filtered products ──
  const filtered = activeCategory === 'ALL' ? products : products.filter(p => p.category === activeCategory);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'sale' && styles.modeBtnActive]}
            onPress={() => setMode('sale')}
          >
            <RNText style={[styles.modeBtnText, mode === 'sale' && styles.modeBtnTextActive]}>VENTE</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'loss' && styles.modeBtnLoss]}
            onPress={() => setMode('loss')}
          >
            <RNText style={[styles.modeBtnText, mode === 'loss' && styles.modeBtnTextActive]}>PERTE</RNText>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', gap: 10 }}>
          <TouchableOpacity style={styles.counterBox} onPress={() => setReportOpen(true)}>
            <RNText style={styles.counterLabel}>Vendus</RNText>
            <RNText style={styles.counterValue}>{totalSold}</RNText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenHistory} style={styles.headerIconButton}>
            <FontAwesome name="history" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.headerIconButton}>
            <FontAwesome name="cog" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLock} style={[styles.headerIconButton, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <FontAwesome name="lock" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Categories bar ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesBar}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <RNText style={[styles.catBtnText, activeCategory === cat && styles.catBtnTextActive]}>{cat}</RNText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Product list ── */}
      <ScrollView
        style={styles.productList}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); syncProducts(); }} tintColor={Colors.primary} />}
      >
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <RNText style={styles.emptyText}>Aucun produit. Tirez pour actualiser.</RNText>
          </View>
        )}
        {filtered.map(product => {
          const productLogs = logs[product.id] || [];
          const soldCount = productLogs.filter(e => e?.startsWith('sale')).length;
          const lostCount = productLogs.filter(e => e === 'loss').length;

          // Build a padded slot array of exactly SLOT_COUNT
          const displaySlots = [...productLogs, ...Array(SLOT_COUNT - (productLogs.length % SLOT_COUNT || SLOT_COUNT)).fill(null)].slice(
            Math.floor(productLogs.length / SLOT_COUNT) * SLOT_COUNT
          );

          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => handleAdd(product.id)}
              onLongPress={() => {
                Vibration.vibrate(30);
                Alert.alert(
                  `Annuler pour ${product.name}?`,
                  'Supprimer la dernière entrée.',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: () => handleUndo(product.id) },
                  ]
                );
              }}
              activeOpacity={0.9}
            >
              {/* Product header */}
              <View style={styles.productMeta}>
                <RNText style={styles.productName}>{product.icon} {product.name}</RNText>
                <View style={styles.counters}>
                  <View style={styles.badgeSale}><RNText style={styles.badgeText}>{soldCount}</RNText></View>
                  <View style={styles.badgeLoss}><RNText style={styles.badgeText}>{lostCount}</RNText></View>
                </View>
              </View>

              {/* Packaging buttons (only in sale mode, only if product has packagings) */}
              {mode === 'sale' && product.takeaway && product.packagings.length > 0 && (
                <View style={styles.packagingBar}>
                  {product.packagings.map(pkg => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={styles.pkgBtn}
                      onPress={(e) => { handleAdd(product.id, pkg.id); }}
                    >
                      <RNText style={styles.pkgIcon}>{pkg.icon}</RNText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Slot grid */}
              <View style={styles.slotsGrid}>
                {displaySlots.map((slot, i) => {
                  if (!slot) return <View key={i} style={styles.slotEmpty} />;
                  const isLoss = slot === 'loss';
                  const hasPkg = slot.includes(':');
                  const pkgId = hasPkg ? slot.split(':')[1] : null;
                  const pkg = pkgId ? product.packagings.find(p => p.id === pkgId) : null;
                  return (
                    <View key={i} style={[styles.slot, isLoss ? styles.slotLoss : styles.slotSale]}>
                      {pkg && <RNText style={styles.slotIcon}>{pkg.icon}</RNText>}
                      {!pkg && !isLoss && <FontAwesome name="times" size={16} color={Colors.primary} />}
                      {isLoss && <FontAwesome name="times" size={16} color={Colors.danger} />}
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Report Modal ── */}
      <Modal visible={reportOpen} animationType="slide" transparent>
        <RNView style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setReportOpen(false)} />
          <RNView style={styles.modalSheet}>
            <RNView style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>📊 Rapport de Session</RNText>
              <TouchableOpacity onPress={() => setReportOpen(false)}>
                <FontAwesome name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </RNView>

            <ScrollView style={styles.reportItems}>
              <RNView style={styles.summaryBox}>
                 <RNText style={styles.summaryLabel}>CHIFFRE DE LA SESSION</RNText>
                 <RNText style={styles.summaryTotal}>{grandTotal.toFixed(3)} DT</RNText>
                 <RNView style={styles.summaryRow}>
                    <RNView style={{ alignItems: 'center' }}>
                       <RNText style={styles.summarySubLabel}>VENDUS</RNText>
                       <RNText style={styles.summarySubValSale}>{totalSoldSession}</RNText>
                    </RNView>
                    <RNView style={{ alignItems: 'center' }}>
                       <RNText style={styles.summarySubLabel}>PERTES</RNText>
                       <RNText style={styles.summarySubValLoss}>{totalLostSession}</RNText>
                    </RNView>
                 </RNView>
              </RNView>

              {reportItems.length === 0 && (
                <RNText style={styles.emptyReportText}>La grille est vide</RNText>
              )}

              {reportItems.map(item => item && (
                <RNView key={item.product.id} style={styles.reportRow}>
                  <RNText style={styles.reportRowName}>{item.product.icon} {item.product.name}</RNText>
                  <RNView style={styles.reportRowBadges}>
                    {item.soldCount > 0 && <RNView style={styles.badgeSale}><RNText style={styles.badgeText}>{item.soldCount}</RNText></RNView>}
                    {item.lostCount > 0 && <RNView style={styles.badgeLoss}><RNText style={styles.badgeText}>{item.lostCount}</RNText></RNView>}
                  </RNView>
                </RNView>
              ))}

              {packagingTotalsList.length > 0 && (
                <RNView style={{ marginTop: 25, marginBottom: 5 }}>
                  <RNText style={[styles.summaryLabel, { marginHorizontal: 20 }]}>CONSOMMATION EMBALLAGES</RNText>
                </RNView>
              )}
              {packagingTotalsList.map(pkg => (
                <RNView key={pkg.name} style={styles.reportRow}>
                  <RNText style={styles.reportRowName}>{pkg.icon} {pkg.name}</RNText>
                  <RNView style={[styles.badgeSale, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <RNText style={[styles.badgeText, { color: '#ffffff' }]}>{pkg.count}</RNText>
                  </RNView>
                </RNView>
              ))}
            </ScrollView>

            <RNView style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBatchBtn} onPress={handleClearBatch}>
                <RNText style={styles.clearBatchText}>SYNCHRONISER & CLÔTURER</RNText>
              </TouchableOpacity>
            </RNView>
          </RNView>
        </RNView>
      </Modal>

      {/* ──────────────────────────────────────────────── */}
      {/* History Modal */}
      {/* ──────────────────────────────────────────────── */}
      <Modal visible={historyOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setHistoryOpen(false)} />
          <View style={[styles.modalSheet, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FontAwesome name="history" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Statistiques de Vente</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryOpen(false)}>
                <FontAwesome name="times-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>AUJOURD'HUI</Text>
                  <Text style={styles.statValue}>{stats.today.toFixed(3)} DT</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: 'rgba(99,102,241,0.08)' }]}>
                  <Text style={styles.statLabel}>CETTE SEMAINE</Text>
                  <Text style={styles.statValue}>{stats.week.toFixed(3)} DT</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>CE MOIS</Text>
                  <Text style={styles.statValue}>{stats.month.toFixed(3)} DT</Text>
                </View>
              </View>

              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#94a3b8', marginBottom: 15, letterSpacing: 1 }}>TICKETS RÉCENTEMENT SYNCHRONISÉS</Text>
                {serverHistory.slice(0, 30).map((s) => (
                  <View key={s.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyRef, s.isVoid && { textDecorationLine: 'line-through', color: '#94a3b8' }]}>
                        #{s.fiscalNumber || s.id.slice(-6).toUpperCase()}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(s.createdAt).toLocaleDateString('fr-FR')} {new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.historyAmount, s.isVoid && { color: '#ef4444' }]}>
                        {s.isVoid ? 'ANNULÉ' : `${Number(s.total).toFixed(3)} DT`}
                      </Text>
                      <View style={styles.syncBadge}>
                        <FontAwesome name="check-circle" size={10} color="#10B981" />
                        <Text style={styles.syncBadgeText}>Serveur</Text>
                      </View>
                    </View>
                  </View>
                ))}
                {serverHistory.length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <FontAwesome name="cloud" size={40} color="rgba(255,255,255,0.05)" />
                    <Text style={{ color: '#64748b', marginTop: 10 }}>Aucune donnée serveur.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ──────────────────────────────────────────────── */}
      {/* Settings Modal */}
      {/* ──────────────────────────────────────────────── */}
      <Modal visible={settingsOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSettingsOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FontAwesome name="cog" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Paramètres</Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsOpen(false)}>
                <FontAwesome name="times-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {/* Sound Toggle */}
              <TouchableOpacity style={styles.settingRow} onPress={toggleSound}>
                <View style={{ backgroundColor: 'transparent' }}>
                  <Text style={styles.settingLabel}>Retour Audio & Tactile</Text>
                  <Text style={styles.settingSub}>Bruitages lors de la saisie</Text>
                </View>
                <FontAwesome 
                  name={soundEnabled ? "toggle-on" : "toggle-off"} 
                  size={32} 
                  color={soundEnabled ? Colors.primary : "#475569"} 
                />
              </TouchableOpacity>

              {soundEnabled && (
                <View style={{ marginTop: 15, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(SOUND_PROFILES).map(([key, profile]) => (
                    <TouchableOpacity 
                      key={key}
                      onPress={async () => {
                        setSoundProfile(key as any);
                        await AsyncStorage.setItem('rachma_sound_profile', key);
                        // Play preview
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.soundOption, 
                        soundProfile === key && styles.soundOptionActive
                      ]}
                    >
                      <Text style={[
                        styles.soundOptionText,
                        soundProfile === key && styles.soundOptionTextActive
                      ]}>
                        {profile.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 }} />

              {/* User Info */}
              <Text style={styles.sectionTitle}>MON PROFIL</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom d'affichage</Text>
                <TextInput
                  style={styles.settingsInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Ex: Barista Central"
                  placeholderTextColor="#475569"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code PIN (4 chiffres)</Text>
                <TextInput
                  style={styles.settingsInput}
                  value={editPin}
                  onChangeText={setEditPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholder="****"
                  placeholderTextColor="#475569"
                />
              </View>

              <TouchableOpacity style={styles.saveProfileBtn} onPress={handleUpdateProfile}>
                <Text style={styles.saveProfileText}>ENREGISTRER</Text>
              </TouchableOpacity>

              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
  },
  modeToggle: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 25, overflow: 'hidden', padding: 3,
  },
  modeBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22 },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnLoss: { backgroundColor: Colors.danger },
  modeBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 13 },
  modeBtnTextActive: { color: '#ffffff' },
  counterBox: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
  },
  counterLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  counterValue: { color: '#ffffff', fontSize: 22, fontWeight: '900', lineHeight: 26 },
  lockBtn: { padding: 5 },
  headerIconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  // Categories
  categoriesBar: {
    flexGrow: 0, paddingHorizontal: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
  },
  catBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
  catBtnTextActive: { color: '#ffffff' },

  // Product list
  productList: { flex: 1, paddingTop: 8 },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: 'transparent' },
  emptyText: { color: '#94a3b8', fontSize: 14 },

  // Product card
  productCard: {
    marginHorizontal: 12, marginBottom: 10, borderRadius: 20,
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14, overflow: 'hidden',
  },
  productMeta: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10, backgroundColor: 'transparent',
  },
  productName: { color: '#ffffff', fontWeight: '800', fontSize: 15, flex: 1 },
  counters: { flexDirection: 'row', gap: 6, backgroundColor: 'transparent' },
  badgeSale: {
    backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 10,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  badgeLoss: {
    backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 10,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },

  // Packaging bar
  packagingBar: {
    flexDirection: 'row', gap: 8, marginBottom: 10,
    backgroundColor: 'transparent',
  },
  pkgBtn: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  pkgIcon: { fontSize: 20 },

  // Slots grid (10 columns)
  slotsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    backgroundColor: 'transparent',
  },
  slotEmpty: {
    width: '8.5%', aspectRatio: 1, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  slot: {
    width: '8.5%', aspectRatio: 1, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  slotSale: { backgroundColor: 'rgba(16,185,129,0.05)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  slotLoss: { backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  slotCheck: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  slotIcon: { fontSize: 18 },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: '#0a0f1e', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '90%', paddingBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  reportItems: { maxHeight: 400 },
  summaryBox: {
    margin: 20, padding: 20, borderRadius: 20,
    backgroundColor: 'rgba(16, 20, 35, 0.9)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  summaryLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  summaryTotal: { color: Colors.primary, fontSize: 36, fontWeight: '900', marginVertical: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  summarySubLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  summarySubValSale: { color: Colors.primary, fontSize: 20, fontWeight: '900' },
  summarySubValLoss: { color: Colors.danger, fontSize: 20, fontWeight: '900' },
  reportRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  reportRowName: { color: '#ffffff', fontWeight: '700', fontSize: 15, flex: 1 },
  reportRowBadges: { flexDirection: 'row', gap: 6 },
  emptyReportText: { color: '#94a3b8', textAlign: 'center', padding: 30 },
  modalActions: { padding: 20 },
  clearBatchBtn: {
    height: 56, borderRadius: 16, backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  clearBatchText: { color: Colors.primary, fontWeight: '800', fontSize: 16, letterSpacing: 1 },

  // Stats & History Styles
  statsGrid: { padding: 15, backgroundColor: 'transparent' },
  statCard: { 
    padding: 24, borderRadius: 24, 
    backgroundColor: 'rgba(99,102,241,0.04)', 
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.1)',
    marginBottom: 12,
  },
  statLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  statValue: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  historyRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  historyRef: { color: Colors.primary, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  historyDate: { color: '#64748b', fontSize: 12, marginTop: 4 },
  historyAmount: { color: '#ffffff', fontWeight: '900', fontSize: 16 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  syncBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800' },

  // Settings Styles
  settingRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, backgroundColor: 'transparent'
  },
  settingLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  settingSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 20 },
  inputGroup: { marginBottom: 20, backgroundColor: 'transparent' },
  inputLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  settingsInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 16, color: '#ffffff',
    fontSize: 16, fontWeight: '600',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  saveProfileBtn: {
    backgroundColor: Colors.primary,
    height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 10,
  },
  saveProfileText: { color: '#ffffff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },

  // Sounds
  soundOption: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  soundOptionActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: Colors.primary,
  },
  soundOptionText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  soundOptionTextActive: { color: Colors.primary },
});
