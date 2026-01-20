import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

// Firebase configuration - use environment variables in production, fallback to JSON in development
let firebaseConfig;

if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  // Production: Use environment variables
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  console.log('Using Firebase config from environment variables');
} else {
  // Development: Use JSON file
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const firebaseConfigJson = require('../firebase-config.json');
  firebaseConfig = {
    apiKey: firebaseConfigJson.apiKey,
    authDomain: firebaseConfigJson.authDomain,
    projectId: firebaseConfigJson.projectId,
    storageBucket: firebaseConfigJson.storageBucket,
    messagingSenderId: firebaseConfigJson.messagingSenderId,
    appId: firebaseConfigJson.appId,
    measurementId: firebaseConfigJson.measurementId,
  };
  console.log('Using Firebase config from JSON file');
}

// Initialize Firebase app (only once)
let app: FirebaseApp;
if (getApps().length) {
  app = getApps()[0];
} else {
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication
export const firebaseAuth: Auth = getAuth(app);

// Helper function to sign up a new user
export const firebaseSignUp = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
};

// Helper function to sign in an existing user
export const firebaseSignIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

// Helper function to sign out the current user
export const firebaseSignOut = async (): Promise<void> => {
  return signOut(firebaseAuth);
};

// Helper function to get the current user's ID token
export const getIdToken = async (): Promise<string | null> => {
  const user: User | null = firebaseAuth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
};

// Export the current user getter
export const getCurrentUser = (): User | null => {
  return firebaseAuth.currentUser;
};

// Google Sign-In provider
const googleProvider = new GoogleAuthProvider();

// Helper function to sign in/up with Google
export const firebaseSignInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    return result;
  } catch (error) {
    // Handle specific errors
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
    } else if (firebaseError.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled.');
    } else if (firebaseError.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in popup is already open.');
    }
    throw error;
  }
};

// Alias for consistency (Firebase handles both signup and signin the same way)
export const signUpWithGoogle = firebaseSignInWithGoogle;

// Helper function to link Google account to current user (for account linking)
export const linkGoogleAccountToCurrentUser = async (): Promise<UserCredential> => {
  try {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    // Use linkWithPopup to link Google to the current user
    const { linkWithPopup } = await import('firebase/auth');
    const result = await linkWithPopup(currentUser, googleProvider);
    return result;
  } catch (error) {
    // Handle specific errors
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
    } else if (firebaseError.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled.');
    } else if (firebaseError.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in popup is already open.');
    } else if (firebaseError.code === 'auth/credential-already-in-use') {
      throw new Error('This Google account is already linked to another user.');
    } else if (firebaseError.code === 'auth/provider-already-linked') {
      throw new Error('A Google account is already linked to this user.');
    } else if (firebaseError.code === 'auth/email-already-in-use') {
      throw new Error('This email is already in use by another account.');
    }
    throw error;
  }
};
