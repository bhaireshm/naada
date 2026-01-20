// Centralized auth configuration following DRY principle
export const AUTH_CONFIG = {
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your music library',
    submitText: 'Sign In',
    googleVariant: 'signin' as const,
    linkText: "Don't have an account?",
    linkHref: '/register',
    linkLabel: 'Sign up',
  },
  register: {
    title: 'Create Account',
    subtitle: 'Sign up to start building your music library',
    submitText: 'Sign Up',
    googleVariant: 'signup' as const,
    linkText: 'Already have an account?',
    linkHref: '/login',
    linkLabel: 'Sign in',
  },
} as const;

export const DEFAULT_REDIRECT_URL = '/library';

// Extracted styles to avoid inline styles
export const AUTH_STYLES = {
  interactive: { pointerEvents: 'auto' } as const,
  button: { pointerEvents: 'auto', touchAction: 'manipulation' } as const,
  input: { input: { pointerEvents: 'auto', touchAction: 'manipulation' } } as const,
} as const;