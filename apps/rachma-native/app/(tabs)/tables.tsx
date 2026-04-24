import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, Modal, Alert, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '@/services/auth';
import { ApiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type TableCart = { total: number };
type TableCarts = Record<string, TableCart>;

export default function TablesScreen() {
  const insets = useSafeAreaInsets();
  const [assignedTables, setAssignedTables] = useState<string[]>([]);
  const [isRestricted, setIsRestricted] = useState(false);
  const [tableCarts, setTableCarts] = useState<TableCarts>({});
  const [refreshing, setRefreshing] = useState(false);
  
  const [historyOpen, setHistoryOpen] = useState(false);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const session = await AuthService.getSession();
      if (session?.user) {
        const assigned = session.user.assignedTables || [];
        if (assigned.length > 0) {
          setAssignedTables(assigned.map((t: string) => t.trim()));
          setIsRestricted(true);
        } else {
          setIsRestricted(false);
        }
      }

      const storeId = session?.storeId || '1';
      const cartsData = await AsyncStorage.getItem(`rachma_table_carts_${storeId}`);
      if (cartsData) {
        setTableCarts(JSON.parse(cartsData));
      } else {
        setTableCarts({});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadHistory = async () => {
    try {
      const session = await AuthService.getSession();
      const storeId = session?.storeId || '1';
      const c = await AsyncStorage.getItem(`tickets_history_${storeId}`);
      if (c) {
        setTicketHistory(JSON.parse(c));
      }
    } catch (e) {}
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleTablePress = (tableId: string) => {
    router.push({ pathname: '/pos', params: { tableId } });
  };

  const handleOpenHistory = () => {
    loadHistory();
    setHistoryOpen(true);
  };

  const handlePrint = (ticket: any) => {
    if (Platform.OS === 'web') {
      window.alert(`Lancement de l'impression pour le ticket ${ticket.id}...`);
    } else {
      Alert.alert('Impression', `Impression du ticket ${ticket.id} envoyée à l'imprimante.`);
    }
  };

  const handleCancel = (ticket: any) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment annuler ce ticket ?\nCette action annulera le ticket légalement de manière tracée.')) {
        AuthService.getSession().then((session) => {
          if (!ticket.dbId) {
            window.alert('Ce ticket local ne peut pas être annulé sur le serveur (Format Obsolète).');
            return;
          }
          ApiService.post(`/sales/${ticket.dbId}/cancel`, { canceledById: session.user?.id })
          .then(async () => {
             window.alert('✅ Ticket annulé avec succès.');
             const storeId = session?.storeId || '1';
             const c = await AsyncStorage.getItem(`tickets_history_${storeId}`);
             if (c) {
               let history = JSON.parse(c);
               const updated = history.map((t: any) => t.id === ticket.id ? { ...t, isVoid: true } : t);
               await AsyncStorage.setItem(`tickets_history_${storeId}`, JSON.stringify(updated));
               setTicketHistory(updated);
               setSelectedTicket({ ...ticket, isVoid: true });
             }
          }).catch(() => {
             window.alert("❌ Impossible d'annuler ce ticket.");
          });
        });
      }
      return;
    }

    Alert.alert(
      'Annuler le ticket',
      'Voulez-vous vraiment annuler ce ticket ? Cette action annulera le ticket serveur de manière tracée.',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, Annuler', 
          style: 'destructive',
          onPress: async () => {
            try {
              const session = await AuthService.getSession();
              if (!ticket.dbId) {
                Alert.alert('Erreur', 'Ce ticket local (anciennes versions) ne peut pas être annulé sur le serveur.');
                return;
              }
              await ApiService.post(`/sales/${ticket.dbId}/cancel`, { canceledById: session.user?.id });
              Alert.alert('✅ Succès', 'Ticket annulé avec succès.');
              
              const storeId = session?.storeId || '1';
              const c = await AsyncStorage.getItem(`tickets_history_${storeId}`);
              if (c) {
                let history = JSON.parse(c);
                const updated = history.map((t: any) => t.id === ticket.id ? { ...t, isVoid: true } : t);
                await AsyncStorage.setItem(`tickets_history_${storeId}`, JSON.stringify(updated));
                setTicketHistory(updated);
                setSelectedTicket({ ...ticket, isVoid: true });
              }
            } catch(e) {
              Alert.alert('Erreur', "Impossible d'annuler ce ticket.");
            }
          }
        }
      ]
    );
  };

  let displayTables = [];
  if (isRestricted) {
    displayTables = assignedTables;
  } else {
    for (let i = 1; i <= 50; i++) {
      displayTables.push(i.toString());
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={{ backgroundColor: 'transparent' }}>
          <Text style={styles.headerTitle}>Plan de Salle</Text>
          <Text style={styles.headerSubtitle}>Veuillez sélectionner une table</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'transparent' }}>
          <TouchableOpacity style={styles.historyBtn} onPress={handleOpenHistory}>
            <FontAwesome name="file-text-o" size={16} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{displayTables.length} TABLES</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.gridContainer}
        contentContainerStyle={styles.gridContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
      >
        {displayTables.map((tableNum) => {
          const tableId = `T${tableNum}`;
          const cart = tableCarts[tableId];
          const isActive = cart && cart.total > 0;

          return (
            <TouchableOpacity 
              key={tableId} 
              style={[styles.tableCard, isActive && styles.tableCardActive]}
              onPress={() => handleTablePress(tableId)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tableNum, isActive && styles.tableNumActive]}>{tableNum}</Text>
              {isActive ? (
                <Text style={styles.tableTotal}>{cart.total.toFixed(3)} DT</Text>
              ) : (
                <Text style={styles.tableFree}>Libre</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* History Modal */}
      <Modal visible={historyOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => { setHistoryOpen(false); setSelectedTicket(null); }} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTicket ? `Ticket ${selectedTicket.id}` : '🧾 Historique'}</Text>
              <TouchableOpacity onPress={() => selectedTicket ? setSelectedTicket(null) : setHistoryOpen(false)}>
                <FontAwesome name={selectedTicket ? "arrow-left" : "close"} size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedTicket ? (
              <ScrollView style={styles.historyList}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketDate}>{new Date(selectedTicket.timestamp).toLocaleString('fr-FR')}</Text>
                  <Text style={styles.ticketTable}>{selectedTicket.tableId ? `Table ${selectedTicket.tableId}` : 'Vente Directe'}</Text>
                </View>
                <View style={styles.ticketDivider} />
                {selectedTicket.items.map((item: any, idx: number) => (
                  <View key={idx} style={styles.ticketRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.ticketItemName}>{item.qty} x {item.name}</Text>
                    </View>
                    <Text style={styles.ticketItemPrice}>{(item.price * item.qty).toFixed(3)}</Text>
                  </View>
                ))}
                <View style={styles.ticketDivider} />
                <View style={styles.ticketTotalRow}>
                  <Text style={styles.ticketTotalLabel}>TOTAL TTC</Text>
                  <Text style={styles.ticketTotalValue}>{selectedTicket.totalTTC.toFixed(3)} DT</Text>
                </View>
                
                {selectedTicket.signature && (
                  <View style={{ paddingHorizontal: 20, paddingBottom: 15, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>CERTIFICAT FISCAL NACEF</Text>
                    <Text style={{ fontSize: 8, color: '#475569', textAlign: 'center', marginTop: 4 }}>
                      Signature (HMAC-SHA256): {selectedTicket.signature}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 20 }}>
                  <TouchableOpacity style={[styles.printBtn, { flex: 1, margin: 0, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }]} onPress={() => handleCancel(selectedTicket)} disabled={selectedTicket.isVoid}>
                    <FontAwesome name="ban" size={18} color={selectedTicket.isVoid ? "#94a3b8" : Colors.danger} />
                    <Text style={[styles.printBtnText, { color: selectedTicket.isVoid ? "#94a3b8" : Colors.danger }]}>{selectedTicket.isVoid ? 'Déjà Annulé' : 'Annuler'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.printBtn, { flex: 2, margin: 0 }]} onPress={() => handlePrint(selectedTicket)}>
                    <FontAwesome name="print" size={18} color="#ffffff" />
                    <Text style={styles.printBtnText}>Imprimer Ticket</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <ScrollView style={styles.historyList}>
                {ticketHistory.length === 0 && (
                  <Text style={styles.emptyHistory}>Aucun historique disponible.</Text>
                )}
                {ticketHistory.map((t, i) => (
                  <TouchableOpacity key={i} style={styles.historyRow} onPress={() => setSelectedTicket(t)}>
                    <View style={styles.historyRowLeft}>
                      <Text style={styles.historyRef}>{t.tableId ? `${t.tableId}` : 'Direct'}</Text>
                      <Text style={styles.historyTime}>
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.historyRowRight}>
                      <Text style={styles.historyTotal}>{t.totalTTC.toFixed(3)} DT</Text>
                      <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 25,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 35, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    opacity: 0.9,
  },
  historyBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 20, 35, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gridContainer: {
    flex: 1,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    paddingBottom: 120,
    gap: 10,
    justifyContent: 'center',
  },
  tableCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(16, 20, 35, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  tableCardActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: Colors.primary,
  },
  tableNum: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  tableNumActive: {
    color: Colors.primary,
  },
  tableFree: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  tableTotal: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#0a0f1e', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '85%', paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    backgroundColor: '#111827',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  historyList: { maxHeight: 500 },
  emptyHistory: { color: '#94a3b8', textAlign: 'center', padding: 40 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyRowLeft: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  historyRef: { color: '#ffffff', fontWeight: '800', fontSize: 16, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  historyTime: { color: '#94a3b8', fontSize: 14 },
  historyRowRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  historyTotal: { color: Colors.primary, fontWeight: '900', fontSize: 16 },
  ticketHeader: { padding: 20, alignItems: 'center' },
  ticketDate: { color: '#94a3b8', fontSize: 14 },
  ticketTable: { color: '#ffffff', fontSize: 22, fontWeight: '900', marginTop: 5 },
  ticketDivider: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, marginVertical: 10 },
  ticketRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8, justifyContent: 'space-between' },
  ticketItemName: { color: '#ffffff', fontSize: 15 },
  ticketItemPrice: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  ticketTotalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  ticketTotalLabel: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  ticketTotalValue: { color: Colors.primary, fontSize: 24, fontWeight: '900' },
  printBtn: {
    margin: 20, height: 56, borderRadius: 16, backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10
  },
  printBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 16 }
});
