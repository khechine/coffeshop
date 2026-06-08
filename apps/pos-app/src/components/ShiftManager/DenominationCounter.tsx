import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { DenominationCounts } from '../../store/useShiftStore';

const DENOMINATIONS = [
  { label: '50 DT', value: 50 },
  { label: '20 DT', value: 20 },
  { label: '10 DT', value: 10 },
  { label: '5 DT', value: 5 },
  { label: '2 DT', value: 2 },
  { label: '1 DT', value: 1 },
  { label: '0.500 DT', value: 0.5 },
  { label: '0.200 DT', value: 0.2 },
  { label: '0.100 DT', value: 0.1 },
  { label: '0.050 DT', value: 0.05 },
];

interface Props {
  onChange: (details: DenominationCounts, total: number) => void;
  initialCounts?: DenominationCounts;
}

export function DenominationCounter({ onChange, initialCounts }: Props) {
  const [counts, setCounts] = useState<DenominationCounts>(initialCounts || {});

  useEffect(() => {
    let total = 0;
    DENOMINATIONS.forEach(denom => {
      const count = counts[denom.value.toString()] || 0;
      total += count * denom.value;
    });
    onChange(counts, total);
  }, [counts]);

  const handleChange = (value: number, text: string) => {
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setCounts(prev => ({
      ...prev,
      [value.toString()]: isNaN(parsed) ? 0 : parsed
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 1 }]}>Dénomination</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Quantité</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Total</Text>
      </View>
      <ScrollView style={styles.list}>
        {DENOMINATIONS.map(denom => {
          const qty = counts[denom.value.toString()] || 0;
          const lineTotal = qty * denom.value;
          return (
            <View key={denom.value} style={styles.row}>
              <Text style={[styles.cell, styles.labelCell]}>{denom.label}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={qty > 0 ? qty.toString() : ''}
                  onChangeText={(text) => handleChange(denom.value, text)}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <Text style={[styles.cell, styles.totalCell]}>{lineTotal.toFixed(3)} DT</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  cell: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  labelCell: {
    fontWeight: '600',
  },
  inputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    width: 80,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
    color: '#111827',
  },
  totalCell: {
    textAlign: 'right',
    fontWeight: '700',
    color: '#10b981',
  },
});
