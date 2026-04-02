import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Dimensions } from 'react-native';
import { usePOSStore } from '../store/posStore';

type ConfirmType = 'default' | 'danger' | 'checkout' | 'success' | 'warning';

interface ConfirmItem {
  name: string;
  qty: number;
  price: number;
}

interface ConfirmParams {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmType;
  items?: ConfirmItem[];
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (params: ConfirmParams) => void;
  alert: (title: string, message: string) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<ConfirmParams | null>(null);
  const { theme } = usePOSStore();

  const confirm = (params: ConfirmParams) => {
    setData(params);
    setVisible(true);
  };

  const alert = (title: string, message: string) => {
    confirm({
      title,
      message,
      confirmLabel: 'OK',
      cancelLabel: '',
      onConfirm: () => {},
    });
  };

  const handleConfirm = () => {
    if (data?.onConfirm) data.onConfirm();
    setVisible(false);
  };

  const handleCancel = () => {
    if (data?.onCancel) data.onCancel();
    setVisible(false);
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <View style={[
                styles.iconBadge, 
                { backgroundColor: data?.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 132, 70, 0.1)' }
              ]}>
                <Text style={{ fontSize: 24 }}>
                  {data?.type === 'danger' ? '⚠️' : data?.type === 'checkout' ? '💰' : '☕'}
                </Text>
              </View>
              <Text style={styles.title}>{data?.title}</Text>
            </View>

            <Text style={styles.message}>{data?.message}</Text>

            {data?.type === 'checkout' && data.items && data.items.length > 0 && (
              <ScrollView style={styles.itemsList}>
                {data.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.qty}x {item.name}</Text>
                    <Text style={styles.itemPrice}>{(item.qty * item.price).toFixed(3)} DT</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.footer}>
              {data?.cancelLabel !== '' && (
                <TouchableOpacity 
                  onPress={handleCancel}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>{data?.cancelLabel || 'ANNULER'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={handleConfirm}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: data?.type === 'danger' ? theme.colors.danger : theme.colors.caramel }
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>{data?.confirmLabel || 'VALIDER'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.shapes.radiusLg, // use radius from theme
    width: '100%',
    maxWidth: 480,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...(theme.shadows.floating as any),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: theme.shapes.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.cream,
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: theme.colors.creamMuted,
    marginBottom: 24,
    lineHeight: 24,
  },
  itemsList: {
    maxHeight: 220,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(245, 230, 211, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 211, 0.05)',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: {
    fontWeight: '800',
    color: theme.colors.cream,
    fontSize: 15,
  },
  itemPrice: {
    color: theme.colors.caramel,
    fontWeight: '900',
    fontSize: 15,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 230, 211, 0.05)',
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cancelBtn: {
    paddingHorizontal: 24,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  cancelBtnText: {
    fontWeight: '900',
    color: theme.colors.creamMuted,
    letterSpacing: 0.5,
    fontSize: 14,
  },
  confirmBtn: {
    paddingHorizontal: 32,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    }),
  },
  confirmBtnText: {
    fontWeight: '900',
    color: theme.colors.background, // contrast with button color
    letterSpacing: 1,
    fontSize: 15,
  },
});
