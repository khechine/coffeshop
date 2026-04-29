import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Colors';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import i18n from '../locales/i18n';

export default function TerminalsManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.storeId) {
        setStoreId(session.storeId);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadTerminals = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await ApiService.get(`/management/terminals/${storeId}`);
      setTerminals(data || []);
    } catch (error) {
      console.error('Failed to load terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      loadTerminals();
    }
  }, [storeId]);

  const handleCreateTerminal = async () => {
    if (!storeId) return;

    if (Platform.OS === 'web') {
      const name = window.prompt(i18n.t('terminals.nameLabel'));
      if (!name) return;
      try {
        const res = await ApiService.post('/management/terminals', { storeId, nickname: name });
        if (res.activationCode) {
          window.alert(`${i18n.t('terminals.activationCodeTitle')}: ${res.activationCode}\n\n${i18n.t('terminals.activationCodeMsg', { code: res.activationCode })}`);
          loadTerminals();
        }
      } catch (e) {
        window.alert(i18n.t('terminals.errorCreate'));
      }
      return;
    }

    Alert.prompt(
      i18n.t('terminals.newTerminal'),
      i18n.t('terminals.namePlaceholder'),
      [
        { text: i18n.t('profile.cancel'), style: 'cancel' },
        { 
          text: i18n.t('terminals.create'), 
          onPress: async (nickname) => {
            if (!nickname) return;
            try {
              const res = await ApiService.post('/management/terminals', { storeId, nickname });
              if (res.activationCode) {
                Alert.alert(
                  i18n.t('terminals.activationCodeTitle'),
                  i18n.t('terminals.activationCodeMsg', { code: res.activationCode }),
                  [{ text: 'OK' }]
                );
                loadTerminals();
              }
            } catch (e) {
              Alert.alert(i18n.t('auth.errorTitle'), i18n.t('terminals.errorCreate'));
            }
          } 
        }
      ],
      'plain-text'
    );
  };

  const handleRevoke = async (id: string) => {
    const confirmMessage = 'Voulez-vous vraiment révoquer cet accès (la caisse sera déconnectée) ?';

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        await ApiService.delete(`/management/terminals/${id}`);
        loadTerminals();
      }
      return;
    }

    Alert.alert(
      i18n.t('terminals.revokeTitle'),
      i18n.t('terminals.revokeConfirm'),
      [
        { text: i18n.t('profile.cancel'), style: 'cancel' },
        { text: i18n.t('tables.yesCancel'), style: 'destructive', onPress: async () => {
            await ApiService.delete(`/management/terminals/${id}`);
            loadTerminals();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <FontAwesome name="desktop" size={24} color={item.status === 'ACTIVE' ? Colors.primary : '#94a3b8'} style={{ marginRight: 15 }} />
          <View>
            <Text style={styles.cardTitle}>{item.nickname}</Text>
            <Text style={styles.cardSub}>
              {item.status === 'ACTIVE' ? i18n.t('terminals.statusActive') : item.status === 'REVOKED' ? i18n.t('terminals.statusRevoked') : i18n.t('terminals.statusPending')} 
              {item.activationCode ? ` • Code: ${item.activationCode}` : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRevoke(item.id)}>
          <FontAwesome name="trash" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('terminals.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleCreateTerminal}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={terminals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{i18n.t('terminals.emptyTerminals')}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050914',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0a0f1e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: 13,
  },
  deleteBtn: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  }
});
