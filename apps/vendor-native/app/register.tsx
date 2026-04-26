import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import { useAlert } from '@/components/AlertContext';

export default function RegisterScreen() {
  const [role, setRole] = useState<'STORE_OWNER' | 'VENDOR'>('VENDOR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !companyName.trim()) {
      showAlert({ title: 'Erreur', message: 'Veuillez remplir tous les champs.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await ApiService.post('/auth/register', { 
        name, 
        email, 
        password, 
        role, 
        companyName 
      });

      if (result.token && result.user) {
        // Save session (handles both storeId and vendorId)
        await AuthService.saveSession(result.token, result.user.storeId, undefined, result.user.vendorId);
        await AuthService.setUser(result.user);
        
        showAlert({ 
            title: 'Succès', 
            message: 'Compte créé avec succès !', 
            type: 'success' 
        });
        
        router.replace('/(tabs)');
      } else {
        showAlert({ title: 'Erreur', message: result.message || 'Échec de la création du compte.', type: 'error' });
      }
    } catch (error: any) {
      showAlert({ title: 'Erreur', message: error.message || 'Impossible de se connecter au serveur.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={16} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>RV</Text>
          </View>
          <Text style={styles.brandName}>Devenir Partenaire</Text>
          <Text style={styles.tagline}>Rejoignez le réseau B2B</Text>
        </View>

        {/* Role Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity 
            style={[styles.modeToggleBtn, role === 'VENDOR' && styles.modeToggleBtnActive]}
            onPress={() => setRole('VENDOR')}
          >
            <Text style={[styles.modeToggleText, role === 'VENDOR' && styles.modeToggleTextActive]}>Fournisseur</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeToggleBtn, role === 'STORE_OWNER' && styles.modeToggleBtnActive]}
            onPress={() => setRole('STORE_OWNER')}
          >
            <Text style={[styles.modeToggleText, role === 'STORE_OWNER' && styles.modeToggleTextActive]}>Ma Boutique</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={[styles.inputContainer, styles.glassEffect]}>
            <FontAwesome name="user-o" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              placeholder="Nom Complet"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, styles.glassEffect]}>
            <FontAwesome name="envelope-o" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              placeholder="Email professionnel"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, styles.glassEffect]}>
            <FontAwesome name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
            >
                <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, styles.glassEffect]}>
            <FontAwesome name={role === 'VENDOR' ? "truck" : "coffee"} size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              placeholder={role === 'VENDOR' ? "Nom de votre entreprise" : "Nom de votre établissement"}
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerBtn, loading && { opacity: 0.7 }]} 
            onPress={handleRegister} 
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <>
                  <Text style={styles.registerBtnText}>Créer mon compte</Text>
                  <FontAwesome name="check" size={16} color="#ffffff" />
                </>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà partenaire ?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}> Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
    paddingTop: 60,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
    fontWeight: '500',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 5,
    marginBottom: 30,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  modeToggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeToggleText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },
  modeToggleTextActive: {
    color: '#ffffff',
  },
  formSection: {
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  glassEffect: {
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 10,
    backgroundColor: 'transparent',
  },
  registerBtn: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  registerBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    backgroundColor: 'transparent',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
