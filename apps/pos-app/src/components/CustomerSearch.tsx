import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Search, UserPlus, X, Star } from 'lucide-react-native';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

// Mocked fetch for now. In real app use React Query + API calls.
export const CustomerSearch: React.FC<Props> = ({ visible, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  
  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      setLoading(true);
      // Simulated Search
      setTimeout(() => {
        setResults([
          { id: 'c1', name: 'Ahmed Ben Ali', phone: '22334455', loyaltyPoints: 240 },
          { id: 'c2', name: 'Fatma Cherif', phone: '99887766', loyaltyPoints: 50 },
        ].filter(c => c.name.toLowerCase().includes(text.toLowerCase()) || c.phone.includes(text)));
        setLoading(false);
      }, 500);
    } else {
      setResults([]);
    }
  };

  const handleCreate = () => {
    if (!newName || !newPhone) return alert('Nom et téléphone requis');
    const newCustomer = { id: `c_${Date.now()}`, name: newName, phone: newPhone, loyaltyPoints: 0 };
    onSelect(newCustomer);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{showNewForm ? 'Nouveau Client' : 'Chercher un Client'}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="#6b7280" /></TouchableOpacity>
          </View>

          {showNewForm ? (
            <View style={styles.formContent}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Ex: Ali Mejri" />
              
              <Text style={styles.label}>Téléphone</Text>
              <TextInput style={styles.input} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" placeholder="22 333 444" />
              
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
                <Text style={styles.primaryBtnText}>Enregistrer & Séletionner</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setShowNewForm(false)}>
                <Text style={{ color: '#6b7280' }}>Retour à la recherche</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.searchContent}>
              <View style={styles.searchBar}>
                <Search size={20} color="#9ca3af" />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Recherche par nom ou téléphone..."
                  value={query}
                  onChangeText={handleSearch}
                  autoFocus
                />
              </View>

              {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.resultsList}>
                  {results.map(c => (
                    <TouchableOpacity key={c.id} style={styles.customerCard} onPress={() => { onSelect(c); onClose(); }}>
                      <View>
                        <Text style={styles.cName}>{c.name}</Text>
                        <Text style={styles.cPhone}>{c.phone}</Text>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Star size={14} color="#d97706" />
                        <Text style={styles.pointsText}>{c.loyaltyPoints} pts</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {query.length > 2 && results.length === 0 && (
                    <Text style={styles.noResults}>Aucun client trouvé.</Text>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowNewForm(true)}>
                <UserPlus size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>Créer un nouveau client</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: 480, maxWidth: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  searchContent: { flex: 0 },
  formContent: { flex: 0 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 16, borderRadius: 12, height: 50
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  resultsList: { minHeight: 150, maxHeight: 300, marginTop: 16 },
  customerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', 
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginBottom: 8
  },
  cName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  cPhone: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  pointsText: { fontSize: 14, fontWeight: 'bold', color: '#d97706', marginLeft: 4 },
  noResults: { textAlign: 'center', color: '#6b7280', marginTop: 20 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#eff6ff', 
    borderRadius: 12, marginTop: 16
  },
  secondaryBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, fontSize: 16 },
  primaryBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
