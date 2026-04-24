import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Vibration, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { ApiService } from '@/services/api';
import { AuthService } from '@/services/auth';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated';

export default function UnlockScreen() {
  const [pin, setPin] = useState('');
  const router = useRouter();
  const shakeOffset = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeOffset.value }]
    };
  });

  const triggerErrorShake = () => {
    Vibration.vibrate([100, 50, 100]);
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    setPin('');
  };

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      Vibration.vibrate(10);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      Vibration.vibrate(10);
    }
  };

  const verifyPin = async () => {
    const session = await AuthService.getSession();
    if (!session.storeId) {
      Alert.alert('Erreur', 'Terminal non assigné à une boutique.');
      router.replace('/login');
      return;
    }

    try {
      const user = await ApiService.get(`/auth/verify-staff-pin?pin=${pin}&storeId=${session.storeId}`);
      if (user && user.role) {
        await AuthService.setUser({ ...user, authMode: 'PIN' });
        Vibration.vibrate([30, 50, 30]);
        let route = '/(tabs)/rachma';
        if (user.defaultPosMode === 'POS') {
          route = '/(tabs)/pos';
        } else if (user.defaultPosMode === 'TABLES') {
          route = '/(tabs)/tables';
        }
        router.replace(route as any);
      } else {
        triggerErrorShake();
      }
    } catch (error) {
      triggerErrorShake();
    }
  };

  // Automatically verify when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin]);

  const handleUnpair = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Ce terminal ne sera plus rattaché à la boutique. Il faudra le scanner à nouveau pour l'activer.\n\nConfirmer ?")) {
        await AuthService.clearSession();
        router.replace('/login');
      }
      return;
    }

    Alert.alert(
      'Déconnecter ce terminal',
      "Ce terminal ne sera plus rattaché à la boutique. Il faudra le scanner à nouveau pour l'activer.",
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnecter', 
          style: 'destructive',
          onPress: async () => {
            await AuthService.clearSession();
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brandTitle}>RACHMA LITE</Text>
      <Text style={styles.promptText}>Accès Personnel</Text>

      {/* PIN Dots */}
      <Animated.View style={[styles.dotsContainer, shakeStyle]}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotActive]} />
        ))}
      </Animated.View>

      {/* Numpad */}
      <View style={styles.numpad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <TouchableOpacity key={num} style={styles.numBtn} onPress={() => handlePress(num)}>
            <Text style={styles.numText}>{num}</Text>
          </TouchableOpacity>
        ))}
        {/* Empty spot to center 0 */}
        <View style={styles.numBtnPlaceholder} />
        
        <TouchableOpacity style={styles.numBtn} onPress={() => handlePress('0')}>
          <Text style={styles.numText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.numBtnDelete} onPress={handleDelete}>
          <Text style={styles.numTextDel}>⌫</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.unpairBtn} onPress={handleUnpair}>
        <Text style={styles.unpairText}>RÉINITIALISER LE TERMINAL</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  brandTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 8
  },
  promptText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 50
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 60,
    backgroundColor: 'transparent'
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  dotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    justifyContent: 'center',
    gap: 15,
    backgroundColor: 'transparent'
  },
  numBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 20, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  numBtnPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent'
  },
  numBtnDelete: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  numText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900'
  },
  numTextDel: {
    color: Colors.danger,
    fontSize: 24,
    fontWeight: '900'
  },
  unpairBtn: {
    position: 'absolute',
    bottom: 40,
    padding: 10,
    backgroundColor: 'transparent'
  },
  unpairText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2
  }
});
