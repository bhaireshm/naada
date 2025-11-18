import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  UserCredential,
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
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Helper function to sign up a new user
export const signUp = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Helper function to sign in an existing user
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Helper function to sign out the current user
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Helper function to get the current user's ID token
export const getIdToken = async (): Promise<string | null> => {
  const user: User | null = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
};

// Export the current user getter
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Google Sign-In provider
const googleProvider = new GoogleAuthProvider();

// Helper function to sign in/up with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    // Handle specific errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in popup is already open.');
    }
    throw error;
  }
};

// Alias for consistency (Firebase handles both signup and signin the same way)
export const signUpWithGoogle = signInWithGoogle;
