import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SoundType = 'success' | 'error' | 'order' | 'ready' | 'tap';

export const SOUND_PROFILES = {
  premium: {
    id: 'premium',
    name: 'Classique (Square)',
    success: 'https://assets.mixkit.co/active_storage/sfx/1077/1077-preview.mp3', // Cash register
    error: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',   // Error beep
    order: 'https://assets.mixkit.co/active_storage/sfx/1083/1083-preview.mp3',   // Dinner bell
    ready: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3',   // Notification
    tap: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',     // Soft tap
  },
  modern: {
    id: 'modern',
    name: 'Moderne (Material)',
    success: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    error: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
    order: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3',
    ready: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
    tap: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  },
  minimal: {
    id: 'minimal',
    name: 'Silencieux',
    success: null, error: null, order: null, ready: null, tap: null
  }
};

class SoundService {
  private enabled: boolean = true;
  private profile: keyof typeof SOUND_PROFILES = 'premium';

  async init() {
    const e = await AsyncStorage.getItem('rachma_sound_enabled');
    if (e !== null) this.enabled = e === 'true';
    
    const p = await AsyncStorage.getItem('rachma_sound_profile');
    if (p !== null && p in SOUND_PROFILES) this.profile = p as any;
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    AsyncStorage.setItem('rachma_sound_enabled', String(val));
  }

  setProfile(val: keyof typeof SOUND_PROFILES) {
    this.profile = val;
    AsyncStorage.setItem('rachma_sound_profile', val);
  }

  async play(type: SoundType) {
    if (!this.enabled) return;

    // 1. Haptics
    this.playHaptics(type);

    // 2. Audio
    try {
      const url = SOUND_PROFILES[this.profile][type];
      if (url) {
        const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
        });
      }
    } catch (e) {
      console.warn('SoundService: Play failed', e);
    }
  }

  private playHaptics(type: SoundType) {
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'order':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'ready':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'tap':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  }

  isEnabled() { return this.enabled; }
  getProfile() { return this.profile; }
}

export const soundService = new SoundService();
