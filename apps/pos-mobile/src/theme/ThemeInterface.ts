import { ViewStyle, TextStyle } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  caramel: string; // Acts as primary accent
  cream: string;   // Acts as primary text
  creamMuted: string;
  softOrange: string;
  success: string;
  danger: string;
  glassBg: string;
  glassBorder: string;
}

export interface ThemeShapes {
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
}

export interface ThemeShadows {
  floating: ViewStyle | TextStyle | any;
  glow: ViewStyle | TextStyle | any;
}

export interface ITheme {
  colors: ThemeColors;
  shapes: ThemeShapes;
  shadows: ThemeShadows;
}
