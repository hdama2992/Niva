import { getApp, getApps } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getStorage } from '@react-native-firebase/storage';

export function firebaseIsConfigured() {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}

function getFirebaseApp() {
  if (!firebaseIsConfigured()) {
    throw new Error(
      'Native Firebase is not configured. Add google-services.json to the EAS build and install a fresh development build.',
    );
  }

  return getApp();
}

export function initializeFirebase() {
  return getFirebaseApp();
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}
