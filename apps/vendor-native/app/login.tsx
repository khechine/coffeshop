import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import { useAlert } from '@/components/AlertContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert({ title: 'Erreur', message: 'Veuillez remplir tous les champs.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const result = await ApiService.post('/auth/login', { email, password });
      
      // Check for vendor login
      if (result.token && result.user?.vendorId) {
        await AuthService.saveSession(result.token, undefined, undefined, result.user.vendorId);
        await AuthService.setUser(result.user);
        router.replace('/(tabs)');
      } else if (result.token) {
        showAlert({ title: 'Accès refusé', message: "Cette application est réservée aux vendeurs partenaires.", type: 'error' });
      } else {
        showAlert({ title: 'Connexion échouée', message: result.message || 'Identifiants invalides.', type: 'error' });
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
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>RV</Text>
          </View>
          <Text style={styles.brandName}>Rachma Vendor</Text>
          <Text style={styles.tagline}>Espace Partenaire B2B</Text>
        </View>

        <View style={styles.formSection}>
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

            <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <>
                  <Text style={styles.loginBtnText}>Se Connecter</Text>
                  <FontAwesome name="arrow-right" size={16} color="#ffffff" />
                </>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Devenir partenaire ?</Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.signupText}> Rejoindre le réseau</Text>
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
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
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
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
  },
  brandName: {
    fontSize: 28,
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
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
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
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 10,
    backgroundColor: 'transparent',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 50,
    backgroundColor: 'transparent',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  signupText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
