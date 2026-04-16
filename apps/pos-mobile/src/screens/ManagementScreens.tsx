import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Image, Animated, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useConfirm } from '../context/ConfirmContext';
import { usePOSStore } from '../store/posStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// ══════════════════════════════════════════════════════════════
// CUSTOM SELECT DROPDOWN (natif, sans librairie externe)
// ══════════════════════════════════════════════════════════════
interface SelectOption { id: string; label: string; isChild?: boolean; parentId?: string; }
interface CustomSelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  theme: any;
  allowEmpty?: boolean;
  emptyLabel?: string;
}
function CustomSelect({ label, placeholder, options, value, onChange, theme, allowEmpty, emptyLabel }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value ? (options.find(o => o.id === value)?.label || placeholder || 'Sélectionner') : (placeholder || 'Sélectionner');
  
  const cs = useMemo(() => StyleSheet.create({
    wrapper: { marginBottom: 12 },
    lbl: { fontSize: 12, fontWeight: '700', color: theme.colors.caramel, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
    trigger: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.colors.background, borderWidth: 1.5,
      borderColor: value ? theme.colors.caramel : theme.colors.glassBorder,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    },
    triggerText: { fontSize: 15, fontWeight: '600', color: value ? theme.colors.cream : theme.colors.creamMuted, flex: 1 },
    chevron: { fontSize: 12, color: theme.colors.caramel, marginLeft: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    sheetInner: { 
      backgroundColor: theme.colors.surface, 
      borderTopLeftRadius: 24, borderTopRightRadius: 24, 
      paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 40 : 20, 
      borderTopWidth: 1, borderColor: theme.colors.glassBorder, 
      maxHeight: '90%' // Allow it to be taller
    },
    handle: { width: 40, height: 4, backgroundColor: theme.colors.glassBorder, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    sheetTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.creamMuted, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder },
    optionChild: { paddingLeft: 40 }, // Indent children
    optionActive: { backgroundColor: `${theme.colors.caramel}18` },
    optionText: { fontSize: 16, fontWeight: '500', color: theme.colors.cream, flex: 1 },
    optionTextChild: { color: theme.colors.creamMuted, fontSize: 15 },
    optionTextActive: { color: theme.colors.caramel, fontWeight: '700' },
    checkIcon: { fontSize: 16, color: theme.colors.caramel },
  }), [theme, value]);
  
  return (
    <View style={cs.wrapper}>
      <Text style={cs.lbl}>{label}</Text>
      <TouchableOpacity style={cs.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={cs.triggerText} numberOfLines={1}>{selectedLabel}</Text>
        <Text style={cs.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={cs.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          {/* Prevent touches from closing when clicking inside the sheet */}
          <TouchableOpacity activeOpacity={1} style={cs.sheetInner}>
            <View style={cs.handle} />
            <Text style={cs.sheetTitle}>{label}</Text>
            
            <ScrollView bounces={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {allowEmpty && (
                <TouchableOpacity style={[cs.option, !value && cs.optionActive]} onPress={() => { onChange(''); setOpen(false); }}>
                  <Text style={[cs.optionText, !value && cs.optionTextActive]}>{emptyLabel || 'Aucune'}</Text>
                  {!value && <Text style={cs.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
              {options.map(opt => (
                <TouchableOpacity 
                  key={opt.id} 
                  style={[cs.option, opt.isChild && cs.optionChild, value === opt.id && cs.optionActive]} 
                  onPress={() => { onChange(opt.id); setOpen(false); }}
                >
                  <Text style={[cs.optionText, opt.isChild && cs.optionTextChild, value === opt.id && cs.optionTextActive]}>
                    {opt.isChild ? `↳ ${opt.label}` : opt.label}
                  </Text>
                  {value === opt.id && <Text style={cs.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Style Factory
const createMgStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.cream, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.caramel, marginBottom: 20 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, padding: 20, borderRadius: 16 },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  emptyText: { color: theme.colors.creamMuted, fontSize: 15, textAlign: 'center', marginTop: 40 },
  row: {
    backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.cream },
  rowSub: { fontSize: 13, color: theme.colors.caramel, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: Platform.OS === 'android' ? 125 : 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: theme.colors.caramel, justifyContent: 'center', alignItems: 'center',
    ...(theme.shadows.floating as any)
  },
  fabText: { color: theme.colors.background, fontSize: 28, fontWeight: '900', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 24, maxHeight: '85%', borderWidth: 1, borderColor: theme.colors.glassBorder },
  modalTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.cream, marginBottom: 16 },
  input: {
    backgroundColor: theme.colors.background, padding: 14, borderRadius: 12, fontSize: 16,
    marginBottom: 12, borderWidth: 1, borderColor: theme.colors.glassBorder, color: theme.colors.cream,
  },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnPrimary: { flex: 1, backgroundColor: theme.colors.caramel, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDanger: { flex: 1, backgroundColor: theme.colors.danger, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnCancel: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: theme.colors.background, fontSize: 16, fontWeight: '900' },
  btnTextDark: { color: theme.colors.cream, fontSize: 16, fontWeight: '800' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.glassBorder },
  pickerChipActive: { backgroundColor: theme.colors.caramel, borderColor: theme.colors.caramel },
  pickerChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.cream },
  pickerChipTextActive: { color: theme.colors.background },
  checkbox: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.glassBorder },
  checkboxActive: { backgroundColor: theme.colors.caramel, borderColor: theme.colors.caramel },
  checkboxText: { fontSize: 12, fontWeight: '600', color: theme.colors.cream },
  checkboxTextActive: { color: theme.colors.background },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.caramel, marginBottom: 6, marginTop: 4 },
  // Hierarchy tree (vendor read-only)
  treeParent: { backgroundColor: theme.colors.surface, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.glassBorder, overflow: 'hidden' },
  treeParentHeader: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  treeParentIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${theme.colors.caramel}20`, justifyContent: 'center', alignItems: 'center' },
  treeParentIconText: { fontSize: 16 },
  treeParentName: { fontSize: 15, fontWeight: '800', color: theme.colors.cream, flex: 1 },
  treeParentCount: { fontSize: 11, fontWeight: '700', color: theme.colors.caramel, backgroundColor: `${theme.colors.caramel}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  treeChild: { paddingVertical: 10, paddingHorizontal: 16, paddingLeft: 60, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.glassBorder },
  treeChildText: { fontSize: 14, color: theme.colors.creamMuted, flex: 1 },
  treeChildDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.caramel, marginRight: 10 },
  noSubBadge: { alignSelf: 'flex-start', marginLeft: 14, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: theme.colors.surfaceLight },
  noSubText: { fontSize: 11, color: theme.colors.creamMuted, fontStyle: 'italic' },
});

export function CategoriesScreen({ storeId, isVendor }: { storeId: string, isVendor?: boolean }) {
  const { theme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', parentId: '' });
  const { alert, confirm } = useConfirm();

  const fetchData = async () => {
    try {
      const endpoint = isVendor ? `management/marketplace/categories` : `products/categories`;
      const res = await fetch(`${API_URL}/${endpoint}`);
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.warn('Categories fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const handleCreate = async () => {
    if (!form.name.trim()) { alert('Erreur', 'Le nom est requis'); return; }
    try {
      const res = await fetch(`${API_URL}/management/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), storeId, parentId: form.parentId || null }),
      });
      if (res.ok) { setShowModal(false); setForm({ name: '', parentId: '' }); fetchData(); }
    } catch (e) { alert('Erreur', 'Echec creation'); }
  };

  const handleDelete = (item: any) => {
    confirm({
      title: 'Supprimer',
      message: `Supprimer "${item.name}" ?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/management/categories/${item.id}`, { method: 'DELETE' });
          if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Echec suppression'); }
          fetchData();
        } catch (e: any) { alert('Erreur', e.message); }
      }
    });
  };

  const rootCategories = categories.filter(c => !c.parentId);

  // ── VENDOR: read-only hierarchy view ──────────────────────────
  if (isVendor) {
    const catIcons: Record<string, string> = {};
    const iconPool = ['🏷️','📦','🍵','🎁','⚡','🌿','🔥','💎','🧴','🍃'];
    rootCategories.forEach((c, i) => { catIcons[c.id] = iconPool[i % iconPool.length]; });

    return (
      <View style={mgStyles.container}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={mgStyles.title}>Catalogue Catégories</Text>
          <Text style={mgStyles.subtitle}>Hiérarchie en lecture seule</Text>

          {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
            <>
              <View style={mgStyles.cardRow}>
                <View style={[mgStyles.card, { backgroundColor: theme.colors.caramel }]}>
                  <Text style={mgStyles.cardLabel}>Catégories racines</Text>
                  <Text style={mgStyles.cardValue}>{rootCategories.length}</Text>
                </View>
                <View style={[mgStyles.card, { backgroundColor: theme.colors.surfaceLight }]}>
                  <Text style={[mgStyles.cardLabel, { color: theme.colors.softOrange }]}>Sous-catégories</Text>
                  <Text style={mgStyles.cardValue}>{categories.filter(c => c.parentId).length}</Text>
                </View>
              </View>

              {rootCategories.length === 0 && (
                <Text style={mgStyles.emptyText}>Aucune catégorie disponible</Text>
              )}

              {rootCategories.map(parent => {
                const children = isVendor 
                  ? (parent.subcategories || []) 
                  : categories.filter(c => c.parentId === parent.id);
                  
                return (
                  <View key={parent.id} style={mgStyles.treeParent}>
                    <View style={mgStyles.treeParentHeader}>
                      <View style={mgStyles.treeParentIcon}>
                        <Text style={mgStyles.treeParentIconText}>{catIcons[parent.id]}</Text>
                      </View>
                      <Text style={mgStyles.treeParentName}>{parent.name}</Text>
                      <Text style={mgStyles.treeParentCount}>
                        {children.length} sous-cat.
                      </Text>
                    </View>
                    {children.length === 0 ? (
                      <View style={mgStyles.noSubBadge}>
                        <Text style={mgStyles.noSubText}>Pas de sous-catégorie</Text>
                      </View>
                    ) : (
                      children.map((child: any) => (
                        <View key={child.id} style={mgStyles.treeChild}>
                          <View style={mgStyles.treeChildDot} />
                          <Text style={mgStyles.treeChildText}>{child.name}</Text>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }

  // ── OWNER: full CRUD ──────────────────────────────────────────
  const rootCatsForPicker = rootCategories;

  return (
    <View style={mgStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Categories</Text>
        <Text style={mgStyles.subtitle}>Organiser vos menus et produits</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: theme.colors.caramel }]}>
                <Text style={mgStyles.cardLabel}>Total categories</Text>
                <Text style={mgStyles.cardValue}>{categories.length}</Text>
              </View>
            </View>

            {categories.map(c => (
              <View key={c.id} style={mgStyles.row}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={mgStyles.rowTitle}>{c.parentId ? `  ↳ ${c.name}` : c.name}</Text>
                    <Text style={mgStyles.rowSub}>{c._count?.products || 0} produits associés</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(c)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              placeholder="ex: Boissons, Froides..."
              placeholderTextColor={theme.colors.creamMuted}
              value={form.name}
              onChangeText={v => setForm({ ...form, name: v })}
            />

            <CustomSelect
              label="Catégorie parente (optionnel)"
              placeholder="Racine (aucune)"
              options={rootCatsForPicker.map(c => ({ id: c.id, label: c.name }))}
              value={form.parentId}
              onChange={v => setForm({ ...form, parentId: v })}
              theme={theme}
              allowEmpty
              emptyLabel="Racine (aucune)"
            />

            <View style={[mgStyles.btnRow, { marginTop: 12 }]}>
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
// PRODUCTS MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════════
export function ProductsScreen({ storeId, isVendor }: { storeId: string, isVendor?: boolean }) {
  const { theme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    subcategoryId: '',
    minOrderQty: '1',
    active: true,
    image: '',
    unit: 'kg',
    brand: '',
    isFeatured: false,
    isFlashSale: false,
    discountPrice: '',
    flashDuration: '24', // Default 24h
    recipe: [] as { stockItemId: string; quantity: string }[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<'all' | 'featured' | 'flash' | 'archived'>('all');

  const { alert, confirm } = useConfirm();

  const fetchData = async () => {
    try {
      const prodEndpoint = isVendor ? `management/marketplace/products?vendorId=${storeId}` : `management/products/${storeId}`;
      const catEndpoint = isVendor ? `management/marketplace/categories?vendorId=${storeId}` : `products/categories`;
      const responses = await Promise.all([
        fetch(`${API_URL}/${prodEndpoint}`),
        fetch(`${API_URL}/${catEndpoint}`),
        ...(isVendor ? [] : [fetch(`${API_URL}/management/stock/${storeId}`)])
      ]);
      if (responses[0].ok) setProducts(await responses[0].json());
      if (responses[1].ok) setCategories(await responses[1].json());
      if (!isVendor && responses[2] && responses[2].ok) setStockItems(await responses[2].json());
    } catch (e) { console.warn('Products fetch error', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search filter
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category filter
      const matchesCategory = !activeCategory || p.categoryId === activeCategory || p.subcategoryId === activeCategory;
      
      // Status filter
      let matchesStatus = true;
      if (activeStatus === 'featured') matchesStatus = !!p.isFeatured;
      else if (activeStatus === 'flash') matchesStatus = !!p.isFlashSale;
      else if (activeStatus === 'archived') matchesStatus = p.active === false;
      else if (activeStatus === 'all') matchesStatus = p.active !== false;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, activeCategory, activeStatus]);

  const openCreate = () => {
    setEditItem(null);
    setForm({
      name: '', price: '',
      categoryId: '',
      subcategoryId: '',
      unit: 'kg', minOrderQty: '1',
      brand: '', image: '',
      isFeatured: false, isFlashSale: false,
      discountPrice: '', flashDuration: '24',
      active: true, recipe: []
    });
    setCurrentView('form');
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: String(Number(item.price)),
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId || '',
      unit: item.unit || 'kg',
      minOrderQty: String(item.minOrderQty || 1),
      brand: item.brand || '',
      image: item.image || '',
      isFeatured: item.isFeatured || false,
      isFlashSale: item.isFlashSale || false,
      discountPrice: item.discountPrice ? String(Number(item.discountPrice)) : '',
      flashDuration: item.flashEnd ? String(Math.max(1, Math.round((new Date(item.flashEnd).getTime() - (item.flashStart ? new Date(item.flashStart).getTime() : Date.now())) / (1000 * 60 * 60)))) : '24',
      active: item.active ?? true,
      recipe: (item.recipe || []).map((r: any) => ({
        stockItemId: r.stockItemId,
        quantity: String(Number(r.quantity))
      }))
    });
    setCurrentView('form');
  };

  const goBack = () => setCurrentView('list');

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      alert('Erreur', 'Nom, prix et catégorie sont requis');
      return;
    }
    setSaving(true);
    try {
      const baseUrl = isVendor ? `${API_URL}/management/marketplace/products` : `${API_URL}/management/products`;
      const url = editItem ? `${baseUrl}/${editItem.id}` : baseUrl;
      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          categoryId: form.categoryId,
          subcategoryId: form.subcategoryId || null,
          ...(isVendor && {
            unit: form.unit,
            brand: form.brand || undefined,
            isFeatured: form.isFeatured,
            isFlashSale: form.isFlashSale,
            discountPrice: (form.isFlashSale && form.discountPrice && !isNaN(parseFloat(form.discountPrice))) ? parseFloat(form.discountPrice) : null,
            flashStart: form.isFlashSale ? new Date().toISOString() : null,
            flashEnd: (form.isFlashSale && !isNaN(parseInt(form.flashDuration || '24'))) 
              ? new Date(Date.now() + parseInt(form.flashDuration || '24') * 3600000).toISOString() 
              : null,
          }),
          minOrderQty: parseFloat(form.minOrderQty) || 1,
          active: form.active,
          image: form.image || undefined,
          ...(!editItem && {
            storeId: isVendor ? undefined : storeId,
            vendorId: isVendor ? storeId : undefined
          }),
        }),
      });
      if (res.ok) {
        const product = await res.json();
        const prodId = editItem ? editItem.id : product.id;
        if (form.recipe.length > 0) {
          await fetch(`${API_URL}/management/products/${prodId}/recipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: form.recipe.map(r => ({ stockItemId: r.stockItemId, quantity: parseFloat(r.quantity) })) })
          });
        }
        setCurrentView('list');
        fetchData();
      } else {
        alert('Erreur', 'Echec sauvegarde');
      }
    } catch (e) { alert('Erreur', 'Echec sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = (item: any) => {
    confirm({
      title: 'Supprimer',
      message: `Supprimer "${item.name}" ?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`${API_URL}/management/products/${item.id}`, { method: 'DELETE' });
          fetchData();
        } catch (e) { alert('Erreur', 'Echec suppression'); }
      }
    });
  };

  // ── FORM PAGE ────────────────────────────────────────────────
  if (currentView === 'form') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Page header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.glassBorder, gap: 12 }}>
          <TouchableOpacity
            onPress={goBack}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.surfaceLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glassBorder }}
          >
            <Text style={{ color: theme.colors.cream, fontSize: 18, fontWeight: '700' }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>CATALOGUE</Text>
            <Text style={{ color: theme.colors.cream, fontSize: 17, fontWeight: '900' }} numberOfLines={1}>
              {editItem ? `Modifier : ${editItem.name}` : 'Nouveau produit'}
            </Text>
          </View>
          {editItem && (
            <TouchableOpacity onPress={() => handleDelete(editItem)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(248,113,113,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' }}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form content */}
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Image hero (vendor only) */}
          {isVendor && (
            <View style={{ marginBottom: 20 }}>
              {form.image ? (
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: form.image }} style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: theme.colors.surfaceLight }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setForm({ ...form, image: '' })}
                    style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: '100%', height: 160, borderRadius: 16, borderWidth: 1.5, borderColor: theme.colors.glassBorder, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface }}>
                  <Text style={{ fontSize: 40, marginBottom: 6 }}>📷</Text>
                  <Text style={{ color: theme.colors.creamMuted, fontSize: 13 }}>Ajouter une photo du produit</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.caramel, padding: 13, borderRadius: 12 }}
                  onPress={async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') { alert('Permission', 'Permission caméra refusée'); return; }
                    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
                    if (!result.canceled && result.assets?.[0]?.base64) setForm({ ...form, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📷</Text>
                  <Text style={{ color: theme.colors.background, fontWeight: '800', fontSize: 13 }}>Caméra</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.surfaceLight, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.glassBorder }}
                  onPress={async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') { alert('Permission', 'Permission galerie refusée'); return; }
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
                    if (!result.canceled && result.assets?.[0]?.base64) setForm({ ...form, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
                  }}
                >
                  <Text style={{ fontSize: 16 }}>🖼️</Text>
                  <Text style={{ color: theme.colors.cream, fontWeight: '700', fontSize: 13 }}>Galerie</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[mgStyles.input, { marginTop: 8, fontSize: 12 }]}
                placeholder="Ou coller une URL d'image..."
                placeholderTextColor={theme.colors.creamMuted}
                value={form.image.startsWith('data:') ? '' : form.image}
                onChangeText={v => setForm({ ...form, image: v })}
              />
            </View>
          )}

          {/* Name + Prix + Statut */}
          <Text style={mgStyles.label}>Nom du produit</Text>
          <TextInput
            style={mgStyles.input}
            placeholder="ex: Tabac Royal Deluxe"
            placeholderTextColor={theme.colors.creamMuted}
            value={form.name}
            onChangeText={v => setForm({ ...form, name: v })}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Text style={mgStyles.label}>Prix (DT)</Text>
              <TextInput style={mgStyles.input} placeholder="0.000" keyboardType="decimal-pad" value={form.price} onChangeText={v => setForm({ ...form, price: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mgStyles.label}>Statut</Text>
              <TouchableOpacity
                style={[mgStyles.input, { justifyContent: 'center', alignItems: 'center', backgroundColor: form.active ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)', borderColor: form.active ? '#22C55E' : '#F87171' }]}
                onPress={() => setForm({ ...form, active: !form.active })}
              >
                <Text style={{ color: form.active ? '#22C55E' : '#F87171', fontWeight: '800', fontSize: 13 }}>{form.active ? '● Actif' : '○ Archivé'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category selects */}
          {(() => {
            const rootCats = categories.filter((c: any) => !c.parentId);
            const selectedRoot = categories.find((c: any) => c.id === form.categoryId);
            const subs = selectedRoot?.subcategories
              ? selectedRoot.subcategories  // Marketplace nested format
              : categories.filter((c: any) => c.parentId === form.categoryId); // POS flat format

            return (
              <>
                <CustomSelect
                  label="Catégorie parente"
                  placeholder="Sélectionner..."
                  options={rootCats.map((c: any) => ({
                    id: c.id,
                    label: c.name + (c.subcategories?.length ? ` › ${c.subcategories.length} sous-catégories` : '')
                  }))}
                  value={form.categoryId}
                  onChange={v => setForm({ ...form, categoryId: v, subcategoryId: '' })}
                  theme={theme}
                />
                
                {form.categoryId && subs.length > 0 && (
                  <CustomSelect
                    label="Sous-catégorie"
                    placeholder="Toute la catégorie"
                    options={subs.map((c: any) => ({ id: c.id, label: c.name }))}
                    value={form.subcategoryId}
                    onChange={v => setForm({ ...form, subcategoryId: v })}
                    theme={theme}
                    allowEmpty
                    emptyLabel="Toute la catégorie"
                  />
                )}
              </>
            );
          })()}

          {/* Vendor-specific fields */}
          {isVendor && (
            <>
              <Text style={mgStyles.label}>Unité</Text>
              <View style={mgStyles.pickerRow}>
                {['kg', 'pièce', 'litre', 'gramme', 'boîte', 'paquet'].map(unit => (
                  <TouchableOpacity key={unit} style={[mgStyles.pickerChip, form.unit === unit && mgStyles.pickerChipActive]} onPress={() => setForm({ ...form, unit })}>
                    <Text style={[mgStyles.pickerChipText, form.unit === unit && mgStyles.pickerChipTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={mgStyles.label}>Quantité min. de commande</Text>
              <TextInput style={mgStyles.input} placeholder="1" keyboardType="number-pad" value={form.minOrderQty} onChangeText={v => setForm({ ...form, minOrderQty: v })} />

              <Text style={mgStyles.label}>Marque (optionnel)</Text>
              <TextInput style={mgStyles.input} placeholder="ex: Al Fakher, Fumari, Tangiers" value={form.brand} onChangeText={v => setForm({ ...form, brand: v })} />

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 4 }}>
                <TouchableOpacity style={[mgStyles.checkbox, { flex: 1 }, form.isFeatured && mgStyles.checkboxActive]} onPress={() => setForm({ ...form, isFeatured: !form.isFeatured })}>
                  <Text style={[mgStyles.checkboxText, form.isFeatured && mgStyles.checkboxTextActive]}>{form.isFeatured ? '🌟 Vedette' : '☆ Vedette'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[mgStyles.checkbox, { flex: 1 }, form.isFlashSale && mgStyles.checkboxActive]} onPress={() => setForm({ ...form, isFlashSale: !form.isFlashSale })}>
                  <Text style={[mgStyles.checkboxText, form.isFlashSale && mgStyles.checkboxTextActive]}>{form.isFlashSale ? '⚡ Flash On' : '⚡ Flash Off'}</Text>
                </TouchableOpacity>
              </View>

              {form.isFlashSale && (
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#EF4444', marginBottom: 20 }}>
                  <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12, marginBottom: 12, letterSpacing: 0.5 }}>PARAMÈTRES VENTE FLASH</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={mgStyles.label}>Prix Remisé (DT)</Text>
                      <TextInput 
                        style={[mgStyles.input, { borderColor: '#EF4444' }]} 
                        placeholder="0.000" 
                        keyboardType="decimal-pad" 
                        value={form.discountPrice} 
                        onChangeText={v => setForm({ ...form, discountPrice: v })} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={mgStyles.label}>Durée (Heures)</Text>
                      <TextInput 
                        style={[mgStyles.input, { borderColor: '#EF4444' }]} 
                        placeholder="24" 
                        keyboardType="number-pad" 
                        value={form.flashDuration} 
                        onChangeText={v => setForm({ ...form, flashDuration: v })} 
                      />
                    </View>
                  </View>
                  <Text style={{ color: theme.colors.creamMuted, fontSize: 11, marginTop: 4 }}>
                    Le prix promo et le compte à rebours s'afficheront sur le marketplace.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Owner-only: recipe */}
          {!isVendor && (
            <>
              <Text style={mgStyles.label}>Recette (Ingredients)</Text>
              {form.recipe.map((r, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <View style={{ flex: 2 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                      {stockItems.map(si => (
                        <TouchableOpacity key={si.id} style={[mgStyles.pickerChip, { marginRight: 4, paddingVertical: 4 }, r.stockItemId === si.id && mgStyles.pickerChipActive]}
                          onPress={() => { const nr = [...form.recipe]; nr[idx].stockItemId = si.id; setForm({ ...form, recipe: nr }); }}>
                          <Text style={[mgStyles.pickerChipText, { fontSize: 11 }, r.stockItemId === si.id && mgStyles.pickerChipTextActive]}>{si.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <TextInput style={[mgStyles.input, { flex: 1, marginBottom: 0, paddingVertical: 8 }]} placeholder="Qte" keyboardType="decimal-pad" value={r.quantity}
                    onChangeText={v => { const nr = [...form.recipe]; nr[idx].quantity = v; setForm({ ...form, recipe: nr }); }} />
                  <TouchableOpacity onPress={() => setForm({ ...form, recipe: form.recipe.filter((_, i) => i !== idx) })}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={{ alignItems: 'center', padding: 10, marginBottom: 12 }} onPress={() => setForm({ ...form, recipe: [...form.recipe, { stockItemId: '', quantity: '1' }] })}>
                <Text style={{ color: '#4F46E5', fontWeight: '700' }}>+ Ajouter un ingredient</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[mgStyles.btnPrimary, { marginTop: 8, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={mgStyles.btnText}>{saving ? 'Enregistrement...' : editItem ? '✓ Enregistrer les modifications' : '✓ Créer le produit'}</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ── LIST PAGE ────────────────────────────────────────────────
  return (
    <View style={mgStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Produits</Text>
        <Text style={mgStyles.subtitle}>{products.length} produits configurés • {filteredProducts.length} affichés</Text>

        {/* Filters Section */}
        <View style={{ marginBottom: 20 }}>
          {/* Search Bar */}
          <View style={{ 
            flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceLight, 
            borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.glassBorder 
          }}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: theme.colors.cream, fontSize: 14 }}
              placeholder="Rechercher un produit..."
              placeholderTextColor={theme.colors.creamMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: theme.colors.creamMuted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Categories Horizontal Scroll */}
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity 
                style={[mgStyles.pickerChip, !activeCategory && mgStyles.pickerChipActive, { marginRight: 8 }]}
                onPress={() => setActiveCategory(null)}
              >
                <Text style={[mgStyles.pickerChipText, !activeCategory && mgStyles.pickerChipTextActive]}>Toutes</Text>
              </TouchableOpacity>
              {categories.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[mgStyles.pickerChip, activeCategory === c.id && mgStyles.pickerChipActive, { marginRight: 8 }]}
                  onPress={() => setActiveCategory(c.id)}
                >
                  <Text style={[mgStyles.pickerChipText, activeCategory === c.id && mgStyles.pickerChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Status Quick Filters */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { id: 'all', label: 'Tous', icon: '📦' },
              { id: 'featured', label: 'Vedettes', icon: '🌟' },
              { id: 'flash', label: 'Flash', icon: '⚡' },
              { id: 'archived', label: 'Archives', icon: '📁' }
            ].map(f => (
              <TouchableOpacity 
                key={f.id}
                onPress={() => setActiveStatus(f.id as any)}
                style={{ 
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                  backgroundColor: activeStatus === f.id ? theme.colors.caramel : theme.colors.surfaceLight,
                  paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: activeStatus === f.id ? theme.colors.caramel : theme.colors.glassBorder
                }}
              >
                <Text style={{ fontSize: 12 }}>{f.icon}</Text>
                <Text style={{ color: activeStatus === f.id ? theme.colors.background : theme.colors.cream, fontSize: 10, fontWeight: '700' }}>
                  {f.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: theme.colors.caramel }]}>
                <Text style={mgStyles.cardLabel}>Total produits</Text>
                <Text style={mgStyles.cardValue}>{products.length}</Text>
              </View>
              <View style={[mgStyles.card, { backgroundColor: theme.colors.surfaceLight }]}>
                <Text style={mgStyles.cardLabel}>Catégories</Text>
                <Text style={mgStyles.cardValue}>{categories.length}</Text>
              </View>
            </View>

            {filteredProducts.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
                <Text style={{ color: theme.colors.creamMuted, fontSize: 15 }}>Aucun résultat pour ces filtres</Text>
              </View>
            )}

            {filteredProducts.map(p => {
              const isActive = p.active ?? true;
              const isFlash = p.isFlashSale && p.discountPrice;
              return (
                <TouchableOpacity key={p.id} style={[mgStyles.row, !isActive && { opacity: 0.55 }]} onPress={() => openEdit(p)} onLongPress={() => handleDelete(p)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {isVendor && (
                      <View style={{ width: 62, height: 62, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.colors.surfaceLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                        {p.image ? <Image source={{ uri: p.image }} style={{ width: 62, height: 62 }} resizeMode="cover" /> : <Text style={{ fontSize: 24 }}>📦</Text>}
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <Text style={[mgStyles.rowTitle, { maxWidth: '100%' }]} numberOfLines={1}>{p.name}</Text>
                        {!isActive && <View style={[mgStyles.badge, { backgroundColor: theme.colors.surfaceLight }]}><Text style={[mgStyles.badgeText, { color: theme.colors.creamMuted, fontSize: 8 }]}>Archivé</Text></View>}
                        {isVendor && p.isFeatured && <View style={[mgStyles.badge, { backgroundColor: '#FCD34D20', borderColor: '#FCD34D', borderWidth: 1 }]}><Text style={[mgStyles.badgeText, { color: '#F59E0B', fontSize: 8 }]}>🌟 VEDETTE</Text></View>}
                        {isVendor && p.isFlashSale && <View style={[mgStyles.badge, { backgroundColor: '#EF444420', borderColor: '#EF4444', borderWidth: 1 }]}><Text style={[mgStyles.badgeText, { color: '#EF4444', fontSize: 8 }]}>⚡ FLASH</Text></View>}
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={mgStyles.rowSub}>{p.category?.name || '-'}</Text>
                        {isVendor && (
                          <Text style={[mgStyles.rowSub, { color: theme.colors.caramel, fontWeight: '700' }]}>
                            • Min: {Number(p.minOrderQty || 1)} {p.unit || 'unité'}
                          </Text>
                        )}
                      </View>
                      {isVendor && p.brand && <Text style={[mgStyles.rowSub, { color: theme.colors.creamMuted, fontSize: 11 }]}>{p.brand}</Text>}
                    </View>
                    
                    <View style={{ alignItems: 'flex-end' }}>
                      {isFlash ? (
                        <>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>{Number(p.discountPrice).toFixed(3)} DT</Text>
                          <Text style={{ fontSize: 10, color: theme.colors.creamMuted, textDecorationLine: 'line-through' }}>{Number(p.price).toFixed(3)}</Text>
                        </>
                      ) : (
                        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.colors.caramel }}>{Number(p.price).toFixed(3)} DT</Text>
                      )}
                    </View>
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
    </View>
  );
}



// ══════════════════════════════════════════════════════════════
// STOCK (Matieres Premieres) MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════════
export function StockManagementScreen({ storeId }: { storeId: string }) {
  const { theme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', quantity: '', cost: '', minThreshold: '', unitId: '', supplierId: '' });
  const { alert, confirm } = useConfirm();

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
    if (!form.name) { alert('Erreur', 'Le nom est requis'); return; }
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
    } catch (e) { alert('Erreur', 'Echec sauvegarde'); }
  };

  const handleDelete = (item: any) => {
    confirm({
      title: 'Supprimer',
      message: `Supprimer "${item.name}" ?`,
      type: 'danger',
      onConfirm: async () => {
        await fetch(`${API_URL}/management/stock/${item.id}`, { method: 'DELETE' });
        fetchData();
      }
    });
  };

  const getStatus = (item: any) => {
    const q = Number(item.quantity), m = Number(item.minThreshold);
    if (q <= 0) return { label: 'Rupture', color: '#EF4444', bg: '#FEE2E2' };
    if (q <= m) return { label: 'Bas', color: '#D97706', bg: '#FEF3C7' };
    return { label: 'OK', color: '#059669', bg: '#D1FAE5' };
  };

  return (
    <View style={mgStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Matieres Premieres</Text>
        <Text style={mgStyles.subtitle}>Inventaire et approvisionnement</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: theme.colors.caramel }]}>
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
  const { theme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', contact: '', phone: '' });
  const { alert, confirm } = useConfirm();

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
    if (!form.name) { alert('Erreur', 'Le nom est requis'); return; }
    try {
      const url = editItem ? `${API_URL}/management/suppliers/${editItem.id}` : `${API_URL}/management/suppliers`;
      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, contact: form.contact, phone: form.phone, ...(!editItem && { storeId }) }),
      });
      if (res.ok) { setShowModal(false); fetchData(); }
    } catch (e) { alert('Erreur', 'Echec sauvegarde'); }
  };

  const handleDelete = (item: any) => {
    confirm({
      title: 'Supprimer',
      message: `Supprimer "${item.name}" ?`,
      type: 'danger',
      onConfirm: async () => {
        await fetch(`${API_URL}/management/suppliers/${item.id}`, { method: 'DELETE' });
        fetchData();
      }
    });
  };

  return (
    <View style={mgStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Fournisseurs</Text>
        <Text style={mgStyles.subtitle}>Gestion des partenaires</Text>

        {loading ? <Text style={mgStyles.emptyText}>Chargement...</Text> : (
          <>
            <View style={mgStyles.cardRow}>
              <View style={[mgStyles.card, { backgroundColor: theme.colors.caramel }]}>
                <Text style={mgStyles.cardLabel}>Fournisseurs</Text>
                <Text style={mgStyles.cardValue}>{suppliers.length}</Text>
              </View>
            </View>

            {suppliers.map(s => (
              <TouchableOpacity key={s.id} style={mgStyles.row} onPress={() => openEdit(s)} onLongPress={() => handleDelete(s)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.caramel, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
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
export function OrdersScreen({ storeId, isVendor }: { storeId: string, isVendor?: boolean }) {
  const { theme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ supplierId: '', items: [{ stockItemId: '', name: '', quantity: '1', price: '0' }] });
  const { alert, confirm } = useConfirm();

  const fetchData = async () => {
    try {
      const ordEndpoint = isVendor ? `management/vendor/orders/${storeId}` : `management/orders/${storeId}`;
      const responses = await Promise.all([
        fetch(`${API_URL}/${ordEndpoint}`),
        ...(isVendor ? [] : [
          fetch(`${API_URL}/management/suppliers/${storeId}`),
          fetch(`${API_URL}/management/stock/${storeId}`)
        ])
      ]);
      if (responses[0].ok) setOrders(await responses[0].json());
      if (!isVendor) {
        if (responses[1] && responses[1].ok) setSuppliers(await responses[1].json());
        if (responses[2] && responses[2].ok) setStockItems(await responses[2].json());
      }
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
    if (validItems.length === 0) { alert('Erreur', 'Ajoutez au moins un article'); return; }
    
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
    } catch (e) { alert('Erreur', 'Echec creation'); }
  };

  const updateStatus = (orderId: string, newStatus: string) => {
    confirm({
      title: 'Changer statut',
      message: `Passer en "${newStatus}" ?`,
      onConfirm: async () => {
        await fetch(`${API_URL}/management/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        fetchData();
      }
    });
  };

  return (
    <View style={mgStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={mgStyles.title}>Commandes</Text>
        <Text style={mgStyles.subtitle}>{isVendor ? 'Gestion des ventes B2B' : 'Approvisionnement fournisseurs'}</Text>

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
                <View key={order.id} style={[mgStyles.row, isVendor && order.status === 'PENDING' && { borderLeftWidth: 4, borderLeftColor: theme.colors.caramel }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={mgStyles.rowTitle}>{isVendor && order.store?.name ? order.store.name : `#${order.id.substring(0, 8)}`}</Text>
                    <View style={[mgStyles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[mgStyles.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  
                  {isVendor && order.store && (
                    <View style={{ marginBottom: 8, backgroundColor: `${theme.colors.glassBorder}50`, padding: 10, borderRadius: 12 }}>
                      <Text style={[mgStyles.rowSub, { color: theme.colors.cream, fontWeight: '700', marginBottom: 2 }]}>
                        📍 {order.store.address || ''}, {order.store.city || ''}
                      </Text>
                      <Text style={mgStyles.rowSub}>📞 {order.store.phone || 'Non renseigné'}</Text>
                      
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity 
                          style={{ backgroundColor: `${theme.colors.caramel}20`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${theme.colors.caramel}40`, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => Linking.openURL(`tel:${order.store.phone}`)}
                        >
                          <Text style={{ fontSize: 14 }}>📞</Text>
                          <Text style={{ color: theme.colors.caramel, fontSize: 10, fontWeight: '900' }}>APPELER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ backgroundColor: '#25D36620', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#25D36640', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => Linking.openURL(`https://wa.me/${order.store.phone?.replace(/\D/g, '')}`)}
                        >
                          <Text style={{ fontSize: 14 }}>💬</Text>
                          <Text style={{ color: '#25D366', fontSize: 10, fontWeight: '900' }}>WHATSAPP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ backgroundColor: `${theme.colors.creamMuted}20`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${theme.colors.creamMuted}40`, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => {
                            const url = order.store.lat && order.store.lng 
                              ? `http://maps.google.com/maps?daddr=${order.store.lat},${order.store.lng}` 
                              : `http://maps.google.com/maps?daddr=${encodeURIComponent(order.store.address + ' ' + order.store.city)}`;
                            Linking.openURL(url);
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>🗺️</Text>
                          <Text style={{ color: theme.colors.creamMuted, fontSize: 10, fontWeight: '900' }}>MAPS</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <Text style={mgStyles.rowSub}>
                    {!isVendor && (order.supplier?.name || order.vendor?.companyName || 'Fournisseur libre')} 
                    {isVendor && `Commande #${order.id.substring(0, 8)}`} | {Number(order.total).toFixed(3)} DT
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

      {!isVendor && (
        <>
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
                  <View key={idx} style={{ backgroundColor: theme.colors.surfaceLight, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.glassBorder }}>
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
        </>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS SCREEN
// ══════════════════════════════════════════════════════════════
export function NotificationsScreen({ storeId }: { storeId: string }) {
  const { theme } = usePOSStore();
  const mgStyles = useMemo(() => createMgStyles(theme), [theme]);
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
    <View style={mgStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={mgStyles.title}>Notifications</Text>
            <Text style={mgStyles.subtitle}>Alertes et rappels</Text>
          </View>
          <TouchableOpacity onPress={fetchNotifications} style={{ padding: 10, backgroundColor: theme.colors.caramel, borderRadius: 12 }}>
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
