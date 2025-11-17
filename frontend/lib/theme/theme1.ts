import { ThemePalette, ThemeConfig } from './types';
import { generateColorScale } from './color-utils';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { animations } from './animations';

/**
 * Theme 1 - Light Mode
 * Primary: Sage green (#ccd5ae)
 * Secondary: Light sage (#e9edc9)
 * Tertiary: Cream (#fefae0)
 * Accent1: Peach (#faedcd)
 * Accent2: Tan (#d4a373)
 */
export const theme1LightPalette: ThemePalette = {
  id: 'theme1',
  name: 'Theme 1',
  colors: {
    primary: '#ccd5ae',
    secondary: '#e9edc9',
    tertiary: '#fefae0',
    accent1: '#faedcd',
    accent2: '#d4a373',
    accent3: '#d4a373',
  },
  mantineColors: {
    primary: generateColorScale('#ccd5ae'),
    secondary: generateColorScale('#e9edc9'),
    tertiary: generateColorScale('#fefae0'),
    accent1: generateColorScale('#faedcd'),
    accent2: generateColorScale('#d4a373'),
    accent3: generateColorScale('#d4a373'),
  },
};

/**
 * Theme 1 - Dark Mode
 * Same colors as light mode for consistency
 */
export const theme1DarkPalette: ThemePalette = {
  id: 'theme1',
  name: 'Theme 1 Dark',
  colors: {
    primary: '#ccd5ae',
    secondary: '#e9edc9',
    tertiary: '#fefae0',
    accent1: '#faedcd',
    accent2: '#d4a373',
    accent3: '#d4a373',
  },
  mantineColors: {
    primary: generateColorScale('#ccd5ae'),
    secondary: generateColorScale('#e9edc9'),
    tertiary: generateColorScale('#fefae0'),
    accent1: generateColorScale('#faedcd'),
    accent2: generateColorScale('#d4a373'),
    accent3: generateColorScale('#d4a373'),
  },
};

/**
 * Theme 1 Light Mode Configuration
 */
export const theme1Light: ThemeConfig = {
  palette: theme1LightPalette,
  colors: {
    primary: theme1LightPalette.mantineColors.primary,
    secondary: theme1LightPalette.mantineColors.secondary,
    tertiary: theme1LightPalette.mantineColors.tertiary,
    accent1: theme1LightPalette.mantineColors.accent1,
    accent2: theme1LightPalette.mantineColors.accent2,
    accent3: theme1LightPalette.mantineColors.accent3,
  },
  primaryColor: 'primary',
  ...typography,
  ...spacing,
  defaultRadius: radius.defaultRadius,
  ...shadows,
  other: animations.other,
};

/**
 * Theme 1 Dark Mode Configuration
 */
export const theme1Dark: ThemeConfig = {
  palette: theme1DarkPalette,
  colors: {
    primary: theme1DarkPalette.mantineColors.primary,
    secondary: theme1DarkPalette.mantineColors.secondary,
    tertiary: theme1DarkPalette.mantineColors.tertiary,
    accent1: theme1DarkPalette.mantineColors.accent1,
    accent2: theme1DarkPalette.mantineColors.accent2,
    accent3: theme1DarkPalette.mantineColors.accent3,
  },
  primaryColor: 'primary',
  ...typography,
  ...spacing,
  defaultRadius: radius.defaultRadius,
  ...shadows,
  other: animations.other,
};

/**
 * Get Theme 1 configuration based on color scheme
 */
export function getTheme1Config(colorScheme: 'light' | 'dark'): ThemeConfig {
  return colorScheme === 'dark' ? theme1Dark : theme1Light;
}
