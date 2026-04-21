import React from 'react';
import { StyleSheet, View, SafeAreaView, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const RACHMA_LITE_URL = 'https://coffeeshop.elkassa.com/rachma-lite/index.html';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <SafeAreaView style={styles.safeArea}>
        <WebView 
          source={{ uri: RACHMA_LITE_URL }} 
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  safeArea: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
});
