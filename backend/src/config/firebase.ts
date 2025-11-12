import admin from 'firebase-admin';
import * as firebaseConfigJson from '../../firebase-config.json';

/**
 * Initialize Firebase Admin SDK
 * Configures service account credentials from JSON file
 */
function initializeFirebase(): admin.app.App {
  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfigJson.project_id,
        privateKey: firebaseConfigJson.private_key,
        clientEmail: firebaseConfigJson.client_email,
      }),
    });

    console.log('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Initialize and export the admin instance
export const firebaseAdmin = initializeFirebase();

// Export auth instance for token verification
export const auth = firebaseAdmin.auth();
