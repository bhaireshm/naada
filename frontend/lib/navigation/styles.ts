// Extracted navigation styles following guardrails
import { MantineTheme } from '@mantine/core';

export const getNavigationStyles = (theme: MantineTheme) => ({
  container: {
    height: '100%',
    background: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.tertiary[6]} 100%)`,
    boxShadow: theme.shadows.sm,
    position: 'relative' as const,
    zIndex: 100,
  },
  
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
    pointerEvents: 'none' as const,
  },
  
  logoContainer: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: theme.radius.lg,
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoText: {
    letterSpacing: '0.5px',
  },
  
  searchContainer: {
    flex: 1,
    maxWidth: 400,
  },
  
  userMenuTarget: {
    cursor: 'pointer',
    transition: 'transform 150ms ease',
    position: 'relative' as const,
    zIndex: 102,
  },
  
  menuDropdown: {
    padding: theme.spacing.xs,
  },
  
  menuLabel: {
    fontSize: '11px',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
  },
});