import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';

export default function TableConfigScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'ZONE' | 'TABLE' | 'ASSIGN'>('ZONE');
  
  // Form States
  const [zoneName, setZoneName] = useState('');
  const [tableNum, setTableNum] = useState('');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) {
        setStoreId(session.storeId);
        loadData(session.storeId);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadData = async (sid: string) => {
    setLoading(true);
    try {
      // Mock or Real API calls
      const [zonesData, staffData] = await Promise.all([
        ApiService.get(`/management/zones/${sid}`),
        ApiService.get(`/management/employees/${sid}`)
      ]);
      setZones(zonesData || [
        { id: 'z1', name: 'Salle Principale', tables: [{ id: 't1', number: '1', staff: [] }, { id: 't2', number: '2', staff: [] }] },
        { id: 'z2', name: 'Terrasse', tables: [{ id: 't10', number: '10', staff: [] }] }
      ]);
      setStaff(staffData || []);
    } catch (error) {
      console.error('Failed to load table config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (!zoneName) return;
    try {
      // await ApiService.post('/management/zones', { storeId, name: zoneName });
      setZones([...zones, { id: Date.now().toString(), name: zoneName, tables: [] }]);
      setZoneName('');
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ajouter la zone.");
    }
  };

  const handleAddTable = async () => {
    if (!tableNum || !selectedZone) return;
    try {
      // await ApiService.post('/management/tables', { zoneId: selectedZone.id, number: tableNum });
      const updatedZones = zones.map(z => {
        if (z.id === selectedZone.id) {
          return { ...z, tables: [...z.tables, { id: Date.now().toString(), number: tableNum, staff: [] }] };
        }
        return z;
      });
      setZones(updatedZones);
      setTableNum('');
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ajouter la table.");
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedTable || !selectedZone) return;
    try {
      // await ApiService.put(`/management/tables/${selectedTable.id}/assign`, { employeeIds: selectedStaff });
      const updatedZones = zones.map(z => {
        if (z.id === selectedZone.id) {
          return {
            ...z,
            tables: z.tables.map((t: any) => t.id === selectedTable.id ? { ...t, staff: selectedStaff } : t)
          };
        }
        return z;
      });
      setZones(updatedZones);
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'assigner le personnel.");
    }
  };

  const openZoneModal = () => {
    setModalMode('ZONE');
    setZoneName('');
    setModalVisible(true);
  };

  const openTableModal = (zone: any) => {
    setSelectedZone(zone);
    setModalMode('TABLE');
    setTableNum('');
    setModalVisible(true);
  };

  const openAssignModal = (zone: any, table: any) => {
    setSelectedZone(zone);
    setSelectedTable(table);
    setSelectedStaff(table.staff || []);
    setModalMode('ASSIGN');
    setModalVisible(true);
  };

  const renderZone = ({ item: zone }: { item: any }) => (
    <View style={styles.zoneCard}>
      <View style={styles.zoneHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <FontAwesome name="map-o" size={18} color={Colors.primary} />
          <Text style={styles.zoneTitle}>{zone.name}</Text>
        </View>
        <TouchableOpacity style={styles.addMiniBtn} onPress={() => openTableModal(zone)}>
          <FontAwesome name="plus" size={14} color="#fff" />
          <Text style={styles.addMiniText}>Table</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tablesGrid}>
        {zone.tables.map((table: any) => (
          <TouchableOpacity 
            key={table.id} 
            style={styles.tableItem}
            onPress={() => openAssignModal(zone, table)}
          >
            <View style={styles.tableCircle}>
              <Text style={styles.tableNumText}>{table.number}</Text>
            </View>
            <View style={styles.staffDots}>
              {(table.staff || []).map((sId: string) => (
                <View key={sId} style={styles.staffDot} />
              ))}
              {(!table.staff || table.staff.length === 0) && (
                <Text style={styles.noStaffText}>Libre</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {zone.tables.length === 0 && (
          <Text style={styles.emptyZoneText}>Aucune table dans cette zone.</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plans de Salle</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openZoneModal}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(item) => item.id}
          renderItem={renderZone}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="map-signs" size={50} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>Commencez par créer une zone (ex: Terrasse, Salle 1).</Text>
            </View>
          }
        />
      )}

      {/* Configuration Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'ZONE' ? 'Nouvelle Zone' : modalMode === 'TABLE' ? `Ajouter à ${selectedZone?.name}` : 'Assigner Barista'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {modalMode === 'ZONE' && (
              <View>
                <Text style={styles.label}>Nom de la Zone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ex: Terrasse"
                  placeholderTextColor="#64748b"
                  value={zoneName}
                  onChangeText={setZoneName}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddZone}>
                  <Text style={styles.saveBtnText}>Créer la Zone</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalMode === 'TABLE' && (
              <View>
                <Text style={styles.label}>Numéro de Table</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ex: 12"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  value={tableNum}
                  onChangeText={setTableNum}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddTable}>
                  <Text style={styles.saveBtnText}>Ajouter Table</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalMode === 'ASSIGN' && (
              <View>
                <Text style={styles.label}>Assigner à la Table {selectedTable?.number}</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {staff.map(member => {
                    const isSelected = selectedStaff.includes(member.id);
                    return (
                      <TouchableOpacity 
                        key={member.id} 
                        style={[styles.staffSelectBtn, isSelected && styles.staffSelectBtnActive]}
                        onPress={() => {
                          if (isSelected) setSelectedStaff(selectedStaff.filter(id => id !== member.id));
                          else setSelectedStaff([...selectedStaff, member.id]);
                        }}
                      >
                        <View style={styles.staffAvatar}>
                          <Text style={styles.staffAvatarText}>{member.name[0]}</Text>
                        </View>
                        <Text style={[styles.staffName, isSelected && { color: '#fff' }]}>{member.name}</Text>
                        {isSelected && <FontAwesome name="check-circle" size={20} color={Colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAssignStaff}>
                  <Text style={styles.saveBtnText}>Confirmer l'Assignation</Text>
                </TouchableOpacity>
              </View>
            )}
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
  zoneCard: {
    backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  zoneTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  addMiniBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  addMiniText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableItem: {
    width: 65, alignItems: 'center', gap: 6,
  },
  tableCircle: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  tableNumText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  staffDots: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
  staffDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  noStaffText: { color: '#475569', fontSize: 10, fontWeight: '700' },
  emptyZoneText: { color: '#475569', fontSize: 13, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 20 },
  emptyText: { color: '#64748b', fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: {
    backgroundColor: '#0f172a', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 16,
  },
  saveBtn: {
    backgroundColor: Colors.primary, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  staffSelectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 8, borderWidth: 1, borderColor: 'transparent',
  },
  staffSelectBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  staffAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  staffAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  staffName: { color: '#94a3b8', fontSize: 15, fontWeight: '600', flex: 1 },
});
