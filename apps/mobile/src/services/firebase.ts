import { getApp, getApps } from '@react-native-firebase/app';
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import {
  connectStorageEmulator,
  getStorage,
} from '@react-native-firebase/storage';

let emulatorConnected = false;

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
  const app = getFirebaseApp();

  if (
    __DEV__ &&
    process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !emulatorConnected
  ) {
    // 127.0.0.2 stays on Android's loopback interface without RNFirebase's
    // emulator-only 127.0.0.1 -> 10.0.2.2 remap. This lets `adb reverse`
    // connect a physical QA device to emulators running on the development Mac.
    connectAuthEmulator(getAuth(app), 'http://127.0.0.2:9099', {
      disableWarnings: true,
    });
    connectStorageEmulator(getStorage(app), '127.0.0.2', 9199);
    emulatorConnected = true;
  }

  return app;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}
