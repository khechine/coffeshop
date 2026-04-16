import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { usePOSStore } from '../../store/posStore';
import { GlassPanel } from '../../components/Antigravity/GlassPanel';
import { ProductsScreen, CategoriesScreen, StockManagementScreen, SuppliersScreen, OrdersScreen, NotificationsScreen } from '../ManagementScreens';
import { MarketplaceScreen } from '../MarketplaceScreen';

type ManagementTab = 'dashboard' | 'products' | 'categories' | 'stock' | 'suppliers' | 'orders' | 'notifs' | 'marketplace';

export function ManagementRoot() {
  const { userRole, theme, storeName, vendorName, logout, storeId, vendorId } = usePOSStore();
  const [activeTab, setActiveTab] = useState<ManagementTab>('dashboard');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);

  const isVendor = userRole === 'vendor';
  const isOwner = userRole === 'owner' || userRole === 'superadmin';
  const contextId = isVendor ? vendorId : storeId;

  // Polling for new orders (Vendor only)
  useEffect(() => {
    if (!isVendor || !vendorId) return;

    const fetchData = async () => {
      try {
        const [ordersRes, prodsRes] = await Promise.all([
          fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/management/vendor/orders/${vendorId}`),
          fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/management/marketplace/products?vendorId=${vendorId}`)
        ]);
        
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setPendingOrdersCount(orders.filter((o: any) => o.status === 'PENDING').length);
        }
        
        if (prodsRes.ok) {
          const products = await prodsRes.json();
          setProductsCount(products.length);
        }
      } catch (e) { /* silent */ }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // every 30s
    return () => clearInterval(interval);
  }, [isVendor, vendorId]);

  const renderContent = () => {
    switch (activeTab) {
      case 'products': return <ProductsScreen storeId={contextId!} isVendor={isVendor} />;
      case 'categories': return <CategoriesScreen storeId={contextId!} isVendor={isVendor} />;
      case 'stock': return <StockManagementScreen storeId={storeId!} />;
      case 'suppliers': return <SuppliersScreen storeId={storeId!} />;
      case 'orders': return <OrdersScreen storeId={contextId!} isVendor={isVendor} />;
      case 'notifs': return <NotificationsScreen storeId={storeId!} />;
      case 'marketplace': return <MarketplaceScreen storeId={storeId!} />;
      default: return isVendor ? <VendorDashboardView onNavigate={setActiveTab} pendingCount={pendingOrdersCount} productsCount={productsCount} /> : <OwnerDashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 0 }}>
        <GlassPanel intensity={40} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.glassBorder }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              {isVendor && (
                <View style={{ backgroundColor: `${theme.colors.caramel}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: `${theme.colors.caramel}40` }}>
                  <Text style={{ color: theme.colors.caramel, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>B2B</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 1 }}>
                  {isVendor ? 'FOURNISSEUR' : 'ADMINISTRATION'}
                </Text>
                <Text style={{ color: theme.colors.cream, fontSize: 17, fontWeight: '900' }} numberOfLines={1}>
                    {activeTab === 'dashboard'
                    ? (isVendor ? (vendorName || 'Fournisseur') : (storeName || 'CoffeeShop'))
                    : (['products','categories','stock','suppliers','orders','notifs','marketplace'] as ManagementTab[]).find(t => t === activeTab)
                        ? ({products:'Catalogue',categories:'Catégories',stock:'Stock',suppliers:'Fournisseurs',orders:'Commandes',notifs:'Alertes',marketplace:'Marketplace'} as any)[activeTab]
                        : activeTab.toUpperCase()
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={logout}
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '900' }}>QUITTER</Text>
            </TouchableOpacity>
          </View>
        </GlassPanel>

        {isVendor && pendingOrdersCount > 0 && activeTab !== 'orders' && (
          <TouchableOpacity 
            onPress={() => setActiveTab('orders')}
            style={{ 
              marginTop: 10, backgroundColor: theme.colors.caramel, borderRadius: 12, padding: 12, 
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              shadowColor: theme.colors.caramel, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
            }}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>
              {pendingOrdersCount} {pendingOrdersCount > 1 ? 'NOUVELLES COMMANDES' : 'NOUVELLE COMMANDE'} !
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Navigation Footer */}
      <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 }}>
        <GlassPanel intensity={60} style={{ flexDirection: 'row', height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: theme.colors.glassBorder }}>
          <NavBtn id="dashboard" icon="📈" label="STATS" active={activeTab === 'dashboard'} onSelect={setActiveTab} />
          {isOwner && <NavBtn id="stock" icon="📦" label="STOCK" active={activeTab === 'stock'} onSelect={setActiveTab} />}
          <NavBtn id="orders" icon="🛒" label="COMMANDES" active={activeTab === 'orders'} onSelect={setActiveTab} />
          <NavBtn id="products" icon="📋" label="CATALOGUE" active={activeTab === 'products'} onSelect={setActiveTab} />
          {/* Catégories : lecture seule pour vendor, gestion pour owner */}
          <NavBtn id="categories" icon="🏷️" label="CATÉGORIES" active={activeTab === 'categories'} onSelect={setActiveTab} />
        </GlassPanel>
      </View>
    </SafeAreaView>
  );
}

function NavBtn({ id, icon, label, active, onSelect }: any) {
  const { theme } = usePOSStore();
  return (
    <TouchableOpacity
      onPress={() => onSelect(id)}
      style={{ alignItems: 'center', flex: 1, paddingVertical: 8, backgroundColor: active ? `${theme.colors.caramel}15` : 'transparent', borderRadius: 12, marginHorizontal: 3 }}
    >
      <Text style={{ fontSize: 18, opacity: active ? 1 : 0.35 }}>{icon}</Text>
      <Text style={{ fontSize: 7, fontWeight: '900', color: active ? theme.colors.caramel : theme.colors.creamMuted, letterSpacing: 0.5, marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function KpiCard({ label, value, sub, color, icon }: any) {
  const { theme } = usePOSStore();
  return (
    <View style={{
      flex: 1, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 18,
      borderWidth: 1, borderColor: theme.colors.glassBorder, ...(theme.shadows.floating as any)
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${color}18`, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
        <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, flex: 1 }}>{label}</Text>
      </View>
      <Text style={{ color, fontSize: 26, fontWeight: '900', marginBottom: 2 }}>{value}</Text>
      {sub && <Text style={{ color: theme.colors.creamMuted, fontSize: 11 }}>{sub}</Text>}
    </View>
  );
}

