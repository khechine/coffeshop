import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, Alert, TextInput, Modal, KeyboardAvoidingView } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { usePOSStore, POSProvider } from './src/store/posStore';
import { ConfirmProvider, useConfirm } from './src/context/ConfirmContext';
import { ProductButton } from './src/components/ProductButton';
import { ProductsScreen, CategoriesScreen, SuppliersScreen, OrdersScreen, NotificationsScreen } from './src/screens/ManagementScreens';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { AntigravityTheme } from './src/theme/AntigravityTheme';
import { FloatingCard } from './src/components/Antigravity/FloatingCard';
import { GlassPanel } from './src/components/Antigravity/GlassPanel';
import { GlassBackground } from './src/components/Antigravity/GlassBackground';
import { RachmaButton } from './src/components/Antigravity/RachmaButton';
import { StatusBar } from 'expo-status-bar';

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
  const { activateTerminal, loginWithAccount, theme, themeMode, toggleThemeMode } = usePOSStore();
  const [loginMode, setLoginMode] = useState<'terminal' | 'account'>('terminal');
  
  // Terminal state
  const [storeIdInput, setStoreIdInput] = useState('');
  const [activationCode, setActivationCode] = useState('');
  
  // Account state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const { alert } = useConfirm();
  const loginStyles = useMemo(() => createLoginStyles(theme), [theme]);
  const mainStyles = useMemo(() => createMainStyles(theme), [theme]);
  
  const handleTerminalLogin = async () => {
    if (!storeIdInput.trim() || !activationCode.trim()) {
      alert("Champs requis", "Veuillez entrer l'ID Boutique ET le Code d'Activation à 6 chiffres.");
      return;
    }
    setIsLoading(true);
    const success = await activateTerminal(activationCode.trim(), storeIdInput.trim());
    setIsLoading(false);
    if (!success) alert("Échec", "ID Boutique ou Code d'Activation invalide.");
  };

  const handleAccountLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Champs requis", "Email et mot de passe nécessaires.");
      return;
    }
    setIsLoading(true);
    const success = await loginWithAccount(email.trim(), password.trim());
    setIsLoading(false);
    if (!success) alert("Échec", "Identifiants invalides.");
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        alert("Permission", "L'accès à la caméra est nécessaire pour scanner le code QR.");
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
        if (payload.code) {
           activateTerminal(payload.code, payload.storeId);
        } else {
           setStoreIdInput(payload.storeId);
           alert("Scanner", "ID Boutique récupéré. Veuillez maintenant saisir le code d'activation à 6 chiffres.");
        }
      } else {
        alert("Code invalide", "Ce code QR n'est pas reconnu par CoffeeShop.");
      }
    } catch (e) {
       if (data.length > 5) {
         setStoreIdInput(data.trim());
       }
    }
  };

  if (showScanner) {
    return (
      <View style={mainStyles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        <View style={mainStyles.overlay}>
          <Text style={mainStyles.scannerText}>Scannez le code sur votre terminal</Text>
          <View style={mainStyles.scannerFrame} />
          <TouchableOpacity 
            style={mainStyles.closeScanner} 
            onPress={() => setShowScanner(false)}
          >
            <Text style={{ color: '#FFF', fontWeight: '800' }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableOpacity 
        onPress={toggleThemeMode}
        style={{ 
          position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 100,
          backgroundColor: 'rgba(245, 230, 211, 0.1)', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245, 230, 211, 0.2)'
        }}
      >
        <Text style={{ fontSize: 20 }}>{themeMode === 'light' ? '🌙' : '☀️'}</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
          <GlassPanel intensity={60} style={{ width: '85%', maxWidth: 400, padding: 32, borderRadius: 30, alignItems: 'center' }}>
            <Text style={{ fontSize: 60, marginBottom: 20 }}>☕</Text>
            
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4, marginBottom: 24, width: '100%' }}>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: loginMode === 'terminal' ? theme.colors.caramel : 'transparent', alignItems: 'center' }}
                onPress={() => setLoginMode('terminal')}
              >
                <Text style={{ color: loginMode === 'terminal' ? '#FFF' : theme.colors.cream, fontWeight: '800', fontSize: 13 }}>Caisse</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: loginMode === 'account' ? theme.colors.caramel : 'transparent', alignItems: 'center' }}
                onPress={() => setLoginMode('account')}
              >
                <Text style={{ color: loginMode === 'account' ? '#FFF' : theme.colors.cream, fontWeight: '800', fontSize: 13 }}>Partenaire</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.cream, marginBottom: 8 }}>
              {loginMode === 'terminal' ? 'Activation Caisse' : 'Accès Partenaire'}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.creamMuted, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
              {loginMode === 'terminal' 
                ? 'Veuillez entrer les identifiants fournis dans votre tableau de bord.' 
                : 'Connectez-vous à votre compte fournisseur ou propriétaire.'}
            </Text>

            {loginMode === 'terminal' ? (
              <>
                <View style={{ width: '100%', marginBottom: 12 }}>
                  <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 }}>ID BOUTIQUE</Text>
                  <TextInput
                    style={{ width: '100%', backgroundColor: theme.colors.background, padding: 18, borderRadius: 16, color: theme.colors.cream, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.glassBorder }}
                    placeholder="Ex: store-123"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={storeIdInput}
                    onChangeText={setStoreIdInput}
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ width: '100%', marginBottom: 12 }}>
                  <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 }}>CODE D'ACTIVATION</Text>
                  <TextInput
                    style={{ width: '100%', backgroundColor: theme.colors.background, padding: 18, borderRadius: 16, color: theme.colors.cream, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.glassBorder }}
                    placeholder="Code à 6 chiffres"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="number-pad"
                    value={activationCode}
                    onChangeText={setActivationCode}
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity 
                  style={{ width: '100%', backgroundColor: theme.colors.caramel, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 }} 
                  onPress={handleTerminalLogin}
                  disabled={isLoading}
                >
                  <Text style={{ color: theme.colors.background, fontSize: 16, fontWeight: '800' }}>
                    {isLoading ? 'Activation...' : 'Activer ce terminal'}
                  </Text>
                </TouchableOpacity>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.glassBorder }} />
                  <Text style={{ marginHorizontal: 16, color: theme.colors.creamMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>OU</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.glassBorder }} />
                </View>

                <TouchableOpacity 
                  style={{ paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(212, 132, 70, 0.1)', borderWidth: 1, borderColor: theme.colors.caramel, width: '100%', alignItems: 'center' }} 
                  onPress={startScan}
                >
                  <Text style={{ color: theme.colors.caramel, fontSize: 13, fontWeight: '800' }}>SCANNER LE CODE QR</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ width: '100%', marginBottom: 12 }}>
                  <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 }}>E-MAIL</Text>
                  <TextInput
                    style={{ width: '100%', backgroundColor: theme.colors.background, padding: 18, borderRadius: 16, color: theme.colors.cream, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.glassBorder }}
                    placeholder="votre@email.com"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View style={{ width: '100%', marginBottom: 12 }}>
                  <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 }}>MOT DE PASSE</Text>
                  <View style={{ width: '100%', position: 'relative' }}>
                    <TextInput
                      style={{ width: '100%', backgroundColor: theme.colors.background, padding: 18, paddingRight: 60, borderRadius: 16, color: theme.colors.cream, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.glassBorder }}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 15, top: 18 }}
                    >
                      <Text style={{ color: theme.colors.caramel, fontWeight: '800', fontSize: 12 }}>{showPassword ? 'CACHER' : 'VOIR'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity 
                  style={{ width: '100%', backgroundColor: theme.colors.caramel, padding: 18, borderRadius: 16, alignItems: 'center' }} 
                  onPress={handleAccountLogin}
                  disabled={isLoading}
                >
                  <Text style={{ color: theme.colors.background, fontSize: 16, fontWeight: '800' }}>
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </GlassPanel>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── PIN LOGIN VIEW ────────────────────────────────────────
function PinLoginView() {
  const { loginWithPin, storeId, deactivateTerminal, theme } = usePOSStore();
  const { confirm } = useConfirm();
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

  const loginStyles = useMemo(() => createLoginStyles(theme), [theme]);

  return (
    <SafeAreaView style={loginStyles.loginContainer}>
      <View style={[loginStyles.loginBox, { backgroundColor: 'transparent', borderWidth: 0 }]}>
        <Text style={loginStyles.loginTitle}>Session Barista</Text>
        <Text style={loginStyles.loginSub}>Boutique: {storeId}</Text>
        
        <View style={loginStyles.pinDisplay}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={[loginStyles.pinDot, pin.length > i && loginStyles.pinDotFilled, error && { backgroundColor: theme.colors.danger }]} />
          ))}
        </View>

        <View style={loginStyles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
            <TouchableOpacity 
              key={key} 
              style={loginStyles.key} 
              onPress={() => {
                if (key === 'C') setPin('');
                else if (key === '⌫') setPin(pin.slice(0, -1));
                else handlePress(key);
              }}
            >
              <Text style={loginStyles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={{ marginTop: 24, padding: 12 }} 
          onPress={() => {
            confirm({
              title: 'Désactiver Terminal',
              message: 'Voulez-vous vraiment désactiver cette caisse ? Vous devrez utiliser un nouveau code de jumelage pour y accéder à nouveau.',
              confirmLabel: 'DÉSAGTIVER',
              cancelLabel: 'ANNULER',
              type: 'danger',
              onConfirm: async () => {
                await deactivateTerminal();
              }
            });
          }}
        >
          <Text style={{ color: theme.colors.creamMuted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Désactiver cet appareil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── POS HEADER COMPONENT ──────────────────────────────────
function POSHeader({ title, sub }: { title?: string; sub?: string }) {
  const { currentBarista, storeName, userRole, logoutBarista, clearRachma, theme } = usePOSStore();
  const { confirm } = useConfirm();
  const [time, setTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const mainStyles = useMemo(() => createMainStyles(theme), [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ padding: 12, paddingBottom: 0 }}>
      <GlassPanel intensity={40} style={{ padding: 16, borderRadius: theme.shapes.radiusMd }}>
        {/* Row 1: Shop & Logout */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.colors.caramel, width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 18 }}>☕</Text>
            </View>
            <Text style={{ color: theme.colors.cream, fontSize: 18, fontWeight: '900', marginLeft: 10 }}>{storeName || 'CoffeeShop'}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              confirm({
                title: 'Changer de Serveur',
                message: 'Voulez-vous clôturer votre session et vous déconnecter ? Le panier en cours non validé sera réinitialisé.',
                type: 'danger',
                confirmLabel: 'CLÔTURER (ABANDONNER PANIER)',
                onConfirm: async () => {
                  clearRachma();
                  logoutBarista();
                }
              });
            }}
            style={{ 
              paddingHorizontal: 10, 
              paddingVertical: 6, 
              borderRadius: 10, 
              borderWidth: 1, 
              borderColor: theme.colors.glassBorder, 
              backgroundColor: 'rgba(255,255,255,0.05)' 
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '900', color: theme.colors.cream, letterSpacing: 0.5 }}>CH. SERVEUR</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Barista & Time */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%', 
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.glassBorder
        }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.colors.caramel, fontSize: 11, fontWeight: '900' }}>
                👤 {currentBarista?.name || 'Session'}
              </Text>
              {userRole === 'superadmin' && (
                <View style={{ backgroundColor: 'rgba(212, 132, 70, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.caramel }}>
                  <Text style={{ color: theme.colors.caramel, fontSize: 8, fontWeight: '900' }}>🛡️ SUPERADMIN</Text>
                </View>
              )}
            </View>
            <Text style={{ color: theme.colors.creamMuted, fontSize: 10, marginTop: 1, fontWeight: '700' }}>{today}</Text>
          </View>

          <View style={{ backgroundColor: 'rgba(212, 132, 70, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212, 132, 70, 0.3)' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.colors.caramel }}>{time}</Text>
          </View>
        </View>
      </GlassPanel>
    </View>
  );
}

