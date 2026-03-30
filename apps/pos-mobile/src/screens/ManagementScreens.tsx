import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// ══════════════════════════════════════════════════════════════
// CATEGORIES MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════════
export function CategoriesScreen({ storeId }: { storeId: string }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', parentId: '' });

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/management/categories/${storeId}`);
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.warn('Categories fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    let finalName = form.name.trim();
    if (form.parentId) {
      const parent = categories.find(c => c.id === form.parentId);
      if (parent) {
        finalName = `${parent.name} > ${finalName}`;
      }
    }

    try {
      const res = await fetch(`${API_URL}/management/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, storeId }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', parentId: '' });
        fetchData();
      }
    } catch (e) {
      Alert.alert('Erreur', 'Echec creation');
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/management/categories/${item.id}`, { method: 'DELETE' });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.message || 'Echec suppression');
            }
            fetchData();
          } catch (e: any) {
            Alert.alert('Erreur', e.message);
          }
        }
      },
    ]);
  };


  // Filter root categories for parent selection (to avoid deep recursive nesting for now)
  const rootCategories = categories.filter(c => !c.name.includes(' > '));

  return (
    <View style={mgStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Categories</Text>
        <Text style={mgStyles.subtitle}>Organiser vos menus et produits</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: '#7C3AED' }]}>
                <Text style={mgStyles.cardLabel}>Total categories</Text>
                <Text style={mgStyles.cardValue}>{categories.length}</Text>
              </View>
            </View>

            {categories.map(c => (
              <View key={c.id} style={mgStyles.row}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={mgStyles.rowTitle}>{c.name}</Text>
                    <Text style={mgStyles.rowSub}>{c._count?.products || 0} produits associés</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(c)}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={mgStyles.fab} onPress={() => setShowModal(true)}>
        <Text style={mgStyles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={mgStyles.modalOverlay}>
          <View style={mgStyles.modalContent}>
            <Text style={mgStyles.modalTitle}>Nouvelle Catégorie</Text>
            
            <Text style={mgStyles.label}>Nom</Text>
            <TextInput 
              style={mgStyles.input} 
              placeholder="ex: Boissons ou Froides" 
              value={form.name} 
              onChangeText={v => setForm({ ...form, name: v })} 
            />

            <Text style={mgStyles.label}>Catégorie Parente (Optionnel)</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
              Choisissez une racine pour créer une sous-catégorie (ex: Café › Chaud)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mgStyles.pickerRow}>
              <TouchableOpacity 
                style={[mgStyles.pickerChip, !form.parentId && mgStyles.pickerChipActive]} 
                onPress={() => setForm({ ...form, parentId: '' })}
              >
                <Text style={[mgStyles.pickerChipText, !form.parentId && mgStyles.pickerChipTextActive]}>Racine</Text>
              </TouchableOpacity>
              {rootCategories.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[mgStyles.pickerChip, form.parentId === c.id && mgStyles.pickerChipActive]} 
                  onPress={() => setForm({ ...form, parentId: c.id })}
                >
                  <Text style={[mgStyles.pickerChipText, form.parentId === c.id && mgStyles.pickerChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[mgStyles.btnRow, { marginTop: 20 }]}>
              <TouchableOpacity style={mgStyles.btnCancel} onPress={() => setShowModal(false)}>
                <Text style={mgStyles.btnTextDark}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mgStyles.btnPrimary} onPress={handleCreate}>
                <Text style={mgStyles.btnText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


// ══════════════════════════════════════════════════════════════
// Shared styles for management screens
// ══════════════════════════════════════════════════════════════
export const mgStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  title: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, padding: 20, borderRadius: 16 },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  emptyText: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginTop: 40 },
  row: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  rowSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '700', marginTop: -2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 16 },
  input: {
    backgroundColor: '#F1F5F9', padding: 14, borderRadius: 12, fontSize: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', color: '#0F172A',
  },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnPrimary: { flex: 1, backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDanger: { flex: 1, backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnCancel: { flex: 1, backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnTextDark: { color: '#64748B', fontSize: 16, fontWeight: '700' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  pickerChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  pickerChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  pickerChipTextActive: { color: '#FFF' },
  label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 4 },
});

// ══════════════════════════════════════════════════════════════
// PRODUCTS MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════════
export function ProductsScreen({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ 
    name: '', 
    price: '', 
    categoryId: '',
    active: true,
    recipe: [] as { stockItemId: string; quantity: string }[] 
  });

  const fetchData = async () => {
    try {
      const [prodRes, catRes, stockRes] = await Promise.all([
        fetch(`${API_URL}/management/products/${storeId}`),
        fetch(`${API_URL}/management/categories/${storeId}`),
        fetch(`${API_URL}/management/stock/${storeId}`),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (stockRes.ok) setStockItems(await stockRes.json());
    } catch (e) { console.warn('Products fetch error', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', price: '', categoryId: categories[0]?.id || '', active: true, recipe: [] });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ 
      name: item.name, 
      price: String(Number(item.price)), 
      categoryId: item.categoryId,
      active: item.active ?? true,
      recipe: (item.recipe || []).map((r: any) => ({ 
        stockItemId: r.stockItemId, 
        quantity: String(Number(r.quantity)) 
      }))
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      Alert.alert('Erreur', 'Remplissez tous les champs');
      return;
    }
    try {
      const url = editItem
        ? `${API_URL}/management/products/${editItem.id}`
        : `${API_URL}/management/products`;
      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          categoryId: form.categoryId,
          active: form.active,
          ...(!editItem && { storeId }),
        }),
      });
      if (res.ok) {
        const product = await res.json();
        const prodId = editItem ? editItem.id : product.id;
        
        // Save recipe
        if (form.recipe.length > 0) {
          await fetch(`${API_URL}/management/products/${prodId}/recipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: form.recipe.map(r => ({
                stockItemId: r.stockItemId,
                quantity: parseFloat(r.quantity)
              }))
            })
          });
        }

        setShowModal(false);
        fetchData();
      }
    } catch (e) { Alert.alert('Erreur', 'Echec sauvegarde'); }
  };

  const handleDelete = (item: any) => {
    Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${API_URL}/management/products/${item.id}`, { method: 'DELETE' });
            fetchData();
          } catch (e) { Alert.alert('Erreur', 'Echec suppression'); }
        }
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Produits</Text>
        <Text style={mgStyles.subtitle}>{products.length} produits configures</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: '#4F46E5' }]}>
                <Text style={mgStyles.cardLabel}>Total produits</Text>
                <Text style={mgStyles.cardValue}>{products.length}</Text>
              </View>
              <View style={[mgStyles.card, { backgroundColor: '#059669' }]}>
                <Text style={mgStyles.cardLabel}>Categories</Text>
                <Text style={mgStyles.cardValue}>{categories.length}</Text>
              </View>
            </View>

            {products.map(p => {
              const isActive = p.active ?? true;
              return (
                <TouchableOpacity key={p.id} style={[mgStyles.row, !isActive && { opacity: 0.6 }]} onPress={() => openEdit(p)} onLongPress={() => handleDelete(p)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={mgStyles.rowTitle}>{p.name}</Text>
                        {!isActive && (
                          <View style={[mgStyles.badge, { backgroundColor: '#F1F5F9', marginLeft: 8 }]}>
                            <Text style={[mgStyles.badgeText, { color: '#64748B' }]}>Archivé</Text>
                          </View>
                        )}
                      </View>
                      <Text style={mgStyles.rowSub}>{p.category?.name || '-'}</Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#4F46E5' }}>
                      {Number(p.price).toFixed(3)} DT
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={mgStyles.fab} onPress={openCreate}>
        <Text style={mgStyles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={mgStyles.modalOverlay}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
            <View style={mgStyles.modalContent}>
              <Text style={mgStyles.modalTitle}>{editItem ? 'Modifier produit' : 'Nouveau produit'}</Text>
              <TextInput style={mgStyles.input} placeholder="Nom du produit" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput style={[mgStyles.input, { flex: 2 }]} placeholder="Prix (DT)" keyboardType="decimal-pad" value={form.price} onChangeText={v => setForm({ ...form, price: v })} />
                <TouchableOpacity 
                  style={[mgStyles.btnCancel, { flex: 1, backgroundColor: form.active ? '#D1FAE5' : '#FEE2E2', borderWidth: 1, borderColor: form.active ? '#10B981' : '#EF4444' }]} 
                  onPress={() => setForm({ ...form, active: !form.active })}
                >
                  <Text style={{ color: form.active ? '#065F46' : '#991B1B', fontWeight: '800', fontSize: 13 }}>
                    {form.active ? 'Actif' : 'Archivé'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={mgStyles.label}>Categorie</Text>
              <View style={mgStyles.pickerRow}>
                {categories.map(c => (
                  <TouchableOpacity key={c.id} style={[mgStyles.pickerChip, form.categoryId === c.id && mgStyles.pickerChipActive]} onPress={() => setForm({ ...form, categoryId: c.id })}>
                    <Text style={[mgStyles.pickerChipText, form.categoryId === c.id && mgStyles.pickerChipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={mgStyles.label}>Recette (Ingredients)</Text>
              {form.recipe.map((r, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <View style={{ flex: 2 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                      {stockItems.map(si => (
                        <TouchableOpacity 
                          key={si.id} 
                          style={[mgStyles.pickerChip, { marginRight: 4, paddingVertical: 4 }, r.stockItemId === si.id && mgStyles.pickerChipActive]} 
                          onPress={() => {
                            const newRecipe = [...form.recipe];
                            newRecipe[idx].stockItemId = si.id;
                            setForm({ ...form, recipe: newRecipe });
                          }}
                        >
                          <Text style={[mgStyles.pickerChipText, { fontSize: 11 }, r.stockItemId === si.id && mgStyles.pickerChipTextActive]}>{si.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <TextInput 
                    style={[mgStyles.input, { flex: 1, marginBottom: 0, paddingVertical: 8 }]} 
                    placeholder="Qte" 
                    keyboardType="decimal-pad" 
                    value={r.quantity} 
                    onChangeText={v => {
                      const newRecipe = [...form.recipe];
                      newRecipe[idx].quantity = v;
                      setForm({ ...form, recipe: newRecipe });
                    }} 
                  />
                  <TouchableOpacity onPress={() => {
                    const newRecipe = form.recipe.filter((_, i) => i !== idx);
                    setForm({ ...form, recipe: newRecipe });
                  }}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity 
                style={{ padding: 8, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, marginBottom: 16 }}
                onPress={() => setForm({ ...form, recipe: [...form.recipe, { stockItemId: '', quantity: '0' }] })}
              >
                <Text style={{ color: '#4F46E5', fontWeight: '700' }}>+ Ajouter un ingredient</Text>
              </TouchableOpacity>

              <View style={mgStyles.btnRow}>
                <TouchableOpacity style={mgStyles.btnCancel} onPress={() => setShowModal(false)}>
                  <Text style={mgStyles.btnTextDark}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={mgStyles.btnPrimary} onPress={handleSave}>
                  <Text style={mgStyles.btnText}>{editItem ? 'Modifier' : 'Creer'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}


// ══════════════════════════════════════════════════════════════
// STOCK (Matieres Premieres) MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════════
export function StockManagementScreen({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', quantity: '', cost: '', minThreshold: '', unitId: '', supplierId: '' });

  const fetchData = async () => {
    try {
      const [stockRes, suppRes, unitRes] = await Promise.all([
        fetch(`${API_URL}/management/stock/${storeId}`),
        fetch(`${API_URL}/management/suppliers/${storeId}`),
        fetch(`${API_URL}/management/units`),
      ]);
      if (stockRes.ok) setItems(await stockRes.json());
      if (suppRes.ok) setSuppliers(await suppRes.json());
      if (unitRes.ok) setUnits(await unitRes.json());
    } catch (e) { console.warn('Stock fetch error', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', quantity: '0', cost: '0', minThreshold: '0', unitId: '', supplierId: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      quantity: String(Number(item.quantity)),
      cost: String(Number(item.cost)),
      minThreshold: String(Number(item.minThreshold)),
      unitId: item.unitId || '',
      supplierId: item.preferredSupplierId || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    try {
      const url = editItem ? `${API_URL}/management/stock/${editItem.id}` : `${API_URL}/management/stock`;
      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          quantity: parseFloat(form.quantity) || 0,
          cost: parseFloat(form.cost) || 0,
          minThreshold: parseFloat(form.minThreshold) || 0,
          unitId: form.unitId || null,
          preferredSupplierId: form.supplierId || null,
          ...(!editItem && { storeId }),
        }),
      });
      if (res.ok) { setShowModal(false); fetchData(); }
    } catch (e) { Alert.alert('Erreur', 'Echec sauvegarde'); }
  };

  const handleDelete = (item: any) => {
    Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await fetch(`${API_URL}/management/stock/${item.id}`, { method: 'DELETE' });
        fetchData();
      }},
    ]);
  };

  const getStatus = (item: any) => {
    const q = Number(item.quantity), m = Number(item.minThreshold);
    if (q <= 0) return { label: 'Rupture', color: '#EF4444', bg: '#FEE2E2' };
    if (q <= m) return { label: 'Bas', color: '#D97706', bg: '#FEF3C7' };
    return { label: 'OK', color: '#059669', bg: '#D1FAE5' };
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Matieres Premieres</Text>
        <Text style={mgStyles.subtitle}>Inventaire et approvisionnement</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: '#4F46E5' }]}>
                <Text style={mgStyles.cardLabel}>Articles</Text>
                <Text style={mgStyles.cardValue}>{items.length}</Text>
              </View>
              <View style={[mgStyles.card, { backgroundColor: '#EF4444' }]}>
                <Text style={mgStyles.cardLabel}>Alertes</Text>
                <Text style={mgStyles.cardValue}>{items.filter(i => Number(i.quantity) <= Number(i.minThreshold)).length}</Text>
              </View>
            </View>

            {items.map(item => {
              const s = getStatus(item);
              return (
                <TouchableOpacity key={item.id} style={mgStyles.row} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={mgStyles.rowTitle}>{item.name}</Text>
                    <View style={[mgStyles.badge, { backgroundColor: s.bg, marginLeft: 8 }]}>
                      <Text style={[mgStyles.badgeText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                  <Text style={mgStyles.rowSub}>
                    Qte: {Number(item.quantity).toFixed(2)} {item.unit?.name || ''} | Seuil: {Number(item.minThreshold)} | Cout: {Number(item.cost).toFixed(3)} DT
                  </Text>
                  {item.preferredSupplier && <Text style={[mgStyles.rowSub, { color: '#4F46E5' }]}>Fournisseur: {item.preferredSupplier.name}</Text>}
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={mgStyles.fab} onPress={openCreate}>
        <Text style={mgStyles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <ScrollView contentContainerStyle={mgStyles.modalOverlay}>
          <View style={mgStyles.modalContent}>
            <Text style={mgStyles.modalTitle}>{editItem ? 'Modifier' : 'Nouvelle matiere'}</Text>
            <TextInput style={mgStyles.input} placeholder="Nom" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <TextInput style={mgStyles.input} placeholder="Quantite" keyboardType="decimal-pad" value={form.quantity} onChangeText={v => setForm({ ...form, quantity: v })} />
            <TextInput style={mgStyles.input} placeholder="Cout unitaire (DT)" keyboardType="decimal-pad" value={form.cost} onChangeText={v => setForm({ ...form, cost: v })} />
            <TextInput style={mgStyles.input} placeholder="Seuil minimum" keyboardType="decimal-pad" value={form.minThreshold} onChangeText={v => setForm({ ...form, minThreshold: v })} />
            
            {units.length > 0 && (<>
              <Text style={mgStyles.label}>Unite</Text>
              <View style={mgStyles.pickerRow}>
                {units.map(u => (
                  <TouchableOpacity key={u.id} style={[mgStyles.pickerChip, form.unitId === u.id && mgStyles.pickerChipActive]} onPress={() => setForm({ ...form, unitId: u.id })}>
                    <Text style={[mgStyles.pickerChipText, form.unitId === u.id && mgStyles.pickerChipTextActive]}>{u.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>)}

            {suppliers.length > 0 && (<>
              <Text style={mgStyles.label}>Fournisseur</Text>
              <View style={mgStyles.pickerRow}>
                <TouchableOpacity style={[mgStyles.pickerChip, !form.supplierId && mgStyles.pickerChipActive]} onPress={() => setForm({ ...form, supplierId: '' })}>
                  <Text style={[mgStyles.pickerChipText, !form.supplierId && mgStyles.pickerChipTextActive]}>Aucun</Text>
                </TouchableOpacity>
                {suppliers.map(s => (
                  <TouchableOpacity key={s.id} style={[mgStyles.pickerChip, form.supplierId === s.id && mgStyles.pickerChipActive]} onPress={() => setForm({ ...form, supplierId: s.id })}>
                    <Text style={[mgStyles.pickerChipText, form.supplierId === s.id && mgStyles.pickerChipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>)}

            <View style={mgStyles.btnRow}>
              <TouchableOpacity style={mgStyles.btnCancel} onPress={() => setShowModal(false)}>
                <Text style={mgStyles.btnTextDark}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mgStyles.btnPrimary} onPress={handleSave}>
                <Text style={mgStyles.btnText}>{editItem ? 'Modifier' : 'Creer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SUPPLIERS MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════════
export function SuppliersScreen({ storeId }: { storeId: string }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', contact: '', phone: '' });

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/management/suppliers/${storeId}`);
      if (res.ok) setSuppliers(await res.json());
    } catch (e) { console.warn('Suppliers fetch error', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', contact: '', phone: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, contact: item.contact || '', phone: item.phone || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    try {
      const url = editItem ? `${API_URL}/management/suppliers/${editItem.id}` : `${API_URL}/management/suppliers`;
      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, contact: form.contact, phone: form.phone, ...(!editItem && { storeId }) }),
      });
      if (res.ok) { setShowModal(false); fetchData(); }
    } catch (e) { Alert.alert('Erreur', 'Echec sauvegarde'); }
  };

  const handleDelete = (item: any) => {
    Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await fetch(`${API_URL}/management/suppliers/${item.id}`, { method: 'DELETE' });
        fetchData();
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Fournisseurs</Text>
        <Text style={mgStyles.subtitle}>Gestion des partenaires</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: '#4F46E5' }]}>
                <Text style={mgStyles.cardLabel}>Fournisseurs</Text>
                <Text style={mgStyles.cardValue}>{suppliers.length}</Text>
              </View>
            </View>

            {suppliers.map(s => (
              <TouchableOpacity key={s.id} style={mgStyles.row} onPress={() => openEdit(s)} onLongPress={() => handleDelete(s)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>{s.name.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={mgStyles.rowTitle}>{s.name}</Text>
                    <Text style={mgStyles.rowSub}>
                      {s.contact || '-'} | Tel: {s.phone || '-'}
                    </Text>
                    <Text style={mgStyles.rowSub}>
                      {s._count?.stockItems || 0} articles | {s._count?.orders || 0} commandes
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={mgStyles.fab} onPress={openCreate}>
        <Text style={mgStyles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={mgStyles.modalOverlay}>
          <View style={mgStyles.modalContent}>
            <Text style={mgStyles.modalTitle}>{editItem ? 'Modifier fournisseur' : 'Nouveau fournisseur'}</Text>
            <TextInput style={mgStyles.input} placeholder="Nom du fournisseur" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <TextInput style={mgStyles.input} placeholder="Contact (email/nom)" value={form.contact} onChangeText={v => setForm({ ...form, contact: v })} />
            <TextInput style={mgStyles.input} placeholder="Telephone" keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} />

            <View style={mgStyles.btnRow}>
              <TouchableOpacity style={mgStyles.btnCancel} onPress={() => setShowModal(false)}>
                <Text style={mgStyles.btnTextDark}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mgStyles.btnPrimary} onPress={handleSave}>
                <Text style={mgStyles.btnText}>{editItem ? 'Modifier' : 'Creer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// ORDERS (Commandes) MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════════
export function OrdersScreen({ storeId }: { storeId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ supplierId: '', items: [{ stockItemId: '', name: '', quantity: '1', price: '0' }] });

  const fetchData = async () => {
    try {
      const [ordRes, suppRes, stockRes] = await Promise.all([
        fetch(`${API_URL}/management/orders/${storeId}`),
        fetch(`${API_URL}/management/suppliers/${storeId}`),
        fetch(`${API_URL}/management/stock/${storeId}`),
      ]);
      if (ordRes.ok) setOrders(await ordRes.json());
      if (suppRes.ok) setSuppliers(await suppRes.json());
      if (stockRes.ok) setStockItems(await stockRes.json());
    } catch (e) { console.warn('Orders fetch error', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'En attente', color: '#D97706', bg: '#FEF3C7' };
      case 'CONFIRMED': return { label: 'Confirmee', color: '#2563EB', bg: '#DBEAFE' };
      case 'DELIVERED': return { label: 'Livree', color: '#059669', bg: '#D1FAE5' };
      case 'CANCELLED': return { label: 'Annulee', color: '#EF4444', bg: '#FEE2E2' };
      default: return { label: status, color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { stockItemId: '', name: '', quantity: '1', price: '0' }] });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...form.items];
    (newItems[index] as any)[field] = value;
    // Auto-fill name from stock item
    if (field === 'stockItemId') {
      const si = stockItems.find(s => s.id === value);
      if (si) {
        newItems[index].name = si.name;
        newItems[index].price = String(Number(si.cost));
      }
    }
    setForm({ ...form, items: newItems });
  };

  const handleCreate = async () => {
    const validItems = form.items.filter(i => i.name || i.stockItemId);
    if (validItems.length === 0) { Alert.alert('Erreur', 'Ajoutez au moins un article'); return; }
    
    const total = validItems.reduce((sum, i) => sum + parseFloat(i.quantity) * parseFloat(i.price), 0);
    try {
      const res = await fetch(`${API_URL}/management/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          supplierId: form.supplierId || null,
          total,
          items: validItems.map(i => ({
            stockItemId: i.stockItemId || null,
            name: i.name || null,
            quantity: parseFloat(i.quantity),
            price: parseFloat(i.price),
          })),
        }),
      });
      if (res.ok) { setShowModal(false); fetchData(); }
    } catch (e) { Alert.alert('Erreur', 'Echec creation'); }
  };

  const updateStatus = (orderId: string, newStatus: string) => {
    Alert.alert('Changer statut', `Passer en "${newStatus}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        await fetch(`${API_URL}/management/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        fetchData();
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Commandes</Text>
        <Text style={mgStyles.subtitle}>Approvisionnement fournisseurs</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: '#D97706' }]}>
                <Text style={mgStyles.cardLabel}>En attente</Text>
                <Text style={mgStyles.cardValue}>{orders.filter(o => o.status === 'PENDING').length}</Text>
              </View>
              <View style={[mgStyles.card, { backgroundColor: '#059669' }]}>
                <Text style={mgStyles.cardLabel}>Livrees</Text>
                <Text style={mgStyles.cardValue}>{orders.filter(o => o.status === 'DELIVERED').length}</Text>
              </View>
            </View>

            {orders.map(order => {
              const st = getStatusBadge(order.status);
              return (
                <View key={order.id} style={mgStyles.row}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={mgStyles.rowTitle}>#{order.id.substring(0, 8)}</Text>
                    <View style={[mgStyles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[mgStyles.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={mgStyles.rowSub}>
                    {order.supplier?.name || order.vendor?.companyName || 'Fournisseur libre'} | {Number(order.total).toFixed(3)} DT
                  </Text>
                  <Text style={mgStyles.rowSub}>
                    {order.items?.length || 0} articles | {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </Text>

                  {/* Status actions */}
                  {order.status === 'PENDING' && (
                    <View style={[mgStyles.btnRow, { marginTop: 8 }]}>
                      <TouchableOpacity style={[mgStyles.btnPrimary, { flex: 1, padding: 10 }]} onPress={() => updateStatus(order.id, 'CONFIRMED')}>
                        <Text style={[mgStyles.btnText, { fontSize: 12 }]}>Confirmer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[mgStyles.btnDanger, { flex: 1, padding: 10 }]} onPress={() => updateStatus(order.id, 'CANCELLED')}>
                        <Text style={[mgStyles.btnText, { fontSize: 12 }]}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <TouchableOpacity style={[mgStyles.btnPrimary, { marginTop: 8, padding: 10, backgroundColor: '#059669' }]} onPress={() => updateStatus(order.id, 'DELIVERED')}>
                      <Text style={[mgStyles.btnText, { fontSize: 12 }]}>Marquer livree</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={mgStyles.fab} onPress={() => {
        setForm({ supplierId: '', items: [{ stockItemId: '', name: '', quantity: '1', price: '0' }] });
        setShowModal(true);
      }}>
        <Text style={mgStyles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <ScrollView contentContainerStyle={mgStyles.modalOverlay}>
          <View style={mgStyles.modalContent}>
            <Text style={mgStyles.modalTitle}>Nouvelle commande</Text>

            {suppliers.length > 0 && (<>
              <Text style={mgStyles.label}>Fournisseur</Text>
              <View style={mgStyles.pickerRow}>
                <TouchableOpacity style={[mgStyles.pickerChip, !form.supplierId && mgStyles.pickerChipActive]} onPress={() => setForm({ ...form, supplierId: '' })}>
                  <Text style={[mgStyles.pickerChipText, !form.supplierId && mgStyles.pickerChipTextActive]}>Libre</Text>
                </TouchableOpacity>
                {suppliers.map(s => (
                  <TouchableOpacity key={s.id} style={[mgStyles.pickerChip, form.supplierId === s.id && mgStyles.pickerChipActive]} onPress={() => setForm({ ...form, supplierId: s.id })}>
                    <Text style={[mgStyles.pickerChipText, form.supplierId === s.id && mgStyles.pickerChipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>)}

            <Text style={mgStyles.label}>Articles</Text>
            {form.items.map((item, idx) => (
              <View key={idx} style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={[mgStyles.label, { marginTop: 0 }]}>Matiere premiere</Text>
                <View style={mgStyles.pickerRow}>
                  {stockItems.slice(0, 10).map(si => (
                    <TouchableOpacity key={si.id} style={[mgStyles.pickerChip, item.stockItemId === si.id && mgStyles.pickerChipActive]} onPress={() => updateItem(idx, 'stockItemId', si.id)}>
                      <Text style={[mgStyles.pickerChipText, item.stockItemId === si.id && mgStyles.pickerChipTextActive]}>{si.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput style={[mgStyles.input, { flex: 1 }]} placeholder="Qte" keyboardType="decimal-pad" value={item.quantity} onChangeText={v => updateItem(idx, 'quantity', v)} />
                  <TextInput style={[mgStyles.input, { flex: 1 }]} placeholder="Prix" keyboardType="decimal-pad" value={item.price} onChangeText={v => updateItem(idx, 'price', v)} />
                </View>
              </View>
            ))}

            <TouchableOpacity style={{ alignItems: 'center', padding: 10 }} onPress={addItem}>
              <Text style={{ color: '#4F46E5', fontWeight: '700' }}>+ Ajouter un article</Text>
            </TouchableOpacity>

            <View style={mgStyles.btnRow}>
              <TouchableOpacity style={mgStyles.btnCancel} onPress={() => setShowModal(false)}>
                <Text style={mgStyles.btnTextDark}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mgStyles.btnPrimary} onPress={handleCreate}>
                <Text style={mgStyles.btnText}>Commander</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS SCREEN
// ══════════════════════════════════════════════════════════════
export function NotificationsScreen({ storeId }: { storeId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/management/notifications/${storeId}`);
      if (res.ok) setNotifications(await res.json());
    } catch (e) { console.warn('Notifications fetch error', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [storeId]);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return { icon: '🔴', bg: '#FEE2E2', color: '#991B1B' };
      case 'warning': return { icon: '🟡', bg: '#FEF3C7', color: '#92400E' };
      default: return { icon: '🔵', bg: '#DBEAFE', color: '#1E40AF' };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={mgStyles.title}>Notifications</Text>
            <Text style={mgStyles.subtitle}>Alertes et rappels</Text>
          </View>
          <TouchableOpacity onPress={fetchNotifications} style={{ padding: 10, backgroundColor: '#4F46E5', borderRadius: 12 }}>
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Actualiser</Text>
          </TouchableOpacity>
        </View>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : notifications.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#059669' }}>Tout est en ordre</Text>
            <Text style={mgStyles.rowSub}>Aucune alerte pour le moment</Text>
          </View>
        ) : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: '#EF4444' }]}>
                <Text style={mgStyles.cardLabel}>Critiques</Text>
                <Text style={mgStyles.cardValue}>{notifications.filter(n => n.severity === 'critical').length}</Text>
              </View>
              <View style={[mgStyles.card, { backgroundColor: '#D97706' }]}>
                <Text style={mgStyles.cardLabel}>Alertes</Text>
                <Text style={mgStyles.cardValue}>{notifications.filter(n => n.severity === 'warning').length}</Text>
              </View>
            </View>

            {notifications.map(n => {
              const sty = getSeverityStyle(n.severity);
              return (
                <View key={n.id} style={[mgStyles.row, { borderLeftWidth: 4, borderLeftColor: sty.color }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>{sty.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={mgStyles.rowTitle}>{n.title}</Text>
                      <Text style={mgStyles.rowSub}>{n.message}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
