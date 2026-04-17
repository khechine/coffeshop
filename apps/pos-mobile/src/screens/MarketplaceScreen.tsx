import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Modal, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { usePOSStore } from '../store/posStore';
import { useConfirm } from '../context/ConfirmContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type SortOption = 'none' | 'price_asc' | 'price_desc' | 'newest';

export function MarketplaceScreen({ storeId }: { storeId: string }) {
  const { theme, mktCart, addToMktCart, removeFromMktCart, deleteItemFromMktCart, clearMktCart, submitMktOrders } = usePOSStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Browsing State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Modals & Selections
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorFilterId, setVendorFilterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters State
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('none');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const { alert, confirm } = useConfirm();

  const mStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 20, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: '900', color: theme.colors.cream, marginBottom: 4 },
    subtitle: { fontSize: 14, color: theme.colors.caramel, marginBottom: 15 },
    
    searchContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    searchBar: { 
      flex: 1, backgroundColor: theme.colors.surface, 
      borderRadius: 15, padding: 12, color: theme.colors.cream, 
      borderWidth: 1, borderColor: theme.colors.glassBorder,
    },
    filterBtn: {
      backgroundColor: theme.colors.surface, borderRadius: 15, padding: 12,
      borderWidth: 1, borderColor: theme.colors.glassBorder, justifyContent: 'center', alignItems: 'center'
    },
    filterBtnActive: { borderColor: theme.colors.caramel, backgroundColor: `${theme.colors.caramel}20` },

    catScroll: { marginBottom: 20 },
    catChip: { 
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
      backgroundColor: theme.colors.surface, marginRight: 8,
      borderWidth: 1, borderColor: theme.colors.glassBorder
    },
    catChipActive: { backgroundColor: theme.colors.caramel, borderColor: theme.colors.caramel },
    catText: { color: theme.colors.cream, fontWeight: '700', fontSize: 13 },
    catTextActive: { color: theme.colors.background },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
    card: { 
      width: '47%', backgroundColor: theme.colors.surface, borderRadius: 20, 
      overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glassBorder
    },
    cardImage: { width: '100%', height: 140, backgroundColor: theme.colors.background },
    cardInfo: { padding: 12 },
    cardVendor: { fontSize: 10, fontWeight: '800', color: theme.colors.caramel, textTransform: 'uppercase', marginBottom: 4 },
    cardName: { fontSize: 14, fontWeight: '700', color: theme.colors.cream, marginBottom: 6, height: 36 },
    cardPrice: { fontSize: 16, fontWeight: '900', color: theme.colors.cream },
    cardUnit: { fontSize: 11, color: theme.colors.creamMuted },
    
    floatingCart: { 
      position: 'absolute', bottom: 20, right: 20, left: 20, 
      backgroundColor: theme.colors.caramel, borderRadius: 16, 
      padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
    },
    cartText: { color: theme.colors.background, fontWeight: '900', fontSize: 16 },
    cartCount: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    
    modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { 
      backgroundColor: theme.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, 
      padding: 24, maxHeight: '85%', borderTopWidth: 1, borderColor: theme.colors.glassBorder
    },
    modalContentFull: {
      backgroundColor: theme.colors.surface, flex: 1, marginTop: Platform.OS === 'ios' ? 40 : 0,
      borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden'
    },
    modalTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.cream, marginBottom: 20 },
    
    // Product Fiche Specifics
    pfImageScroll: { height: 300, backgroundColor: theme.colors.background },
    pfImage: { width: SCREEN_WIDTH, height: 300, resizeMode: 'contain' },
    pfHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder },
    pfVendorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    pfVendorBadge: { backgroundColor: `${theme.colors.caramel}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pfVendorText: { color: theme.colors.caramel, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    pfName: { fontSize: 26, fontWeight: '900', color: theme.colors.cream, marginBottom: 10 },
    pfPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    pfPrice: { fontSize: 28, fontWeight: '900', color: theme.colors.caramel },
    pfUnit: { fontSize: 14, color: theme.colors.creamMuted, marginBottom: 4 },
    pfSection: { padding: 20 },
    pfSectionTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.cream, marginBottom: 10 },
    pfDesc: { fontSize: 14, color: theme.colors.creamMuted, lineHeight: 22 },
    pfBottomBar: { 
      padding: 20, backgroundColor: theme.colors.surfaceLight, borderTopWidth: 1, borderTopColor: theme.colors.glassBorder,
      flexDirection: 'row', gap: 15, alignItems: 'center'
    },
    pfQtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glassBorder },
    pfQtyBtn: { padding: 15, alignItems: 'center', justifyContent: 'center' },
    pfQtyBtnText: { color: theme.colors.cream, fontSize: 20, fontWeight: '900' },
    pfQtyVal: { paddingHorizontal: 20 },
    pfQtyValText: { color: theme.colors.caramel, fontSize: 18, fontWeight: '900' },
    pfAddBtn: { flex: 1, backgroundColor: theme.colors.caramel, borderRadius: 15, padding: 16, alignItems: 'center', justifyContent: 'center' },
    pfAddBtnText: { color: theme.colors.background, fontWeight: '900', fontSize: 16 },

    // Vendor Profile Specifics
    vpCover: { height: 120, backgroundColor: theme.colors.caramel, marginBottom: 50 },
    vpAvatarWrapper: { 
      position: 'absolute', top: 70, left: 20, width: 90, height: 90, borderRadius: 45, 
      backgroundColor: theme.colors.surface, borderWidth: 4, borderColor: theme.colors.surface,
      justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
    },
    vpAvatarText: { fontSize: 32 },
    vpBody: { paddingHorizontal: 20, paddingBottom: 20 },
    vpName: { fontSize: 24, fontWeight: '900', color: theme.colors.cream, marginBottom: 5 },
    vpTagline: { fontSize: 13, color: theme.colors.creamMuted, marginBottom: 20 },
    vpInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    vpInfoBox: { width: '48%', backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.glassBorder },
    vpInfoLabel: { color: theme.colors.caramel, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
    vpInfoValue: { color: theme.colors.cream, fontSize: 13 },
    vpActionBtn: { backgroundColor: theme.colors.caramel, padding: 15, borderRadius: 15, alignItems: 'center' },

    // Filters
    fRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    fLabel: { color: theme.colors.cream, fontSize: 16, fontWeight: '800' },
    fInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fInput: { flex: 1, backgroundColor: theme.colors.background, color: theme.colors.cream, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.glassBorder },
    fSortBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.glassBorder, marginBottom: 10 },
    fSortBtnActive: { borderColor: theme.colors.caramel, backgroundColor: `${theme.colors.caramel}20` },
    fSortText: { color: theme.colors.cream, fontSize: 14, fontWeight: '600' },
    fSortTextActive: { color: theme.colors.caramel }

  }), [theme]);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`${API_URL}/management/marketplace/products`),
          fetch(`${API_URL}/management/marketplace/categories`)
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (cRes.ok) setCategories(await cRes.json());
      } catch (e) { console.warn("Marketplace fetch error", e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !activeCategory || p.categoryId === activeCategory || p.subcategoryId === activeCategory;
      const matchesVendor = !vendorFilterId || p.vendorId === vendorFilterId;
      
      const price = Number(p.price || 0);
      const matchesMin = !minPrice || price >= Number(minPrice);
      const matchesMax = !maxPrice || price <= Number(maxPrice);
      
      return matchesSearch && matchesCat && matchesVendor && matchesMin && matchesMax;
    });

    if (sortOption === 'price_asc') result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortOption === 'price_desc') result.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortOption === 'newest') result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return result;
  }, [products, search, activeCategory, vendorFilterId, minPrice, maxPrice, sortOption]);

  // Cart computed
  const itemsInCart = useMemo(() => products.filter(p => mktCart[p.id]).map(p => ({ ...p, quantity: mktCart[p.id] })), [products, mktCart]);
  const cartByVendor = useMemo(() => {
    const grouped: Record<string, { vendorName: string, items: any[], total: number }> = {};
    itemsInCart.forEach(item => {
      const vId = item.vendorId;
      const vName = item.vendor?.companyName || item.vendorName || 'Fournisseur';
      if (!grouped[vId]) grouped[vId] = { vendorName: vName, items: [], total: 0 };
      grouped[vId].items.push(item);
      grouped[vId].total += Number(item.price || 0) * Number(item.quantity || 0);
    });
    return grouped;
  }, [itemsInCart]);
  const totalCartPrice = itemsInCart.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    let allSuccess = true;
    for (const [vId, group] of Object.entries(cartByVendor)) {
      const ok = await submitMktOrders(vId, group.items, group.total);
      if (!ok) allSuccess = false;
    }
    
    if (allSuccess) {
      alert("Succès", "Vos commandes ont été transmises aux fournisseurs.");
      clearMktCart();
      setIsCartVisible(false);
    } else {
      alert("Attention", "Certaines commandes n'ont pas pu être transmises.");
    }
    setIsSubmitting(false);
  };

  // Helper to get multiple images for carousel simulation (since API currently returns 1 image string)
  const getSimulatedImages = (product: any) => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    const baseImg = product.image || 'https://via.placeholder.com/400';
    // Return 3 copies for pagination dummy testing if only 1 image exists
    return [baseImg, baseImg, baseImg];
  };

  if (loading) return <View style={mStyles.container}><ActivityIndicator color={theme.colors.caramel} style={{ marginTop: 100 }} /></View>;

  return (
    <View style={mStyles.container}>
      <ScrollView bounces={false}>
        <View style={mStyles.header}>
          <Text style={mStyles.title}>Marketplace</Text>
          <Text style={mStyles.subtitle}>Sourcing & Commandes B2B</Text>
          
          <View style={mStyles.searchContainer}>
            <TextInput 
              style={mStyles.searchBar} 
              placeholder="Rechercher un produit, une marque..." 
              placeholderTextColor={theme.colors.creamMuted}
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity 
              style={[mStyles.filterBtn, (minPrice || maxPrice || sortOption !== 'none') && mStyles.filterBtnActive]} 
              onPress={() => setIsFilterVisible(true)}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mStyles.catScroll}>
            <TouchableOpacity 
              style={[mStyles.catChip, !activeCategory && mStyles.catChipActive]}
              onPress={() => setActiveCategory(null)}
            >
              <Text style={[mStyles.catText, !activeCategory && mStyles.catTextActive]}>Tous</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[mStyles.catChip, activeCategory === cat.id && mStyles.catChipActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[mStyles.catText, activeCategory === cat.id && mStyles.catTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={mStyles.grid}>
          {filteredProducts.map(product => {
            const vName = product.vendor?.companyName || product.vendorName || 'FOURNISSEUR';
            return (
              <View key={product.id} style={mStyles.card}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => setSelectedProduct(product)}
                >
                  <Image source={{ uri: product.image || 'https://via.placeholder.com/150' }} style={mStyles.cardImage} />
                </TouchableOpacity>
                <View style={mStyles.cardInfo}>
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => setSelectedVendor(product.vendor || { companyName: vName, user: product.user, phone: product.phone, address: product.address })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={mStyles.cardVendor}>{vName}</Text>
                  </TouchableOpacity>
                  <Text style={mStyles.cardName} numberOfLines={2}>{product.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text style={mStyles.cardPrice}>{Number(product.price || 0).toFixed(3)} DT</Text>
                    <Text style={mStyles.cardUnit}>/ {product.unit}</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FLOATING CART SUMMARY */}
      {itemsInCart.length > 0 && !selectedProduct && !selectedVendor && !isFilterVisible && (
        <TouchableOpacity style={mStyles.floatingCart} onPress={() => setIsCartVisible(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={mStyles.cartCount}><Text style={{ color: '#FFF', fontWeight: '900' }}>{itemsInCart.length}</Text></View>
            <Text style={mStyles.cartText}>Voir le panier</Text>
          </View>
          <Text style={mStyles.cartText}>{Number(totalCartPrice).toFixed(3)} DT</Text>
        </TouchableOpacity>
      )}

      {/* VENDOR FILTER BADGE */}
      {vendorFilterId && (
        <TouchableOpacity 
          style={{ 
            position: 'absolute', top: 180, right: 20, 
            backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, 
            borderRadius: 10, borderWidth: 1, borderColor: theme.colors.caramel,
            flexDirection: 'row', alignItems: 'center', gap: 8
          }}
          onPress={() => setVendorFilterId(null)}
        >
          <Text style={{ color: theme.colors.caramel, fontSize: 10, fontWeight: '900' }}>Filtre Vendeur Actif</Text>
          <Text style={{ color: '#EF4444', fontWeight: '900' }}>✕</Text>
        </TouchableOpacity>
      )}

      {/* FILTERS MODAL */}
      <Modal visible={isFilterVisible} transparent animationType="slide" onRequestClose={() => setIsFilterVisible(false)}>
        <TouchableOpacity style={mStyles.modal} activeOpacity={1} onPress={() => setIsFilterVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={mStyles.modalContent}>
            <Text style={mStyles.modalTitle}>Filtres & Tri</Text>
            
            <View style={{ marginBottom: 25 }}>
              <Text style={mStyles.fLabel}>Trier par</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                {(['none', 'price_asc', 'price_desc', 'newest'] as SortOption[]).map(opt => (
                  <TouchableOpacity 
                    key={opt}
                    onPress={() => setSortOption(opt)}
                    style={[mStyles.fSortBtn, sortOption === opt && mStyles.fSortBtnActive]}
                  >
                    <Text style={[mStyles.fSortText, sortOption === opt && mStyles.fSortTextActive]}>
                      {opt === 'none' ? 'Pertinence' : opt === 'price_asc' ? 'Prix croissant' : opt === 'price_desc' ? 'Prix décroissant' : 'Nouveautés'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 25 }}>
              <Text style={[mStyles.fLabel, { marginBottom: 10 }]}>Fourchette de prix (DT)</Text>
              <View style={mStyles.fInputRow}>
                <TextInput 
                  style={mStyles.fInput} 
                  placeholder="Min" placeholderTextColor={theme.colors.creamMuted}
                  keyboardType="numeric" value={minPrice} onChangeText={setMinPrice}
                />
                <Text style={{ color: theme.colors.cream }}>à</Text>
                <TextInput 
                  style={mStyles.fInput} 
                  placeholder="Max" placeholderTextColor={theme.colors.creamMuted}
                  keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity 
                style={[mStyles.vfBtn, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.glassBorder, padding: 15, borderRadius: 15, alignItems: 'center' }]}
                onPress={() => { setMinPrice(''); setMaxPrice(''); setSortOption('none'); setVendorFilterId(null); setIsFilterVisible(false); }}
              >
                <Text style={{ color: theme.colors.cream, fontWeight: '700' }}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[mStyles.vfBtn, { flex: 1, backgroundColor: theme.colors.caramel, padding: 15, borderRadius: 15, alignItems: 'center' }]}
                onPress={() => setIsFilterVisible(false)}
              >
                <Text style={{ color: theme.colors.background, fontWeight: '900' }}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* FICHE PRODUIT MODAL */}
      <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
        <View style={mStyles.modalContentFull}>
          <ScrollView bounces={false}>
            {/* Header / Dismiss */}
            <TouchableOpacity 
              style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setSelectedProduct(null)}
            >
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>

            {/* Image Carousel (Paging) */}
            <View style={mStyles.pfImageScroll}>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {getSimulatedImages(selectedProduct).map((imgUrl, idx) => (
                  <Image key={idx} source={{ uri: imgUrl }} style={mStyles.pfImage} />
                ))}
              </ScrollView>
              {getSimulatedImages(selectedProduct).length > 1 && (
                <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                  {getSimulatedImages(selectedProduct).map((_, idx) => (
                    <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' }} />
                  ))}
                </View>
              )}
            </View>

            <View style={mStyles.pfHeader}>
              <TouchableOpacity 
                style={mStyles.pfVendorRow}
                onPress={() => {
                  const vName = selectedProduct?.vendor?.companyName || selectedProduct?.vendorName || 'FOURNISSEUR';
                  setSelectedVendor(selectedProduct?.vendor || { companyName: vName });
                }}
              >
                <View style={mStyles.pfVendorBadge}><Text style={mStyles.pfVendorText}>Vendu par</Text></View>
                <Text style={{ color: theme.colors.cream, fontSize: 13, fontWeight: '700' }}>
                  {selectedProduct?.vendor?.companyName || selectedProduct?.vendorName || 'FOURNISSEUR'} ›
                </Text>
              </TouchableOpacity>
              
              <Text style={mStyles.pfName}>{selectedProduct?.name}</Text>
              <View style={mStyles.pfPriceRow}>
                <Text style={mStyles.pfPrice}>{Number(selectedProduct?.price || 0).toFixed(3)}</Text>
                <Text style={mStyles.pfUnit}>DT / {selectedProduct?.unit}</Text>
              </View>
            </View>

            <View style={mStyles.pfSection}>
              <Text style={mStyles.pfSectionTitle}>Description détaillée</Text>
              <Text style={mStyles.pfDesc}>
                {selectedProduct?.description || "Ce fournisseur n'a pas encore ajouté de description détaillée pour ce produit. Les spécifications techniques complètes sont disponibles sur demande."}
              </Text>
            </View>

            <View style={[mStyles.pfSection, { backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 10, marginBottom: 40 }]}>
              <Text style={mStyles.pfSectionTitle}>Spécifications</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder }}>
                <Text style={{ color: theme.colors.creamMuted }}>Catégorie</Text>
                <Text style={{ color: theme.colors.cream, fontWeight: '700' }}>{categories.find(c => c.id === selectedProduct?.categoryId)?.name || 'Standard'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder }}>
                <Text style={{ color: theme.colors.creamMuted }}>Conditionnement</Text>
                <Text style={{ color: theme.colors.cream, fontWeight: '700' }}>{selectedProduct?.unit}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ color: theme.colors.creamMuted }}>Commande Minimum</Text>
                <Text style={{ color: theme.colors.cream, fontWeight: '700' }}>{selectedProduct?.minOrderQty || 1} {selectedProduct?.unit}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={mStyles.pfBottomBar}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingRight: 10 }}>
                <TouchableOpacity style={mStyles.pfQtyBtn} onPress={() => removeFromMktCart(selectedProduct?.id, selectedProduct?.minOrderQty || 1, selectedProduct?.minOrderQty || 1)}>
                  <Text style={{ color: theme.colors.cream, fontSize: 18, fontWeight: '900' }}>-</Text>
                </TouchableOpacity>
                <Text style={{ color: mktCart[selectedProduct?.id] ? theme.colors.caramel : theme.colors.creamMuted, fontSize: 18, fontWeight: '900' }}>
                  {mktCart[selectedProduct?.id] || 0}
                </Text>
                <TouchableOpacity style={mStyles.pfQtyBtn} onPress={() => addToMktCart(selectedProduct?.id, selectedProduct?.minOrderQty || 1)}>
                  <Text style={{ color: theme.colors.cream, fontSize: 18, fontWeight: '900' }}>+</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[mStyles.pfAddBtn, { flex: 1, marginLeft: 10 }, mktCart[selectedProduct?.id] ? { backgroundColor: theme.colors.success } : {}]}
                onPress={() => {
                  if (!mktCart[selectedProduct?.id]) addToMktCart(selectedProduct?.id, selectedProduct?.minOrderQty || 1);
                  setIsCartVisible(true);
                }}
              >
                <Text style={mStyles.pfAddBtnText}>Acheter</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FICHE VENDEUR MODAL */}
      <Modal visible={!!selectedVendor} transparent animationType="slide" onRequestClose={() => setSelectedVendor(null)}>
        <View style={mStyles.modalContentFull}>
          <ScrollView bounces={false}>
            <TouchableOpacity 
              style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setSelectedVendor(null)}
            >
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>

            <View style={mStyles.vpCover}>
              {/* Cover pattern or solid color */}
            </View>
            <View style={mStyles.vpAvatarWrapper}>
              <Text style={mStyles.vpAvatarText}>{selectedVendor?.companyName?.charAt(0) || '🏢'}</Text>
            </View>

            <View style={mStyles.vpBody}>
              <Text style={mStyles.vpName}>{selectedVendor?.companyName}</Text>
              <Text style={mStyles.vpTagline}>Partenaire Fournisseur Certifié B2B</Text>

              <View style={mStyles.vpInfoGrid}>
                <View style={mStyles.vpInfoBox}>
                  <Text style={mStyles.vpInfoLabel}>Email de contact</Text>
                  <Text style={mStyles.vpInfoValue} numberOfLines={1} adjustsFontSizeToFit>{selectedVendor?.user?.email || 'Non renseigné'}</Text>
                </View>
                <View style={mStyles.vpInfoBox}>
                  <Text style={mStyles.vpInfoLabel}>Téléphone</Text>
                  <Text style={mStyles.vpInfoValue}>{selectedVendor?.phone || 'Non renseigné'}</Text>
                </View>
                <View style={[mStyles.vpInfoBox, { width: '100%' }]}>
                  <Text style={mStyles.vpInfoLabel}>Adresse du Siège</Text>
                  <Text style={mStyles.vpInfoValue}>
                    {selectedVendor?.address || 'Adresse non renseignée'}
                    {selectedVendor?.city ? `\n${selectedVendor.city}` : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={mStyles.vpActionBtn}
                onPress={() => {
                  if (selectedVendor?.id) {
                    setVendorFilterId(selectedVendor.id);
                    setSelectedVendor(null);
                    setSelectedProduct(null); // Close product if open
                  } else {
                    alert("Info", "Ce vendeur n'a pas encore de profil achevé.");
                  }
                }}
              >
                <Text style={{ color: theme.colors.background, fontWeight: '900', fontSize: 16 }}>Parcourir son catalogue complet</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* CART MODAL */}
      <Modal visible={isCartVisible} transparent animationType="slide" onRequestClose={() => setIsCartVisible(false)}>
        <TouchableOpacity style={mStyles.modal} activeOpacity={1} onPress={() => setIsCartVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={mStyles.modalContent}>
            <Text style={mStyles.modalTitle}>Récapitulatif Sourcing</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(cartByVendor).map(([vId, group]) => (
                <View key={vId} style={mStyles.vendorOrder}>
                  <Text style={mStyles.vendorTitle}>Fournisseur: {group.vendorName}</Text>
                  {group.items.map(item => (
                    <View key={item.id} style={{ marginBottom: 12 }}>
                      <View style={mStyles.orderItem}>
                        <Text style={[mStyles.orderItemText, { fontWeight: '700' }]}>{item.name}</Text>
                        <Text style={mStyles.orderItemPrice}>{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(3)} DT</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <TouchableOpacity 
                          onPress={() => removeFromMktCart(item.id, item.minOrderQty || 1, item.minOrderQty || 1)}
                          style={{ width: 28, height: 28, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glassBorder }}
                        >
                          <Text style={{ color: theme.colors.cream, fontSize: 16, fontWeight: '900' }}>-</Text>
                        </TouchableOpacity>
                        <Text style={{ color: theme.colors.caramel, fontWeight: '900', fontSize: 14 }}>{item.quantity}</Text>
                        <TouchableOpacity 
                          onPress={() => addToMktCart(item.id, item.minOrderQty || 1)}
                          style={{ width: 28, height: 28, backgroundColor: 'rgba(212, 132, 70, 0.2)', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.caramel }}
                        >
                          <Text style={{ color: theme.colors.caramel, fontSize: 16, fontWeight: '900' }}>+</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity 
                          onPress={() => deleteItemFromMktCart(item.id)}
                          style={{ padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}
                        >
                          <Text style={{ fontSize: 12 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <View style={mStyles.orderTotal}>
                    <Text style={mStyles.orderTotalText}>Total Fournisseur</Text>
                    <Text style={mStyles.orderTotalText}>{Number(group.total).toFixed(3)} DT</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity 
                style={[mStyles.floatingCart, { position: 'relative', bottom: 0, right: 0, left: 0, opacity: isSubmitting ? 0.6 : 1 }]}
                onPress={handleCheckout}
                disabled={isSubmitting}
              >
                <Text style={mStyles.cartText}>{isSubmitting ? "Envoi en cours..." : "Confirmer et Commander"}</Text>
                <Text style={mStyles.cartText}>{Number(totalCartPrice).toFixed(3)} DT</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
