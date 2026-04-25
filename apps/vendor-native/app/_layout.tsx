import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthService } from '@/services/auth';
import { AlertProvider } from '@/components/AlertContext';

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

  const [authState, setAuthState] = useState<{ isLogged: boolean; isUnlocked?: boolean } | null>(null);
  const router = useRouter();

  // Check auth state
  useEffect(() => {
    async function checkAuth() {
      const session = await AuthService.getSession();
      
      if (session.token && session.vendorId) {
        setAuthState({ isLogged: true, isUnlocked: true });
      } else if (session.token && session.storeId) {
        setAuthState({ isLogged: true, isUnlocked: session.isUnlocked });
      } else {
        setAuthState({ isLogged: false });
      }
    }
    checkAuth();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && authState !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authState]);

  // Redirect logic
  useEffect(() => {
    if (!loaded || authState === null) return;

    if (!authState.isLogged) {
      router.replace('/login');
    } else if (authState.isUnlocked === false) {
      router.replace('/unlock');
    } else {
      router.replace('/(tabs)');
    }
  }, [loaded, authState, router]);

  if (!loaded || authState === null) {
    return null;
  }

  return <RootLayoutNav />;
}

const CustomTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0f1e', // Force deep blue dark background natively
  },
};

function RootLayoutNav() {
  return (
    <ThemeProvider value={CustomTheme}>
      <AlertProvider>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="unlock" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </AlertProvider>
    </ThemeProvider>
  );
}
