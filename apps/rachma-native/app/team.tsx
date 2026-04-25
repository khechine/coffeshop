import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';

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
      Alert.alert("Erreur", "Le nom et le code PIN sont obligatoires.");
      return;
    }
    if (pinCode.length < 4) {
      Alert.alert("Erreur", "Le code PIN doit faire au moins 4 caractères.");
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
      Alert.alert("Erreur", "Impossible d'enregistrer l'employé.");
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Révoquer l\'accès',
      `Voulez-vous vraiment désactiver le compte de ${name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
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
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>
              {item.role === 'CASHIER' ? '🟢 Caissier(e)' : '🟣 Manager'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openForm(item)}>
            <FontAwesome name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
            <FontAwesome name="user-times" size={18} color={Colors.danger} />
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
        <Text style={styles.headerTitle}>Gestion Équipe</Text>
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
            <Text style={styles.emptyText}>Aucun employé trouvé. Ajoutez des membres à votre équipe !</Text>
          }
        />
      )}

      {/* Modal Form */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Modifier un employé' : 'Nouvel employé'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nom de l'Employé</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Ahmed"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Code PIN (Secret)</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 4 chiffres, ex: 1234"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              secureTextEntry={true}
              value={pinCode}
              onChangeText={setPinCode}
              maxLength={8}
            />

            <Text style={styles.label}>Rôle</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'CASHIER' && styles.roleBtnActive]} 
                onPress={() => setRole('CASHIER')}
              >
                <Text style={[styles.roleText, role === 'CASHIER' && styles.roleTextActive]}>Caissier</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'STORE_OWNER' && styles.roleBtnActiveOwner]} 
                onPress={() => setRole('STORE_OWNER')}
              >
                <Text style={[styles.roleText, role === 'STORE_OWNER' && styles.roleTextActive]}>Manager</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer ✔</Text>
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
