import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Modal, Platform, ActivityIndicator } from 'react-native';
import { usePOSStore } from '../store/posStore';
import { useConfirm } from '../context/ConfirmContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export function MarketplaceScreen({ storeId }: { storeId: string }) {
  const { theme, mktCart, addToMktCart, removeFromMktCart, clearMktCart, submitMktOrders } = usePOSStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorFilterId, setVendorFilterId] = useState<string | null>(null);
  const { alert, confirm } = useConfirm();

  const mStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 20, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: '900', color: theme.colors.cream, marginBottom: 4 },
    subtitle: { fontSize: 14, color: theme.colors.caramel, marginBottom: 15 },
    searchBar: { 
      backgroundColor: theme.colors.surface, 
      borderRadius: 15, padding: 12, color: theme.colors.cream, 
      borderWidth: 1, borderColor: theme.colors.glassBorder,
      marginBottom: 15
    },
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
    cardImage: { width: '100%', height: 120, backgroundColor: theme.colors.background },
    cardInfo: { padding: 12 },
    cardVendor: { fontSize: 10, fontWeight: '800', color: theme.colors.caramel, textTransform: 'uppercase', marginBottom: 4 },
    cardName: { fontSize: 14, fontWeight: '700', color: theme.colors.cream, marginBottom: 6, height: 36 },
    cardPrice: { fontSize: 16, fontWeight: '900', color: theme.colors.cream },
    cardUnit: { fontSize: 11, color: theme.colors.creamMuted },
    
    qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: theme.colors.background, borderRadius: 10, overflow: 'hidden' },
    qtyBtn: { flex: 1, padding: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    qtyBtnText: { color: theme.colors.cream, fontSize: 18, fontWeight: '900' },
    qtyVal: { flex: 1.5, alignItems: 'center' },
    qtyValText: { color: theme.colors.caramel, fontWeight: '900' },
    
    floatingCart: { 
      position: 'absolute', bottom: 20, right: 20, left: 20, 
      backgroundColor: theme.colors.caramel, borderRadius: 16, 
      padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
    },
    cartText: { color: theme.colors.background, fontWeight: '900', fontSize: 16 },
    cartCount: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    
    modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    modalContent: { 
      backgroundColor: theme.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, 
      padding: 24, maxHeight: '80%', borderTopWidth: 1, borderColor: theme.colors.glassBorder
    },
    modalTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.cream, marginBottom: 20 },
    vendorOrder: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15 },
    vendorTitle: { color: theme.colors.caramel, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', marginBottom: 10 },
    orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    orderItemText: { color: theme.colors.cream, fontSize: 14 },
    orderItemPrice: { color: theme.colors.creamMuted, fontSize: 14 },
    orderTotal: { borderTopWidth: 1, borderTopColor: theme.colors.glassBorder, paddingTop: 10, marginTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
    orderTotalText: { color: theme.colors.cream, fontWeight: '900' },
    
    // Vendor Modal
    vInfoCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: theme.colors.glassBorder },
    vInfoText: { color: theme.colors.cream, fontSize: 15, marginBottom: 8 },
    vInfoLabel: { color: theme.colors.caramel, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
    vInfoBtn: { backgroundColor: theme.colors.caramel, padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 }
  }), [theme]);

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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !activeCategory || p.categoryId === activeCategory || p.subcategoryId === activeCategory;
      const matchesVendor = !vendorFilterId || p.vendorId === vendorFilterId;
      return matchesSearch && matchesCat && matchesVendor;
    });
  }, [products, search, activeCategory, vendorFilterId]);

  const itemsInCart = useMemo(() => {
    return products.filter(p => mktCart[p.id]).map(p => ({ ...p, quantity: mktCart[p.id] }));
  }, [products, mktCart]);

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

  if (loading) return <View style={mStyles.container}><ActivityIndicator color={theme.colors.caramel} style={{ marginTop: 100 }} /></View>;

  return (
    <View style={mStyles.container}>
      <ScrollView bounces={false}>
        <View style={mStyles.header}>
          <Text style={mStyles.title}>Marketplace</Text>
          <Text style={mStyles.subtitle}>Sourcing & Commandes Fournisseurs</Text>
          <TextInput 
            style={mStyles.searchBar} 
            placeholder="Rechercher un produit, une marque..." 
            placeholderTextColor={theme.colors.creamMuted}
            value={search}
            onChangeText={setSearch}
          />
          
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
          {filteredProducts.map(product => (
            <View key={product.id} style={mStyles.card}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setSelectedVendor(product.vendor || { companyName: product.vendorName || 'Vendeur inconnu' })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image source={{ uri: product.image || 'https://via.placeholder.com/150' }} style={mStyles.cardImage} />
              </TouchableOpacity>
              <View style={mStyles.cardInfo}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => setSelectedVendor(product.vendor || { companyName: product.vendorName || 'Vendeur inconnu' })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={mStyles.cardVendor}>{product.vendor?.companyName || product.vendorName || 'FOURNISSEUR'}</Text>
                </TouchableOpacity>
                <Text style={mStyles.cardName} numberOfLines={2}>{product.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                  <Text style={mStyles.cardPrice}>{Number(product.price || 0).toFixed(3)} DT</Text>
                  <Text style={mStyles.cardUnit}>/ {product.unit}</Text>
                </View>

                <View style={mStyles.qtyRow}>
                  <TouchableOpacity style={mStyles.qtyBtn} onPress={() => removeFromMktCart(product.id)}>
                    <Text style={mStyles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <View style={mStyles.qtyVal}>
                    <Text style={mStyles.qtyValText}>{mktCart[product.id] || 0}</Text>
                  </View>
                  <TouchableOpacity style={mStyles.qtyBtn} onPress={() => addToMktCart(product.id)}>
                    <Text style={mStyles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {itemsInCart.length > 0 && (
        <TouchableOpacity style={mStyles.floatingCart} onPress={() => setIsCartVisible(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={mStyles.cartCount}><Text style={{ color: '#FFF', fontWeight: '900' }}>{itemsInCart.length}</Text></View>
            <Text style={mStyles.cartText}>Voir le panier</Text>
          </View>
          <Text style={mStyles.cartText}>{Number(totalCartPrice).toFixed(3)} DT</Text>
        </TouchableOpacity>
      )}

      <Modal visible={isCartVisible} transparent animationType="slide" onRequestClose={() => setIsCartVisible(false)}>
        <TouchableOpacity style={mStyles.modal} activeOpacity={1} onPress={() => setIsCartVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={mStyles.modalContent}>
            <Text style={mStyles.modalTitle}>Récapitulatif Sourcing</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(cartByVendor).map(([vId, group]) => (
                <View key={vId} style={mStyles.vendorOrder}>
                  <Text style={mStyles.vendorTitle}>Fournisseur: {group.vendorName}</Text>
                  {group.items.map(item => (
                    <View key={item.id} style={mStyles.orderItem}>
                      <Text style={mStyles.orderItemText}>{item.quantity}x {item.name}</Text>
                      <Text style={mStyles.orderItemPrice}>{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(3)} DT</Text>
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
      
      {/* VENDOR INFO MODAL */}
      <Modal visible={!!selectedVendor} transparent animationType="fade" onRequestClose={() => setSelectedVendor(null)}>
        <TouchableOpacity style={mStyles.modal} activeOpacity={1} onPress={() => setSelectedVendor(null)}>
          <TouchableOpacity activeOpacity={1} style={[mStyles.modalContent, { maxHeight: '60%' }]}>
            <Text style={mStyles.modalTitle}>{selectedVendor?.companyName}</Text>
            
            <View style={mStyles.vInfoCard}>
              <View style={{ marginBottom: 15 }}>
                <Text style={mStyles.vInfoLabel}>Email de contact</Text>
                <Text style={mStyles.vInfoText}>{selectedVendor?.user?.email || 'Non renseigné'}</Text>
              </View>
              
              <View style={{ marginBottom: 15 }}>
                <Text style={mStyles.vInfoLabel}>Téléphone</Text>
                <Text style={mStyles.vInfoText}>{selectedVendor?.phone || 'Non renseigné'}</Text>
              </View>
              
              <View>
                <Text style={mStyles.vInfoLabel}>Adresse & Siège</Text>
                <Text style={mStyles.vInfoText}>
                  {selectedVendor?.address || 'Adresse non renseignée'}
                  {selectedVendor?.city ? `\n${selectedVendor.city}` : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={mStyles.vInfoBtn}
              onPress={() => {
                if (selectedVendor?.id) {
                  setVendorFilterId(selectedVendor.id);
                  setSelectedVendor(null);
                } else {
                  alert("Info", "Ce vendeur n'a pas encore de boutique en ligne complète.");
                }
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900' }}>Voir tous ses produits</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[mStyles.vInfoBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.glassBorder, marginTop: 10 }]}
              onPress={() => setSelectedVendor(null)}
            >
              <Text style={{ color: theme.colors.cream }}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* VENDOR FILTER BADGE */}
      {vendorFilterId && (
        <TouchableOpacity 
          style={{ 
            position: 'absolute', top: 120, right: 20, 
            backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, 
            borderRadius: 10, borderWidth: 1, borderColor: theme.colors.caramel,
            flexDirection: 'row', alignItems: 'center', gap: 8
          }}
          onPress={() => setVendorFilterId(null)}
        >
          <Text style={{ color: theme.colors.caramel, fontSize: 10, fontWeight: '900' }}>Vendeur actif</Text>
          <Text style={{ color: '#EF4444', fontWeight: '900' }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
