import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

export default function StocksScreen() {
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const UNITS = ['UN', 'KG', 'G', 'L', 'ML', 'CL', 'PIÈCE', 'SAC', 'BOTTE'];
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'MATERIALS'>((tab as any) || 'PRODUCTS');
  const ICON_LIST = ['☕', '🥐', '🍰', '🍔', '🍕', '🥗', '🥤', '🍦', '🍵', '🍺', '🍹', '🥪', '🥣', '🍳', '🥩', '🍗', '🍡', '🍱', '🍜', '🥘', '🥫', '🥛', '🍞', '🥯', '🥑', '🥥', '🥝', '🍓', '🧂', '🍫', '🍩', '🍪', '🔋', '📦', '🧹', '🧴'];

  useEffect(() => {
    if (tab === 'MATERIALS' || tab === 'PRODUCTS') {
      setActiveTab(tab as any);
    }
  }, [tab]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  
  // CRUD States
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📦');
  const [formQty, setFormQty] = useState('0');
  const [formPrice, setFormPrice] = useState('0.000');
  const [formTVA, setFormTVA] = useState('0');
  const [formUnit, setFormUnit] = useState('UN');
  const [formCost, setFormCost] = useState('0.000');
  const [formRecipe, setFormRecipe] = useState<any[]>([]); // { stockItemId, name, quantity, unit }
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [ingredientQtyModalVisible, setIngredientQtyModalVisible] = useState(false);
  const [selectedIngredientForQty, setSelectedIngredientForQty] = useState<any>(null);
  const [tempIngredientQty, setTempIngredientQty] = useState('0.1');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [showUnitSelect, setShowUnitSelect] = useState(false); // Bottom sheet visibility

  const fetchData = async (currentStoreId: string) => {
    try {
      const [catData, stockData, productsData] = await Promise.all([
        ApiService.get(`/management/categories/${currentStoreId}`),
        ApiService.get(`/management/stock/${currentStoreId}`),
        ApiService.get(`/management/products/${currentStoreId}`)
      ]);
      
      setStockItems(stockData || []);
      setProducts(productsData || []);

      const mapped = (catData || []).map((cat: any) => {
        const prodCount = (productsData || []).filter((p: any) => p.categoryId === cat.id).length;
        const stockCount = (stockData || []).filter((s: any) => s.categoryId === cat.id).length;
        return {
          ...cat,
          itemCount: activeTab === 'PRODUCTS' ? prodCount : stockCount,
        };
      });
      setCategories(mapped);
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormIcon('📦');
    setFormQty('0');
    setFormPrice('0.000');
    setFormCost('0.000');
    setFormTVA('0');
    setFormUnit('UN');
    setFormRecipe([]);
    setFormImage(null);
    setEditingCategory(null);
    setEditingItem(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Erreur", "Permission caméra refusée.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormImage(result.assets[0].uri);
    }
  };

  const handleSaveCategory = async () => {
    if (!formName) return Alert.alert("Erreur", "Le nom est requis.");
    try {
      const payload = {
        name: formName,
        icon: formIcon,
        storeId,
        type: activeTab === 'PRODUCTS' ? 'PRODUCT' : 'MATERIAL'
      };

      if (editingCategory) {
        await ApiService.put(`/management/categories/${editingCategory.id}`, payload);
      } else {
        await ApiService.post('/management/categories', payload);
      }
      
      setIsCategoryModalVisible(false);
      resetForm();
      onRefresh();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder la catégorie.");
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert("Confirmation", "Supprimer cette catégorie et tous ses articles ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try {
          await ApiService.delete(`/management/categories/${id}`);
          onRefresh();
        } catch (error) {
          Alert.alert("Erreur", "Suppression impossible.");
        }
      }}
    ]);
  };

  const handleSaveItem = async () => {
    if (!formName) return Alert.alert("Erreur", "Le nom est requis.");
    const isProduct = activeTab === 'PRODUCTS';
    const endpoint = isProduct ? '/management/products' : '/management/stock';
    
    try {
      const payload: any = {
        name: formName,
        storeId,
        categoryId: selectedCategory?.id === 'UNCATEGORIZED' ? undefined : selectedCategory?.id,
      };

      if (isProduct) {
        payload.price = Number(formPrice);
        payload.taxRate = Number(formTVA) / 100;
        payload.icon = formIcon;
        if (formImage) payload.image = formImage;
      } else {
        payload.quantity = Number(formQty);
        payload.cost = Number(formCost);
        payload.unit = formUnit;
      }

      if (isProduct) {
        payload.recipeItems = formRecipe.map(r => ({
           stockItemId: r.stockItemId,
           quantity: Number(r.quantity)
        }));
      }

      if (editingItem) {
        await ApiService.put(`${endpoint}/${editingItem.id}`, payload);
      } else {
        await ApiService.post(endpoint, payload);
      }
      
      setIsItemModalVisible(false);
      resetForm();
      onRefresh();
    } catch (error) {
      Alert.alert("Erreur", "Sauvegarde article impossible.");
    }
  };

  const handleDeleteItem = (id: string) => {
    const endpoint = activeTab === 'PRODUCTS' ? '/management/products' : '/management/stock';
    Alert.alert("Confirmation", "Supprimer cet article ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try {
          await ApiService.delete(`${endpoint}/${id}`);
          onRefresh();
        } catch (error) {
          Alert.alert("Erreur", "Suppression impossible.");
        }
      }}
    ]);
  };

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) {
        setStoreId(session.storeId);
        fetchData(session.storeId);
      }
    });
  }, [activeTab]);

  const onRefresh = () => {
    if (!storeId) return;
    setRefreshing(true);
    fetchData(storeId);
  };

  const displayCategories = categories.filter(c => {
    const isMaterial = c.type === 'MATERIAL' || c.name.toLowerCase().includes('mat') || c.name.toLowerCase().includes('stock');
    if (activeTab === 'MATERIALS') return isMaterial;
    return !isMaterial;
  });

  const searchedItems = (activeTab === 'PRODUCTS' ? products : stockItems).filter(s => {
    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  const getUncategorizedItems = () => {
    if (activeTab === 'PRODUCTS') {
        return products.filter(p => !p.categoryId);
    }
    return stockItems.filter(s => !s.categoryId);
  };

  const uncategorizedItems = getUncategorizedItems();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'PRODUCTS' && styles.activeTab]} onPress={() => { setActiveTab('PRODUCTS'); setSelectedCategory(null); setSearch(''); }}>
          <Text style={[styles.tabText, activeTab === 'PRODUCTS' && styles.activeTabText]}>Catalogue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'MATERIALS' && styles.activeTab]} onPress={() => { setActiveTab('MATERIALS'); setSelectedCategory(null); setSearch(''); }}>
          <Text style={[styles.tabText, activeTab === 'MATERIALS' && styles.activeTabText]}>Matière Première</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'PRODUCTS' ? (
        selectedCategory ? (
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
             <View style={styles.drillDownHeader}>
               <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backBtnCircle}>
                 <FontAwesome name="chevron-left" size={14} color="#fff" />
               </TouchableOpacity>
               <View style={{ marginLeft: 15, flex: 1, backgroundColor: 'transparent' }}>
                  <Text style={styles.drillDownTitle}>{selectedCategory?.icon} {selectedCategory?.name.toUpperCase()}</Text>
                  <Text style={styles.drillDownSub}>Gestion du Catalogue</Text>
               </View>
             </View>

            <ScrollView contentContainerStyle={styles.scrollBody}>
              <Text style={styles.mgmtSectionTitle}>PRODUITS DANS CETTE CATÉGORIE</Text>
              {products
                .filter(s => selectedCategory?.id === 'UNCATEGORIZED' ? !s.categoryId : s.categoryId === selectedCategory?.id)
                .map((item, idx) => (
                <TouchableOpacity 
                    key={idx} 
                    style={styles.itemRow}
                    onPress={() => {
                        setEditingItem(item);
                        setFormName(item.name);
                        setFormQty(String(item.quantity || 0));
                        setFormPrice(String(item.price || 0));
                        setFormCost(String(item.cost || 0));
                        setFormTVA(String((item.taxRate || 0) * 100));
                        setFormUnit(item.unit?.name || item.unit || 'UN');
                        setFormIcon(item.icon || '☕');
                        setFormRecipe((item.recipeItems || []).map((r: any) => ({
                            stockItemId: r.stockItemId,
                            name: r.stockItem?.name || 'Ingrédient',
                            quantity: String(r.quantity),
                            unit: r.stockItem?.unit?.name || r.stockItem?.unit || 'UN'
                        })));
                        setIsItemModalVisible(true);
                    }}
                >
                   <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                        <Text style={{ fontSize: 20 }}>{item.icon || '☕'}</Text>
                   </View>
                   <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemRef}>
                        {`${Number(item.price || 0).toFixed(3)} DT (+${(item.taxRate || 0.19) * 100}%)`}
                    </Text>
                   </View>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.quantity || 0}</Text>
                    <Text style={styles.qtyUnit}>{item.unit?.name || item.unit || 'UN'}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity 
                style={[styles.addItemBtn, { marginTop: 20 }]}
                onPress={() => { resetForm(); setIsItemModalVisible(true); }}
              >
                <FontAwesome name="plus" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.addItemText}>Ajouter un Produit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
            <View style={styles.searchBar}>
              <FontAwesome name="search" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
              <TextInput 
                placeholder="Chercher un produit..." 
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {search.length > 0 ? (
              <>
                <Text style={styles.mgmtSectionTitle}>RÉSULTATS DE RECHERCHE</Text>
                {searchedItems.map((item, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.itemRow}
                    onPress={() => {
                        setEditingItem(item);
                        setFormName(item.name);
                        setFormQty(String(item.quantity || 0));
                        setFormPrice(String(item.price || 0));
                        setFormCost(String(item.cost || 0));
                        setFormTVA(String((item.taxRate || 0) * 100));
                        setFormUnit(item.unit?.name || item.unit || 'UN');
                        setFormIcon(item.icon || '☕');
                        setFormRecipe((item.recipeItems || []).map((r: any) => ({
                            stockItemId: r.stockItemId,
                            name: r.stockItem?.name || 'Ingrédient',
                            quantity: String(r.quantity),
                            unit: r.stockItem?.unit?.name || r.stockItem?.unit || 'UN'
                        })));
                        setIsItemModalVisible(true);
                    }}
                  >
                     <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 18 }}>{item.icon || '☕'}</Text>
                     </View>
                     <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                       <Text style={styles.itemName}>{item.name}</Text>
                       <Text style={styles.itemRef}>{`${Number(item.price || 0).toFixed(3)} DT`}</Text>
                     </View>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>{item.quantity || 0}</Text>
                      <Text style={styles.qtyUnit}>{item.unit?.name || item.unit || 'UN'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Mes Catégories</Text>
                <View style={styles.categoryList}>
                  {displayCategories.map((cat: any, i: number) => (
                    <TouchableOpacity key={i} style={[styles.categoryCard, styles.glassCard]} onPress={() => setSelectedCategory(cat)}>
                      <View style={[styles.catIconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                         <Text style={styles.catEmoji}>{cat.icon || '📦'}</Text>
                      </View>
                      <View style={styles.catInfo}>
                        <Text style={styles.catTitle}>{cat.name.toUpperCase()}</Text>
                        <Text style={styles.catSubtitle}>{cat.itemCount} PRODUITS</Text>
                      </View>
                      <View style={styles.catActions}>
                          <TouchableOpacity 
                            style={styles.actionBtn} 
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={(e) => { 
                              e.stopPropagation(); 
                              setEditingCategory(cat); 
                              setFormName(cat.name); 
                              setFormIcon(cat.icon || '📦'); 
                              setIsCategoryModalVisible(true); 
                            }}
                          >
                            <FontAwesome name="pencil" size={16} color="#94a3b8" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionBtn} 
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteCategory(cat.id); 
                            }}
                          >
                            <FontAwesome name="trash-o" size={16} color="#94a3b8" />
                          </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {uncategorizedItems.length > 0 && (
                    <TouchableOpacity style={[styles.categoryCard, styles.glassCard]} onPress={() => setSelectedCategory({ id: 'UNCATEGORIZED', name: 'Non classés', icon: '📁' })}>
                      <View style={[styles.catIconContainer, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}><Text style={styles.catEmoji}>📁</Text></View>
                      <View style={styles.catInfo}><Text style={styles.catTitle}>NON CLASSÉS</Text><Text style={styles.catSubtitle}>{uncategorizedItems.length} PRODUITS</Text></View>
                      <FontAwesome name="chevron-right" size={14} color="#475569" style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.addItemBtn} onPress={() => { resetForm(); setIsCategoryModalVisible(true); }}>
                  <FontAwesome name="plus-circle" size={20} color="#ffffff" style={{ marginRight: 10 }} />
                  <Text style={styles.addItemText}>Nouvelle Catégorie</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
          <View style={styles.searchBar}>
            <FontAwesome name="search" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
            <TextInput 
              placeholder="Chercher une matière première..." 
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <Text style={styles.sectionTitle}>Stock des Matières Premières</Text>
          {searchedItems.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.itemRow}
              onPress={() => {
                setEditingItem(item);
                setFormName(item.name);
                setFormQty(String(item.quantity || 0));
                setFormCost(String(item.cost || 0));
                setFormUnit(item.unit?.name || item.unit || 'UN');
                setFormIcon(item.icon || '📦');
                setIsItemModalVisible(true);
              }}
            >
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemRef}>{`Coût: ${Number(item.cost || 0)} DT`}</Text>
              </View>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{item.quantity || 0}</Text>
                <Text style={styles.qtyUnit}>{item.unit?.name || item.unit || 'UN'}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={[styles.addItemBtn, { marginTop: 20 }]}
            onPress={() => { resetForm(); setIsItemModalVisible(true); }}
          >
            <FontAwesome name="plus" size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.addItemText}>Ajouter une Matière Première</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Category Editor Modal */}
      <Modal visible={isCategoryModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { height: 'auto' }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editingCategory ? 'Editer' : 'Nouvelle'} Catégorie</Text>
                    <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}><FontAwesome name="times" size={20} color="#fff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 25 }}>
                    <Text style={styles.inputLabel}>Nom de la catégorie</Text>
                    <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} placeholder="Nom..." placeholderTextColor="#475569" />
                    
                    <Text style={styles.inputLabel}>Icône / Emoji</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelector}>
                        {ICON_LIST.map(ic => (
                            <TouchableOpacity 
                                key={ic} 
                                style={[styles.iconChoice, formIcon === ic && styles.iconChoiceActive]}
                                onPress={() => setFormIcon(ic)}
                            >
                                <Text style={{ fontSize: 24 }}>{ic}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCategory}>
                        <Text style={styles.saveBtnText}>Enregistrer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>


      {/* Item Editor Modal */}
      <Modal visible={isItemModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { height: '80%' }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editingItem ? 'Editer' : 'Nouvel'} Article</Text>
                    <TouchableOpacity onPress={() => setIsItemModalVisible(false)}><FontAwesome name="times" size={20} color="#fff" /></TouchableOpacity>
                </View>
                <ScrollView style={{ padding: 20 }}>
                    <Text style={styles.inputLabel}>Nom de l'article</Text>
                    <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} placeholder="Nom..." placeholderTextColor="#475569" />
                    
                    {activeTab === 'PRODUCTS' && (
                        <>
                            <Text style={styles.inputLabel}>Icône / Emoji</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelector}>
                                {ICON_LIST.map(ic => (
                                    <TouchableOpacity 
                                        key={ic} 
                                        style={[styles.iconChoice, formIcon === ic && styles.iconChoiceActive]}
                                        onPress={() => setFormIcon(ic)}
                                    >
                                        <Text style={{ fontSize: 24 }}>{ic}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Photo de l'article</Text>
                            <View style={styles.imagePickerContainer}>
                                {formImage ? (
                                    <View style={styles.imagePreviewWrapper}>
                                        <Image source={{ uri: ApiService.getFileUrl(formImage) || undefined }} style={styles.imagePreview} />
                                        <TouchableOpacity 
                                            style={styles.removeImageBtn} 
                                            onPress={() => setFormImage(null)}
                                        >
                                            <FontAwesome name="times" size={12} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <FontAwesome name="camera" size={30} color="#475569" />
                                    </View>
                                )}
                                <View style={styles.imagePickerActions}>
                                    <TouchableOpacity style={styles.pickerActionBtn} onPress={takePhoto}>
                                        <FontAwesome name="camera" size={16} color="#fff" />
                                        <Text style={styles.pickerActionText}>Prendre</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.pickerActionBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={pickImage}>
                                        <FontAwesome name="image" size={16} color="#94a3b8" />
                                        <Text style={[styles.pickerActionText, { color: '#94a3b8' }]}>Galerie</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                    
                    <View style={{ flexDirection: 'row', gap: 15, backgroundColor: 'transparent' }}>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                            <Text style={styles.inputLabel}>Quantité Stock</Text>
                            <TextInput style={styles.modalInput} value={formQty} onChangeText={setFormQty} keyboardType="numeric" placeholder="0" placeholderTextColor="#475569" />
                        </View>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                            <Text style={styles.inputLabel}>Unité</Text>
                            <TouchableOpacity 
                                style={styles.selectField}
                                onPress={() => setShowUnitSelect(true)}
                            >
                                <Text style={styles.selectFieldValue}>{formUnit}</Text>
                                <FontAwesome name="chevron-down" size={14} color="#10b981" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 15, backgroundColor: 'transparent' }}>
                        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                            <Text style={styles.inputLabel}>{activeTab === 'PRODUCTS' ? 'Prix de Vente (DT)' : 'Coût / Achat (DT)'}</Text>
                            <TextInput 
                                style={[styles.modalInput, activeTab === 'PRODUCTS' ? { color: '#10b981', fontWeight: 'bold' } : {}]} 
                                value={activeTab === 'PRODUCTS' ? formPrice : formCost} 
                                onChangeText={activeTab === 'PRODUCTS' ? setFormPrice : setFormCost} 
                                keyboardType="numeric" 
                                placeholder="0.000" 
                                placeholderTextColor="#475569" 
                            />
                        </View>
                        {activeTab === 'PRODUCTS' && (
                            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                <Text style={styles.inputLabel}>TVA %</Text>
                                <TextInput style={styles.modalInput} value={formTVA} onChangeText={setFormTVA} keyboardType="numeric" placeholder="0" placeholderTextColor="#475569" />
                            </View>
                        )}
                    </View>

                    {activeTab === 'PRODUCTS' && (
                        <View style={{ marginTop: 10, padding: 15, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                            <Text style={[styles.inputLabel, { color: Colors.primary }]}>RECOUVREMENT (RECETTE)</Text>
                            <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 10 }}>Ingrédients déduits lors de la vente.</Text>
                            
                            {formRecipe.length > 0 ? formRecipe.map((ing, ri) => (
                                <View key={ri} style={styles.recipeRow}>
                                    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{ing.name}</Text>
                                        <Text style={{ color: '#94a3b8', fontSize: 11 }}>Quantité: {ing.quantity} {ing.unit}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setFormRecipe(prev => prev.filter((_, idx) => idx !== ri))}>
                                        <FontAwesome name="trash" size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            )) : (
                                <Text style={{ color: '#475569', fontSize: 13, fontStyle: 'italic', marginBottom: 15, textAlign: 'center' }}>Aucun ingrédient.</Text>
                            )}
                            
                            <TouchableOpacity 
                              style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, alignItems: 'center', marginTop: 5 }}
                              onPress={() => setAddingIngredient(true)}
                            >
                                <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '700' }}>+ Ajouter un ingrédient</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Ingredient Selector Modal Overlay */}
                    <Modal visible={addingIngredient} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setAddingIngredient(false)} />
                            <View style={[styles.modalSheet, { height: '60%' }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Choisir un ingrédient</Text>
                                    <TouchableOpacity onPress={() => setAddingIngredient(false)}><FontAwesome name="times" size={20} color="#fff" /></TouchableOpacity>
                                </View>
                                <ScrollView style={{ padding: 20 }}>
                                    {stockItems.map((si, sidx) => (
                                        <TouchableOpacity 
                                            key={sidx} 
                                            style={styles.selectableItem}
                                            onPress={() => {
                                                setSelectedIngredientForQty(si);
                                                setTempIngredientQty('0.1');
                                                setAddingIngredient(false); // Close the list modal first
                                                setTimeout(() => setIngredientQtyModalVisible(true), 300); // Small delay for smooth transition
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{si.name}</Text>
                                            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Stock actuel: {si.quantity} {si.unit?.name || si.unit || 'UN'}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {stockItems.length === 0 && <Text style={{ color: '#94a3b8', textAlign: 'center' }}>Aucune matière première trouvée dans vos stocks.</Text>}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
                        <Text style={styles.saveBtnText}>Enregistrer</Text>
                    </TouchableOpacity>
                    
                    {editingItem && (
                        <TouchableOpacity style={{ marginTop: 15, alignItems: 'center', backgroundColor: 'transparent' }} onPress={() => handleDeleteItem(editingItem.id)}>
                            <Text style={{ color: Colors.danger, fontWeight: '600' }}>Supprimer l'article</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </View>
      </Modal>

      {/* Unit Selection Bottom Sheet Overlay */}
      <Modal visible={showUnitSelect} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowUnitSelect(false)} />
            <View style={[styles.modalSheet, { height: 'auto', borderTopRightRadius: 30, borderTopLeftRadius: 30 }]}>
                <View style={[styles.modalHeader, { paddingBottom: 10 }]}>
                    <Text style={styles.modalTitle}>Choisir l'unité</Text>
                    <TouchableOpacity onPress={() => setShowUnitSelect(false)}><FontAwesome name="times" size={20} color="#fff" /></TouchableOpacity>
                </View>
                <View style={{ paddingBottom: 30 }}>
                    {UNITS.map((u, i) => (
                        <TouchableOpacity 
                            key={u} 
                            style={[
                                styles.pickerItem, 
                                formUnit === u && styles.activePickerItem,
                                i === UNITS.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={() => {
                                setFormUnit(u);
                                setShowUnitSelect(false);
                            }}
                        >
                            <Text style={[styles.pickerItemText, formUnit === u && styles.activePickerItemText]}>{u}</Text>
                            {formUnit === u && <FontAwesome name="check-circle" size={18} color="#10b981" />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
      </Modal>

      {/* Quantity Modal for Ingredient */}
      <Modal visible={ingredientQtyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setIngredientQtyModalVisible(false)} />
            <View style={[styles.modalSheet, { height: 'auto', paddingBottom: 40 }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Quantité par portion</Text>
                    <TouchableOpacity onPress={() => { setIngredientQtyModalVisible(false); setAddingIngredient(true); }}><FontAwesome name="times" size={20} color="#fff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 25 }}>
                    <Text style={{ color: '#fff', fontSize: 16, marginBottom: 15 }}>
                        Combien de <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{selectedIngredientForQty?.name}</Text> ({selectedIngredientForQty?.unit?.name || selectedIngredientForQty?.unit || 'UN'}) est utilisé pour une portion de {formName} ?
                    </Text>
                    <TextInput 
                        style={styles.modalInput} 
                        value={tempIngredientQty} 
                        onChangeText={setTempIngredientQty} 
                        keyboardType="numeric" 
                        autoFocus
                        placeholder="0.1" 
                        placeholderTextColor="#475569" 
                    />
                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={() => {
                            if (tempIngredientQty && !isNaN(Number(tempIngredientQty))) {
                                setFormRecipe([...formRecipe, { 
                                    stockItemId: selectedIngredientForQty.id, 
                                    name: selectedIngredientForQty.name, 
                                    quantity: tempIngredientQty, 
                                    unit: selectedIngredientForQty.unit?.name || selectedIngredientForQty.unit || 'UN' 
                                }]);
                                setIngredientQtyModalVisible(false);
                                setAddingIngredient(false);
                            }
                        }}
                    >
                        <Text style={styles.saveBtnText}>Ajouter l'ingrédient</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    padding: 20,
  },
  scrollBody: {
    paddingBottom: 130,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#10b981',
  },
  categoryList: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    height: 80,
  },
  catIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  catEmoji: {
    fontSize: 24,
  },
  catInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  catTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  catSubtitle: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginRight: 5,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  addItemBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    height: 55,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  addItemText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: '#0a0f1e',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 40,
  },
  modalHeader: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalHeaderIcon: { fontSize: 24 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    height: 55,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 5,
  },
  saveBtn: {
    backgroundColor: '#10b981',
    height: 55,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  mgmtSectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 20 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  itemName: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  itemRef: { color: '#64748b', fontSize: 12, marginTop: 2 },
  qtyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  qtyText: { color: '#10b981', fontWeight: '800', fontSize: 16 },
  qtyUnit: { color: '#10b981', fontWeight: '600', fontSize: 9 },
  drillDownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillDownTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  drillDownSub: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  recipeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.02)',
  },
  selectableItem: {
      padding: 18,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
      backgroundColor: 'transparent',
  },
  unitBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.05)',
      marginRight: 8,
      borderWidth: 1,
      borderColor: 'transparent',
  },
  activeUnitBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  unitBadgeText: {
      color: '#94a3b8',
      fontSize: 12,
      fontWeight: '700',
  },
  activeUnitBadgeText: {
      color: '#10b981',
  },
  selectField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 14,
      paddingHorizontal: 15,
      height: 50,
      marginTop: 5,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
  },
  selectFieldValue: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
  },
  pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 18,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.03)',
      backgroundColor: 'transparent',
  },
  activePickerItem: {
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  pickerItemText: {
      color: '#94a3b8',
      fontSize: 16,
      fontWeight: '600',
  },
  activePickerItemText: {
      color: '#ffffff',
      fontWeight: '800',
  },
  iconSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'transparent',
    paddingVertical: 5,
  },
  iconChoice: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconChoiceActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  // Image Picker Styles
  imagePickerContainer: {
    flexDirection: 'row', gap: 15, marginTop: 10, marginBottom: 20,
    backgroundColor: 'transparent',
  },
  imagePreviewWrapper: {
    width: 100, height: 100, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  imagePreview: { width: '100%', height: '100%' },
  removeImageBtn: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 100, height: 100, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  imagePickerActions: { flex: 1, gap: 10, justifyContent: 'center' },
  pickerActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 15,
    borderRadius: 12,
  },
  pickerActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },

});