// ─── TABLES SCREEN (Mode Table) ───────────────────────────
function LocalTablesScreen({ onSelectTable }: { onSelectTable: (id: string) => void }) {
  const { tables, getTableTotal, currentBarista, userRole, storeTables, theme } = usePOSStore();
  const posStyles = useMemo(() => createPosStyles(theme), [theme]);
  
  const isOwner = userRole === 'owner' || userRole === 'superadmin';
  const assigned = currentBarista?.assignedTables || [];
  
  const baseTables = storeTables.length > 0 ? storeTables.map(t => t.label) : Array.from({ length: 48 }, (_, i) => `T${i + 1}`);
  const tableIds = isOwner ? baseTables : baseTables.filter(id => assigned.includes(id));

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder }}>
        <Text style={{ fontSize: 13, fontWeight: '900', color: theme.colors.caramel, textTransform: 'uppercase', letterSpacing: 1 }}>Plan de Salle</Text>
        <Text style={{ fontSize: 12, color: theme.colors.creamMuted }}>{tableIds.length} tables disponibles</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {tableIds.length === 0 ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🛋️</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.creamMuted, textAlign: 'center' }}>
              Aucune table affectée
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
                    isOccupied && { backgroundColor: theme.colors.caramel, borderColor: theme.colors.caramel, ...(theme.shadows.glow as any) }
                  ]} 
                  onPress={() => onSelectTable(id)}
                >
                  <Text style={[posStyles.tableNumber, isOccupied && { color: theme.colors.background }]}>{id}</Text>
                  {isOccupied ? (
                    <Text style={[posStyles.tableTotal, { fontSize: 11, color: theme.colors.background, fontWeight: '900' }]}>{Number(total).toFixed(3)} DT</Text>
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
function LocalCaisseScreen({ onBackToTables }: { 
  onBackToTables?: () => void; 
}) {
  const { confirm } = useConfirm();
  const { 
    products, pendingSales, currentBarista, storeId, activeTable, setActiveTable,
    logoutBarista, checkout, checkoutTable, syncSales, getTotalItems, getTotalPrice,
    tables, cart, theme // Added theme
  } = usePOSStore();
  
  const posStyles = useMemo(() => createPosStyles(theme), [theme]);
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const unsyncedCount = pendingSales.filter(s => s.status === 'pending').length;
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  const [navStack, setNavStack] = useState<string[]>([]);

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
    
    const targetCart = activeTable ? (tables[activeTable] || {}) : cart;
    const checkoutItems = Object.entries(targetCart).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return { name: p?.name || 'Inconnu', qty, price: p?.price || 0 };
    });

    confirm({
      title: activeTable ? `Encaisser Table ${activeTable}` : 'Valider le paiement',
      message: `Montant total à encaisser : ${Number(totalPrice).toFixed(3)} DT. Voulez-vous valider cette vente ?`,
      type: 'checkout',
      items: checkoutItems,
      confirmLabel: 'ENCAISSER',
      onConfirm: () => {
        checkout();
        if (activeTable) onBackToTables?.();
        syncSales();
      }
    });
  };

  const handleSync = async () => {
    if (unsyncedCount === 0 || isSyncing) return;
    setIsSyncing(true);
    await syncSales();
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      
      {activeTable && (
        <View style={{ backgroundColor: theme.colors.caramel, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.background, fontWeight: '900', fontSize: 16 }}>🪑 TABLE {activeTable}</Text>
            <View style={{ width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.3)', marginHorizontal: 12 }} />
            <Text style={{ color: 'rgba(18,15,14,0.8)', fontSize: 12, fontWeight: '700' }}>COMMANDE EN COURS</Text>
          </View>
          <TouchableOpacity onPress={onBackToTables} style={{ backgroundColor: 'rgba(18,15,14,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(18,15,14,0.1)' }}>
            <Text style={{ color: theme.colors.background, fontSize: 13, fontWeight: '900' }}>RETOUR AUX TABLES</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: 'rgba(242, 232, 218, 0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity onPress={() => setNavStack([])}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: theme.colors.caramel, letterSpacing: 0.5 }}>TERMINAL</Text>
            </TouchableOpacity>
            {navStack.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(242, 232, 218, 0.2)', marginHorizontal: 8 }}>/</Text>
                <TouchableOpacity onPress={() => setNavStack(navStack.slice(0, i + 1))}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: theme.colors.cream, letterSpacing: 0.5 }}>{step.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity 
          style={{ 
            backgroundColor: unsyncedCount > 0 ? theme.colors.caramel : 'rgba(255,255,255,0.05)', 
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginLeft: 12,
            borderWidth: 1, borderColor: unsyncedCount > 0 ? theme.colors.caramel : 'rgba(242, 232, 218, 0.1)'
          }} 
          onPress={handleSync}
        >
          <Text style={{ fontSize: 10, fontWeight: '900', color: unsyncedCount > 0 ? theme.colors.background : theme.colors.creamMuted }}>
            {unsyncedCount > 0 ? `SYNC (${unsyncedCount})` : 'SECURED'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {(() => {
          const getCategoryEmoji = (cat: string) => {
            const low = cat.toLowerCase();
            if (low.includes('chaud') || low.includes('café') || low.includes('cafe')) return '☕';
            if (low.includes('froid') || low.includes('glacé') || low.includes('glace')) return '🧊';
            if (low.includes('boisson') || low.includes('soda') || low.includes('eau')) return '🥤';
            if (low.includes('jus')) return '🧃';
            if (low.includes('thé') || low.includes('the')) return '🫖';
            if (low.includes('viennoiserie') || low.includes('croissant')) return '🥐';
            if (low.includes('dessert') || low.includes('gâteau') || low.includes('crepe') || low.includes('crêpe')) return '🍰';
            if (low.includes('snack') || low.includes('salé') || low.includes('sandwich')) return '🥪';
            if (low.includes('smoothie')) return '🍹';
            return '📂';
          };
          
          return (
            <>
              {navStack.length > 0 && (
                <TouchableOpacity 
                  onPress={handleBack} 
                  style={{ marginBottom: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.glassBorder, flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>⬅️</Text>
                  <Text style={{ fontWeight: '800', color: theme.colors.cream }}>Retour</Text>
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
                      <Text style={posStyles.categoryEmoji}>{getCategoryEmoji(name)}</Text>
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
      </>
    );
  })()}
</ScrollView>

      <View style={posStyles.checkoutFooter} pointerEvents="box-none">
        <GlassPanel intensity={90} style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 20, 
          paddingVertical: 14, 
          borderRadius: 24,
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: 'rgba(242, 232, 218, 0.1)',
          ...(theme.shadows.floating as any)
        }}>
          <TouchableOpacity onPress={() => setShowOrderModal(true)} style={{ flex: 1, marginRight: 16 }}>
            <Text style={posStyles.totalPrice}>{Number(totalPrice).toFixed(3)} <Text style={{ fontSize: 12 }}>DT</Text></Text>
            <Text style={{ fontSize: 11, color: theme.colors.creamMuted, fontWeight: '800', textTransform: 'uppercase' }}>{totalItems} articles • Détails 📋</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleCheckout} 
            activeOpacity={0.8}
            style={posStyles.payBtn}
          >
            <Text style={posStyles.payBtnText}>ENCAISSER</Text>
          </TouchableOpacity>
        </GlassPanel>
      </View>

      <OrderItemsModal 
        visible={showOrderModal} 
        onClose={() => setShowOrderModal(false)}
        activeTable={activeTable}
      />
    </View>
  );
}

// ─── RACHMA HISTORY MODAL ──────────────────────────────────
function RachmaHistoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { rachmaHistory, theme } = usePOSStore();

  if (!visible) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '80%', padding: 24, borderWidth: 1, borderColor: theme.colors.glassBorder }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.cream }}>Journal d'activité</Text>
              <Text style={{ fontSize: 13, color: theme.colors.caramel, fontWeight: '700' }}>MODES RACHMA - TEMPS RÉEL</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: theme.colors.creamMuted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {rachmaHistory.length === 0 ? (
              <View style={{ paddingTop: 60, alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>📜</Text>
                <Text style={{ textAlign: 'center', color: theme.colors.creamMuted, fontWeight: '800' }}>Aucune action récente</Text>
              </View>
            ) : (
              rachmaHistory.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder }}>
                  <Text style={{ fontSize: 16, marginRight: 12 }}>{item.type === 'ADD' ? '🟢' : '🔴'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.cream }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.creamMuted }}>{item.type === 'ADD' ? 'Ajouté' : 'Retiré'}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: theme.colors.caramel }}>{formatTime(item.timestamp)}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── RACHMA PAST SALES MODAL ───────────────────────────────
function RachmaPastSalesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { storeId, theme, products } = usePOSStore();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !storeId) return;
    const fetchSales = async () => {
      setLoading(true);
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${API_URL}/sales/${storeId}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to show completed/paid sales
          setSales(data.filter((s: any) => s.paymentStatus !== 'pending' && s.total > 0).slice(0, 50));
        }
      } catch (e) {
        console.warn('RachmaPastSales: erreur fetch', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [visible, storeId]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', padding: 24, borderWidth: 1, borderColor: theme.colors.glassBorder }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.cream }}>Ventes Clôturées</Text>
              <Text style={{ fontSize: 13, color: theme.colors.caramel, fontWeight: '700' }}>HISTORIQUE DES SESSIONS (Aujourd'hui, etc.)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: theme.colors.creamMuted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {loading ? (
              <Text style={{ color: theme.colors.creamMuted, marginTop: 20, textAlign: 'center' }}>Chargement...</Text>
            ) : sales.length === 0 ? (
              <Text style={{ color: theme.colors.creamMuted, marginTop: 20, textAlign: 'center' }}>Aucune vente trouvée.</Text>
            ) : (
              sales.map((item) => (
                <View key={item.id} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.cream }}>Total: {Number(item.total).toFixed(3)} DT</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: item.paymentStatus === 'PAID' ? theme.colors.success : theme.colors.softOrange }}>{item.paymentStatus}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.colors.caramel, marginBottom: 8, fontWeight: '700' }}>{formatTime(item.createdAt)}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {item.items?.map((i: any, idx: number) => {
                      const p = products.find(prod => prod.id === i.productId);
                      return (
                        <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, color: theme.colors.creamMuted }}>{p?.name || 'Produit'} x{i.quantity}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── ORDER ITEMS MODAL ─────────────────────────────────────
function OrderItemsModal({ visible, onClose, activeTable }: { visible: boolean; onClose: () => void; activeTable: string | null }) {
  const { cart, tables, products, addToCart, removeFromCart, deleteItemFromCart, clearCart, getTableTotal, getTotalPrice, theme } = usePOSStore();
  const [discount, setDiscount] = useState(0);

  const currentCart = activeTable ? (tables[activeTable] || {}) : cart;
  const items = Object.entries(currentCart).map(([id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return { ...p, id, qty };
  });

  const rawTotal = activeTable ? getTableTotal(activeTable) : getTotalPrice();
  const discountedTotal = rawTotal * (1 - discount / 100);

  if (!visible) return null;

  const { alert } = useConfirm();

  const handlePrint = () => {
    alert("Impression", "Le ticket a été envoyé à l'imprimante Bluetooth.");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', padding: 24, borderWidth: 1, borderColor: theme.colors.glassBorder }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.cream }}>Résumé Commande</Text>
              <Text style={{ fontSize: 14, color: theme.colors.caramel, fontWeight: '800' }}>
                {activeTable ? `TABLE ${activeTable}` : 'MODE DIRECT'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: theme.colors.creamMuted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {items.length === 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 40, color: theme.colors.creamMuted, fontWeight: '800' }}>Aucun article sélectionné</Text>
            ) : (
              items.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.cream }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.creamMuted }}>{Number(item.price).toFixed(3)} DT/unité</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity 
                      onPress={() => removeFromCart(item.id)}
                      style={{ width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glassBorder }}
                    >
                      <Text style={{ color: theme.colors.cream, fontSize: 18, fontWeight: '900' }}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={{ fontSize: 18, fontWeight: '900', color: theme.colors.caramel, minWidth: 24, textAlign: 'center' }}>{item.qty}</Text>
                    
                    <TouchableOpacity 
                      onPress={() => addToCart(item.id)}
                      style={{ width: 32, height: 32, backgroundColor: 'rgba(212, 132, 70, 0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.caramel }}
                    >
                      <Text style={{ color: theme.colors.caramel, fontSize: 18, fontWeight: '900' }}>+</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => deleteItemFromCart(item.id)}
                      style={{ marginLeft: 10, padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 10 }}
                    >
                      <Text style={{ fontSize: 14 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            {items.length > 0 && (
              <View style={{ marginTop: 24, padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: theme.colors.caramel, marginBottom: 12, textTransform: 'uppercase' }}>Réductions (%)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[0, 5, 10, 15, 20].map(pct => (
                    <TouchableOpacity 
                      key={pct} 
                      onPress={() => setDiscount(pct)}
                      style={{ 
                        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                        backgroundColor: discount === pct ? theme.colors.caramel : theme.colors.surface,
                        borderWidth: 1, borderColor: discount === pct ? theme.colors.caramel : theme.colors.glassBorder
                      }}
                    >
                      <Text style={{ fontWeight: '900', color: discount === pct ? theme.colors.background : theme.colors.cream, fontSize: 12 }}>{pct}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={{ paddingTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.glassBorder }}>
            {discount > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: theme.colors.creamMuted, fontWeight: '700' }}>Remise ({discount}%)</Text>
                <Text style={{ color: '#EF4444', fontWeight: '800' }}>-{(Number(rawTotal) * discount / 100).toFixed(3)} DT</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.colors.cream }}>TOTAL</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.colors.caramel }}>{Number(discountedTotal).toFixed(3)} DT</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                onPress={handlePrint}
                style={{ flex: 1, height: 56, backgroundColor: theme.colors.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '900', color: theme.colors.cream }}>🎫 TICKET</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onClose}
                style={{ flex: 2, height: 56, backgroundColor: theme.colors.caramel, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '900', color: theme.colors.background }}>VALIDER & FERMER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── STYLE FACTORIES ───────────────────────────
const createLoginStyles = (theme: any) => StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: 'transparent', paddingBottom: Platform.OS === 'android' ? 20 : 0 },
  loginBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loginTitle: { fontSize: 36, fontWeight: '900', color: theme.colors.cream, marginBottom: 8 },
  loginSub: { fontSize: 16, color: theme.colors.creamMuted, marginBottom: 48, fontWeight: '600', letterSpacing: 1 },
  pinDisplay: { flexDirection: 'row', gap: 20, marginBottom: 60 },
  pinDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.glassBorder, backgroundColor: 'transparent' },
  pinDotFilled: { backgroundColor: theme.colors.caramel, borderColor: theme.colors.caramel },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'space-between', gap: 20 },
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  keyText: { fontSize: 28, fontWeight: '700', color: theme.colors.cream },
});

