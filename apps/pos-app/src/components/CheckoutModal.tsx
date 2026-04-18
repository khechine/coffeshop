import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X, CreditCard, Banknote, Coffee, ShoppingBag, Star } from 'lucide-react-native';
import { Customer } from './CustomerSearch';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (method: string, type: string, loyaltyUsed: number) => void;
  total: number;
  customer?: Customer;
}

export const CheckoutModal: React.FC<Props> = ({ visible, onClose, onConfirm, total, customer }) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, MIXED
  const [consumeType, setConsumeType] = useState('DINE_IN'); // DINE_IN, TAKEAWAY
  const [useLoyalty, setUseLoyalty] = useState(false);

  // Conversion: 100 points = 1 DT
  const loyaltyValueDT = customer ? (customer.loyaltyPoints / 100) : 0;
  const maxDiscountDT = Math.min(loyaltyValueDT, total);
  
  const finalTotal = useLoyalty ? total - maxDiscountDT : total;
  const earnedPoints = Math.floor(finalTotal); // 1 point per 1 DT spent

  const handleConfirm = () => {
    onConfirm(
      paymentMethod, 
      consumeType, 
      useLoyalty ? (maxDiscountDT * 100) : 0
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Paiement</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="#6b7280" /></TouchableOpacity>
          </View>

          {/* Consume Type Select */}
          <View style={styles.rowTypes}>
            <TouchableOpacity 
              style={[styles.typeBtn, consumeType === 'DINE_IN' && styles.typeBtnActive]} 
              onPress={() => setConsumeType('DINE_IN')}
            >
              <Coffee size={24} color={consumeType === 'DINE_IN' ? '#3e2723' : '#9ca3af'} />
              <Text style={[styles.typeText, consumeType === 'DINE_IN' && styles.typeTextActive]}>Sur Place</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, consumeType === 'TAKEAWAY' && styles.typeBtnActive]} 
              onPress={() => setConsumeType('TAKEAWAY')}
            >
              <ShoppingBag size={24} color={consumeType === 'TAKEAWAY' ? '#3e2723' : '#9ca3af'} />
              <Text style={[styles.typeText, consumeType === 'TAKEAWAY' && styles.typeTextActive]}>À Emporter</Text>
            </TouchableOpacity>
          </View>

          {/* Customer & Loyalty Box */}
          {customer && (
            <View style={styles.loyaltyBox}>
              <View style={styles.loyaltyHeader}>
                <View>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerPoints}>Solde: {customer.loyaltyPoints} pts</Text>
                </View>
                {loyaltyValueDT >= 0.5 && (
                  <TouchableOpacity 
                    style={[styles.switchBtn, useLoyalty && styles.switchBtnActive]}
                    onPress={() => setUseLoyalty(!useLoyalty)}
                  >
                    <Star size={16} color={useLoyalty ? '#fff' : '#d97706'} />
                    <Text style={[styles.switchBtnText, useLoyalty && { color: '#fff' }]}>
                      Utiliser -{maxDiscountDT.toFixed(3)} DT
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Financial Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{total.toFixed(3)} DT</Text>
            </View>
            {useLoyalty && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelLoyalty}>Remise Fidélité</Text>
                <Text style={styles.summaryValueLoyalty}>-{maxDiscountDT.toFixed(3)} DT</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.totalLabel}>TOTAL À PAYER</Text>
              <Text style={styles.totalValue}>{finalTotal.toFixed(3)} DT</Text>
            </View>
            {customer && (
              <Text style={styles.earnText}>+ {earnedPoints} points gagnés</Text>
            )}
          </View>

          {/* Payment Methods */}
          <Text style={styles.sectionTitle}>Moyen de paiement</Text>
          <View style={styles.rowMethods}>
            <TouchableOpacity 
              style={[styles.methodBtn, paymentMethod === 'CASH' && styles.methodBtnActive]} 
              onPress={() => setPaymentMethod('CASH')}
            >
              <Banknote size={24} color={paymentMethod === 'CASH' ? '#10b981' : '#9ca3af'} />
              <Text style={styles.methodText}>Espèces</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.methodBtn, paymentMethod === 'CARD' && styles.methodBtnActive]} 
              onPress={() => setPaymentMethod('CARD')}
            >
              <CreditCard size={24} color={paymentMethod === 'CARD' ? '#3b82f6' : '#9ca3af'} />
              <Text style={styles.methodText}>Carte</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>ENCAISSER {finalTotal.toFixed(3)} DT</Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 20
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  
  rowTypes: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16,
    borderWidth: 2, borderColor: '#f3f4f6', borderRadius: 16, gap: 8
  },
  typeBtnActive: { borderColor: '#d7ccc8', backgroundColor: '#efebe9' },
  typeText: { fontSize: 16, fontWeight: 'bold', color: '#9ca3af' },
  typeTextActive: { color: '#3e2723' },

  loyaltyBox: { backgroundColor: '#fef3c7', padding: 16, borderRadius: 16, marginBottom: 24 },
  loyaltyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#92400e' },
  customerPoints: { fontSize: 14, color: '#b45309', marginTop: 4 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fde68a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  switchBtnActive: { backgroundColor: '#d97706' },
  switchBtnText: { fontWeight: 'bold', color: '#d97706' },

  summaryBox: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 16, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: '#4b5563' },
  summaryValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  summaryLabelLoyalty: { fontSize: 16, color: '#ef4444' },
  summaryValueLoyalty: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
  summaryTotalRow: { borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 16, marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 18, fontWeight: '900', color: '#111827' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#10b981' },
  earnText: { textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: '#d97706', marginTop: 8 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  rowMethods: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  methodBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20,
    borderWidth: 2, borderColor: '#f3f4f6', borderRadius: 16, gap: 12
  },
  methodBtnActive: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  methodText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },

  confirmBtn: { backgroundColor: '#111827', padding: 20, borderRadius: 16, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});
