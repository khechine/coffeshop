import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthService } from '@/services/auth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    async function checkAuth() {
      const session = await AuthService.getSession();
      
      if (session.token && session.vendorId) {
        setInitialRoute('(tabs)');
      } else if (session.token && session.storeId) {
        setInitialRoute(session.isUnlocked ? '(tabs)' : 'unlock');
      } else {
        setInitialRoute('login');
      }
    }
    checkAuth();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && initialRoute !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, initialRoute]);

  if (!loaded || initialRoute === null) {
    return null;
  }

  return <RootLayoutNav initialRoute={initialRoute} />;
}

const CustomTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0f1e', // Force deep blue dark background natively
  },
};

function RootLayoutNav({ initialRoute }: { initialRoute: string }) {
  return (
    <ThemeProvider value={CustomTheme}>
      <Stack initialRouteName={initialRoute as any}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="unlock" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
