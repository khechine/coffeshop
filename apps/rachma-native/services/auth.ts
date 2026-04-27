import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'rachma_token';
const STORE_ID_KEY = 'rachma_store_id';
const USER_KEY = 'rachma_user';
const TERMINAL_ID_KEY = 'rachma_terminal_id';
const APP_MODE_KEY = 'rachma_app_mode';
const RADIUS_KEY = 'rachma_search_radius';

// Web fallback: SecureStore is not available on web
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const AuthService = {
  // --- Device Level Auth ---
  async saveSession(token: string, storeId: string, terminalId?: string) {
    try {
      await storage.setItem(TOKEN_KEY, token);
      await storage.setItem(STORE_ID_KEY, storeId);
      if (terminalId) {
        await storage.setItem(TERMINAL_ID_KEY, terminalId);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  async clearDeviceSession() {
    try {
      await storage.removeItem(TOKEN_KEY);
      await storage.removeItem(STORE_ID_KEY);
      await storage.removeItem(USER_KEY);
      await storage.removeItem(TERMINAL_ID_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  // --- User Level Auth ---
  async setUser(user: any) {
    try {
      await storage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  },

  async clearUser() {
    try {
      await storage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  },

  // --- State Check ---
  async getSession() {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      const storeId = await storage.getItem(STORE_ID_KEY);
      const terminalId = await storage.getItem(TERMINAL_ID_KEY);
      const userStr = await storage.getItem(USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      
      return { 
        isPaired: !!(token && storeId), 
        isUnlocked: !!user,
        token, 
        storeId,
        terminalId,
        user 
      };
    } catch (error) {
      console.error('Failed to get session:', error);
      return { isPaired: false, isUnlocked: false, token: null, storeId: null, terminalId: null, user: null };
    }
  },

  // --- App Mode Persistence ---
  async getAppMode(): Promise<'RACHMA' | 'FULL'> {
    try {
      const mode = await storage.getItem(APP_MODE_KEY);
      return (mode as 'RACHMA' | 'FULL') || 'FULL';
    } catch (e) {
      return 'FULL';
    }
  },

  async setAppMode(mode: 'RACHMA' | 'FULL') {
    try {
      await storage.setItem(APP_MODE_KEY, mode);
    } catch (e) {
      console.error('Failed to set app mode:', e);
    }
  },

  // --- Search Radius Persistence ---
  async getSearchRadius(): Promise<number> {
    try {
      const r = await storage.getItem(RADIUS_KEY);
      return r ? parseInt(r) : 50; // default 50km
    } catch (e) {
      return 50;
    }
  },

  async setSearchRadius(radius: number) {
    try {
      await storage.setItem(RADIUS_KEY, radius.toString());
    } catch (e) {
      console.error('Failed to set radius:', e);
    }
  },

  // (Legacy clear function, maps to clearing everything)
  async clearSession() {
    await this.clearDeviceSession();
  }
};
