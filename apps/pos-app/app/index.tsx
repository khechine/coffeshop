import React from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, Text } from 'react-native';
import { ProductCard } from '../src/components/ProductCard';
import { Cart } from '../src/components/Cart';
import { SimplisticPOS } from '../src/components/SimplisticPOS';
import { mockProducts } from '../src/data/mockProducts';
import { useCartStore } from '../src/store/useCartStore';
import { LayoutGrid, Hash } from 'lucide-react-native';
import { TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function Home() {
  const { addToCart, posMode, setPosMode } = useCartStore();
  const [navStack, setNavStack] = React.useState<string[]>([]);

  // Build Hierarchy
  const buildHierarchy = () => {
    const root: any = { sub: {}, products: [] };
    mockProducts.forEach(p => {
      const parts = (p.category || 'Autres').split(' > ').map(s => s.trim());
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Selector */}
      <View style={styles.topHeader}>
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>☕ CoffeeShop POS</Text>
        </View>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity 
            style={[styles.modeBtn, posMode === 'standard' && styles.modeBtnActive]} 
            onPress={() => setPosMode('standard')}
          >
            <LayoutGrid size={18} color={posMode === 'standard' ? '#fff' : '#4b5563'} />
            <Text style={[styles.modeBtnText, posMode === 'standard' && styles.modeBtnTextActive]}>Standard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeBtn, posMode === 'simplistic' && styles.modeBtnActive]} 
            onPress={() => setPosMode('simplistic')}
          >
            <Hash size={18} color={posMode === 'simplistic' ? '#fff' : '#4b5563'} />
            <Text style={[styles.modeBtnText, posMode === 'simplistic' && styles.modeBtnTextActive]}>Comptage Session</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {posMode === 'standard' ? (
          <>
            {/* Left Side: Product Hierarchy Grid */}
            <View style={[styles.productsArea, isMobile && styles.productsAreaMobile]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 }}>
                {navStack.length > 0 && (
                  <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Text style={{ fontSize: 18 }}>⬅️</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.welcomeText}>
                  {navStack.length === 0 ? "Ventes par ticket" : navStack.join(' › ')}
                </Text>
              </View>

              <FlatList
                data={[...subItems.map(name => ({ type: 'category', name })), ...levelProducts.map(p => ({ type: 'product', ...p }))]}
                keyExtractor={(item) => item.type === 'category' ? `cat-${item.name}` : item.id}
                numColumns={isMobile ? 2 : 3}
                key={isMobile ? `mobile-${navStack.length}` : `tablet-${navStack.length}`}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => {
                  if (item.type === 'category') {
                    return (
                      <TouchableOpacity 
                        style={styles.categoryCard} 
                        onPress={() => setNavStack([...navStack, item.name])}
                      >
                        <Text style={{ fontSize: 32, marginBottom: 8 }}>📂</Text>
                        <Text style={styles.categoryName}>{item.name}</Text>
                        <Text style={styles.categoryInfo}>Ouvrir</Text>
                      </TouchableOpacity>
                    );
                  }
                  return <ProductCard product={item} onPress={addToCart} />;
                }}
              />
            </View>

            {/* Right Side: Cart */}
            <View style={[styles.cartArea, isMobile && styles.cartAreaMobile]}>
              <Cart />
            </View>
          </>

        ) : (
          <SimplisticPOS />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3e2723',
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 4,
    borderRadius: 12,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: '#3e2723',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeBtnText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#4b5563',
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  contentMobile: {
    flexDirection: 'column',
  },
  productsArea: {
    flex: 1.8,
    backgroundColor: '#FAF8F5',
  },
  productsAreaMobile: {
    flex: 2,
  },
  welcomeText: {
    fontSize: isMobile ? 18 : 24,
    fontWeight: 'bold',
    color: '#3e2723',
    padding: isMobile ? 12 : 24,
    paddingBottom: 8,
  },
  listContainer: {
    padding: isMobile ? 8 : 16,
    alignItems: 'center',
  },
  cartArea: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  cartAreaMobile: {
    flex: 1.5,
    borderLeftWidth: 0,
    borderTopWidth: 1,
  },
  backBtn: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 12,
  },
  categoryCard: {
    width: (width - 64) / (isMobile ? 2 : 3) - 16,
    height: 140,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3e2723',
    textAlign: 'center',
  },
  categoryInfo: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '600',
  },
});


