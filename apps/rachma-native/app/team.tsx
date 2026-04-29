import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import i18n from '../locales/i18n';

export default function TeamManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [role, setRole] = useState('CASHIER');

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) setStoreId(session.storeId);
      else setLoading(false);
    });
  }, []);

  const loadTeam = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await ApiService.get(`/management/employees/${storeId}`);
      setTeam(data || []);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) loadTeam();
  }, [storeId]);

  const openForm = (emp?: any) => {
    if (emp) {
      setEditId(emp.id);
      setName(emp.name);
      setPinCode(emp.pinCode || '');
      setRole(emp.role);
    } else {
      setEditId(null);
      setName('');
      setPinCode('');
      setRole('CASHIER');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !pinCode) {
      Alert.alert(i18n.t('auth.errorTitle'), i18n.t('team.errorFields'));
      return;
    }
    if (pinCode.length < 4) {
      Alert.alert(i18n.t('auth.errorTitle'), i18n.t('team.errorPinLength'));
      return;
    }

    try {
      if (editId) {
        await ApiService.put(`/management/employees/${editId}`, { name, role, pinCode });
      } else {
        await ApiService.post('/management/employees', { storeId, name, role, pinCode });
      }
      setModalVisible(false);
      loadTeam();
    } catch (e) {
      Alert.alert(i18n.t('auth.errorTitle'), i18n.t('team.errorSave'));
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await ApiService.put(`/management/employees/${id}`, { isActive: !currentStatus });
      loadTeam();
    } catch (e) {
      Alert.alert(i18n.t('auth.errorTitle'), i18n.t('team.errorStatus'));
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      i18n.t('team.revokeTitle'),
      i18n.t('team.revokeConfirm', { name }),
      [
        { text: i18n.t('profile.cancel'), style: 'cancel' },
        { 
          text: i18n.t('pos.close'), 
          style: 'destructive', 
          onPress: async () => {
            await ApiService.delete(`/management/employees/${id}`);
            loadTeam();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isActive = item.isActive !== false; // Default true if undefined
    return (
      <View style={[styles.card, !isActive && { opacity: 0.6 }]}>
        <View style={styles.cardInfo}>
          <View style={[styles.avatar, { backgroundColor: item.role === 'STORE_OWNER' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
            <Text style={[styles.avatarText, { color: item.role === 'STORE_OWNER' ? '#a855f7' : '#10b981' }]}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {!isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>{i18n.t('team.inactive')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSub}>
              {item.role === 'STORE_OWNER' ? i18n.t('team.manager') : i18n.t('team.cashier')} • PIN: ****
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.statusBtn, { backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]} 
            onPress={() => toggleStatus(item.id, isActive)}
          >
            <FontAwesome name={isActive ? "toggle-on" : "toggle-off"} size={20} color={isActive ? '#10b981' : '#ef4444'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => openForm(item)}>
            <FontAwesome name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('team.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={team}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{i18n.t('team.emptyTeam')}</Text>
          }
        />
      )}

      {/* Modal Form */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? i18n.t('team.editMember') : i18n.t('team.newMember')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{i18n.t('team.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={i18n.t('team.namePlaceholder')}
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>{i18n.t('team.pinLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={i18n.t('team.pinPlaceholder')}
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              secureTextEntry={true}
              value={pinCode}
              onChangeText={setPinCode}
              maxLength={8}
            />

            <Text style={styles.label}>{i18n.t('team.roleLabel')}</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'CASHIER' && styles.roleBtnActive]} 
                onPress={() => setRole('CASHIER')}
              >
                <Text style={[styles.roleText, role === 'CASHIER' && styles.roleTextActive]}>{i18n.t('team.cashier')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'STORE_OWNER' && styles.roleBtnActiveOwner]} 
                onPress={() => setRole('STORE_OWNER')}
              >
                <Text style={[styles.roleText, role === 'STORE_OWNER' && styles.roleTextActive]}>{i18n.t('team.manager')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{i18n.t('team.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050914' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: '#0a0f1e', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { padding: 10, marginLeft: -10 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  addBtn: {
    backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: -10,
  },
  list: { padding: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16,
    marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 15,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSub: { color: '#94a3b8', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    padding: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
  },
  deleteBtn: {
    padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12,
  },
  statusBtn: {
    padding: 12, borderRadius: 12,
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
  },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 15 },

  // Modal classes
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)'
  },
  modalContent: {
    backgroundColor: '#0f172a', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 16,
  },
  roleContainer: { flexDirection: 'row', gap: 12, marginTop: 5 },
  roleBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  roleBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: Colors.primary },
  roleBtnActiveOwner: { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: '#a855f7' },
  roleText: { color: '#94a3b8', fontWeight: '700', fontSize: 14 },
  roleTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: Colors.primary, padding: 18, borderRadius: 14,
    alignItems: 'center', marginTop: 30, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
