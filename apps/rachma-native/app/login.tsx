import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import { useAlert } from '@/components/AlertContext';
import { useEffect } from 'react';

export default function LoginScreen() {
  const [loginMode, setLoginMode] = useState<'email' | 'pairing'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeIdInput, setStoreIdInput] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [pendingSession, setPendingSession] = useState<{token: string, storeId: string, user: any} | null>(null);

  // Listen for scanned Store ID
  useEffect(() => {
    if (params.scannedStoreId) {
      setLoginMode('pairing');
      setStoreIdInput(params.scannedStoreId as string);
    }
  }, [params.scannedStoreId]);

  const handleLogin = async () => {
    if (loginMode === 'email') {
      if (!email.trim() || !password.trim()) {
        showAlert({ title: 'Erreur', message: 'Veuillez remplir tous les champs.', type: 'error' });
        return;
      }
      setLoading(true);
      try {
        const result = await ApiService.post('/auth/login', { email, password });
        if (result.token && result.user?.storeId) {
          const isOwner = result.user.role === 'STORE_OWNER' || result.user.role === 'SUPERADMIN';
          if (isOwner) {
             setPendingSession({ token: result.token, storeId: result.user.storeId, user: result.user });
             setShowModeSelection(true);
          } else {
             await AuthService.saveSession(result.token, result.user.storeId);
             await AuthService.setUser({ ...result.user, authMode: 'PASSWORD' });
             router.replace('/(tabs)');
          }
        } else {
          showAlert({ title: 'Connexion échouée', message: result.message || 'Identifiants invalides.', type: 'error' });
        }
      } catch (error: any) {
        showAlert({ title: 'Erreur', message: error.message || 'Impossible de se connecter au serveur.', type: 'error' });
      } finally {
        setLoading(false);
      }
    } else {
      if (!storeIdInput.trim() || !activationCode.trim()) {
        showAlert({ title: 'Erreur', message: 'Veuillez remplir tous les champs de couplage.', type: 'error' });
        return;
      }
      setLoading(true);
      try {
        const result = await ApiService.get(`/auth/activate-terminal?code=${activationCode}&storeId=${storeIdInput}`);
        
        // Terminal activation returns storeId and terminalId, not a standard token
        if (result.storeId && result.terminalId) {
          await AuthService.saveSession(result.terminalId, result.storeId, result.terminalId);
          await AuthService.clearUser(); // explicitly clear any previous user state so it prompts for PIN
          router.replace('/unlock');
        } else {
          showAlert({ title: 'Appairage échoué', message: result.error || "Code d'activation invalide.", type: 'error' });
        }
      } catch (error: any) {
        showAlert({ title: 'Erreur', message: error.message || "Vérifiez le code et l'ID de la boutique.", type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const selectModeAndRedirect = async (mode: 'RACHMA' | 'FULL') => {
    if (!pendingSession) return;
    await AuthService.setAppMode(mode);
    await AuthService.saveSession(pendingSession.token, pendingSession.storeId);
    await AuthService.setUser({ ...pendingSession.user, authMode: 'PASSWORD' });
    setShowModeSelection(false);
    router.replace('/(tabs)');
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
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <View style={[styles.inputContainer, styles.glassEffect, { flex: 1, marginBottom: 0 }]}>
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
                <TouchableOpacity 
                    style={styles.qrBtn}
                    onPress={() => router.push('/scanner?mode=AUTH_STORE')}
                >
                    <FontAwesome name="qrcode" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, styles.glassEffect]}>
                <FontAwesome name="key" size={20} color="#94a3b8" style={styles.inputIcon} />
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
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.signupText}> Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Mode Selection Modal */}
      <Modal visible={showModeSelection} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FontAwesome name="th-large" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Personnalisez votre interface</Text>
            </View>
            <Text style={styles.modalSub}>Choisissez le mode de fonctionnement principal pour cet appareil.</Text>

            <TouchableOpacity 
              style={styles.modeOption} 
              onPress={() => selectModeAndRedirect('RACHMA')}
            >
              <View style={[styles.modeIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <FontAwesome name="briefcase" size={20} color="#10b981" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>Mode Rachma Uniquement</Text>
                <Text style={styles.modeDescription}>Gestion, Stocks et Marché B2B. Interface épurée.</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeOption} 
              onPress={() => selectModeAndRedirect('FULL')}
            >
              <View style={[styles.modeIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <FontAwesome name="desktop" size={20} color="#6366f1" />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>Mode Complet (Table + Caisse)</Text>
                <Text style={styles.modeDescription}>Toutes les fonctionnalités, y compris la prise de commande.</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  qrBtn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#10b981', // Matching theme accent
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111827',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  modeInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modeName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modeDescription: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
});
