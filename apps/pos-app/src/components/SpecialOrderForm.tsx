import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ArrowLeft, Calendar, UserPlus, Package, Check, User } from 'lucide-react-native';
import { CustomerSearch, Customer } from './CustomerSearch';

interface Props {
  onBack: () => void;
  onSave: (order: any) => void;
}

export const SpecialOrderForm: React.FC<Props> = ({ onBack, onSave }) => {
  const [customer, setCustomer] = useState<Customer | undefined>();
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  
  // Form State
  const [productName, setProductName] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [notes, setNotes] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  
  // Custom JSON fields (simulated for cakes)
  const [cakeModel, setCakeModel] = useState('');
  const [cakeFlavor, setCakeFlavor] = useState('');
  const [cakeMessage, setCakeMessage] = useState('');

  const handleSave = () => {
    if (!productName || !dateStr || !price) {
      alert("Veuillez remplir le nom du produit, la date et le prix");
      return;
    }

    const orderData = {
      productName,
      unitPrice: parseFloat(price),
      totalPrice: parseFloat(price), // Defaulting qty to 1 for now
      deliveryDate: new Date(`${dateStr}T${timeStr || '12:00'}:00`),
      depositAmount: deposit ? parseFloat(deposit) : 0,
      notes,
      isDelivery,
      customFields: {
        modele: cakeModel,
        parfum: cakeFlavor,
        message: cakeMessage
      },
      customerId: customer?.id,
      clientName: customer ? customer.name : 'Client Passager',
      clientPhone: customer ? customer.phone : ''
    };
    
    onSave(orderData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Nouvelle Commande Spéciale</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* CUSTOMER SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><User size={20} color="#3b82f6"/> CLIENT</Text>
          {customer ? (
            <View style={styles.customerBox}>
              <View>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerPhone}>{customer.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomerSearch(true)}>
                <Text style={styles.changeText}>Changer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addCustomerBtn} onPress={() => setShowCustomerSearch(true)}>
              <UserPlus size={20} color="#3b82f6" />
              <Text style={styles.addCustomerText}>Rechercher / Ajouter un client</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PRODUCT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><Package size={20} color="#f59e0b"/> PRODUIT & PRIX</Text>
          <Text style={styles.label}>Nom du produit ou description libre</Text>
          <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="Ex: Gâteau d'anniversaire Forêt Noire" />
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.label}>Prix Total (DT)</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="45.000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Acompte versé (DT)</Text>
              <TextInput style={styles.input} value={deposit} onChangeText={setDeposit} keyboardType="numeric" placeholder="20.000" />
            </View>
          </View>
        </View>

        {/* CUSTOMIZATION SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ PERSONNALISATION</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.label}>Modèle</Text>
              <TextInput style={styles.input} value={cakeModel} onChangeText={setCakeModel} placeholder="Ex: 3 étages carré" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Parfum</Text>
              <TextInput style={styles.input} value={cakeFlavor} onChangeText={setCakeFlavor} placeholder="Ex: Vanille / Fraise" />
            </View>
          </View>
          <Text style={styles.label}>Message sur gâteau</Text>
          <TextInput style={styles.input} value={cakeMessage} onChangeText={setCakeMessage} placeholder="Ex: Joyeux Anniversaire Ahmed" />
        </View>

        {/* DELIVERY SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><Calendar size={20} color="#10b981"/> DATE DE RÉCEPTION</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.label}>Date (AAAA-MM-JJ)</Text>
              <TextInput style={styles.input} value={dateStr} onChangeText={setDateStr} placeholder="2024-05-12" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Heure</Text>
              <TextInput style={styles.input} value={timeStr} onChangeText={setTimeStr} placeholder="14:30" />
            </View>
          </View>
          <View style={styles.rowTypes}>
            <TouchableOpacity 
              style={[styles.typeBtn, !isDelivery && styles.typeBtnActive]} 
              onPress={() => setIsDelivery(false)}
            >
              <Text style={[styles.typeText, !isDelivery && styles.typeTextActive]}>Retrait Boutique</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, isDelivery && styles.typeBtnActive]} 
              onPress={() => setIsDelivery(true)}
            >
              <Text style={[styles.typeText, isDelivery && styles.typeTextActive]}>Livraison</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NOTES */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes internes</Text>
          <TextInput 
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
            value={notes} 
            onChangeText={setNotes} 
            multiline 
            placeholder="Détails supplémentaires..." 
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotal}>Total: {price || '0.000'} DT</Text>
          {deposit ? <Text style={styles.footerRest}>Reste dû: {(parseFloat(price||'0') - parseFloat(deposit)).toFixed(3)} DT</Text> : null}
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Check size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>Enregistrer la Commande</Text>
        </TouchableOpacity>
      </View>

      <CustomerSearch 
        visible={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        onSelect={setCustomer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { padding: 8, marginRight: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  section: { backgroundColor: '#fff', padding: 24, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, fontSize: 16 },
  row: { flexDirection: 'row' },
  
  addCustomerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#eff6ff', borderRadius: 12 },
  addCustomerText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 8 },
  customerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef9c3', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fef08a' },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#854d0e' },
  customerPhone: { fontSize: 14, color: '#a16207', marginTop: 4 },
  changeText: { color: '#3b82f6', fontWeight: 'bold' },

  rowTypes: { flexDirection: 'row', gap: 16, marginTop: 16 },
  typeBtn: { flex: 1, alignItems: 'center', padding: 12, borderWidth: 2, borderColor: '#f3f4f6', borderRadius: 12 },
  typeBtnActive: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  typeText: { fontWeight: 'bold', color: '#6b7280' },
  typeTextActive: { color: '#10b981' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTotal: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  footerRest: { fontSize: 14, color: '#dc2626', fontWeight: '600', marginTop: 4 },
  saveBtn: { flexDirection: 'row', backgroundColor: '#10b981', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
