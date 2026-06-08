import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { DenominationCounter } from './DenominationCounter';
import { useShiftStore, DenominationCounts } from '../../store/useShiftStore';
import { LockOpen } from 'lucide-react-native';

export function ShiftOpenScreen() {
  const { openShift } = useShiftStore();
  const [details, setDetails] = useState<DenominationCounts>({});
  const [total, setTotal] = useState(0);

  const handleOpen = () => {
    openShift(details, total);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LockOpen size={32} color="#10b981" />
          </View>
          <Text style={styles.title}>Ouverture de Caisse</Text>
          <Text style={styles.subtitle}>
            Veuillez saisir le nombre exact de pièces et billets en votre possession pour commencer la session.
          </Text>
        </View>

        <View style={styles.counterContainer}>
          <DenominationCounter onChange={(newDetails, newTotal) => {
            setDetails(newDetails);
            setTotal(newTotal);
          }} />
        </View>

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total en Caisse:</Text>
            <Text style={styles.totalValue}>{total.toFixed(3)} DT</Text>
          </View>

          <TouchableOpacity style={styles.openButton} onPress={handleOpen}>
            <Text style={styles.openButtonText}>Ouvrir la Caisse ({total.toFixed(3)} DT)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  counterContainer: {
    flex: 1,
    minHeight: 300,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10b981',
  },
  openButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  openButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
