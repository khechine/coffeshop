/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { Text as DefaultText, View as DefaultView, StyleSheet, I18nManager } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import i18n from '../locales/i18n';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() || 'light';
  const colorFromProps = props[theme as 'light' | 'dark'];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return (Colors as any)[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  
  const isArabic = i18n.locale === 'ar';
  
  // Auto-scaling and font for Arabic
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const baseFontSize = flattenedStyle.fontSize || 14;
  const isBold = flattenedStyle.fontWeight === 'bold' || flattenedStyle.fontWeight === '900' || flattenedStyle.fontWeight === '800';
  
  const arabicStyle = isArabic ? {
    fontFamily: isBold ? 'Almarai-Bold' : 'Almarai-Regular',
    fontSize: baseFontSize * 1.1, // Almarai is slightly larger than Cairo, 1.1x is enough
    lineHeight: (flattenedStyle.lineHeight || baseFontSize * 1.2) * 1.1,
    textAlign: flattenedStyle.textAlign || 'right',
  } : {};

  return <DefaultText style={[{ color }, style, arabicStyle]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  const isArabic = i18n.locale === 'ar';
  const rtlStyle = isArabic ? {
    direction: 'rtl' as const,
  } : {};

  return <DefaultView style={[{ backgroundColor }, style, rtlStyle]} {...otherProps} />;
}
