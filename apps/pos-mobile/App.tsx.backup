import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, Alert, TextInput, Modal } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { usePOSStore, POSProvider } from './src/store/posStore';
import { ProductButton } from './src/components/ProductButton';
import { ProductsScreen, CategoriesScreen, StockManagementScreen, SuppliersScreen, OrdersScreen, NotificationsScreen } from './src/screens/ManagementScreens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── LOGIN VIEW ────────────────────────────────────────────
function LoginView() {
  const { authenticate, activateTerminal } = usePOSStore();
  const [storeIdInput, setStoreIdInput] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!storeIdInput.trim() || !activationCode.trim()) {
      Alert.alert("Champs requis", "Veuillez entrer l'ID Boutique ET le Code d'Activation à 6 chiffres.");
      return;
    }
    
    setIsLoading(true);
    const success = await activateTerminal(activationCode.trim(), storeIdInput.trim());
    setIsLoading(false);

    if (!success) {
      Alert.alert("Échec", "ID Boutique ou Code d'Activation invalide.");
    }
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission", "L'accès à la caméra est nécessaire pour scanner le code QR.");
        return;
      }
    }
    setShowScanner(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    try {
      const payload = JSON.parse(data);
      if (payload.type === 'coffeeshop-pair' && payload.storeId) {
        // If QR contains both (future proofing)
        if (payload.code) {
           activateTerminal(payload.code, payload.storeId);
        } else {
           setStoreIdInput(payload.storeId);
           Alert.alert("Scanner", "ID Boutique récupéré. Veuillez maintenant saisir le code d'activation à 6 chiffres.");
        }
      } else {
        Alert.alert("Code invalide", "Ce code QR n'est pas reconnu par CoffeeShop.");
      }
    } catch (e) {
       if (data.length > 5) {
         setStoreIdInput(data.trim());
       }
    }
  };

  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        <View style={styles.overlay}>
          <Text style={styles.scannerText}>Scannez le code sur votre terminal</Text>
          <View style={styles.scannerFrame} />
          <TouchableOpacity 
            style={styles.closeScanner} 
            onPress={() => setShowScanner(false)}
          >
            <Text style={{ color: '#FFF', fontWeight: '800' }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginBox}>
        <Text style={styles.logoEmoji}>☕</Text>
        <Text style={styles.loginTitle}>Activation Caisse</Text>
        <Text style={styles.loginSub}>Saisissez les informations de jumelage affichées sur votre Dashboard.</Text>
        
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>PAIRING</Text>
          <View style={styles.line} />
        </View>
        
        <Text style={styles.label}>ID DE LA BOUTIQUE</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: store-lac2"
          placeholderTextColor="#94A3B8"
          value={storeIdInput}
          onChangeText={setStoreIdInput}
          autoCapitalize="none"
        />

        <Text style={styles.label}>CODE D'ACTIVATION (6 CHIFFRES)</Text>
        <TextInput
          style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontSize: 24, fontWeight: '900' }]}
          placeholder="000000"
          placeholderTextColor="#E2E8F0"
          value={activationCode}
          onChangeText={setActivationCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        
        <TouchableOpacity 
          style={[styles.loginBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginBtnText}>{isLoading ? "Activation..." : "ACTIVER CAISSE"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.qrBtnSmall} onPress={startScan}>
          <Text style={styles.qrBtnTextSmall}>📷 Scanner l'ID Boutique</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 20, opacity: 0.3 }}>
          <Text style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center' }}>
            SERVER: {process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── PIN LOGIN VIEW ────────────────────────────────────────
function PinLoginView() {
  const { loginWithPin, storeId, logout } = usePOSStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePress = async (num: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    
    if (newPin.length === 4) {
      const success = await loginWithPin(newPin);
      if (!success) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1000);
      }
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginBox}>
        <Text style={styles.loginTitle}>Session Barista</Text>
        <Text style={styles.loginSub}>Boutique: {storeId}</Text>
        
        <View style={styles.pinDisplay}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled, error && { backgroundColor: '#EF4444' }]} />
          ))}
        </View>

        <View style={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
            <TouchableOpacity 
              key={key} 
              style={styles.key} 
              onPress={() => {
                if (key === 'C') setPin('');
                else if (key === '⌫') setPin(pin.slice(0, -1));
                else handlePress(key);
              }}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={{ marginTop: 20 }} onPress={logout}>
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>Désactiver cet appareil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── POS HEADER COMPONENT ──────────────────────────────────
function POSHeader({ title, sub }: { title?: string; sub?: string }) {
  const { currentBarista, storeName, logoutBarista } = usePOSStore();
  const [time, setTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoIcon}>
          <Text style={{ fontSize: 22 }}>☕</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>{storeName || 'CoffeeShop'}</Text>
          <Text style={styles.headerSub}>
            {currentBarista?.name || 'Session'} • {today}
          </Text>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity 
          onPress={logoutBarista}
          style={{ 
            marginRight: 16, 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#FCA5A5', 
            backgroundColor: '#FEF2F2' 
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#B91C1C' }}>CHANGER BARISTA</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -1 }}>{time}</Text>
          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>Connecté</Text>
        </View>
      </View>
    </View>
  );
}

// ─── TABLES SCREEN (Mode Table) ───────────────────────────
function TablesScreen({ onSelectTable }: { onSelectTable: (id: string) => void }) {
  const { tables, getTableTotal, currentBarista, userRole, storeTables } = usePOSStore();
  
  const isOwner = userRole === 'owner';
  const assigned = currentBarista?.assignedTables || [];
  
  // Logic: Use real tables from store if available, otherwise fallback to representative T1..T48
  const baseTables = storeTables.length > 0 ? storeTables.map(t => t.label) : Array.from({ length: 48 }, (_, i) => `T${i + 1}`);
  const tableIds = isOwner ? baseTables : baseTables.filter(id => assigned.includes(id));

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <POSHeader />
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#4F46E5' }}>PLAN DE SALLE</Text>
        <Text style={{ fontSize: 12, color: '#64748B' }}>{tableIds.length} tables disponibles dans votre zone</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {tableIds.length === 0 ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🛋️</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
              Aucune table affectée
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
              Demandez à votre gérant de vous affecter une zone de service.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '2.5%' }}>
            {tableIds.map(id => {
              const total = getTableTotal(id);
              const isOccupied = total > 0;
              return (
                <TouchableOpacity 
                  key={id} 
                  style={[
                    posStyles.tableCard, 
                    isOccupied && { backgroundColor: '#4F46E5', borderColor: '#4F46E5', shadowColor: '#4F46E5', shadowOpacity: 0.3 }
                  ]} 
                  onPress={() => onSelectTable(id)}
                >
                  <Text style={[posStyles.tableNumber, isOccupied && { color: '#FFF' }]}>{id}</Text>
                  {isOccupied ? (
                    <Text style={[posStyles.tableTotal, { fontSize: 11 }]}>{total.toFixed(3)} DT</Text>
                  ) : (
                    <Text style={posStyles.tableStatus}>Libre</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── POS SCREEN (Caisse) ──────────────────────────────────
function CaisseScreen({ onBackToTables }: { onBackToTables?: () => void }) {
  const { 
    products, pendingSales, currentBarista, storeId, activeTable, setActiveTable,
    logoutBarista, checkout, checkoutTable, syncSales, getTotalItems, getTotalPrice 
  } = usePOSStore();
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const unsyncedCount = pendingSales.filter(s => s.status === 'pending').length;
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Navigation stack for hierarchy
  const [navStack, setNavStack] = useState<string[]>([]);

  // Build hierarchy on the fly
  const buildHierarchy = () => {
    const root: any = { sub: {}, products: [] };
    products.forEach(p => {
      const parts = (p.categoryName || 'Autres').split(' > ').map(s => s.trim());
      let current = root;
      parts.forEach(part => {
        if (!current.sub[part]) current.sub[part] = { sub: {}, products: [] };
        current = current.sub[part];
      });
      current.products.push(p);
    });
    return root;
  };

  const hierarchy = buildHierarchy();
  let currentLevel = hierarchy;
  navStack.forEach(step => {
    if (currentLevel.sub[step]) currentLevel = currentLevel.sub[step];
  });

  const subItems = Object.keys(currentLevel.sub).sort();
  const levelProducts = currentLevel.products.sort((a: any, b: any) => a.name.localeCompare(b.name));

  const handleBack = () => {
    const next = [...navStack];
    next.pop();
    setNavStack(next);
  };

  const handleCheckout = () => {
    if (totalItems === 0) return;
    const msg = `Valider le paiement de ${totalPrice.toFixed(3)} DT ?${activeTable ? ` (Table ${activeTable})` : ''}`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        if (activeTable) {
          checkoutTable(activeTable);
          onBackToTables?.();
        } else {
          checkout();
        }
        syncSales();
      }
    } else {
      Alert.alert("Valider Paiement", msg, [
        { text: "Annuler", style: "cancel" },
        { text: "Valider", onPress: () => {
          if (activeTable) {
            checkoutTable(activeTable);
            onBackToTables?.();
          } else {
            checkout();
          }
          syncSales();
        }}
      ]);
    }
  };

  const handleSync = async () => {
    if (unsyncedCount === 0 || isSyncing) return;
    setIsSyncing(true);
    await syncSales();
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <POSHeader />
      
      {/* Table Context Overlay */}
      {activeTable && (
        <View style={{ backgroundColor: '#4F46E5', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>🪑 TABLE {activeTable}</Text>
            <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 }} />
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>COMMANDE EN COURS</Text>
          </View>
          <TouchableOpacity onPress={onBackToTables} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>RETOUR AUX TABLES</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Breadcrumbs & Sync */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity onPress={() => setNavStack([])}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748B' }}>POS</Text>
            </TouchableOpacity>
            {navStack.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#CBD5E1', marginHorizontal: 6 }}>›</Text>
                <TouchableOpacity onPress={() => setNavStack(navStack.slice(0, i + 1))}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#4F46E5' }}>{step}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity 
          style={{ 
            backgroundColor: unsyncedCount > 0 ? '#4F46E5' : '#F1F5F9', 
            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginLeft: 12
          }} 
          onPress={handleSync}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', color: unsyncedCount > 0 ? '#FFF' : '#94A3B8' }}>
            {unsyncedCount > 0 ? `SYNC (${unsyncedCount})` : 'A JOUR'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Menu Grid */}
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {navStack.length > 0 && (
          <TouchableOpacity 
            onPress={handleBack} 
            style={{ marginBottom: 12, padding: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>⬅️</Text>
            <Text style={{ fontWeight: '800', color: '#1E293B' }}>Retour</Text>
          </TouchableOpacity>
        )}

        {subItems.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {subItems.map(name => (
              <TouchableOpacity 
                key={name} 
                style={posStyles.categoryCard} 
                onPress={() => setNavStack([...navStack, name])}
              >
                <Text style={posStyles.categoryEmoji}>📂</Text>
                <Text style={posStyles.categoryText}>{name}</Text>
                <Text style={posStyles.categoryCount}>
                  {Object.keys(currentLevel.sub[name].sub).length || currentLevel.sub[name].products.length} réf.
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {levelProducts.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {levelProducts.map((p: any) => <ProductButton key={p.id} product={p} />)}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Order Items Modal */}
      <OrderItemsModal 
        visible={showOrderModal} 
        onClose={() => setShowOrderModal(false)}
        activeTable={activeTable}
      />

      {/* Checkout Footer */}
      <View style={posStyles.checkoutFooter}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#F1F5F9', 
              paddingHorizontal: 12, 
              paddingVertical: 8, 
              borderRadius: 12,
              marginBottom: 4,
              alignSelf: 'flex-start'
            }}
            onPress={() => setShowOrderModal(true)}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#64748B' }}>VOIR COMMANDE ({totalItems})</Text>
          </TouchableOpacity>
          <Text style={posStyles.totalPrice}>{totalPrice.toFixed(3)} DT</Text>
        </View>
        <TouchableOpacity style={posStyles.payBtn} onPress={handleCheckout}>
          <Text style={posStyles.payBtnText}>ENCAISSER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── ORDER ITEMS MODAL ─────────────────────────────────────
function OrderItemsModal({ visible, onClose, activeTable }: { visible: boolean; onClose: () => void; activeTable: string | null }) {
  const { cart, tables, products, removeFromCart, clearCart, getTableTotal, getTotalPrice } = usePOSStore();
  const [discount, setDiscount] = useState(0); // percentage

  const currentCart = activeTable ? (tables[activeTable] || {}) : cart;
  const items = Object.entries(currentCart).map(([id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return { ...p, id, qty };
  });

  const rawTotal = activeTable ? getTableTotal(activeTable) : getTotalPrice();
  const discountedTotal = rawTotal * (1 - discount / 100);

  if (!visible) return null;

  const handlePrint = () => {
    Alert.alert("Impression", "Le ticket a été envoyé à l'imprimante Bluetooth.");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>Résumé Commande</Text>
              <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '800' }}>
                {activeTable ? `TABLE ${activeTable}` : 'MODE DIRECT'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#64748B' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {items.length === 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 40, color: '#94A3B8', fontWeight: '800' }}>Aucun article sélectionné</Text>
            ) : (
              items.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>{Number(item.price).toFixed(3)} DT/unité</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#4F46E5', marginRight: 12 }}>x{item.qty}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ padding: 6, backgroundColor: '#FEF2F2', borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, color: '#EF4444' }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            {items.length > 0 && (
              <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 12, textTransform: 'uppercase' }}>Réductions (%)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[0, 5, 10, 15, 20].map(pct => (
                    <TouchableOpacity 
                      key={pct} 
                      onPress={() => setDiscount(pct)}
                      style={{ 
                        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                        backgroundColor: discount === pct ? '#4F46E5' : '#FFF',
                        borderWidth: 1, borderColor: discount === pct ? '#4F46E5' : '#E2E8F0'
                      }}
                    >
                      <Text style={{ fontWeight: '900', color: discount === pct ? '#FFF' : '#64748B', fontSize: 12 }}>{pct}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={{ paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
            {discount > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#64748B', fontWeight: '700' }}>Remise ({discount}%)</Text>
                <Text style={{ color: '#EF4444', fontWeight: '800' }}>-{(rawTotal * discount / 100).toFixed(3)} DT</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>TOTAL</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#4F46E5' }}>{discountedTotal.toFixed(3)} DT</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                onPress={handlePrint}
                style={{ flex: 1, height: 56, backgroundColor: '#F1F5F9', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '900', color: '#4F46E5' }}>🎫 TICKET</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onClose}
                style={{ flex: 2, height: 56, backgroundColor: '#4F46E5', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '900', color: '#FFF' }}>VALIDER & FERMER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}





import { Svg, Defs, Pattern, Rect, Path } from 'react-native-svg';

// ─── CATEGORY COLOR PALETTE (Dynamic, no schema change needed) ───────
const CATEGORY_PALETTE: Record<string, string> = {
  'cafés':    '#6F4E37',
  'café':     '#6F4E37',
  'cafes':    '#6F4E37',
  'jus':      '#F97316',
  'boissons': '#0EA5E9',
  'gâteaux':  '#EC4899',
  'gateaux':  '#EC4899',
  'pizzas':   '#EF4444',
  'pizza':    '#EF4444',
  'chicha':   '#9333EA',
  'jeux':     '#F59E0B',
  'autres':   '#64748B',
};

const FALLBACK_COLORS = [
  '#4F46E5', '#0891B2', '#059669', '#7C3AED',
  '#DB2777', '#D97706', '#DC2626', '#15803D'
];

function getCategoryColor(categoryName?: string | null): string {
  if (!categoryName) return FALLBACK_COLORS[0];
  const key = categoryName.toLowerCase().trim();
  if (CATEGORY_PALETTE[key]) return CATEGORY_PALETTE[key];
  // Hash-based fallback for unknown categories
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

// ─── RACHMA GRID BACKGROUND (Represents the hand-drawn idea) ────────
function RachmaGridBackground() {
  const size = 30; // size of the squares
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="grid" width={size} height={size} patternUnits="userSpaceOnUse">
            <Path 
              d={`M ${size} 0 L 0 0 0 ${size}`} 
              fill="none" 
              stroke="#CBD5E0" 
              strokeWidth="1" 
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
}

// ─── RACHMA SCREEN (Simplified Mode) ───────────────────────
function RachmaScreen() {
  const { products, rachmaCart, addToRachma, removeFromRachma, clearRachma, checkoutRachma, getRachmaTotal, syncSales, pendingSales } = usePOSStore();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{ visible: boolean; type: 'clear' | 'checkout' | 'prepare' }>({ visible: false, type: 'clear' });

  const unpaidSales = pendingSales.filter(s => s.paymentStatus === 'UNPAID');

  const categories = Array.from(new Set(products.map(p => p.categoryName || 'Autres'))).sort();
  
  useEffect(() => {
    if (!selectedCat && categories.length > 0) {
      setSelectedCat(categories[0]);
    }
  }, [categories]);

  const filteredProducts = products.filter(p => (p.categoryName || 'Autres') === selectedCat);
  const total = getRachmaTotal();

  const handleFinish = () => {
    if (total === 0) return;
    setConfirmData({ visible: true, type: 'checkout' });
  };

  const handlePrepare = () => {
    if (total === 0) return;
    setConfirmData({ visible: true, type: 'prepare' });
  };

  const handleClearRequest = () => {
    if (total === 0) return;
    setConfirmData({ visible: true, type: 'clear' });
  };

  const onConfirmAction = () => {
    if (confirmData.type === 'checkout') {
      checkoutRachma('PAID');
      syncSales();
    } else if (confirmData.type === 'prepare') {
      checkoutRachma('UNPAID');
      syncSales();
    } else {
      clearRachma();
    }
    setConfirmData({ ...confirmData, visible: false });
  };

  const cartDetails = Object.entries(rachmaCart).map(([id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return { name: p?.name || 'Inconnu', qty, price: p?.price || 0 };
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <RachmaGridBackground />
      <POSHeader />
      
      {/* Categories Bar directly visible without scrolling */}
      <View style={{ backgroundColor: '#1E293B', paddingVertical: 14, paddingHorizontal: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {categories.map(cat => {
            // "Boissons > Jus" -> "JUS"
            const displayCat = cat.split('>').pop()?.trim().toUpperCase() || cat.toUpperCase();
            return (
              <TouchableOpacity 
                key={cat}
                onPress={() => setSelectedCat(cat)}
                style={{ 
                  paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, 
                  backgroundColor: selectedCat === cat ? '#4F46E5' : 'rgba(255,255,255,0.15)',
                  minWidth: 90, alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: selectedCat === cat ? '#FFF' : '#CBD5E1', letterSpacing: 0.5 }}>
                  {displayCat}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Grid Content - Tally Style (Made semi-transparent to see the Grid background) */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 4 }}>
          {filteredProducts.map(p => {
            const qty = rachmaCart[p.id] || 0;
            return (
              <TouchableOpacity 
                key={p.id}
                onLongPress={() => removeFromRachma(p.id)}
                delayLongPress={300}
                onPress={() => addToRachma(p.id)}
                activeOpacity={0.5}
                style={{ 
                  width: '33.33%', 
                  padding: 4 // margin between items
                }}
              >
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.85)', 
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: qty > 0 ? getCategoryColor(p.categoryName) : '#CBD5E1',
                  paddingVertical: 12, // Reduced from 16
                  paddingHorizontal: 6, // Reduced from 8
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: 130, // Reduced from 140 for better fit
                  elevation: 2,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
                }}>
                  <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 13, textAlign: 'center', lineHeight: 16, minHeight: 32 }} numberOfLines={2}>
                    {p.name.toUpperCase()}
                  </Text>
                
                  <View style={{ 
                    height: 48, width: 48, borderRadius: 24, // Smaller circle
                    backgroundColor: qty > 0 ? getCategoryColor(p.categoryName) : '#F1F5F9',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 3, borderColor: qty > 0 ? getCategoryColor(p.categoryName) : '#E2E8F0',
                    marginVertical: 4
                  }}>
                    <Text style={{ color: qty > 0 ? '#FFF' : '#64748B', fontSize: 22, fontWeight: '900' }}>
                      {qty}
                    </Text>
                  </View>

                  <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '800' }}>{p.price.toFixed(3)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* NEW: UNPAID ORDERS LIST (Horizontal bubble list) */}
      {unpaidSales.length > 0 && (
        <View style={{ backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#64748B', marginBottom: 4, marginLeft: 8 }}>EN ATTENTE PAIEMENT ({unpaidSales.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {unpaidSales.map(sale => (
              <TouchableOpacity
                key={sale.id}
                onPress={() => {
                  const msg = `Encaisser ${sale.totalPrice.toFixed(3)} DT ?`;
                  const handlePay = () => {
                    sale.paymentStatus = 'PAID';
                    syncSales();
                  };

                  if (Platform.OS === 'web') {
                    if (window.confirm(msg)) handlePay();
                  } else {
                    Alert.alert("Encaisser", msg, [
                      { text: "Annuler", style: "cancel" },
                      { text: "Oui, Encaissé", onPress: handlePay }
                    ]);
                  }
                }}
                style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: '#4F46E5', flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '800', color: '#4F46E5', fontSize: 12 }}>#{sale.id.substring(sale.id.length-4)} • {sale.totalPrice.toFixed(3)}</Text>
                <Text style={{ marginLeft: 8 }}>💰</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Tally Bar - FIXED FOR ANDROID SQUEEZE */}
      <View style={{ 
        backgroundColor: '#FFF', borderTopWidth: 2, borderTopColor: '#1E293B',
        padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 12,
        zIndex: 100 
      }}>
        <View style={{ flex: 1.2, marginRight: 8 }}>
          <Text style={{ color: '#64748B', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }} numberOfLines={1}>TOTAL À ENCAISSER</Text>
          <Text style={{ color: '#1E293B', fontSize: 22, fontWeight: '900' }} numberOfLines={1}>{total.toFixed(3)} <Text style={{ fontSize: 11 }}>DT</Text></Text>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 6, flex: 3, justifyContent: 'flex-end' }}>
          <TouchableOpacity 
            onPress={handleClearRequest}
            activeOpacity={0.7}
            style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center' }}
          >
            <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11 }}>VIDER</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handlePrepare}
            activeOpacity={0.9}
            style={{ backgroundColor: '#0EA5E9', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, elevation: 4, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>PRÉPARER</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleFinish}
            activeOpacity={0.9}
            style={{ backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, elevation: 4, minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>ENCAISSER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* NEW: CUSTOM CONFIRMATION MODAL (Replaces Alert.alert for Web support) */}
      <Modal visible={confirmData.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 32, width: '100%', maxWidth: 450, padding: 32, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 8 }}>
              {confirmData.type === 'checkout' ? 'Clôturer & Encaisser' : confirmData.type === 'prepare' ? 'Envoyer Préparation' : 'Voulez-vous tout vider ?'}
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
              {confirmData.type === 'checkout' 
                ? 'La vente sera enregistrée et encaissée.' 
                : confirmData.type === 'prepare'
                ? 'La commande sera envoyée au bar. Vous devrez l\'encaisser plus tard.'
                : 'Attention : toutes les saisies en cours seront effacées sans être enregistrées.'}
            </Text>

            {confirmData.type === 'checkout' && (
              <ScrollView style={{ maxHeight: 200, marginBottom: 24, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16 }}>
                {cartDetails.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontWeight: '700', color: '#334155' }}>{item.qty}x {item.name}</Text>
                    <Text style={{ color: '#64748B', fontWeight: '600' }}>{(item.qty * item.price).toFixed(3)} DT</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 24, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => setConfirmData({ ...confirmData, visible: false })}
                style={{ paddingHorizontal: 20, paddingVertical: 12 }}
              >
                <Text style={{ fontWeight: '800', color: '#94A3B8' }}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onConfirmAction}
                style={{ 
                  backgroundColor: confirmData.type === 'clear' ? '#EF4444' : '#4F46E5', 
                  paddingHorizontal: 24, paddingVertical: 12, 
                  borderRadius: 12 
                }}
              >
                <Text style={{ fontWeight: '900', color: '#FFF' }}>
                  {confirmData.type === 'checkout' ? 'ENCAISSER MAINTENANT' : confirmData.type === 'prepare' ? 'ENVOYER AU BAR' : 'OUI, VIDER'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}



import { Audio } from 'expo-av';

// ─── PREPARATEUR SCREEN (KDS Mode) ───────────────────────
function PreparateurScreen({ onBack }: { onBack: () => void }) {
  const { storeId, currentBarista, products, updatePreparationStatus, syncSales } = usePOSStore();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState<string>('bar'); // bar, kitchen, chicha
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const lastTicketCount = useRef(0);

  const fetchSales = async () => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${API_URL}/sales/${storeId}`);
      if (res.ok) {
        const data = await res.json();
        const pending = data.filter((s: any) => 
          (s.preparationStatus === 'PENDING' || s.preparationStatus === 'IN_PROGRESS' || s.preparationStatus === 'READY') &&
          (!s.preparationStation || s.preparationStation === station)
        );

        if (pending.length > lastTicketCount.current) {
          playSound();
        }
        lastTicketCount.current = pending.length;
        setSales(data);
      }
    } catch (e) {
      console.warn('Preparateur: erreur fetch', e);
    } finally {
      setLoading(false);
    }
  };

  async function playSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' } // Simple ding
      );
      setSound(sound);
      await sound.playAsync();
    } catch (e) {
      console.warn('Erreur audio:', e);
    }
  }

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, 10000); // Polling every 10s
    return () => {
      clearInterval(interval);
      if (sound) sound.unloadAsync();
    };
  }, [storeId, station]);

  const updateStatus = async (id: string, nextStatus: string) => {
    const ok = await updatePreparationStatus(id, nextStatus, station);
    if (ok) fetchSales();
  };

  const pendingSales = sales.filter(s => s.preparationStatus === 'PENDING' && (!s.preparationStation || s.preparationStation === station));
  const inProgressSales = sales.filter(s => s.preparationStatus === 'IN_PROGRESS' && s.preparationStation === station);
  const readySales = sales.filter(s => s.preparationStatus === 'READY' && s.preparationStation === station);

  const renderTicket = (sale: any) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(sale.createdAt).getTime()) / 60000);
    const isLate = elapsedMinutes >= 5;

    return (
      <View key={sale.id} style={{ 
        backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, 
        borderWidth: 2, borderColor: isLate ? '#EF4444' : '#E2E8F0',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B' }}>{sale.tableName || 'Vente Directe'}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8' }}>#{sale.id.substring(0, 6).toUpperCase()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: isLate ? '#EF4444' : '#4F46E5' }}>{elapsedMinutes} min</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B' }}>Serv. {sale.takenBy?.name || 'Inconnu'}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginBottom: 16 }}>
          {sale.items.map((item: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#334155' }}>{item.quantity}x {item.product?.name}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {sale.preparationStatus === 'PENDING' && (
            <TouchableOpacity 
              onPress={() => updateStatus(sale.id, 'IN_PROGRESS')}
              style={{ flex: 1, backgroundColor: '#4F46E5', padding: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900' }}>PRÉPARER</Text>
            </TouchableOpacity>
          )}
          {sale.preparationStatus === 'IN_PROGRESS' && (
            <TouchableOpacity 
              onPress={() => updateStatus(sale.id, 'READY')}
              style={{ flex: 1, backgroundColor: '#059669', padding: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900' }}>PRÊT ✅</Text>
            </TouchableOpacity>
          )}
          {sale.preparationStatus === 'READY' && (
            <TouchableOpacity 
              onPress={() => updateStatus(sale.id, 'SERVED')}
              style={{ flex: 1, backgroundColor: '#1E293B', padding: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900' }}>SERVI 🤝</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      {/* Station Header */}
      <View style={{ backgroundColor: '#1E293B', padding: 16, paddingTop: 60, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity 
          onPress={onBack}
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 18 }}>⬅️</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
          {['bar', 'cuisine', 'chicha'].map(s => (
            <TouchableOpacity 
              key={s} 
              onPress={() => setStation(s)}
              style={{ 
                flex: 1, padding: 12, borderRadius: 12, 
                backgroundColor: station === s ? '#4F46E5' : 'rgba(255,255,255,0.1)',
                alignItems: 'center' 
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          onPress={() => {
            syncSales();
            fetchSales();
          }}
          disabled={loading}
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1E293B' }}>Commandes {station}</Text>
          <View style={{ backgroundColor: (pendingSales.length + inProgressSales.length) > 0 ? '#EF4444' : '#64748B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>{pendingSales.length + inProgressSales.length} EN ATTENTE</Text>
          </View>
        </View>

        {loading && sales.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#94A3B8', fontWeight: '700' }}>Chargement des tickets...</Text>
        ) : (
          <>
            {[...inProgressSales, ...pendingSales, ...readySales].map(sale => renderTicket(sale))}
            {pendingSales.length === 0 && inProgressSales.length === 0 && readySales.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 100 }}>
                <Text style={{ fontSize: 60 }}>😴</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#94A3B8', marginTop: 16 }}>Rien à préparer pour le moment</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}



// ─── DASHBOARD SCREEN ──────────────────────────────────────
function DashboardScreen() {
  const { pendingSales, storeId, currentBarista, products } = usePOSStore();
  const [serverSales, setServerSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    const fetchSales = async () => {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${API_URL}/sales/${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setServerSales(data);
        }
      } catch (e) {
        console.warn('Dashboard: erreur fetch sales', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [storeId]);
  
  const [timeFilter, setTimeFilter] = useState<'day'|'month'>('day');
  
  // UNIFIED SALES LOGIC (Deduplicated by ID)
  const allSalesMap = new Map<string, any>();
  serverSales.forEach(s => allSalesMap.set(s.id, { ...s, total: Number(s.total) }));
  pendingSales.forEach(s => {
    if (!allSalesMap.has(s.id)) {
      allSalesMap.set(s.id, { 
        id: s.id, total: s.totalPrice, createdAt: new Date(s.timestamp).toISOString(), 
        items: s.items.map(i => ({ ...i, price: products.find(p => p.id === i.productId)?.price || 0 }))
      });
    }
  });

  const allSales = Array.from(allSalesMap.values());
  const todayStr = new Date().toDateString();
  const currentMonthStr = new Date().getMonth() + '-' + new Date().getFullYear();

  const todaySales = allSales.filter(s => new Date(s.createdAt).toDateString() === todayStr);
  const monthSales = allSales.filter(s => {
    const d = new Date(s.createdAt);
    return d.getMonth() + '-' + d.getFullYear() === currentMonthStr;
  });

  const displaySales = timeFilter === 'day' ? todaySales : monthSales;
  const displayRevenue = displaySales.reduce((sum, s) => sum + s.total, 0);
  const displayCount = displaySales.length;
  const avgTicket = displayCount > 0 ? displayRevenue / displayCount : 0;

  // Top produits (from unified sales)
  const productSalesCount: Record<string, { name: string; count: number; revenue: number }> = {};
  displaySales.forEach((sale: any) => {
    sale.items?.forEach((item: any) => {
      const pid = item.productId;
      const name = item.product?.name || products.find(p => p.id === pid)?.name || 'Inconnu';
      if (!productSalesCount[pid]) productSalesCount[pid] = { name, count: 0, revenue: 0 };
      productSalesCount[pid].count += item.quantity;
      productSalesCount[pid].revenue += Number(item.price || 0) * item.quantity;
    });
  });
  const topProducts = Object.values(productSalesCount).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={mgStyles.title}>Dashboard</Text>
      <Text style={mgStyles.subtitle}>Bonjour {currentBarista?.name}</Text>

      {loading ? (
        <Text style={mgStyles.emptyText}>Chargement...</Text>
      ) : (
        <>
          {/* Time Toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setTimeFilter('day')} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: timeFilter === 'day' ? '#FFF' : 'transparent', borderRadius: 8, elevation: timeFilter === 'day' ? 2 : 0 }}>
              <Text style={{ fontWeight: '800', color: timeFilter === 'day' ? '#0F172A' : '#64748B' }}>Aujourd'hui</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTimeFilter('month')} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: timeFilter === 'month' ? '#FFF' : 'transparent', borderRadius: 8, elevation: timeFilter === 'month' ? 2 : 0 }}>
              <Text style={{ fontWeight: '800', color: timeFilter === 'month' ? '#0F172A' : '#64748B' }}>Ce Mois</Text>
            </TouchableOpacity>
          </View>

          {/* KPI Cards */}
          <View style={mgStyles.cardRow}>
            <View style={[mgStyles.card, { backgroundColor: '#4F46E5' }]}>  
              <Text style={mgStyles.cardLabel}>Ventes ({timeFilter === 'day' ? 'Jour' : 'Mois'})</Text>
              <Text style={mgStyles.cardValue}>{displayCount}</Text>
            </View>
            <View style={[mgStyles.card, { backgroundColor: '#059669' }]}>
              <Text style={mgStyles.cardLabel}>Chiffre ({timeFilter === 'day' ? 'Jour' : 'Mois'})</Text>
              <Text style={mgStyles.cardValue}>{displayRevenue.toFixed(3)} DT</Text>
            </View>
          </View>

          <View style={mgStyles.cardRow}>
            <View style={[mgStyles.card, { backgroundColor: '#0891B2' }]}>
              <Text style={mgStyles.cardLabel}>Ticket moyen</Text>
              <Text style={mgStyles.cardValue}>{avgTicket.toFixed(3)} DT</Text>
            </View>
            <View style={[mgStyles.card, { backgroundColor: '#D97706' }]}>
              <Text style={mgStyles.cardLabel}>En attente sync</Text>
              <Text style={mgStyles.cardValue}>{pendingSales.filter(s => s.status === 'pending').length}</Text>
            </View>
          </View>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <>
              <Text style={[mgStyles.title, { fontSize: 20, marginTop: 24 }]}>Top produits</Text>
              {topProducts.map((p, i) => (
                <View key={i} style={mgStyles.saleRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>{i + 1}</Text>
                    </View>
                    <View>
                      <Text style={mgStyles.saleId}>{p.name}</Text>
                      <Text style={mgStyles.saleTime}>{p.count} vendus</Text>
                    </View>
                  </View>
                  <Text style={mgStyles.saleTotal}>{p.revenue.toFixed(3)} DT</Text>
                </View>
              ))}
            </>
          )}

          {/* Recent Sales */}
          <Text style={[mgStyles.title, { fontSize: 20, marginTop: 24 }]}>Dernieres ventes</Text>
          {todaySales.length === 0 ? (
            <Text style={mgStyles.emptyText}>Aucune vente aujourd'hui</Text>
          ) : (
            <>
              {todaySales.slice(0, 15).map((sale: any) => {
                const isSynced = serverSales.some((ss: any) => ss.id === sale.id);
                return (
                  <View key={sale.id} style={mgStyles.saleRow}>
                    <View>
                      <Text style={mgStyles.saleId}>#{sale.id.substring(0, 8)}</Text>
                      <Text style={mgStyles.saleTime}>
                        {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={mgStyles.saleTotal}>{Number(sale.total).toFixed(3)} DT</Text>
                      <View style={[mgStyles.statusBadge, { backgroundColor: isSynced ? '#D1FAE5' : '#FEF3C7' }]}>
                        <Text style={[mgStyles.statusText, { color: isSynced ? '#065F46' : '#92400E' }]}>{isSynced ? 'Synced' : 'Pending'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── STOCK SCREEN ──────────────────────────────────────────
function StockScreen() {
  const { storeId } = usePOSStore();
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${API_URL}/sales/management/stock/${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setStockItems(data);
        }
      } catch (e) {
        console.warn('Stock: erreur fetch', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [storeId]);

  const getStockStatus = (item: any) => {
    const qty = Number(item.quantity);
    const min = Number(item.minThreshold);
    if (qty <= 0) return { label: 'Rupture', color: '#EF4444', bg: '#FEE2E2' };
    if (qty <= min) return { label: 'Bas', color: '#D97706', bg: '#FEF3C7' };
    return { label: 'OK', color: '#059669', bg: '#D1FAE5' };
  };

  return (
    <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={mgStyles.title}>Gestion des Stocks</Text>
      <Text style={mgStyles.subtitle}>Matieres premieres et inventaire</Text>

      {loading ? (
        <Text style={mgStyles.emptyText}>Chargement...</Text>
      ) : stockItems.length === 0 ? (
        <View style={mgStyles.placeholderBox}>
          <Text style={mgStyles.placeholderText}>Aucun stock configure</Text>
          <Text style={[mgStyles.saleTime, { marginTop: 8, textAlign: 'center' }]}>
            Ajoutez des matieres premieres depuis le dashboard web
          </Text>
        </View>
      ) : (
        <>
          {/* Summary cards */}
          <View style={mgStyles.cardRow}>
            <View style={[mgStyles.card, { backgroundColor: '#4F46E5' }]}>
              <Text style={mgStyles.cardLabel}>Articles</Text>
              <Text style={mgStyles.cardValue}>{stockItems.length}</Text>
            </View>
            <View style={[mgStyles.card, { backgroundColor: '#EF4444' }]}>
              <Text style={mgStyles.cardLabel}>Alertes stock bas</Text>
              <Text style={mgStyles.cardValue}>
                {stockItems.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length}
              </Text>
            </View>
          </View>

          {/* Stock list */}
          {stockItems.map((item) => {
            const status = getStockStatus(item);
            const unitName = item.unit?.name || '';
            const supplier = item.preferredSupplier?.name || item.preferredVendor?.companyName || '-';
            const costPerUnit = Number(item.cost);
            const totalValue = Number(item.quantity) * costPerUnit;

            return (
              <View key={item.id} style={mgStyles.saleRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={mgStyles.saleId}>{item.name}</Text>
                    <View style={[mgStyles.statusBadge, { backgroundColor: status.bg, marginLeft: 8 }]}>
                      <Text style={[mgStyles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={mgStyles.saleTime}>
                    Qte: {Number(item.quantity).toFixed(2)} {unitName} | Min: {Number(item.minThreshold)} {unitName}
                  </Text>
                  <Text style={[mgStyles.saleTime, { marginTop: 2 }]}>
                    Cout: {costPerUnit.toFixed(3)} DT/{unitName} | Valeur: {totalValue.toFixed(3)} DT
                  </Text>
                  {supplier !== '-' && (
                    <Text style={[mgStyles.saleTime, { marginTop: 2, color: '#4F46E5' }]}>
                      Fournisseur: {supplier}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── STAFF SCREEN ──────────────────────────────────────────
function StaffScreen() {
  const { storeId } = usePOSStore();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${API_URL}/sales/management/staff/${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setStaffList(data);
        }
      } catch (e) {
        console.warn('Staff: erreur fetch', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [storeId]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER': return { label: 'Proprietaire', color: '#7C3AED', bg: '#EDE9FE' };
      case 'MANAGER': return { label: 'Manager', color: '#2563EB', bg: '#DBEAFE' };
      case 'CASHIER': return { label: 'Caissier', color: '#059669', bg: '#D1FAE5' };
      default: return { label: role, color: '#64748B', bg: '#F1F5F9' };
    }
  };

  return (
    <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={mgStyles.title}>Gestion du Personnel</Text>
      <Text style={mgStyles.subtitle}>Equipe et performances</Text>

      {loading ? (
        <Text style={mgStyles.emptyText}>Chargement...</Text>
      ) : staffList.length === 0 ? (
        <View style={mgStyles.placeholderBox}>
          <Text style={mgStyles.placeholderText}>Aucun membre d'equipe</Text>
        </View>
      ) : (
        <>
          {/* Summary */}
          <View style={mgStyles.cardRow}>
            <View style={[mgStyles.card, { backgroundColor: '#4F46E5' }]}>
              <Text style={mgStyles.cardLabel}>Membres</Text>
              <Text style={mgStyles.cardValue}>{staffList.length}</Text>
            </View>
            <View style={[mgStyles.card, { backgroundColor: '#059669' }]}>
              <Text style={mgStyles.cardLabel}>Total ventes equipe</Text>
              <Text style={mgStyles.cardValue}>
                {staffList.reduce((sum, s) => sum + (s._count?.paidSales || 0), 0)}
              </Text>
            </View>
          </View>

          {/* Staff list */}
          {staffList.map((member) => {
            const role = getRoleBadge(member.role);
            const totalSales = (member._count?.paidSales || 0) + (member._count?.takenSales || 0);
            
            return (
              <View key={member.id} style={mgStyles.saleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ 
                    width: 44, height: 44, borderRadius: 22, 
                    backgroundColor: '#4F46E5', justifyContent: 'center', 
                    alignItems: 'center', marginRight: 12 
                  }}>
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>
                      {member.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={mgStyles.saleId}>{member.name}</Text>
                      <View style={[mgStyles.statusBadge, { backgroundColor: role.bg, marginLeft: 8 }]}>
                        <Text style={[mgStyles.statusText, { color: role.color }]}>{role.label}</Text>
                      </View>
                    </View>
                    <Text style={mgStyles.saleTime}>
                      PIN: {member.pinCode || 'Non defini'} | Tel: {member.phone || '-'}
                    </Text>
                    <Text style={[mgStyles.saleTime, { marginTop: 2 }]}>
                      Mode: {String(member.defaultPosMode).toUpperCase()} | Encaissements: {member._count?.paidSales || 0}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── MAIN APP WITH TABS ────────────────────────────────────
type TabId = 'tables' | 'caisse' | 'dashboard' | 'products' | 'categories' | 'stock' | 'suppliers' | 'orders' | 'staff' | 'notifs' | 'rachma' | 'menu' | 'bar';

// ─── HOME MODULES MENU ─────────────────────────────────────
function MenuScreen({ onSelect }: { onSelect: (tab: TabId) => void }) {
  const menuGroups = [
    { title: 'Ventes & POS', tabs: [
      { id: 'tables', label: 'Plan Salle', icon: '🛋️', color: '#4F46E5' }, 
      { id: 'caisse', label: 'Caisse POS', icon: '🧾', color: '#0EA5E9' }, 
      { id: 'rachma', label: 'Rachma', icon: '📋', color: '#8B5CF6' },
      { id: 'bar', label: 'Bar (Prép.)', icon: '☕', color: '#F43F5E' }
    ] },
    { title: 'Catalogue & Gestion', tabs: [{ id: 'products', label: 'Carte Produits', icon: '☕', color: '#F59E0B' }, { id: 'categories', label: 'Catégories', icon: '📁', color: '#EAB308' }] },
    { title: 'Inventaire & Achats', tabs: [{ id: 'stock', label: 'Stock Matières', icon: '🫙', color: '#10B981' }, { id: 'suppliers', label: 'Fournisseurs', icon: '🛒', color: '#14B8A6' }, { id: 'orders', label: 'Commandes', icon: '🚚', color: '#06B6D4' }] },
    { title: 'Administration', tabs: [{ id: 'dashboard', label: 'Statistiques', icon: '📈', color: '#EF4444' }, { id: 'staff', label: 'Équipe', icon: '🧑‍🍳', color: '#F43F5E' }, { id: 'notifs', label: 'Alertes', icon: '🔔', color: '#F97316' }] }
  ];

  return (
    <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 20 }}>
      <Text style={mgStyles.title}>Menu Principal</Text>
      <Text style={mgStyles.subtitle}>Sélectionnez un module de gestion</Text>
      {menuGroups.map((group, i) => (
        <View key={i} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' }}>{group.title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {group.tabs.map((tab) => (
              <TouchableOpacity key={tab.id} onPress={() => onSelect(tab.id as TabId)} style={{ width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: tab.color + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 24 }}>{tab.icon}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E293B' }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function MainApp() {
  const { authToken, storeId, currentBarista, userRole, setActiveTable } = usePOSStore();
  const isOwner = userRole === 'owner';
  
  // Set initial tab from barista preference
  const initialTab: TabId = isOwner ? 'menu' : ((currentBarista?.defaultPosMode?.toLowerCase() as TabId) || 'tables');
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (!isOwner && currentBarista?.defaultPosMode) setActiveTab(currentBarista.defaultPosMode.toLowerCase() as TabId);
  }, [currentBarista?.id, isOwner]);

  if (!authToken || !storeId) return <LoginView />;
  if (!currentBarista) return <PinLoginView />;

  const handleSelectTable = (id: string) => {
    setActiveTable(id);
    setActiveTab('caisse');
  };

  const allTabs: { id: TabId; label: string; icon: string }[] = isOwner ? [
    { id: 'tables', label: 'Salle', icon: '🛋️' }, { id: 'caisse', label: 'Caisse', icon: '🧾' }, { id: 'rachma', label: 'Rachma', icon: '📋' },
    { id: 'bar', label: 'Bar', icon: '☕' },
    { id: 'dashboard', label: 'Stats', icon: '📈' }, { id: 'products', label: 'Carte', icon: '☕' }, { id: 'categories', label: 'Dossiers', icon: '📁' },
    { id: 'stock', label: 'Stock', icon: '🫙' }, { id: 'suppliers', label: 'Fournis.', icon: '🛒' }, { id: 'orders', label: 'Commandes', icon: '🚚' },
    { id: 'staff', label: 'Équipe', icon: '🧑‍🍳' }, { id: 'notifs', label: 'Alertes', icon: '🔔' }
  ] : [
    ...((currentBarista?.permissions?.includes('TABLES') || currentBarista?.defaultPosMode === 'tables') ? [{ id: 'tables', label: 'Salle', icon: '🛋️' } as const] : []),
    ...((currentBarista?.permissions?.includes('POS') || currentBarista?.defaultPosMode === 'pos' || currentBarista?.defaultPosMode === 'caisse' || currentBarista?.defaultPosMode === 'simplistic') ? [{ id: 'caisse', label: 'Caisse', icon: '🧾' } as const] : []),
    ...((currentBarista?.permissions?.includes('RACHMA') || currentBarista?.defaultPosMode === 'rachma') ? [{ id: 'rachma', label: 'Rachma', icon: '📋' } as const] : []),
    ...((currentBarista?.permissions?.includes('BAR') || currentBarista?.defaultPosMode === 'bar' || currentBarista?.defaultPosMode === 'preparateur') ? [{ id: 'bar', label: 'Bar', icon: '☕' } as const] : []),
    { id: 'dashboard', label: 'Stats', icon: '📈' } as const
  ];

  // Logic contextuelle
  const modules = {
    ventes: ['tables', 'caisse', 'rachma', 'bar', 'dashboard', 'menu'], 
    catalogue: ['products', 'categories'],
    inventaire: ['stock', 'suppliers', 'orders'],
    admin: ['dashboard', 'staff', 'notifs'] 
  };

  let finalTabs = allTabs;
  if (isOwner) {
    if (activeTab === 'menu') {
      finalTabs = []; // Hide bottom bar on menu
    } else {
      const currentMod = Object.values(modules).find(arr => arr.includes(activeTab as any)) || [];
      finalTabs = [...allTabs.filter(t => currentMod.includes(t.id)), { id: 'menu', label: 'Menu', icon: '🎛️' }];
    }
  } else {
    if (finalTabs.length === 0) finalTabs = [{ id: 'caisse', label: 'Caisse', icon: '🧾' }]; 
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'menu': return <MenuScreen onSelect={setActiveTab} />;
      case 'tables': return <TablesScreen onSelectTable={handleSelectTable} />;
      case 'bar': return <PreparateurScreen onBack={() => setActiveTab('menu')} />;
      case 'rachma': return <RachmaScreen />;
      case 'dashboard': return <DashboardScreen />;
      case 'products': return <ProductsScreen storeId={storeId} />;
      case 'categories': return <CategoriesScreen storeId={storeId} />;
      case 'stock': return <StockManagementScreen storeId={storeId} />;
      case 'suppliers': return <SuppliersScreen storeId={storeId} />;
      case 'orders': return <OrdersScreen storeId={storeId} />;
      case 'staff': return <StaffScreen />;
      case 'notifs': return <NotificationsScreen storeId={storeId} />;
      case 'caisse':
      default: return <CaisseScreen onBackToTables={() => setActiveTab('tables')} />;
    }
  };

  const showTabBar = finalTabs.length > 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Screen content */}
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {/* Tab bar */}
      {showTabBar && (
        <View 
          style={tabStyles.tabBarScroll}
        >
          <View style={tabStyles.tabBarContent}>
          {finalTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[tabStyles.tab, isActive && tabStyles.tabActive]}
                onPress={() => {
                  if (tab.id === 'caisse') setActiveTable(null); // Direct POS if clicked
                  setActiveTab(tab.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={tabStyles.tabIcon}>{tab.icon}</Text>
                <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── TAB BAR STYLES ────────────────────────────────────────
const tabStyles = StyleSheet.create({
  tabBarScroll: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    maxHeight: 70,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 70,
  },
  tabActive: {
    borderTopWidth: 3,
    borderTopColor: '#4F46E5',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#FFF',
  }
});

// ─── MANAGEMENT STYLES ─────────────────────────────────────
const mgStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
  },
  cardLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saleId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  saleTime: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  placeholderBox: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ─── POS STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  syncText: {
    marginLeft: 6,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollContent: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  summaryContainer: {
    flex: 1,
  },
  summaryText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalPriceText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  checkoutBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 20,
    minWidth: 160,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#334155',
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    padding: 32,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  loginSub: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 16,
    color: '#FFF',
    fontSize: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#4F46E5',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 15,
    marginVertical: 30,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4F46E5',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#4F46E5',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 15,
  },
  key: {
    width: 75,
    height: 75,
    backgroundColor: '#334155',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  keyText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  scannerText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 40, textAlign: 'center', paddingHorizontal: 40 },
  scannerFrame: { width: 280, height: 280, borderWidth: 2, borderColor: '#4F46E5', borderRadius: 32, backgroundColor: 'transparent' },
  closeScanner: { marginTop: 60, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  qrBtn: { width: '100%', backgroundColor: '#EEF2FF', padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 32, borderWidth: 2, borderColor: '#4F46E5', borderStyle: 'dashed' },
  qrBtnText: { color: '#4F46E5', fontSize: 16, fontWeight: '900' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 16, color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  label: { width: '100%', color: '#94A3B8', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  qrBtnSmall: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(79, 70, 229, 0.1)', borderWidth: 1, borderColor: '#4F46E5', width: '100%', alignItems: 'center' },
  qrBtnTextSmall: { color: '#4F46E5', fontSize: 13, fontWeight: '800' },
});

// ─── NEW POS HIERARCHY STYLES ───────────────────────────
const posStyles = StyleSheet.create({
  categoryCard: {
    width: (Platform.OS === 'web' || Platform.OS === 'android' ? 140 : 110),
    height: 120,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  categoryEmoji: { fontSize: 32, marginBottom: 8 },
  categoryText: { fontSize: 13, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  categoryCount: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '600' },
  
  // Table Mode Styles
  tableCard: {
    width: '23%', // 4 per row
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 1,
  },
  tableNumber: { fontSize: 18, fontWeight: '900', color: '#4F46E5' },
  tableTotal: { fontSize: 10, fontWeight: '700', color: '#FFF', marginTop: 4 },
  tableStatus: { fontSize: 9, color: '#94A3B8', marginTop: 2 },
  
  // Checkout Footer
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  totalLabelContainer: {
    flexDirection: 'column',
  },
  itemsCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  payBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 150,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});


export default function App() {
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification recue:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification click:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <POSProvider>
      <NotificationWatcher />
      <MainApp />
    </POSProvider>
  );
}

// ─── NOTIFICATION UTILS ─────────────────────────────────────

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Echec permission notifications');
      return;
    }
  }
}

function NotificationWatcher() {
  const { storeId, userRole } = usePOSStore();
  const lastCheck = useRef<number>(0);

  useEffect(() => {
    if (!storeId || userRole !== 'owner') return;

    const checkAlerts = async () => {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${API_URL}/management/notifications/${storeId}`);
        if (res.ok) {
          const alerts = await res.json();
          const criticals = alerts.filter((a: any) => a.severity === 'critical');
          
          if (criticals.length > 0) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⚠️ Alerte Stock Critique",
                body: `${criticals[0].title}: ${criticals[0].message}`,
                data: { type: 'stock_alert' },
              },
              trigger: null,
            });
          }
        }
      } catch (e) {
        // Silently fail watcher
      }
    };

    // Check every 5 minutes
    const interval = setInterval(() => {
      checkAlerts();
    }, 1000 * 60 * 5);

    checkAlerts(); // Initial check

    return () => clearInterval(interval);
  }, [storeId, userRole]);

  return null;
}

