import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Platform, View, TouchableOpacity, Alert, Modal, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthService } from '@/services/auth';
import { ApiService } from '@/services/api';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [role, setRole] = useState<string>('UNKNOWN');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<string>('');
  const [appMode, setAppMode] = useState<'RACHMA' | 'FULL'>('FULL');
  const [showSettings, setShowSettings] = useState(false);
  const [radius, setRadius] = useState(50);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments[segments.length - 1] || 'index';

  useEffect(() => {
    async function fetchUser() {
      const session = await AuthService.getSession();
      if (session.user) {
        setRole(session.user.role || 'UNKNOWN');
        setPermissions(session.user.permissions || []);
        setAuthMode(session.user.authMode || '');
      }
      setStoreId(session.storeId);
      const mode = await AuthService.getAppMode();
      setAppMode(mode);
      const r = await AuthService.getSearchRadius();
      setRadius(r);
    }
    fetchUser();
  }, [showSettings]);

  const isOwnerRole = role === 'STORE_OWNER' || role === 'SUPERADMIN';
  const isManager = authMode === 'PASSWORD';
  const isTerminal = authMode === 'PIN' || !authMode;

  const isFullMode = appMode === 'FULL';
  const isRachmaOnly = appMode === 'RACHMA';

  const hasRachmaAccess = isRachmaOnly && (isTerminal || isOwnerRole) && (isOwnerRole || permissions.includes('RACHMA') || role === 'RACHMA' || role === 'CASHIER');
  const hasPosAccess = isFullMode && (isTerminal || isOwnerRole) && (isOwnerRole || permissions.includes('POS') || permissions.includes('TABLES') || role === 'POS' || role === 'CASHIER');
  const hasTablesAccess = isFullMode && (isTerminal || isOwnerRole) && (isOwnerRole || permissions.includes('TABLES') || role === 'TABLES' || role === 'CASHIER');
  const hasManagementAccess = isManager || isOwnerRole;
  const hasMarketplaceAccess = hasManagementAccess && !isRachmaOnly;

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await AuthService.clearSession();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const toggleAppMode = async (mode: 'RACHMA' | 'FULL') => {
    await AuthService.setAppMode(mode);
    setAppMode(mode);
    setShowSettings(false);
    Alert.alert(
      'Mode modifié',
      'L\'interface a été mise à jour. Redémarrez si certains onglets ne se rafraîchissent pas.',
      [{ text: 'OK' }]
    );
  };

  const updateRadius = async (r: number) => {
    await AuthService.setSearchRadius(r);
    setRadius(r);
  };

  const renderSettingsContent = () => {
    const segs = segments as any[];
    const isMarketplace = segs.includes('marketplace');
    const isDashboard = segs.length <= 1 || (!segs.includes('pos') && !segs.includes('tables') && !segs.includes('rachma') && !segs.includes('stocks') && !segs.includes('marketplace'));


    const handleSeedTunisia = async () => {
      if (!storeId) return;
      Alert.alert(
        'Pack Initial Tunisie',
        'Installer le Pack Initial Tunisie (Produits, Recettes & Emballages) ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Installer',
            onPress: async () => {
              try {
                setIsSeeding(true);
                const res = await ApiService.seedTunisia(storeId);
                Alert.alert('Succès', res.message);
                setShowSettings(false);
              } catch (error: any) {
                Alert.alert('Erreur', error.message || 'Échec de l\'installation');
              } finally {
                setIsSeeding(false);
              }
            },
          },
        ]
      );
    };

    if (isDashboard) {
      return (
        <View style={{ backgroundColor: 'transparent' }}>
          <View style={styles.modalHeader}>
            <FontAwesome name="user-circle" size={24} color={Colors.primary} />
            <Text style={styles.modalTitle}>Administration</Text>
          </View>
          <Text style={styles.modalSub}>Gestion de la boutique et du personnel.</Text>
          
          <View style={{ gap: 10 }}>
            <TouchableOpacity 
              style={[styles.adminLink, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]} 
              onPress={handleSeedTunisia}
              disabled={isSeeding}
            >
              <FontAwesome name="magic" size={18} color="#10b981" />
              <Text style={[styles.adminLinkText, { color: '#10b981' }]}>{isSeeding ? 'Installation...' : 'Pack Initial Tunisie'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.adminLink} onPress={() => { setShowSettings(false); router.push('/team'); }}>
              <FontAwesome name="users" size={18} color="#94a3b8" />
              <Text style={styles.adminLinkText}>Gestion Personnel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminLink} onPress={() => { setShowSettings(false); router.push('/table-config'); }}>
              <FontAwesome name="th" size={18} color="#94a3b8" />
              <Text style={styles.adminLinkText}>Configuration Tables</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.adminLink, { borderColor: 'rgba(99, 102, 241, 0.3)', backgroundColor: 'rgba(99, 102, 241, 0.05)' }]} onPress={() => { setShowSettings(false); router.push('/live'); }}>
              <FontAwesome name="feed" size={18} color="#6366f1" />
              <Text style={[styles.adminLinkText, { color: '#6366f1' }]}>Live Dashboard (Owner)</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Default: App Mode
    return (
      <View style={{ backgroundColor: 'transparent' }}>
        <View style={styles.modalHeader}>
          <FontAwesome name="cog" size={24} color={Colors.primary} />
          <Text style={styles.modalTitle}>Mode Application</Text>
        </View>
        <Text style={styles.modalSub}>Choisissez le focus de l'interface.</Text>

        <TouchableOpacity 
          style={[styles.modeOption, appMode === 'RACHMA' && styles.modeOptionActive]} 
          onPress={() => toggleAppMode('RACHMA')}
        >
          <View style={[styles.modeIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <FontAwesome name="briefcase" size={20} color="#10b981" />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeName}>Focus Rachma (Caisse)</Text>
            <Text style={styles.modeDescription}>Interface simplifiée pour les ventes rapides.</Text>
          </View>
          {appMode === 'RACHMA' && <FontAwesome name="check-circle" size={20} color="#10b981" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeOption, appMode === 'FULL' && styles.modeOptionActive]} 
          onPress={() => toggleAppMode('FULL')}
        >
          <View style={[styles.modeIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <FontAwesome name="desktop" size={20} color="#6366f1" />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeName}>Mode Gestion Complète</Text>
            <Text style={styles.modeDescription}>Tableau de bord, B2B & Caisse temps-réel.</Text>
          </View>
        </TouchableOpacity>

        {isOwnerRole && (
          <TouchableOpacity 
            style={[styles.adminLink, { borderColor: 'rgba(99, 102, 241, 0.3)', backgroundColor: 'rgba(99, 102, 241, 0.05)', marginTop: 15 }]} 
            onPress={() => { setShowSettings(false); router.push('/live'); }}
          >
            <FontAwesome name="feed" size={18} color="#6366f1" />
            <Text style={[styles.adminLinkText, { color: '#6366f1' }]}>Live Dashboard (Owner)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarItemStyle: {
          borderRadius: 15,
          marginHorizontal: 5,
          marginVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 32 : 12,
          marginHorizontal: Platform.OS === 'ios' ? 0 : 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 20,
          borderRadius: Platform.OS === 'ios' ? 0 : 24,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
        },
        headerStyle: {
          backgroundColor: '#0a0f1e',
        },
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: '800',
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, gap: 12, backgroundColor: 'transparent' }}>
            {isOwnerRole && (
              <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerIcon}>
                <FontAwesome name="cog" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout} style={styles.headerIcon}>
              <FontAwesome name="sign-out" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ),
        headerShown: true,
      }}>
      <Tabs.Screen
        name="rachma"
        options={{
          title: 'RACHMA',
          tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
          tabBarLabel: 'Rachma',
          headerShown: false,
          href: hasRachmaAccess ? '/(tabs)/rachma' : null,
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Caisse',
          tabBarIcon: ({ color }) => <TabBarIcon name="calculator" color={color} />,
          headerShown: false,
          href: hasPosAccess ? '/(tabs)/pos' : null,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Tables',
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
          headerShown: false,
          href: hasTablesAccess ? '/(tabs)/tables' : null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Finance',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
          headerShown: false,
          href: hasManagementAccess ? '/(tabs)' : null,
        }}
      />
      <Tabs.Screen
        name="stocks"
        options={{
          title: 'Gestion Pro',
          tabBarLabel: 'Gestion',
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
          href: hasManagementAccess ? '/(tabs)/stocks' : null,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'B2B',
          tabBarLabel: 'Marché',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          href: hasMarketplaceAccess ? '/(tabs)/marketplace' : null,
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Fournisseurs',
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Ventes',
          href: null,
        }}
      />
    </Tabs>

    <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderSettingsContent()}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSettings(false)}>
                <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 24,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modeOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modeDescription: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    marginTop: 10,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  radiusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  radiusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  radiusBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  adminLinkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
