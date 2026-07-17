import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as SecureStore from 'expo-secure-store';
import {
  ConfirmationResult,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { Platform } from 'react-native';

import {
  firebaseConfig,
  firebaseIsConfigured,
  getFirebaseAuth,
} from './firebase';
import NivaPhoneNumberVerification from '../../modules/niva-phone-number-verification';

export type MobileAuthMode = 'beta' | 'firebase';

export type PhoneNumberVerificationAvailability = {
  available: boolean;
  reason?: string;
};

let phoneConfirmation: ConfirmationResult | undefined;
let pnvTestSessionEnabled = false;
const firebaseSessionKey = 'niva.firebase-session.v1';

type StoredFirebaseSession = {
  idToken: string;
  refreshToken: string;
};

type WebStorage = {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

export function getMobileAuthMode(): MobileAuthMode {
  const configuredMode = process.env.EXPO_PUBLIC_AUTH_MODE;

  if (configuredMode === 'beta') {
    return 'beta';
  }

  if (configuredMode === 'firebase') {
    if (!firebaseIsConfigured) {
      throw new Error(
        'EXPO_PUBLIC_AUTH_MODE is firebase, but Firebase configuration is incomplete.',
      );
    }

    return 'firebase';
  }

  return firebaseIsConfigured ? 'firebase' : 'beta';
}

export async function sendPhoneCode(
  phone: string,
  recaptchaVerifier: FirebaseRecaptchaVerifierModal | null,
) {
  if (getMobileAuthMode() === 'beta') {
    return;
  }

  if (isLocalWebPhoneAuth()) {
    throw new Error(
      'Firebase phone verification cannot complete on localhost. Use an Android development build or an approved HTTPS test domain.',
    );
  }

  if (!recaptchaVerifier) {
    throw new Error('The phone verification check is not ready. Try again.');
  }

  phoneConfirmation = await signInWithPhoneNumber(
    getFirebaseAuth(),
    phone,
    recaptchaVerifier,
  );
}

export async function getPhoneNumberVerificationAvailability(): Promise<PhoneNumberVerificationAvailability> {
  if (getMobileAuthMode() !== 'firebase') {
    return {
      available: false,
      reason: 'Firebase authentication is not active.',
    };
  }

  if (Platform.OS !== 'android') {
    return {
      available: false,
      reason: 'Firebase PNV is currently Android-only.',
    };
  }

  if (process.env.EXPO_PUBLIC_FIREBASE_PNV_ENABLED !== 'true') {
    return {
      available: false,
      reason: 'Firebase PNV is disabled for this build.',
    };
  }

  if (!NivaPhoneNumberVerification) {
    return {
      available: false,
      reason:
        'Install an Android development or production build to use Firebase PNV.',
    };
  }

  await enablePnvTestSessionIfConfigured();
  const result = await NivaPhoneNumberVerification.getSupportInfoAsync();

  return result.supported
    ? { available: true }
    : {
        available: false,
        reason: 'This device or mobile carrier does not support Firebase PNV.',
      };
}

export async function requestPhoneNumberVerification(): Promise<string> {
  const availability = await getPhoneNumberVerificationAvailability();

  if (!availability.available || !NivaPhoneNumberVerification) {
    throw new Error(
      availability.reason || 'Firebase PNV is unavailable on this device.',
    );
  }

  const result = await NivaPhoneNumberVerification.requestVerificationAsync();
  return result.pnvToken;
}

export async function signInWithPnvCustomToken(
  customToken: string,
): Promise<string> {
  if (getMobileAuthMode() !== 'firebase') {
    throw new Error('Firebase PNV is unavailable in beta authentication mode.');
  }

  const credential = await signInWithCustomToken(
    getFirebaseAuth(),
    customToken,
  );
  return persistFirebaseSession(credential.user);
}

export async function verifyPhoneCode(
  code: string,
): Promise<string | undefined> {
  if (getMobileAuthMode() === 'beta') {
    return undefined;
  }

  if (!phoneConfirmation) {
    throw new Error('Request a new verification code before continuing.');
  }

  const credential = await phoneConfirmation.confirm(code);
  phoneConfirmation = undefined;
  return persistFirebaseSession(credential.user);
}

export async function restoreFirebaseIdToken(): Promise<string | undefined> {
  if (getMobileAuthMode() === 'beta') {
    return undefined;
  }

  const user = getFirebaseAuth().currentUser;

  if (user) {
    return persistFirebaseSession(user);
  }

  const storedValue = await readStoredSession();

  if (!storedValue) {
    return undefined;
  }

  let session: StoredFirebaseSession;
  try {
    session = JSON.parse(storedValue) as StoredFirebaseSession;
  } catch {
    await clearStoredSession();
    return undefined;
  }

  const apiKey = firebaseConfig.apiKey;
  if (!apiKey) {
    return undefined;
  }

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
    {
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
      }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    },
  );

  if (!response.ok) {
    await clearStoredSession();
    return undefined;
  }

  const refreshed = (await response.json()) as {
    id_token: string;
    refresh_token: string;
  };

  await writeStoredSession(
    JSON.stringify({
      idToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token,
    } satisfies StoredFirebaseSession),
  );

  return refreshed.id_token;
}

export async function logoutMobileUser() {
  if (getMobileAuthMode() === 'firebase') {
    await Promise.all([clearStoredSession(), signOut(getFirebaseAuth())]);
  }
}

async function persistFirebaseSession(user: {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  refreshToken: string;
}) {
  const idToken = await user.getIdToken();

  await writeStoredSession(
    JSON.stringify({
      idToken,
      refreshToken: user.refreshToken,
    } satisfies StoredFirebaseSession),
  );

  return idToken;
}

async function enablePnvTestSessionIfConfigured() {
  const testToken = process.env.EXPO_PUBLIC_FIREBASE_PNV_TEST_TOKEN;

  if (!testToken || pnvTestSessionEnabled || !NivaPhoneNumberVerification) {
    return;
  }

  await NivaPhoneNumberVerification.enableTestSessionAsync(testToken);
  pnvTestSessionEnabled = true;
}

async function readStoredSession() {
  const webStorage = getWebStorage();
  if (webStorage) {
    return webStorage.getItem(firebaseSessionKey);
  }

  return SecureStore.getItemAsync(firebaseSessionKey);
}

async function writeStoredSession(value: string) {
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(firebaseSessionKey, value);
    return;
  }

  await SecureStore.setItemAsync(firebaseSessionKey, value);
}

async function clearStoredSession() {
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.removeItem(firebaseSessionKey);
    return;
  }

  await SecureStore.deleteItemAsync(firebaseSessionKey);
}

function getWebStorage(): WebStorage | undefined {
  try {
    return (globalThis as { localStorage?: WebStorage }).localStorage;
  } catch {
    return undefined;
  }
}

function isLocalWebPhoneAuth() {
  if (Platform.OS !== 'web') {
    return false;
  }

  const hostname = (globalThis as { location?: { hostname?: string } }).location
    ?.hostname;

  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  );
}