const createMainStyles = (theme: any) => StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    paddingTop: Platform.OS === 'android' ? 10 : 4, // Reduced because of SafeAreaView
    backgroundColor: theme.colors.background, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.glassBorder 
  },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  scannerText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 40, textAlign: 'center', paddingHorizontal: 40 },
  scannerFrame: { width: 280, height: 280, borderWidth: 2, borderColor: theme.colors.caramel, borderRadius: 32, backgroundColor: 'transparent' },
  closeScanner: { marginTop: 60, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
});

const createPosStyles = (theme: any) => StyleSheet.create({
  categoryCard: { 
    width: (Platform.OS === 'web' || Platform.OS === 'android' ? 140 : 115), 
    height: 110, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    borderRadius: 20, 
    padding: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(242, 232, 218, 0.08)', 
    marginBottom: 10, 
    ...(theme.shadows.floating as any) 
  },
  categoryEmoji: { fontSize: 32, marginBottom: 6 },
  categoryText: { fontSize: 11, fontWeight: '900', color: theme.colors.cream, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryCount: { fontSize: 9, color: theme.colors.caramel, marginTop: 4, fontWeight: '800' },
  tableCard: { 
    width: '22%', 
    aspectRatio: 1, 
    backgroundColor: 'rgba(255, 255, 255, 0.04)', 
    borderRadius: 20, 
    marginBottom: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(242, 232, 218, 0.08)', 
    ...(theme.shadows.floating as any) 
  },
  tableNumber: { fontSize: 20, fontWeight: '900', color: theme.colors.caramel },
  tableTotal: { fontSize: 10, fontWeight: '800', color: theme.colors.cream, marginTop: 4 },
  tableStatus: { fontSize: 10, color: theme.colors.creamMuted, marginTop: 2, fontWeight: '700', textTransform: 'uppercase' },
  checkoutFooter: { 
    position: 'absolute', 
    bottom: Platform.OS === 'android' ? 88 : 24, 
    left: 12, 
    right: 12, 
    backgroundColor: 'transparent', 
    zIndex: 100 
  },
  totalPrice: { fontSize: 28, fontWeight: '900', color: theme.colors.cream, letterSpacing: -1 },
  payBtn: { 
    backgroundColor: theme.colors.caramel, 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 20, 
    minWidth: 140, 
    alignItems: 'center', 
    ...(theme.shadows.glow as any) 
  },
  payBtnText: { color: theme.colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});

const createMgStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.cream, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.creamMuted, marginBottom: 20 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, padding: 20, borderRadius: 16 },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  emptyText: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginTop: 40 },
  saleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  saleId: { fontSize: 16, fontWeight: '700', color: theme.colors.cream },
  saleTime: { fontSize: 13, color: theme.colors.creamMuted, marginTop: 2 },
  saleTotal: { fontSize: 18, fontWeight: '800', color: theme.colors.caramel },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

