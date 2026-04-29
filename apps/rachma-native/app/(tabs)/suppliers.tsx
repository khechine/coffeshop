import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import i18n from '../../locales/i18n';

export default function SuppliersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const fetchData = async (currentStoreId: string) => {
    try {
      const data = await ApiService.get(`/management/suppliers/${currentStoreId}`);
      setSuppliers(data || []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) {
        setStoreId(session.storeId);
        fetchData(session.storeId);
      }
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(storeId);
  };

  const handleSave = async () => {
    if (!formName) return Alert.alert(i18n.t('admin.error'), i18n.t('pos.nameRequired'));
    try {
      const payload = {
        name: formName,
        contact: formContact,
        phone: formPhone,
        storeId
      };

      if (editingSupplier) {
        await ApiService.put(`/management/suppliers/${editingSupplier.id}`, payload);
      } else {
        await ApiService.post('/management/suppliers', payload);
      }
      
      setIsModalVisible(false);
      resetForm();
      onRefresh();
    } catch (error) {
      Alert.alert(i18n.t('admin.error'), i18n.t('admin.error'));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(i18n.t('pos.confirm'), i18n.t('suppliers.confirmDelete'), [
      { text: i18n.t('pos.cancel'), style: "cancel" },
      { text: i18n.t('pos.delete'), style: "destructive", onPress: async () => {
        try {
          await ApiService.delete(`/management/suppliers/${id}`);
          onRefresh();
        } catch (error) {
          Alert.alert(i18n.t('admin.error'), i18n.t('admin.error'));
        }
      }}
    ]);
  };

  const resetForm = () => {
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setEditingSupplier(null);
  };

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('suppliers.title')}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setIsModalVisible(true); }}>
              <FontAwesome name="plus" size={16} color="#fff" />
          </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <FontAwesome name="search" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
        <TextInput 
          placeholder={i18n.t('suppliers.searchPlaceholder')} 
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {filtered.length > 0 ? filtered.map((s, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.supplierCard, styles.glassCard]}
            onPress={() => {
                setEditingSupplier(s);
                setFormName(s.name);
                setFormContact(s.contact || '');
                setFormPhone(s.phone || '');
                setIsModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{s.name.substring(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={styles.supplierName}>{s.name}</Text>
                    <Text style={styles.supplierContact}>{s.contact || i18n.t('suppliers.noContact')}</Text>
                </View>
                <TouchableOpacity onPress={() => s.phone && Linking.openURL(`tel:${s.phone}`)}>
                    <View style={styles.phoneCircle}>
                        <FontAwesome name="phone" size={16} color={Colors.primary} />
                    </View>
                </TouchableOpacity>
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.tag}>
                   <Text style={styles.tagText}>{i18n.t('suppliers.linkedProducts', { count: s._count?.stockItems || 0 })}</Text>
                </View>
                <View style={styles.tag}>
                   <Text style={styles.tagText}>{i18n.t('suppliers.ordersCount', { count: s._count?.orders || 0 })}</Text>
                </View>
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyState}>
             <FontAwesome name="handshake-o" size={64} color="rgba(255,255,255,0.05)" />
             <Text style={styles.emptyText}>{i18n.t('suppliers.emptyState')}</Text>
             <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setIsModalVisible(true)}>
                 <Text style={styles.emptyAddText}>{i18n.t('suppliers.addFirst')}</Text>
             </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Supplier Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSupplier ? i18n.t('suppliers.edit') : i18n.t('suppliers.new')} {i18n.t('suppliers.suppliersSingle') || 'Fournisseur'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <FontAwesome name="times-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.inputLabel}>{i18n.t('suppliers.companyName')}</Text>
                <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} placeholder={i18n.t('suppliers.companyPlaceholder')} placeholderTextColor="#475569" />
                
                <Text style={styles.inputLabel}>{i18n.t('suppliers.contactPerson')}</Text>
                <TextInput style={styles.modalInput} value={formContact} onChangeText={setFormContact} placeholder={i18n.t('suppliers.contactPlaceholder')} placeholderTextColor="#475569" />
                
                <Text style={styles.inputLabel}>{i18n.t('suppliers.phone')}</Text>
                <TextInput style={styles.modalInput} value={formPhone} onChangeText={setFormPhone} keyboardType="phone-pad" placeholder="+216 ..." placeholderTextColor="#475569" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>{i18n.t('suppliers.save')}</Text>
                </TouchableOpacity>

                {editingSupplier && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(editingSupplier.id)}>
                        <Text style={styles.deleteBtnText}>{i18n.t('suppliers.delete')}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollBody: {
    paddingBottom: 40,
  },
  supplierCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 15,
  },
  glassCard: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  supplierName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  supplierContact: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  phoneCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  cardFooter: {
      flexDirection: 'row',
      marginTop: 15,
      gap: 10,
      backgroundColor: 'transparent',
  },
  tag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tagText: {
      color: '#94a3b8',
      fontSize: 10,
      fontWeight: '600',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyAddBtn: {
      marginTop: 30,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  emptyAddText: {
      color: Colors.primary,
      fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0a101f',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
    paddingTop: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  modalBody: {
    padding: 25,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 5,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    height: 55,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  deleteBtn: {
      marginTop: 20,
      alignItems: 'center',
      padding: 10,
      backgroundColor: 'transparent',
  },
  deleteBtnText: {
      color: Colors.danger,
      fontWeight: '600',
  }
});