function QuickActionBtn({ icon, label, color, onPress }: any) {
  const { theme } = usePOSStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: theme.colors.glassBorder, marginBottom: 10,
        ...(theme.shadows.floating as any)
      }}
      activeOpacity={0.75}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${color}18`, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={{ color: theme.colors.cream, fontWeight: '700', fontSize: 15, flex: 1 }}>{label}</Text>
      <Text style={{ color: theme.colors.creamMuted, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

function OwnerDashboardView({ onNavigate }: { onNavigate: (tab: ManagementTab) => void }) {
  const { theme } = usePOSStore();

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: theme.colors.cream, fontSize: 22, fontWeight: '900', marginBottom: 2 }}>Bonjour 👋</Text>
      <Text style={{ color: theme.colors.creamMuted, fontSize: 13, marginBottom: 20 }}>Voici l'état de votre activité aujourd'hui.</Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <KpiCard label="VENTES DU JOUR" value="—" sub="En attente de sync" color={theme.colors.caramel} icon="💰" />
        <KpiCard label="COMMANDES" value="0" sub="Actives" color={theme.colors.softOrange} icon="🛒" />
      </View>

      <Text style={{ color: theme.colors.cream, fontSize: 15, fontWeight: '800', marginBottom: 12 }}>Gestion rapide</Text>
      <QuickActionBtn icon="📋" label="Gérer le catalogue" color={theme.colors.caramel} onPress={() => onNavigate('products')} />
      <QuickActionBtn icon="🏷️" label="Catégories & Menus" color={theme.colors.softOrange} onPress={() => onNavigate('categories')} />
      <QuickActionBtn icon="👥" label="Fournisseurs" color="#8B5CF6" onPress={() => onNavigate('suppliers')} />
      <QuickActionBtn icon="🛍️" label="B2B Marketplace" color={theme.colors.caramel} onPress={() => onNavigate('marketplace')} />
      <QuickActionBtn icon="🔔" label="Alertes stock" color="#EF4444" onPress={() => onNavigate('notifs')} />
    </ScrollView>
  );
}

function VendorDashboardView({ onNavigate, pendingCount, productsCount }: { onNavigate: (tab: ManagementTab) => void, pendingCount: number, productsCount: number }) {
  const { theme, vendorName } = usePOSStore();

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {pendingCount > 0 && (
        <TouchableOpacity 
          onPress={() => onNavigate('orders')}
          style={{
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            borderRadius: 20, padding: 16, marginBottom: 20,
            borderWidth: 2, borderColor: theme.colors.caramel,
            flexDirection: 'row', alignItems: 'center', gap: 12
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.caramel, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>🛒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.caramel, fontWeight: '900', fontSize: 16 }}>Nouvelle commande !</Text>
            <Text style={{ color: theme.colors.creamMuted, fontSize: 12 }}>Vous avez {pendingCount} {pendingCount > 1 ? 'commandes' : 'commande'} en attente.</Text>
          </View>
          <Text style={{ color: theme.colors.caramel, fontWeight: '900' }}>VOIR ›</Text>
        </TouchableOpacity>
      )}

      {/* Welcome banner */}
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 20, padding: 20, marginBottom: 20,
        borderWidth: 1, borderColor: theme.colors.glassBorder,
        ...(theme.shadows.floating as any)
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <View style={{ backgroundColor: `${theme.colors.caramel}20`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: `${theme.colors.caramel}40` }}>
            <Text style={{ color: theme.colors.caramel, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>FOURNISSEUR B2B</Text>
          </View>
        </View>
        <Text style={{ color: theme.colors.cream, fontSize: 20, fontWeight: '900', marginBottom: 2 }}>
          {vendorName || 'Espace Fournisseur'}
        </Text>
        <Text style={{ color: theme.colors.creamMuted, fontSize: 13 }}>Gérez votre catalogue et vos expéditions B2B.</Text>
      </View>

      {/* KPIs */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <KpiCard label="COMMANDES" value={pendingCount > 0 ? String(pendingCount) : '0'} sub="À traiter" color={pendingCount > 0 ? theme.colors.caramel : theme.colors.creamMuted} icon="📦" />
        <KpiCard label="CATALOGUE" value={String(productsCount)} sub="Produits actifs" color={theme.colors.softOrange} icon="📋" />
      </View>

      {/* Quick actions */}
      <Text style={{ color: theme.colors.cream, fontSize: 15, fontWeight: '800', marginBottom: 12 }}>Actions rapides</Text>
      <QuickActionBtn icon="📋" label="Gérer mon catalogue" color={theme.colors.caramel} onPress={() => onNavigate('products')} />
      <QuickActionBtn icon="🛒" label="Voir les commandes B2B" color={theme.colors.softOrange} onPress={() => onNavigate('orders')} />
      <QuickActionBtn icon="🏷️" label="Hiérarchie des catégories" color="#8B5CF6" onPress={() => onNavigate('categories')} />
    </ScrollView>
  );
}

