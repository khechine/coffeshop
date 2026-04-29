import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Platform, View, TouchableOpacity, Alert, Modal, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthService } from '@/services/auth';
import { ApiService } from '@/services/api';
import i18n, { setAppLanguage } from '../../locales/i18n';
import * as Updates from 'expo-updates';

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
      i18n.t('admin.signout'),
      i18n.t('admin.signoutConfirm'),
      [
        { text: i18n.t('pos.cancel'), style: 'cancel' },
        {
          text: i18n.t('admin.signout'),
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
      i18n.t('admin.modeChanged'),
      i18n.t('admin.modeChangedMsg'),
      [{ text: i18n.t('pos.close') }]
    );
  };

  const updateRadius = async (r: number) => {
    await AuthService.setSearchRadius(r);
    setRadius(r);
  };

  const handleLanguageChange = async (lang: 'fr' | 'ar') => {
    const needsReload = await setAppLanguage(lang);
    if (needsReload) {
      Alert.alert(
        i18n.t('profile.language'),
        i18n.t('profile.languageRestartMsg'),
        [
          { text: i18n.t('profile.cancel'), style: 'cancel' },
          { text: i18n.t('profile.restart'), onPress: () => Updates.reloadAsync() }
        ]
      );
    } else {
      setShowSettings(false);
    }
  };

  const renderSettingsContent = () => {
    const segs = segments as any[];
    const isMarketplace = segs.includes('marketplace');
    const isDashboard = segs.length <= 1 || (!segs.includes('pos') && !segs.includes('tables') && !segs.includes('rachma') && !segs.includes('stocks') && !segs.includes('marketplace'));


    const handleSeedTunisia = async () => {
      if (!storeId) return;
      Alert.alert(
        i18n.t('admin.tunisiaPack'),
        i18n.t('admin.tunisiaPackConfirm'),
        [
          { text: i18n.t('pos.cancel'), style: 'cancel' },
          {
            text: i18n.t('admin.install'),
            onPress: async () => {
              try {
                setIsSeeding(true);
                const res = await ApiService.seedTunisia(storeId);
                Alert.alert(i18n.t('admin.success'), res.message);
                setShowSettings(false);
              } catch (error: any) {
                Alert.alert(i18n.t('admin.error'), error.message || i18n.t('admin.error'));
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
            <Text style={styles.modalTitle}>{i18n.t('admin.administration')}</Text>
          </View>
          <Text style={styles.modalSub}>{i18n.t('admin.adminSub')}</Text>
          
          <View style={{ gap: 10 }}>
            <TouchableOpacity 
              style={[styles.adminLink, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]} 
              onPress={handleSeedTunisia}
              disabled={isSeeding}
            >
              <FontAwesome name="magic" size={18} color="#10b981" />
              <Text style={[styles.adminLinkText, { color: '#10b981' }]}>{isSeeding ? i18n.t('admin.seeding') : i18n.t('admin.tunisiaPack')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.adminLink} onPress={() => { setShowSettings(false); router.push('/team'); }}>
              <FontAwesome name="users" size={18} color="#94a3b8" />
              <Text style={styles.adminLinkText}>{i18n.t('admin.staffMgmt')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminLink} onPress={() => { setShowSettings(false); router.push('/table-config'); }}>
              <FontAwesome name="th" size={18} color="#94a3b8" />
              <Text style={styles.adminLinkText}>{i18n.t('admin.tableConfig')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.adminLink, { borderColor: 'rgba(99, 102, 241, 0.3)', backgroundColor: 'rgba(99, 102, 241, 0.05)' }]} onPress={() => { setShowSettings(false); router.push('/live'); }}>
              <FontAwesome name="feed" size={18} color="#6366f1" />
              <Text style={[styles.adminLinkText, { color: '#6366f1' }]}>{i18n.t('admin.liveDashboardOwner')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={{ backgroundColor: 'transparent' }}>
        <View style={styles.divider} />
        <View style={styles.modalHeader}>
          <FontAwesome name="image" size={20} color={Colors.primary} />
          <Text style={[styles.modalTitle, { fontSize: 18 }]}>{i18n.t('admin.premiumWallpapers')}</Text>
        </View>
        <Text style={styles.modalSub}>{i18n.t('admin.selectStyle')}</Text>

        <TouchableOpacity 
          style={[styles.modeOption, appMode === 'RACHMA' && styles.modeOptionActive]} 
          onPress={() => toggleAppMode('RACHMA')}
        >
          <View style={[styles.modeIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <FontAwesome name="briefcase" size={20} color="#10b981" />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeName}>{i18n.t('admin.focusRachma')}</Text>
            <Text style={styles.modeDescription}>{i18n.t('admin.focusRachmaSub')}</Text>
          </View>
          {appMode === 'RACHMA' && <FontAwesome name="check-circle" size={20} color="#10b981" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeOption, appMode === 'FULL' && styles.modeOptionActive]} 
          onPress={() => toggleAppMode('FULL')}
        >
          <View style={[styles.modeIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <FontAwesome name="dashboard" size={20} color="#3b82f6" />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeName}>{i18n.t('admin.focusDashboard')}</Text>
            <Text style={styles.modeDescription}>{i18n.t('admin.focusDashboardSub')}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ marginTop: 25 }}>
          <Text style={styles.modalSub}>{i18n.t('profile.language')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={[styles.modeOption, i18n.locale === 'fr' && styles.modeOptionActive, { flex: 1, marginBottom: 0 }]} 
              onPress={() => handleLanguageChange('fr')}
            >
              <Text style={[styles.modeName, { textAlign: 'center', width: '100%' }]}>{i18n.t('profile.language_fr')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeOption, i18n.locale === 'ar' && styles.modeOptionActive, { flex: 1, marginBottom: 0 }]} 
              onPress={() => handleLanguageChange('ar')}
            >
              <Text style={[styles.modeName, { textAlign: 'center', width: '100%' }]}>{i18n.t('profile.language_ar')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
          <TouchableOpacity style={[styles.styleBtn, styles.styleBtnActive]} onPress={() => Alert.alert('Premium', i18n.t('admin.styleClassicSelected'))}>
             <Text style={styles.styleBtnText}>{i18n.t('admin.classicRachma')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.styleBtn} onPress={() => Alert.alert('Premium', i18n.t('admin.styleStandardSelected'))}>
             <Text style={styles.styleBtnText}>{i18n.t('admin.standardRachma')}</Text>
          </TouchableOpacity>
        </View>
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
        name="index"
        options={{
          title: i18n.t('nav.home'),
          tabBarLabel: i18n.t('nav.home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
        }}
        redirect={!isOwnerRole && !permissions.includes('DASHBOARD')}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: i18n.t('nav.pointOfSale'),
          tabBarLabel: i18n.t('nav.pointOfSale'),
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />,
        }}
        redirect={!hasPosAccess}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: i18n.t('nav.tables'),
          tabBarLabel: i18n.t('nav.tables'),
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
        }}
        redirect={!hasTablesAccess}
      />
      <Tabs.Screen
        name="rachma"
        options={{
          title: i18n.t('nav.live'),
          tabBarLabel: i18n.t('nav.live'),
          tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
        }}
        redirect={!hasRachmaAccess}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: i18n.t('nav.history'),
          tabBarLabel: i18n.t('nav.history'),
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
        }}
        redirect={!isOwnerRole && !permissions.includes('HISTORY')}
      />
      <Tabs.Screen
        name="stocks"
        options={{
          title: i18n.t('nav.stocks'),
          tabBarLabel: i18n.t('nav.stocks'),
          tabBarIcon: ({ color }) => <TabBarIcon name="cubes" color={color} />,
        }}
        redirect={!hasManagementAccess || isRachmaOnly}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: i18n.t('nav.marketplace'),
          tabBarLabel: i18n.t('nav.marketplace'),
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-bag" color={color} />,
        }}
        redirect={!hasMarketplaceAccess}
      />
    </Tabs>

    <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderSettingsContent()}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSettings(false)}>
                <Text style={styles.closeBtnText}>{i18n.t('pos.close')}</Text>
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 20,
  },
  modalLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  styleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  styleBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: Colors.primary,
  },
  styleBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
