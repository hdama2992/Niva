import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';

const requiredConfigKeys = [
  'apiKey',
  'appId',
  'projectId',
  'storageBucket',
] as const;

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

export const firebaseIsConfigured = requiredConfigKeys.every(
  (key) => Boolean(firebaseConfig[key]),
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

function getFirebaseApp() {
  if (!firebaseIsConfigured) {
    throw new Error(
      'Firebase is not configured. Add the EXPO_PUBLIC_FIREBASE_* values before using production authentication.',
    );
  }

  app ??= getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth() {
  auth ??= getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseStorage() {
  storage ??= getStorage(getFirebaseApp());
  return storage;
}
