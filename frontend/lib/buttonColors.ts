import { MantineTheme } from '@mantine/core';

/**
 * Consistent button color scheme using 3 primary colors
 * - Normal: accent1 (warm brown #b08968)
 * - Active: accent2 (dark brown #7f5539)
 * - Hover: accent3 (medium brown #9c6644)
 */

export interface ButtonColorScheme {
  normal: {
    bg: string;
    border: string;
    text: string;
  };
  active: {
    bg: string;
    border: string;
    text: string;
  };
  hover: {
    bg: string;
    border: string;
    text: string;
  };
}

/**
 * Get consistent button colors from theme
 */
export function getButtonColors(theme: MantineTheme): ButtonColorScheme {
  return {
    normal: {
      bg: 'transparent',
      border: theme.colors.accent1[4],
      text: theme.colors.accent1[7],
    },
    active: {
      bg: theme.colors.accent2[1],
      border: theme.colors.accent2[6],
      text: theme.colors.accent2[9],
    },
    hover: {
      bg: theme.colors.accent3[1],
      border: theme.colors.accent3[5],
      text: theme.colors.accent3[8],
    },
  };
}

/**
 * Get button styles for normal state
 */
export function getNormalButtonStyles(theme: MantineTheme) {
  const colors = getButtonColors(theme);
  return {
    border: `1px solid ${colors.normal.border}`,
    backgroundColor: colors.normal.bg,
    color: colors.normal.text,
    '&:hover': {
      backgroundColor: colors.hover.bg,
      borderColor: colors.hover.border,
    },
    transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
  };
}

/**
 * Get button styles for active state
 */
export function getActiveButtonStyles(theme: MantineTheme) {
  const colors = getButtonColors(theme);
  return {
    border: `1px solid ${colors.active.border}`,
    backgroundColor: colors.active.bg,
    color: colors.active.text,
    '&:hover': {
      backgroundColor: colors.hover.bg,
      borderColor: colors.hover.border,
    },
    transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
  };
}

/**
 * Get button styles with conditional active state
 */
export function getConditionalButtonStyles(theme: MantineTheme, isActive: boolean) {
  return isActive ? getActiveButtonStyles(theme) : getNormalButtonStyles(theme);
}
