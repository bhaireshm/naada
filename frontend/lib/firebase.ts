import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential,
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

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
