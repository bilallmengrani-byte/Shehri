import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Client Firebase configuration from environment or fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDE-gih4RJavkPLZNl6zzKeLa24dXg7Vcs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0075882837.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0075882837',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0075882837.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '891113885145',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:891113885145:web:64294376bb909b049f9dc8',
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore:
// Standard Firebase default database MUST always be initialized with getFirestore(app) (no second argument).
// Only pass a second argument if an explicit custom non-default database ID is specified.
const rawDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
const isCustomDb = Boolean(
  rawDbId &&
  rawDbId !== '(default)' &&
  rawDbId !== 'default' &&
  rawDbId !== 'DEFAULT' &&
  rawDbId.trim() !== ''
);

export const db = isCustomDb
  ? getFirestore(app, rawDbId)
  : getFirestore(app);

// Firebase Cloud Storage is disabled (replaced with Cloudinary for unsigned client uploads)
// export const storage = getStorage(app);

// Firebase App Check is optional and currently disabled.
// Uncomment below if you enable App Check with reCAPTCHA v3 in Firebase Console.
/*
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey && typeof window !== 'undefined') {
  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn('Firebase App Check initialization warning:', e);
  }
}
*/

