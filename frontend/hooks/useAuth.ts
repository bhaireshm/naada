import { getUserProfile } from '@/lib/api';
import {
  firebaseAuth,
  firebaseSignIn,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  firebaseSignUp
} from '@/lib/firebase';
import { AuthErrorCodes, User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

/**
 * Maps Firebase error codes to user-friendly error messages
 * 
 * @param {unknown} error - The error object from Firebase
 * @param {string} defaultMessage - Default message if error code is not recognized
 * @returns {string} User-friendly error message
 */
function getFirebaseErrorMessage(error: unknown, defaultMessage: string): string {
  const firebaseError = error as { code?: string; message?: string };

  if (!firebaseError.code) {
    return error instanceof Error ? error.message : defaultMessage;
  }

  switch (firebaseError.code) {
    // Sign up errors
    case AuthErrorCodes.EMAIL_EXISTS:
      return 'An account with this email already exists. Please sign in instead.';
    case AuthErrorCodes.WEAK_PASSWORD:
      return 'Password is too weak. Please use a stronger password.';
    case AuthErrorCodes.OPERATION_NOT_ALLOWED:
      return 'Email/password accounts are not enabled. Please contact support.';

    // Sign in errors
    case AuthErrorCodes.USER_DELETED:
      return 'No account found with this email. Please sign up first.';
    case AuthErrorCodes.INVALID_PASSWORD:
      return 'Incorrect password. Please try again.';
    case AuthErrorCodes.USER_DISABLED:
      return 'This account has been disabled.';
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
      return 'Too many failed attempts. Please try again later.';
    case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
      return 'Invalid email or password. Please check your credentials.';

    // Google sign in errors
    case AuthErrorCodes.POPUP_BLOCKED:
      return 'Popup blocked. Allow popups and try again.';
    case AuthErrorCodes.PROVIDER_ALREADY_LINKED:
      return 'Account exists with different provider. Link accounts.';
    case AuthErrorCodes.POPUP_CLOSED_BY_USER:
      return 'Sign-in cancelled.';

    // Common errors
    case AuthErrorCodes.INVALID_EMAIL:
      return 'Invalid email address format.';
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
      return 'Network error. Please check your connection and try again.';

    default:
      return firebaseError.message || defaultMessage;
  }
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Custom hook to manage authentication state and operations
 * Tracks current user, loading state, and handles authentication errors
 * 
 * @returns {UseAuthReturn} Authentication state and action functions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        console.error('Auth state change error:', authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sync the Firebase user with the backend database
   */
  const syncUserWithBackend = async () => {
    try {
      // This call triggers the backend middleware to create/update the user
      await getUserProfile();
    } catch (err) {
      console.error('Failed to sync user with backend:', err);
      // We don't throw here to allow the auth flow to continue, 
      // but we log it. The user might face issues later if the backend record isn't created.
    }
  };

  /**
   * Sign up a new user with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @throws {Error} If sign up fails
   */
  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignUp(email, password);
      await syncUserWithBackend();
    } catch (err: unknown) {
      const errorMessage = getFirebaseErrorMessage(err, 'Failed to sign up');
      console.error('Sign up error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in an existing user with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @throws {Error} If sign in fails
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignIn(email, password);
      await syncUserWithBackend();
    } catch (err: unknown) {
      const errorMessage = getFirebaseErrorMessage(err, 'Failed to sign in');
      console.error('Sign in error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignInWithGoogle();
      await syncUserWithBackend();
    } catch (err: unknown) {
      const errorMessage = getFirebaseErrorMessage(err, 'Failed to sign in with Google');
      console.error('Google sign in error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   * 
   * @throws {Error} If sign out fails
   */
  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignOut();
      // User state will be updated by onAuthStateChanged
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err, "Failed to sing out with Google");
      console.error('Google sign out error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
