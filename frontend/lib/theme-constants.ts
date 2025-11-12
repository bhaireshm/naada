/**
 * Theme Constants
 * Centralized color definitions and gradients for consistent styling across the application
 */

// Primary Colors
export const COLORS = {
  // Deep Blue Palette
  deepBlue: {
    primary: '#011f4b',
    light: '#0056e6',
    lighter: '#1a75ff',
    lightest: '#e6f0ff',
  },
  
  // Slate Palette
  slate: {
    primary: '#2c3e50',
    light: '#34495e',
    lighter: '#566573',
    lightest: '#ecf0f1',
  },
  
  // Silver/Gray Palette
  silver: {
    primary: '#bdc3c7',
    light: '#ced4da',
    lighter: '#dee2e6',
    lightest: '#f8f9fa',
  },
  
  // Pastel Colors
  pastel: {
    blue: '#e6f0ff',
    purple: '#f0e6ff',
    pink: '#ffe6f0',
    lightPink: '#fff5f8',
    lightBlue: '#e3f2fd',
    lightPurple: '#f3e5f5',
  },
  
  // Accent Colors
  accent: {
    pink: '#ff6b9d',
    darkPink: '#c44569',
    lightBlue: '#90caf9',
  },
} as const;

// Gradient Definitions
export const GRADIENTS = {
  // Primary Gradients
  primary: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
  primaryLight: 'linear-gradient(135deg, #0056e6 0%, #34495e 100%)',
  primaryAccent: 'linear-gradient(135deg, #1a75ff 0%, #7f8c8d 100%)',
  
  // Pastel Gradients
  pastelBlue: 'linear-gradient(135deg, #e6f0ff 0%, #f0e6ff 100%)',
  pastelPink: 'linear-gradient(135deg, #fff5f8 0%, #ffe6f0 100%)',
  pastelPurple: 'linear-gradient(135deg, #f8f5ff 0%, #e8d6ff 100%)',
  pastelLight: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
  
  // Subtle Gradients
  subtleGray: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
  subtleBlue: 'linear-gradient(135deg, rgba(1, 31, 75, 0.03) 0%, rgba(44, 62, 80, 0.03) 100%)',
  subtleTransparent: 'linear-gradient(135deg, rgba(1, 31, 75, 0.05) 0%, rgba(44, 62, 80, 0.05) 100%)',
  
  // Accent Gradients
  pinkAccent: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
  
  // Overlay
  headerOverlay: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
} as const;

// Border Colors
export const BORDERS = {
  light: 'rgba(189, 195, 199, 0.2)',
  medium: 'rgba(189, 195, 199, 0.4)',
  accent: '#011f4b',
  activeBlue: '#90caf9',
} as const;

// Shadow Definitions
export const SHADOWS = {
  sm: '0 2px 8px rgba(1, 31, 75, 0.08)',
  md: '0 4px 20px rgba(1, 31, 75, 0.08)',
  lg: '0 12px 24px rgba(1, 31, 75, 0.15)',
  xl: '0 4px 20px rgba(0, 0, 0, 0.15)',
} as const;

// Mantine Gradient Props
export const MANTINE_GRADIENTS = {
  primary: { from: 'deepBlue.7', to: 'slate.7', deg: 135 },
  pinkAccent: { from: 'pink.6', to: 'red.6', deg: 135 },
} as const;

// Background Styles
export const BACKGROUNDS = {
  glassmorphic: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  frostedGlass: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
  },
} as const;
