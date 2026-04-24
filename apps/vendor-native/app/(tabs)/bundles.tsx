import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text, View } from '@/components/Themed';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function BundlesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bundles, setBundles] = useState<any[]>([]);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.000');
  const [selectedItems, setSelectedItems] = useState<{ vendorProductId: string; quantity: number }[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const fetchData = async (vid: string) => {
    try {
      console.log("Fetching bundles and products for vendor:", vid);
      const [bundlesData, productsData] = await Promise.all([
        ApiService.get(`/management/vendor/bundles/${vid}`).catch(e => { console.error("Bundles fetch error:", e); return []; }),
        ApiService.get(`/management/marketplace/products?vendorId=${vid}`).catch(e => { console.error("Products fetch error:", e); return []; })
      ]);
      
      console.log(`Loaded ${bundlesData?.length || 0} bundles and ${productsData?.length || 0} products`);
      setBundles(Array.isArray(bundlesData) ? bundlesData : []);
      setVendorProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error("Failed to fetch bundles data:", error);
      Alert.alert("Erreur", "Impossible de charger les données.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.user?.vendorId) {
        setVendorId(session.user.vendorId);
        fetchData(session.user.vendorId);
      }
    });
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('0.000');
    setSelectedItems([]);
    setImages([]);
    setEditingBundle(null);
  };

  const handleOpenModal = (bundle?: any) => {
    if (bundle) {
      setEditingBundle(bundle);
      setName(bundle.name);
      setDescription(bundle.description || '');
      setPrice(String(bundle.price));
      setSelectedItems(bundle.items?.map((it: any) => ({ 
        vendorProductId: it.vendorProductId, 
        quantity: Number(it.quantity) 
      })) || []);
      setImages(bundle.images || []);
    } else {
      resetForm();
    }
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || selectedItems.length === 0) {
      return Alert.alert("Erreur", "Veuillez remplir le nom et ajouter au moins un produit.");
    }
    try {
      const payload = {
        name,
        description,
        price: Number(price),
        items: selectedItems,
        images,
        isActive: true
      };

      if (editingBundle) {
        await ApiService.put(`/management/vendor/bundles/${editingBundle.id}`, payload);
      } else {
        await ApiService.post(`/management/vendor/bundles/${vendorId}`, payload);
      }
      setIsModalVisible(false);
      if (vendorId) fetchData(vendorId);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le pack.");
    }
  };

  const addProductToBundle = (productId: string) => {
    if (selectedItems.find(it => it.vendorProductId === productId)) return;
    setSelectedItems([...selectedItems, { vendorProductId: productId, quantity: 1 }]);
  };

  const updateItemQty = (productId: string, qty: number) => {
    setSelectedItems(selectedItems.map(it => 
      it.vendorProductId === productId ? { ...it, quantity: Math.max(1, qty) } : it
    ));
  };

  const removeItemFromBundle = (productId: string) => {
    setSelectedItems(selectedItems.filter(it => it.vendorProductId !== productId));
  };

  const addImage = () => {
    if (newImageUrl) {
      setImages([...images, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Accès refusé", "Nous avons besoin de l'accès à vos photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadFile(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Erreur", "Accès caméra refusé.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadFile(result.assets[0].uri);
    }
  };

  const uploadFile = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: type
      } as any);

      const res = await ApiService.upload('/management/upload', formData);
      if (res && res.url) {
        setImages([...images, res.url]);
      } else {
        throw new Error('No URL returned');
      }
    } catch (error) {
      console.error("Bundle upload error:", error);
      Alert.alert("Erreur", "Échec de l'upload. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#f59e0b" /></View>;

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => vendorId && fetchData(vendorId)} tintColor="#f59e0b" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mes Packs</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
            <FontAwesome name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}> Créer un Pack</Text>
          </TouchableOpacity>
        </View>

        {bundles.map((bundle) => (
          <TouchableOpacity key={bundle.id} style={styles.bundleCard} onPress={() => handleOpenModal(bundle)}>
            <View style={styles.bundleInfo}>
              <Text style={styles.bundleName}>{bundle.name}</Text>
              <Text style={styles.bundleDetails}>{bundle.items?.length || 0} produits inclus</Text>
              <Text style={styles.bundlePrice}>{bundle.price} DT</Text>
            </View>
            <View style={styles.bundleActions}>
              <FontAwesome name="edit" size={20} color="#f59e0b" />
            </View>
          </TouchableOpacity>
        ))}

        {bundles.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome name="gift" size={50} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>Aucun pack créé pour le moment</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Composition */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBundle ? 'Modifier le Pack' : 'Composer un Pack'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <FontAwesome name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
              <Text style={styles.label}>Nom du pack</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Pack Découverte" placeholderTextColor="#94a3b8" />
              
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="Détails de l'offre..." placeholderTextColor="#94a3b8" />

              <Text style={styles.label}>Prix de vente (DT)</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

              {/* Multi-Images */}
              <Text style={styles.label}>Photos (URLs)</Text>
              <View style={styles.imageInputRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={newImageUrl} onChangeText={setNewImageUrl} placeholder="Lien vers image..." placeholderTextColor="#94a3b8" />
                <TouchableOpacity style={styles.addImageBtn} onPress={addImage}>
                  <FontAwesome name="plus" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addImageBtn, { backgroundColor: '#10b981' }]} onPress={pickImage}>
                  <FontAwesome name="photo" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addImageBtn, { backgroundColor: '#3b82f6' }]} onPress={takePhoto}>
                  <FontAwesome name="camera" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              {uploading && (
                  <View style={{ marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'transparent' }}>
                      <ActivityIndicator size="small" color="#f59e0b" />
                      <Text style={{ color: '#f59e0b', fontSize: 13 }}>Chargement...</Text>
                  </View>
              )}
              <ScrollView horizontal style={styles.imagePreviewRow} showsHorizontalScrollIndicator={false}>
                {images.map((img, idx) => (
                  <View key={idx} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: img }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                      <FontAwesome name="times-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <Text style={styles.sectionDivider}>Produits Inclus</Text>
              {selectedItems.map((item, idx) => {
                const prod = vendorProducts.find(p => p.id === item.vendorProductId);
                return (
                  <View key={idx} style={styles.selectedItemRow}>
                    <Text style={styles.selectedItemName} numberOfLines={1}>{prod?.name || 'Inconnu'}</Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity onPress={() => updateItemQty(item.vendorProductId, item.quantity - 1)}>
                        <FontAwesome name="minus-circle" size={24} color="#64748b" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateItemQty(item.vendorProductId, item.quantity + 1)}>
                        <FontAwesome name="plus-circle" size={24} color="#f59e0b" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeItemFromBundle(item.vendorProductId)}>
                      <FontAwesome name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <Text style={styles.sectionDivider}>Ajouter des produits</Text>
              <View style={styles.productPicker}>
                {vendorProducts.filter(p => !selectedItems.find(it => it.vendorProductId === p.id)).map(prod => (
                  <TouchableOpacity key={prod.id} style={styles.pickerItem} onPress={() => addProductToBundle(prod.id)}>
                    <Text style={styles.pickerItemText}>{prod.name}</Text>
                    <FontAwesome name="plus" size={12} color="#f59e0b" />
                  </TouchableOpacity>
                ))}
                {vendorProducts.filter(p => !selectedItems.find(it => it.vendorProductId === p.id)).length === 0 && (
                  <Text style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>Aucun autre produit disponible</Text>
                )}
              </View>
              
              <View style={{ height: 40 }} />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer le Pack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f1e' },
  scrollBody: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  addBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '800' },
  bundleCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bundleInfo: { flex: 1, backgroundColor: 'transparent' },
  bundleName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 5 },
  bundleDetails: { fontSize: 14, color: '#64748b', marginBottom: 5 },
  bundlePrice: { fontSize: 16, fontWeight: '900', color: '#f59e0b' },
  bundleActions: { backgroundColor: 'transparent' },
  emptyState: { alignItems: 'center', marginTop: 100, backgroundColor: 'transparent' },
  emptyText: { color: '#64748b', marginTop: 15, fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#0f172a', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    height: '92%', 
    paddingBottom: 20,
    marginHorizontal: Platform.OS === 'web' ? '5%' : (Platform.OS === 'ios' && (Platform as any).isPad ? 20 : 0)
  },
  modalHeader: { 
    backgroundColor: '#111827',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  modalForm: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#cbd5e1', marginBottom: 8, marginTop: 15 },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)', 
    borderRadius: 12, 
    padding: 15, 
    color: '#ffffff', 
    marginBottom: 10 
  },
  sectionDivider: { fontSize: 14, fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', marginTop: 25, marginBottom: 15 },
  selectedItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 10 },
  selectedItemName: { flex: 1, color: '#fff', fontWeight: '600' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, backgroundColor: 'transparent' },
  qtyText: { color: '#fff', fontWeight: '800', marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  productPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: 'transparent' },
  pickerItem: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pickerItemText: { color: '#94a3b8', fontSize: 13 },
  saveBtn: { backgroundColor: '#f59e0b', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  imageInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'transparent' },
  addImageBtn: { backgroundColor: '#f59e0b', width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  imagePreviewRow: { flexDirection: 'row', marginTop: 10, backgroundColor: 'transparent' },
  imagePreviewWrapper: { position: 'relative', marginRight: 15, backgroundColor: 'transparent' },
  imagePreview: { width: 80, height: 80, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: 'transparent' },
});
