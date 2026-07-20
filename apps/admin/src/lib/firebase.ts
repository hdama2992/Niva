import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const environmentConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let authPromise: Promise<Auth> | undefined;

export function initializeAdminFirebaseAuth() {
  authPromise ??= initializeAuth();
  return authPromise;
}

export function getAdminFirebaseAuth() {
  if (getApps().length === 0) {
    throw new Error('Firebase is still loading. Please try again.');
  }
  return getAuth(getApp());
}

async function initializeAuth() {
  if (getApps().length) return getAuth(getApp());

  const configured = Object.values(environmentConfig).every(Boolean);
  let config = environmentConfig;
  if (!configured) {
    const response = await fetch('/__/firebase/init.json');
    if (!response.ok) {
      throw new Error(
        'Firebase Admin is not configured. On localhost, add the public Firebase web configuration to apps/admin/.env.local.',
      );
    }
    config = (await response.json()) as FirebaseOptions;
  }

  return getAuth(initializeApp(config));
}
