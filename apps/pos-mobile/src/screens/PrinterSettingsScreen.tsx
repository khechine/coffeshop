import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Switch, Platform } from 'react-native';
import { usePOSStore } from '../store/posStore';
import { GlassPanel } from '../components/Antigravity/GlassPanel';
import { PrintService } from '../services/PrintService';

export function PrinterSettingsScreen() {
  const { theme, printerSettings, updatePrinterSettings, storeName, planName } = usePOSStore();
  const [testing, setTesting] = useState(false);
  const isStarter = planName?.toUpperCase() === 'STARTER';

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 20 },
    title: { fontSize: 24, fontWeight: '900', color: theme.colors.cream, marginBottom: 4 },
    subtitle: { fontSize: 13, color: theme.colors.caramel, textTransform: 'uppercase', letterSpacing: 1 },
    section: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.cream, marginBottom: 15 },
    card: { 
      backgroundColor: theme.colors.surface, 
      borderRadius: 16, 
      padding: 20, 
      borderWidth: 1, 
      borderColor: theme.colors.glassBorder,
      marginBottom: 20
    },
    label: { fontSize: 13, color: theme.colors.caramel, fontWeight: '700', marginBottom: 8 },
    input: { 
      backgroundColor: theme.colors.background, 
      padding: 12, 
      borderRadius: 10, 
      color: theme.colors.cream, 
      borderWidth: 1, 
      borderColor: theme.colors.glassBorder,
      marginBottom: 15
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    rowText: { color: theme.colors.cream, fontSize: 15, fontWeight: '600' },
    sizeSelector: { flexDirection: 'row', gap: 10 },
    sizeBtn: { 
      flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, 
      borderColor: theme.colors.glassBorder, alignItems: 'center', 
      backgroundColor: theme.colors.background 
    },
    sizeBtnActive: { borderColor: theme.colors.caramel, backgroundColor: `${theme.colors.caramel}15` },
    sizeText: { color: theme.colors.creamMuted, fontWeight: '700' },
    sizeTextActive: { color: theme.colors.caramel },
    testBtn: { 
      backgroundColor: theme.colors.caramel, 
      padding: 16, 
      borderRadius: 12, 
      alignItems: 'center', 
      marginTop: 20 
    },
    testBtnText: { color: theme.colors.background, fontWeight: '900', fontSize: 16 }
  });

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      await PrintService.printTicket({
        storeName: storeName || 'Test Store',
        sale: { id: 'TEST-' + Math.random().toString(36).substr(2, 5), timestamp: Date.now(), total: 0 },
        items: [{ name: 'TEST IMPRESSION', quantity: 1, price: 0 }]
      }, printerSettings);
    } catch (e) {
      alert("Erreur d'impression test");
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Imprimante</Text>
        <Text style={styles.subtitle}>Configuration thermique {isStarter ? '' : 'NACEF'}</Text>
      </View>

      <ScrollView style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres de connexion</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Adresse IP (Réseau)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="ex: 192.168.1.100" 
            placeholderTextColor={theme.colors.creamMuted}
            value={printerSettings.ip}
            onChangeText={ip => updatePrinterSettings({ ip })}
          />
          <Text style={{ color: theme.colors.creamMuted, fontSize: 11, fontStyle: 'italic' }}>
            Laissez vide pour utiliser le dialogue d'impression système (Bluetooth/AirPrint).
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Options d'impression</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>Impression automatique</Text>
            <Switch 
              value={printerSettings.autoPrint}
              onValueChange={autoPrint => updatePrinterSettings({ autoPrint })}
              trackColor={{ false: theme.colors.glassBorder, true: theme.colors.caramel }}
            />
          </View>

          <Text style={styles.label}>Largeur du papier</Text>
          <View style={styles.sizeSelector}>
            {(['58mm', '80mm'] as const).map(size => (
              <TouchableOpacity 
                key={size}
                style={[styles.sizeBtn, printerSettings.paperSize === size && styles.sizeBtnActive]}
                onPress={() => updatePrinterSettings({ paperSize: size })}
              >
                <Text style={[styles.sizeText, printerSettings.paperSize === size && styles.sizeTextActive]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.testBtn, testing && { opacity: 0.6 }]} 
          onPress={handleTestPrint}
          disabled={testing}
        >
          <Text style={styles.testBtnText}>{testing ? 'Impression...' : 'Imprimer un ticket de test'}</Text>
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
