import { ThemePalette, ThemeConfig } from './types';
import { generateColorScale } from './color-utils';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { animations } from './animations';

/**
 * Theme 1 - Light Mode
 * Warm Earthy Palette
 * Primary: Light cream (#ede0d4)
 * Secondary: Warm beige (#e6ccb2)
 * Tertiary: Sand (#ddb892)
 * Accent1: Warm brown (#b08968)
 * Accent2: Dark brown (#7f5539)
 * Accent3: Medium brown (#9c6644)
 */
export const theme1LightPalette: ThemePalette = {
  id: 'theme1',
  name: 'Theme 1',
  colors: {
    primary: '#ede0d4',
    secondary: '#e6ccb2',
    tertiary: '#ddb892',
    accent1: '#b08968',
    accent2: '#7f5539',
    accent3: '#9c6644',
  },
  mantineColors: {
    primary: generateColorScale('#ede0d4'),
    secondary: generateColorScale('#e6ccb2'),
    tertiary: generateColorScale('#ddb892'),
    accent1: generateColorScale('#b08968'),
    accent2: generateColorScale('#7f5539'),
    accent3: generateColorScale('#9c6644'),
  },
};

/**
 * Theme 1 - Dark Mode
 * Warm Earthy Palette (same as light mode for consistency)
 */
export const theme1DarkPalette: ThemePalette = {
  id: 'theme1',
  name: 'Theme 1 Dark',
  colors: {
    primary: '#ede0d4',
    secondary: '#e6ccb2',
    tertiary: '#ddb892',
    accent1: '#b08968',
    accent2: '#7f5539',
    accent3: '#9c6644',
  },
  mantineColors: {
    primary: generateColorScale('#ede0d4'),
    secondary: generateColorScale('#e6ccb2'),
    tertiary: generateColorScale('#ddb892'),
    accent1: generateColorScale('#b08968'),
    accent2: generateColorScale('#7f5539'),
    accent3: generateColorScale('#9c6644'),
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
