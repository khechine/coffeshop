import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';

export default function LoginScreen() {
  const [loginMode, setLoginMode] = useState<'email' | 'pairing'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeIdInput, setStoreIdInput] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (loginMode === 'email') {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
        return;
      }
      setLoading(true);
      try {
        const result = await ApiService.post('/auth/login', { email, password });
        if (result.token && result.user?.storeId) {
          await AuthService.saveSession(result.token, result.user.storeId);
          await AuthService.setUser({ ...result.user, authMode: 'PASSWORD' }); // Save User directly for Manager
          router.replace('/(tabs)');
        } else {
          Alert.alert('Connexion échouée', result.message || 'Identifiants invalides.');
        }
      } catch (error: any) {
        Alert.alert('Erreur', error.message || 'Impossible de se connecter au serveur.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!storeIdInput.trim() || !activationCode.trim()) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs de couplage.');
        return;
      }
      setLoading(true);
      try {
        const result = await ApiService.get(`/auth/activate-terminal?code=${activationCode}&storeId=${storeIdInput}`);
        
        // Terminal activation returns storeId and terminalId, not a standard token
        if (result.storeId && result.terminalId) {
          await AuthService.saveSession(result.terminalId, result.storeId);
          await AuthService.clearUser(); // explicitly clear any previous user state so it prompts for PIN
          router.replace('/unlock');
        } else {
          Alert.alert('Appairage échoué', result.error || "Code d'activation invalide.");
        }
      } catch (error: any) {
        Alert.alert('Erreur', error.message || "Vérifiez le code et l'ID de la boutique.");
      } finally {
        setLoading(false);
      }
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
            <Text style={styles.logoText}>RP</Text>
          </View>
          <Text style={styles.brandName}>Rachma Pro</Text>
          <Text style={styles.tagline}>Gestion Intelligente B2B</Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity 
            style={[styles.modeToggleBtn, loginMode === 'email' && styles.modeToggleBtnActive]}
            onPress={() => setLoginMode('email')}
          >
            <Text style={[styles.modeToggleText, loginMode === 'email' && styles.modeToggleTextActive]}>Manager</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeToggleBtn, loginMode === 'pairing' && styles.modeToggleBtnActive]}
            onPress={() => setLoginMode('pairing')}
          >
            <Text style={[styles.modeToggleText, loginMode === 'pairing' && styles.modeToggleTextActive]}>Terminal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          {loginMode === 'email' ? (
            <>
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
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.inputContainer, styles.glassEffect]}>
                <FontAwesome name="building-o" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  placeholder="ID de la boutique"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={storeIdInput}
                  onChangeText={setStoreIdInput}
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, styles.glassEffect]}>
                <FontAwesome name="qrcode" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  placeholder="Code d'activation (ex: 123456)"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={activationCode}
                  onChangeText={setActivationCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Où trouver le code ?</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <>
                  <Text style={styles.loginBtnText}>
                    {loginMode === 'email' ? 'Se Connecter' : 'Appairer'}
                  </Text>
                  <FontAwesome name="arrow-right" size={16} color="#ffffff" />
                </>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity>
            <Text style={styles.signupText}> Contacter le support</Text>
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
