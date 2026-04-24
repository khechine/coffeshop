import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');
const innerDimension = width * 0.7;

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const router = useRouter();

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <FontAwesome name="camera" size={50} color={Colors.primary} style={{ marginBottom: 20 }} />
          <Text style={styles.permissionText}>L'accès à la caméra est nécessaire pour scanner.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // Logic: Identify if it's a product or store
    alert(`Scanné: ${data}`);
    
    // Reset scanned state after a short delay
    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128"],
        }}
        enableTorch={torch}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <FontAwesome name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scanner un article</Text>
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconBtn}>
              <FontAwesome name="flash" size={24} color={torch ? Colors.primary : "#ffffff"} />
            </TouchableOpacity>
          </View>

          {/* Scanner Frame */}
          <View style={styles.mainContainer}>
              <View style={styles.scanArea}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
              <Text style={styles.hintText}>Placez le code dans le cadre</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.infoBox}>
              <FontAwesome name="info-circle" size={16} color="#94a3b8" />
              <Text style={styles.infoText}>Format supportés: QR, EAN, Code128</Text>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0a0f1e',
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scanArea: {
    width: innerDimension,
    height: innerDimension,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
  },
  hintText: {
    color: '#ffffff',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    gap: 8,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
});
