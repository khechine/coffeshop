import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Text, Animated, Dimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const hideAlert = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
      if (callback) callback();
    });
  }, [fadeAnim, slideAnim]);

  const getIcon = () => {
    switch (options?.type) {
      case 'success': return { name: 'check-circle' as any, color: '#10b981' };
      case 'error': return { name: 'times-circle' as any, color: '#ef4444' };
      case 'warning': return { name: 'exclamation-triangle' as any, color: '#f59e0b' };
      default: return { name: 'info-circle' as any, color: '#3b82f6' };
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {visible && options && (
        <Modal transparent visible={visible} animationType="none">
          <View style={styles.overlay}>
            <Animated.View 
              style={[
                styles.alertCard, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }] 
                }
              ]}
            >
              <View style={styles.iconContainer}>
                <FontAwesome name={getIcon().name} size={48} color={getIcon().color} />
              </View>
              
              <Text style={styles.title}>{options.title}</Text>
              <Text style={styles.message}>{options.message}</Text>
              
              <View style={styles.buttonContainer}>
                {options.buttons && options.buttons.length > 0 ? (
                  options.buttons.map((btn, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={[
                        styles.button, 
                        btn.style === 'destructive' && styles.buttonDestructive,
                        btn.style === 'cancel' && styles.buttonCancel,
                        options.buttons!.length > 1 && { flex: 1 }
                      ]} 
                      onPress={() => hideAlert(btn.onPress)}
                    >
                      <Text style={[
                        styles.buttonText,
                        btn.style === 'cancel' && { color: '#94a3b8' }
                      ]}>{btn.text}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity style={styles.button} onPress={() => hideAlert()}>
                    <Text style={styles.buttonText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertCard: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 25,
    width: width > 400 ? 400 : '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  }
});
