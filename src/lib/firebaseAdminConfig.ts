
import * as admin from 'firebase-admin';

// This script initializes the Firebase Admin SDK for server-side operations.
// It uses a robust, multi-stage initialization process suitable for local development,
// CI/CD, and production Google Cloud environments.

// Only attempt to initialize if no apps are already running.
if (!admin.apps.length) {
  let initialized = false;
  let initError: any = null;

  // Attempt 1: Use explicit credentials from environment variables (Primary for local dev)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // When using a variable, the newline characters in the key need to be processed correctly.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
     try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
      });
      initialized = true;
     } catch (error: any) {
      initError = error;
      console.error("ADMIN_SDK: Explicit credential initialization FAILED.", error);
     }
  }

  // Attempt 2: Use default credentials (Fallback for deployed/CI environments)
  if (!initialized) {
    try {
      admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
      });
      initialized = true;
    } catch (error: any) {
        // This error is expected if default credentials aren't configured and explicit ones failed.
        initError = error;
    }
  }
}

// After all initialization attempts, perform a final check.
if (!admin.apps.length) {
  throw new Error(
    'CRITICAL: Firebase Admin SDK failed to initialize. ' +
    'None of the initialization methods succeeded. Please verify your server environment configuration.'
  );
}

// Export the initialized services.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
