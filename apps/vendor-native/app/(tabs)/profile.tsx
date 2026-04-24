import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, Switch } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [allSectors, setAllSectors] = useState<any[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: '',
    description: '',
    address: '',
    phone: '',
    lat: '',
    lng: '',
    mktSectors: [] as string[]
  });

  const fetchData = async (vid: string) => {
    try {
      const [profileData, sectorsData] = await Promise.all([
        ApiService.get(`/management/vendor/profile/${vid}`),
        ApiService.get('/management/marketplace/sectors')
      ]);
      
      setProfile(profileData);
      setAllSectors(sectorsData);
      setForm({
        companyName: profileData.companyName || '',
        description: profileData.description || '',
        address: profileData.address || '',
        phone: profileData.phone || '',
        lat: String(profileData.lat || ''),
        lng: String(profileData.lng || ''),
        mktSectors: profileData.mktSectors?.map((s: any) => s.id) || []
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AuthService.getSession().then(session => {
      if (session?.user?.vendorId) {
        setVendorId(session.user.vendorId);
        fetchData(session.user.vendorId);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!vendorId) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
      };
      await ApiService.put(`/management/vendor/profile/${vendorId}`, payload);
      Alert.alert("Succès", "Votre profil a été mis à jour.");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSector = (id: string) => {
    setForm(prev => ({
      ...prev,
      mktSectors: prev.mktSectors.includes(id) 
        ? prev.mktSectors.filter(sid => sid !== id)
        : [...prev.mktSectors, id]
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Profil Vendeur</Text>
        
        {/* Basic Info */}
        <View style={[styles.card, styles.glassEffect]}>
          <Text style={styles.cardHeader}>Informations Générales</Text>
          
          <Text style={styles.label}>Nom de l'entreprise</Text>
          <TextInput 
            style={styles.input} 
            value={form.companyName} 
            onChangeText={(t) => setForm({...form, companyName: t})}
            placeholder="Ex: Café de Paris"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Description Marketplace</Text>
          <TextInput 
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
            value={form.description} 
            onChangeText={(t) => setForm({...form, description: t})}
            multiline
            placeholder="Décrivez votre activité..."
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Contact & Map */}
        <View style={[styles.card, styles.glassEffect]}>
          <Text style={styles.cardHeader}>Coordonnées & Localisation</Text>
          
          <Text style={styles.label}>Adresse Physique</Text>
          <TextInput 
            style={styles.input} 
            value={form.address} 
            onChangeText={(t) => setForm({...form, address: t})}
            placeholder="Ex: Rue 123, Tunis"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Téléphone de contact</Text>
          <TextInput 
            style={styles.input} 
            value={form.phone} 
            onChangeText={(t) => setForm({...form, phone: t})}
            keyboardType="phone-pad"
            placeholderTextColor="#64748b"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput 
                style={styles.input} 
                value={form.lat} 
                onChangeText={(t) => setForm({...form, lat: t})}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 20, backgroundColor: 'transparent' }} />
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput 
                style={styles.input} 
                value={form.lng} 
                onChangeText={(t) => setForm({...form, lng: t})}
                keyboardType="numeric"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.mapHint}>
            <FontAwesome name="map-marker" size={14} color="#f59e0b" />
            <Text style={styles.mapHintText}> Utiliser ma position actuelle</Text>
          </TouchableOpacity>
        </View>

        {/* Sectors */}
        <Text style={styles.sectionSubtitle}>Secteurs Marketplace</Text>
        <View style={styles.sectorsGrid}>
          {allSectors.map((sector) => (
            <TouchableOpacity 
              key={sector.id} 
              style={[
                styles.sectorItem, 
                form.mktSectors.includes(sector.id) && styles.sectorItemActive
              ]}
              onPress={() => toggleSector(sector.id)}
            >
              <Text style={[
                styles.sectorText,
                form.mktSectors.includes(sector.id) && styles.sectorTextActive
              ]}>{sector.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving 
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  scrollBody: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 25,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 15,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  glassEffect: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 15,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  mapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    backgroundColor: 'transparent',
  },
  mapHintText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
  },
  sectorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
    marginBottom: 30,
  },
  sectorItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectorItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  sectorText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  sectorTextActive: {
    color: '#f59e0b',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: '#f59e0b',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});
