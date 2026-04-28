import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import { fr } from './fr';
import { ar } from './ar';

const i18n = new I18n({
  fr,
  ar,
});

i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

export const setAppLanguage = async (lang: 'fr' | 'ar') => {
  i18n.locale = lang;
  await AsyncStorage.setItem('app_language', lang);
  
  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    return true; // indicates that a reload is required
  }
  return false;
};

export const initI18n = async () => {
  const savedLang = await AsyncStorage.getItem('app_language');
  if (savedLang) {
    i18n.locale = savedLang;
  } else {
    // Check device language or default to 'fr'
    const locales = Localization.getLocales();
    if (locales && locales.length > 0 && locales[0].languageCode === 'ar') {
      i18n.locale = 'ar';
    } else {
      i18n.locale = 'fr';
    }
  }
  
  const isRTL = i18n.locale === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
};

export default i18n;