// ─── RACHMA SCREEN (Simplified Mode) ───────────────────────
function LocalRachmaScreen() {
  const { confirm } = useConfirm();
  const { 
    products, rachmaCart, rachmaTakeawayCart, rachmaTakeawayActive, toggleRachmaTakeaway, 
    addToRachma, removeFromRachma, clearRachma, checkoutRachma, getRachmaTotal, 
    syncSales, pendingSales, theme, hasBarSupport 
  } = usePOSStore();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPastSales, setShowPastSales] = useState(false);

  const categories = ['TOUT', ...Array.from(new Set(products.map(p => p.categoryName || 'Autres'))).sort()];
  
  useEffect(() => {
    if (!selectedCat) {
      setSelectedCat('TOUT');
    }
  }, []);

  const filteredProducts = selectedCat === 'TOUT' 
    ? products 
    : products.filter(p => (p.categoryName || 'Autres') === selectedCat);

  const total = getRachmaTotal();

  const handleFinish = () => {
    if (total === 0) return;
    confirm({
      title: 'Clôturer & Encaisser',
      message: 'La vente sera enregistrée et encaissée immédiatement.',
      type: 'checkout',
      items: cartDetails,
      confirmLabel: 'ENCAISSER',
      onConfirm: () => {
        checkoutRachma('PAID');
        syncSales();
      }
    });
  };

  const handlePrepare = () => {
    if (total === 0) return;
    confirm({
      title: 'Envoyer Préparation',
      message: 'La commande sera envoyée au bar. Vous devrez l\'encaisser plus tard.',
      type: 'default',
      confirmLabel: 'ENVOYER',
      onConfirm: () => {
        checkoutRachma('UNPAID');
        syncSales();
      }
    });
  };

  const handleClearRequest = () => {
    if (total === 0) return;
    confirm({
      title: 'Vider le panier ?',
      message: 'Attention : toutes les saisies en cours seront effacées sans être enregistrées.',
      type: 'danger',
      confirmLabel: 'VIDER TOUT',
      onConfirm: () => clearRachma()
    });
  };

  const cartDetails = Object.entries(rachmaCart).map(([id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return { name: p?.name || 'Inconnu', qty, price: p?.price || 0 };
  });

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Category Ribbon */}
      <View style={{ 
        paddingVertical: 14, 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(242, 232, 218, 0.05)',
        backgroundColor: 'transparent'
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {categories.map(cat => {
            const isAll = cat === 'TOUT';
            const displayCat = isAll ? 'TOUT' : (cat.split('>').pop()?.trim().toUpperCase() || cat.toUpperCase());
            const isActive = selectedCat === cat;
            
            return (
              <TouchableOpacity 
                key={cat}
                onPress={() => setSelectedCat(cat)}
                style={{ 
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, 
                  backgroundColor: isActive ? theme.colors.caramel : 'rgba(255,255,255,0.03)',
                  alignItems: 'center',
                  borderWidth: 1, 
                  borderColor: isActive ? theme.colors.caramel : 'rgba(242, 232, 218, 0.1)',
                  ...(isActive ? (theme.shadows.glow as any) : {})
                }}
              >
                <Text style={{ 
                  fontSize: 11, 
                  fontWeight: '900', 
                  color: isActive ? theme.colors.background : theme.colors.cream, 
                  letterSpacing: 0.8
                }}>
                  {displayCat}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {filteredProducts.map(p => (
            <FloatingCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              qty={rachmaCart[p.id] || 0}
              takeawayQty={rachmaTakeawayCart[p.id] || 0}
              onPress={() => addToRachma(p.id)}
              onLongPress={() => removeFromRachma(p.id)}
              onToggleTakeaway={toggleRachmaTakeaway}
            />
          ))}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={{ position: 'absolute', bottom: Platform.OS === 'android' ? 88 : 24, left: 12, right: 12, zIndex: 1000 }} pointerEvents="box-none">
        <GlassPanel intensity={90} style={{ 
          padding: 16, 
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(242, 232, 218, 0.1)',
          ...(theme.shadows.floating as any)
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(242, 232, 218, 0.05)' }}>
            <View>
              <Text style={{ color: theme.colors.caramel, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>Total Rachmet</Text>
              <Text style={{ color: theme.colors.cream, fontSize: 11, fontWeight: '700' }}>{Object.keys(rachmaCart).length} articles en cours</Text>
            </View>
            <Text style={{ color: theme.colors.cream, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>{Number(total).toFixed(3)} <Text style={{ fontSize: 14 }}>DT</Text></Text>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={() => setShowHistory(true)}
              style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(242, 232, 218, 0.1)', flexDirection: 'row', gap: 8 }}
            >
              <Text style={{ fontSize: 18 }}>📜</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: theme.colors.cream, letterSpacing: 0.5 }}>JOURNAL</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowPastSales(true)}
              style={{ width: '48%', backgroundColor: 'rgba(16, 185, 129, 0.08)', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', flexDirection: 'row', gap: 8 }}
            >
              <Text style={{ fontSize: 18 }}>💰</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 }}>CLÔTURÉS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleClearRequest}
              style={{ width: '30%', backgroundColor: 'rgba(244, 63, 94, 0.08)', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.2)' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '900', color: theme.colors.danger }}>VIDER</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleFinish}
              style={{ flex: 1, backgroundColor: theme.colors.caramel, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16, ...(theme.shadows.glow as any) }}
            >
              <Text style={{ fontSize: 14, fontWeight: '900', color: theme.colors.background, letterSpacing: 1 }}>ENCAISSER</Text>
            </TouchableOpacity>

            {hasBarSupport && (
              <TouchableOpacity 
                onPress={handlePrepare}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: theme.colors.caramel, flexDirection: 'row', gap: 8 }}
              >
                <Text style={{ fontSize: 18 }}>☕</Text>
                <Text style={{ color: theme.colors.caramel, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>7ADHER</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassPanel>
      </View>

      <RachmaHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
      <RachmaPastSalesModal visible={showPastSales} onClose={() => setShowPastSales(false)} />
    </View>
  );
}

// ─── PREPARATEUR SCREEN (KDS Mode) ───────────────────────
function LocalPreparateurScreen({ onBack }: { onBack: () => void }) {
  const { storeId, updatePreparationStatus, syncSales, theme } = usePOSStore();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState<string>('bar');
  const [sound, setSound] = useState<any | null>(null);
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
          // playSound();
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

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [storeId, station]);

  const updateStatus = async (id: string, nextStatus: string) => {
    const ok = await updatePreparationStatus(id, nextStatus, station);
    if (ok) fetchSales();
  };

  const pendingSales = sales.filter(s => s.preparationStatus === 'PENDING' && (!s.preparationStation || s.preparationStation === station));
  const inProgressSales = sales.filter(s => s.preparationStatus === 'IN_PROGRESS' && s.preparationStation === station);
  const readySales = sales.filter(s => s.preparationStatus === 'READY' && s.preparationStation === station);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, paddingTop: 60, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity onPress={onBack} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>⬅️</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
          {['bar', 'cuisine', 'chicha'].map(s => (
            <TouchableOpacity key={s} onPress={() => setStation(s)} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: station === s ? theme.colors.caramel : theme.colors.surface, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.cream, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.cream }}>Commandes {station}</Text>
        {[...inProgressSales, ...pendingSales, ...readySales].map(sale => (
          <View key={sale.id} style={{ backgroundColor: theme.colors.surface, borderRadius: 24, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: theme.colors.cream }}>{sale.tableName || 'Vente Directe'}</Text>
            {sale.preparationStatus === 'PENDING' && <TouchableOpacity onPress={() => updateStatus(sale.id, 'IN_PROGRESS')}><Text style={{ color: theme.colors.caramel }}>PRÉPARER</Text></TouchableOpacity>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── DASHBOARD SCREEN ──────────────────────────────────────
function LocalDashboardScreen() {
  const { pendingSales, storeId, currentBarista, products, theme, themeName, setTheme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
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
  const todaySales = allSales.filter(s => new Date(s.createdAt).toDateString() === todayStr);
  const displayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={mgStyles.title}>Dashboard</Text>
      <Text style={mgStyles.subtitle}>Bonjour {currentBarista?.name}</Text>
      <View style={mgStyles.cardRow}>
        <View style={[mgStyles.card, { backgroundColor: theme.colors.caramel }]}>
          <Text style={mgStyles.cardLabel}>Chiffre Jour</Text>
          <Text style={mgStyles.cardValue}>{Number(displayRevenue).toFixed(3)} DT</Text>
        </View>
      </View>

      <View style={{ marginTop: 32 }}>
        <Text style={[mgStyles.title, { fontSize: 20, marginBottom: 12 }]}>Apparence</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            onPress={() => setTheme('antigravity')}
            style={{ 
              flex: 1, padding: 16, borderRadius: 16, backgroundColor: themeName === 'antigravity' ? theme.colors.caramel : theme.colors.surface,
              borderWidth: 1, borderColor: themeName === 'antigravity' ? theme.colors.caramel : theme.colors.glassBorder,
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>☕</Text>
            <Text style={{ color: themeName === 'antigravity' ? theme.colors.background : theme.colors.cream, fontWeight: '800', fontSize: 12 }}>ANTIGRAVITY</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setTheme('neon-food')}
            style={{ 
              flex: 1, padding: 16, borderRadius: 16, backgroundColor: themeName === 'neon-food' ? theme.colors.caramel : theme.colors.surface,
              borderWidth: 1, borderColor: themeName === 'neon-food' ? theme.colors.caramel : theme.colors.glassBorder,
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>🍟</Text>
            <Text style={{ color: themeName === 'neon-food' ? theme.colors.background : theme.colors.cream, fontWeight: '800', fontSize: 12 }}>NEON FOOD</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── STOCK SCREEN ──────────────────────────────────────────
function LocalStockScreen() {
  const { storeId, theme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
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

  return (
    <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={mgStyles.title}>Gestion des Stocks</Text>
      {stockItems.map((item) => (
        <View key={item.id} style={mgStyles.saleRow}>
          <Text style={mgStyles.saleId}>{item.name}</Text>
          <Text style={mgStyles.saleTotal}>{Number(item.quantity).toFixed(2)}</Text>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── STAFF SCREEN ──────────────────────────────────────────
function LocalStaffScreen() {
  const { storeId, theme, userRole, currentBarista, updateStaffMember, updateStaffPin } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
  const isOwner = userRole === 'owner' || userRole === 'superadmin';
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

  const [editingMember, setEditingMember] = useState<any>(null);
  const [form, setForm] = useState({ name: '', pinCode: '' });
  const [saving, setSaving] = useState(false);

  const openEdit = (m: any) => {
    if (userRole !== 'owner' && !(currentBarista?.permissions || []).includes('STAFF')) return;
    setEditingMember(m);
    setForm({ name: m.name, pinCode: m.pinCode || '' });
  };

  const handleUpdate = async () => {
    setSaving(true);
    const success = await updateStaffMember(editingMember.id, { name: form.name });
    const pinSuccess = await updateStaffPin(editingMember.id, form.pinCode || null);
    
    if (success && pinSuccess) {
      // Refresh list
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/sales/management/staff/${storeId}`);
      if (res.ok) setStaffList(await res.json());
      setEditingMember(null);
    }
    setSaving(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Gestion du Personnel</Text>
        <Text style={{ color: theme.colors.cream, opacity: 0.6, fontSize: 12, marginBottom: 15 }}>
          {isOwner || (currentBarista?.permissions || []).includes('STAFF') ? "Cliquer sur un membre pour modifier son profil ou son PIN." : "Consultez la liste de vos collaborateurs."}
        </Text>
        {staffList.map((member) => (
          <TouchableOpacity 
            key={member.id} 
            style={[mgStyles.saleRow, { justifyContent: 'space-between' }]}
            onPress={() => openEdit(member)}
          >
            <View>
              <Text style={mgStyles.saleId}>{member.name}</Text>
              <Text style={{ color: theme.colors.cream, opacity: 0.5, fontSize: 11 }}>
                Role: {member.role === 'STORE_OWNER' ? 'Gérant' : 'Caissier'} {member.pinCode ? '• PIN: ****' : ''}
              </Text>
            </View>
            {(isOwner || (currentBarista?.permissions || []).includes('STAFF')) && (
              <Text style={{ fontSize: 20 }}>✏️</Text>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Staff Edit Modal */}
      {editingMember && (
        <Modal 
          visible={!!editingMember} 
          transparent 
          animationType="fade"
          onRequestClose={() => setEditingMember(null)}
        >
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            activeOpacity={1}
            onPress={() => setEditingMember(null)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={{ width: '100%', maxWidth: 400, backgroundColor: theme.colors.surface, padding: 24, borderRadius: 25, borderWidth: 1, borderColor: theme.colors.glassBorder }}
            >
              <Text style={{ color: theme.colors.cream, fontSize: 20, fontWeight: '900', marginBottom: 20 }}>Modifier {editingMember.name}</Text>
              
              <Text style={{ color: theme.colors.cream, fontSize: 13, marginBottom: 8, fontWeight: '700' }}>NOM COMPLET</Text>
              <TextInput 
                style={{ backgroundColor: theme.colors.background, color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 20 }}
                value={form.name}
                onChangeText={t => setForm(f => ({ ...f, name: t }))}
              />

              <Text style={{ color: theme.colors.cream, fontSize: 13, marginBottom: 8, fontWeight: '700' }}>CODE PIN (4 CHIFFRES)</Text>
              <TextInput 
                style={{ backgroundColor: theme.colors.background, color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 24, fontSize: 20, textAlign: 'center', letterSpacing: 8 }}
                value={form.pinCode}
                maxLength={4}
                placeholder="0000"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
                onChangeText={t => setForm(f => ({ ...f, pinCode: t.replace(/\D/g, '') }))}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                  onPress={() => setEditingMember(null)}
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: theme.colors.cream, fontWeight: '800' }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleUpdate}
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: theme.colors.caramel, padding: 15, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: theme.colors.background, fontWeight: '900' }}>{saving ? "..." : "Enregistrer"}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

// ─── MAIN APP WITH TABS ────────────────────────────────────
type TabId = 'tables' | 'caisse' | 'dashboard' | 'products' | 'categories' | 'stock' | 'suppliers' | 'orders' | 'staff' | 'notifs' | 'rachma' | 'menu' | 'bar' | 'marketplace';

function LocalMenuScreen({ onSelect }: { onSelect: (tab: TabId) => void }) {
  const { theme, currentBarista, userRole, authMode, isFiscalEnabled, planName } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
  
  const permissions = currentBarista?.permissions || [];
  const isOwner = userRole === 'owner' || userRole === 'superadmin';

  const menuItems: { id: TabId, label: string, icon: string, permission?: string }[] = [
    { id: 'tables', label: 'Plan Salle', icon: '🪑', permission: 'TABLES' },
    { id: 'caisse', label: 'Caisse Directe', icon: '💰', permission: 'POS' },
    { id: 'rachma', label: 'Mode Rachma', icon: '⚡', permission: 'RACHMA' },
    { id: 'bar', label: 'KDS / Bar', icon: '☕', permission: 'BAR' },
    { id: 'dashboard', label: 'Dashboard', icon: '📈', permission: 'DASHBOARD' },
    { id: 'stock', label: 'Stocks', icon: '📦', permission: 'STOCK' },
    { id: 'staff', label: 'Personnel', icon: '👥', permission: 'STAFF' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛍️' },
  ];

  const filteredItems = menuItems.filter(item => {
    // Basic permissions check
    const hasPerm = isOwner || !item.permission || permissions.includes(item.permission);
    // Explicit Marketplace restriction: only in Account mode
    if (item.id === 'marketplace' && authMode === 'TERMINAL') return false;
    
    // Plan-based restrictions
    if (planName === 'RACHMA') {
        // Rachma plan: only Rachma mode allowed
        if (item.id !== 'rachma' && item.id !== 'menu') return false;
    }
    if (planName === 'PRO' || isFiscalEnabled) {
        // PRO or Fiscal: No Rachma mode
        if (item.id === 'rachma') return false;
    }
    // STARTER (Implicit else): If FiscalEnabled, Rachma is already blocked above
    
    return hasPerm;
  });

  return (
    <ScrollView style={mgStyles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={mgStyles.title}>Menu Principal</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
        {filteredItems.map(item => (
          <TouchableOpacity 
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={{ 
              width: '47%', backgroundColor: theme.colors.surface, padding: 20, borderRadius: 20, 
              borderWidth: 1, borderColor: theme.colors.glassBorder, alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</Text>
            <Text style={{ color: theme.colors.cream, fontWeight: '800', fontSize: 13 }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── POS ROOT (FORMERLY MAIN APP) ──────────────────────────
function POSRoot() {
  const { storeId, currentBarista, userRole, setActiveTable, theme, activeTable, isFiscalEnabled, planName } = usePOSStore();
  const { confirm } = useConfirm();
  const isOwner = userRole === 'owner' || userRole === 'superadmin';
  
  const permissions = currentBarista?.permissions || [];
  const permissions = currentBarista?.permissions || [];
  // Force Rachma Mode if:
  // 1. Plan is explicitly RACHMA
  // 2. User is NOT an owner and does NOT have 'POS' permission (even if they have STOCK/STAFF)
  // 3. Special case for STARTER plan users with only RACHMA
  const hasPosPermission = permissions.includes('POS') || permissions.includes('TABLES');
  const hasRachmaModeOnly = (planName === 'RACHMA') || 
    (!isOwner && permissions.includes('RACHMA') && !hasPosPermission) ||
    (!isOwner && !hasPosPermission && !isFiscalEnabled);
  
  const initialTab: TabId = hasRachmaModeOnly ? 'rachma' : (isOwner ? 'menu' : ((currentBarista?.defaultPosMode?.toLowerCase() as TabId) || (planName === 'PRO' || isFiscalEnabled ? 'tables' : 'rachma')));
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Reset screen when user changes (PIN change)
  useEffect(() => {
    setActiveTab(initialTab);
    setActiveTable(null);
  }, [currentBarista?.id]);

  if (!currentBarista) return <PinLoginView />;

  const handleSelectTable = (id: string) => {
    setActiveTable(id);
    setActiveTab('caisse');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'menu': return <LocalMenuScreen onSelect={setActiveTab} />;
      case 'tables': return <LocalTablesScreen onSelectTable={handleSelectTable} />;
      case 'bar': return <LocalPreparateurScreen onBack={() => setActiveTab('menu')} />;
      case 'rachma': return <LocalRachmaScreen />;
      case 'dashboard': return <LocalDashboardScreen />;
      case 'products': return <ProductsScreen storeId={storeId!} />;
      case 'categories': return <CategoriesScreen storeId={storeId!} />;
      case 'stock': return <LocalStockScreen />;
      case 'suppliers': return <SuppliersScreen storeId={storeId!} />;
      case 'orders': return <OrdersScreen storeId={storeId!} />;
      case 'staff': return <LocalStaffScreen />;
      case 'marketplace': return <MarketplaceScreen storeId={storeId!} />;
      case 'notifs': return <NotificationsScreen storeId={storeId!} />;
      case 'caisse':
      default: return <LocalCaisseScreen onBackToTables={() => setActiveTab('tables')} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <POSHeader />
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
      
      {!hasRachmaModeOnly && activeTab !== 'bar' && (
        <View style={{ position: 'absolute', bottom: Platform.OS === 'android' ? 88 : 24, left: 12, right: 12, zIndex: 1000 }}>
          <GlassPanel intensity={75} style={{ 
            flexDirection: 'row', 
            height: 64, 
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'space-around',
            borderWidth: 1,
            borderColor: 'rgba(242, 232, 218, 0.1)',
            ...(theme.shadows.floating as any)
          }}>
            {[
              { id: 'tables', label: 'PLAN SALLE', icon: '🪑', permission: 'TABLES' },
              { id: 'caisse', label: 'CAISSE', icon: '💰', permission: 'POS' },
              { id: 'rachma', label: 'RACHMET', icon: '⚡', permission: 'RACHMA' },
              { id: 'menu', label: 'MENU', icon: '📋' }
            ].filter(tab => {
              if (tab.permission && !permissions.includes(tab.permission) && !isOwner) return false;
              
              // Plan restrictions
              if (planName === 'RACHMA') {
                  if (tab.id !== 'rachma' && tab.id !== 'menu') return false;
              }
              if (planName === 'PRO' || isFiscalEnabled) {
                  if (tab.id === 'rachma') return false;
              }
              
              return true;
            })
            .map(tab => {
              const isActive = activeTab === tab.id || (tab.id === 'tables' && activeTab === 'caisse' && activeTable);
              return (
                <TouchableOpacity 
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as TabId)}
                  style={{ 
                    alignItems: 'center', flex: 1, height: '100%', justifyContent: 'center',
                    backgroundColor: isActive ? 'rgba(212, 132, 70, 0.12)' : 'transparent',
                    borderRadius: 20
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 1, opacity: isActive ? 1 : 0.4 }}>{tab.icon}</Text>
                  <Text style={{ 
                    fontSize: 8, 
                    fontWeight: '900', 
                    color: isActive ? theme.colors.caramel : theme.colors.creamMuted,
                    letterSpacing: 1.2
                  }}>
                    {tab.label}
                  </Text>
                  {isActive && (
                    <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.caramel }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </GlassPanel>
        </View>
      )}
    </SafeAreaView>
  );
}

import { ManagementRoot } from './src/screens/management/ManagementRoot';

function MainApp() {
  const { authToken, storeId, authMode, userRole } = usePOSStore();

  if (!authToken || !authMode) return <LoginView />;
  
  // Vendors don't have storeId, they have vendorId (which is used in ManagementRoot)
  if (userRole !== 'vendor' && !storeId) return <LoginView />;

  return (
    <View style={{ flex: 1 }}>
      <GlassBackground />
      {authMode === 'TERMINAL' ? <POSRoot /> : <ManagementRoot />}
    </View>
  );
}

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
      <ConfirmProvider>
        <NotificationWatcher />
        <MainApp />
        <StatusBar style="light" />
      </ConfirmProvider>
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

    const interval = setInterval(() => {
      checkAlerts();
    }, 1000 * 60 * 5);

    checkAlerts();

    return () => clearInterval(interval);
  }, [storeId, userRole]);

  return null;
}

