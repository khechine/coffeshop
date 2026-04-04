import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { usePOSStore } from '../../store/posStore';
import { GlassPanel } from '../../components/Antigravity/GlassPanel';
import { FloatingCard } from '../../components/Antigravity/FloatingCard';
import { ProductsScreen, CategoriesScreen, StockManagementScreen, SuppliersScreen, OrdersScreen, NotificationsScreen } from '../ManagementScreens';

type ManagementTab = 'dashboard' | 'products' | 'categories' | 'stock' | 'suppliers' | 'orders' | 'notifs';

export function ManagementRoot() {
  const { userRole, theme, storeName, vendorName, logout, storeId, vendorId } = usePOSStore();
  const [activeTab, setActiveTab] = useState<ManagementTab>('dashboard');
  
  const isVendor = userRole === 'vendor';
  const isOwner = userRole === 'owner' || userRole === 'superadmin';

  const contextId = isVendor ? vendorId : storeId;

  const renderContent = () => {
    switch (activeTab) {
      case 'products': return <ProductsScreen storeId={contextId!} isVendor={isVendor} />;
      case 'categories': return <CategoriesScreen storeId={contextId!} isVendor={isVendor} />;
      case 'stock': return <StockManagementScreen storeId={storeId!} />; // Stock is typically store-centric
      case 'suppliers': return <SuppliersScreen storeId={storeId!} />;
      case 'orders': return <OrdersScreen storeId={contextId!} isVendor={isVendor} />;
      case 'notifs': return <NotificationsScreen storeId={storeId!} />;
      default: return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ padding: 12, paddingBottom: 0 }}>
        <GlassPanel intensity={40} style={{ padding: 16, borderRadius: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: theme.colors.caramel, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 }}>
                {isVendor ? 'RÉSEAU FOURNISSEUR' : 'ADMINISTRATION'}
              </Text>
              <Text style={{ color: theme.colors.cream, fontSize: 18, fontWeight: '900' }}>
                {activeTab === 'dashboard' ? (isVendor ? (vendorName || 'Fournisseur') : (storeName || 'CoffeeShop')) : activeTab.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={logout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
              <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '900' }}>QUITTER</Text>
            </TouchableOpacity>
          </View>
        </GlassPanel>
      </View>

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Navigation Footer */}
      <View style={{ padding: 12, paddingTop: 0 }}>
        <GlassPanel intensity={60} style={{ flexDirection: 'row', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: theme.colors.glassBorder }}>
          <NavBtn id="dashboard" icon="📈" label="STATS" active={activeTab === 'dashboard'} onSelect={setActiveTab} />
          {isOwner && <NavBtn id="stock" icon="📦" label="STOCK" active={activeTab === 'stock'} onSelect={setActiveTab} />}
          <NavBtn id="orders" icon="🛒" label="COMMANDES" active={activeTab === 'orders'} onSelect={setActiveTab} />
          <NavBtn id="products" icon="📋" label="CATALOGUE" active={activeTab === 'products'} onSelect={setActiveTab} />
        </GlassPanel>
      </View>
    </SafeAreaView>
  );
}

function NavBtn({ id, icon, label, active, onSelect }: any) {
  const { theme } = usePOSStore();
  return (
    <TouchableOpacity onPress={() => onSelect(id)} style={{ alignItems: 'center', flex: 1, paddingVertical: 8, backgroundColor: active ? 'rgba(212, 132, 70, 0.1)' : 'transparent', borderRadius: 12, marginHorizontal: 4 }}>
      <Text style={{ fontSize: 18, opacity: active ? 1 : 0.4 }}>{icon}</Text>
      <Text style={{ fontSize: 8, fontWeight: '900', color: active ? theme.colors.caramel : theme.colors.creamMuted, letterSpacing: 1 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SummaryCard({ title, value, theme }: any) {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.colors.surface, 
      padding: 16, 
      borderRadius: 20, 
      borderWidth: 1, 
      borderColor: theme.colors.glassBorder,
      ...(theme.shadows.floating as any)
    }}>
      <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}>{title}</Text>
      <Text style={{ color: theme.colors.cream, fontSize: 20, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

function DashboardView({ onNavigate }: { onNavigate: (tab: ManagementTab) => void }) {
  const { theme, userRole } = usePOSStore();
  const isVendor = userRole === 'vendor';

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ color: theme.colors.cream, fontSize: 24, fontWeight: '900', marginBottom: 4 }}>Bonjour,</Text>
      <Text style={{ color: theme.colors.caramel, fontSize: 13, marginBottom: 24 }}>Voici l'état de votre activité aujourd'hui.</Text>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <SummaryCard title="VENTES DU JOUR" value="0.000 DT" theme={theme} />
        <SummaryCard title="COMMANDES" value="0" theme={theme} />
      </View>

      <Text style={{ color: theme.colors.cream, fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 12 }}>Raccourcis de gestion</Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <MenuCard icon="🏷️" label="Catégories" onPress={() => onNavigate('categories')} />
        <MenuCard icon="👥" label="Fournisseurs" onPress={() => onNavigate('suppliers')} />
        <MenuCard icon="🔔" label="Alertes" onPress={() => onNavigate('notifs')} />
        <MenuCard icon="⚙️" label="Paramètres" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

function MenuCard({ icon, label, onPress }: any) {
  const { theme } = usePOSStore();
  return (
    <TouchableOpacity onPress={onPress} style={{ width: '48%', backgroundColor: theme.colors.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.glassBorder, alignItems: 'center' }}>
      <Text style={{ fontSize: 28, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ color: theme.colors.cream, fontWeight: '800', fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}
