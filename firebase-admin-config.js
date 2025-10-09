// Firebase Admin SDK Configuration
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// For production, use service account key file
// For development, you can use the Firebase project ID and private key from environment variables

const initializeFirebaseAdmin = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // For production deployment (Cloud Run)
    if (process.env.NODE_ENV === 'production') {
      // Use service account key from environment variable or file
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID || "stock-6e930",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || "stock-6e930"
      });
    } else {
      // For development, use application default credentials or emulator
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "stock-6e930"
      });
    }

    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin.app();
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Initialize Firebase Admin
const firebaseAdmin = initializeFirebaseAdmin();

// Export Firebase Admin Auth
export const adminAuth = firebaseAdmin.auth();

// Export the admin instance
export default firebaseAdmin;
