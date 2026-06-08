import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { DenominationCounter } from './DenominationCounter';
import { useShiftStore, DenominationCounts } from '../../store/useShiftStore';
import { PrintService } from '../../services/PrintService';
import { X, Calculator } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ShiftCloseModal({ visible, onClose }: Props) {
  const { openingCash, salesCashTotal, openTime, closeShift, resetShift } = useShiftStore();
  const [details, setDetails] = useState<DenominationCounts>({});
  const [countedTotal, setCountedTotal] = useState(0);
  const [fondDeCaisse, setFondDeCaisse] = useState<string>('0');

  const expectedTotal = openingCash + salesCashTotal;
  const difference = countedTotal - expectedTotal;
  const fondValue = parseFloat(fondDeCaisse) || 0;
  const montantDepot = countedTotal - fondValue;

  const handleCloseShift = async () => {
    // Print logic
    const shiftData = {
      openTime: openTime || new Date().toISOString(),
      closeTime: new Date().toISOString(),
      openingCash,
      salesCashTotal,
      expectedTotal,
      countedTotal,
      difference,
      fondDeCaisse: fondValue,
      montantDepot
    };
    
    // Simulate print
    // await PrintService.printShiftReport(shiftData);
    console.log("Impression du rapport Z...", shiftData);
    
    // Reset shift to trigger open screen again
    resetShift();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Calculator size={28} color="#ef4444" />
              <Text style={styles.title}>Clôture de Caisse</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Left side: Denomination Counter */}
            <View style={styles.counterSection}>
              <Text style={styles.sectionTitle}>Comptage Actuel</Text>
              <DenominationCounter onChange={(newDetails, newTotal) => {
                setDetails(newDetails);
                setCountedTotal(newTotal);
              }} />
            </View>

            {/* Right side: Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Résumé de Session</Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fond de départ:</Text>
                  <Text style={styles.summaryValue}>{openingCash.toFixed(3)} DT</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ventes (Espèces):</Text>
                  <Text style={styles.summaryValue}>+ {salesCashTotal.toFixed(3)} DT</Text>
                </View>
                <View style={[styles.summaryRow, styles.expectedRow]}>
                  <Text style={styles.expectedLabel}>Total Attendu:</Text>
                  <Text style={styles.expectedValue}>{expectedTotal.toFixed(3)} DT</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Compté:</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>{countedTotal.toFixed(3)} DT</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Écart:</Text>
                  <Text style={[styles.summaryValue, { color: difference < 0 ? '#ef4444' : (difference > 0 ? '#10b981' : '#6b7280') }]}>
                    {difference > 0 ? '+' : ''}{difference.toFixed(3)} DT
                  </Text>
                </View>
              </View>

              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>Fond de Caisse (à garder):</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.fondInput}
                    keyboardType="numeric"
                    value={fondDeCaisse}
                    onChangeText={setFondDeCaisse}
                    placeholder="0.000"
                  />
                  <Text style={styles.currencySuffix}>DT</Text>
                </View>
              </View>

              <View style={styles.depotCard}>
                <Text style={styles.depotLabel}>Montant à Déposer:</Text>
                <Text style={styles.depotValue}>{Math.max(0, montantDepot).toFixed(3)} DT</Text>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={handleCloseShift}>
                <Text style={styles.closeButtonText}>Clôturer et Imprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    gap: 32,
  },
  counterSection: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    paddingRight: 32,
  },
  summarySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#4b5563',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  expectedRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 0,
  },
  expectedLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  expectedValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3b82f6',
  },
  inputCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 12,
  },
  fondInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
  },
  currencySuffix: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d97706',
  },
  depotCard: {
    backgroundColor: '#ecfdf5',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  depotLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 4,
  },
  depotValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
  },
  closeButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
