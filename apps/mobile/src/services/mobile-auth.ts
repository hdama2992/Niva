import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as SecureStore from 'expo-secure-store';
import {
  ConfirmationResult,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';

import { firebaseConfig, firebaseIsConfigured, getFirebaseAuth } from './firebase';

export type MobileAuthMode = 'beta' | 'firebase';

let phoneConfirmation: ConfirmationResult | undefined;
const firebaseSessionKey = 'niva.firebase-session.v1';

type StoredFirebaseSession = {
  idToken: string;
  refreshToken: string;
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

  if (!recaptchaVerifier) {
    throw new Error('The phone verification check is not ready. Try again.');
  }

  phoneConfirmation = await signInWithPhoneNumber(
    getFirebaseAuth(),
    phone,
    recaptchaVerifier,
  );
}

export async function verifyPhoneCode(code: string): Promise<string | undefined> {
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

  const storedValue = await SecureStore.getItemAsync(firebaseSessionKey);

  if (!storedValue) {
    return undefined;
  }

  let session: StoredFirebaseSession;
  try {
    session = JSON.parse(storedValue) as StoredFirebaseSession;
  } catch {
    await SecureStore.deleteItemAsync(firebaseSessionKey);
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
    await SecureStore.deleteItemAsync(firebaseSessionKey);
    return undefined;
  }

  const refreshed = (await response.json()) as {
    id_token: string;
    refresh_token: string;
  };

  await SecureStore.setItemAsync(
    firebaseSessionKey,
    JSON.stringify({
      idToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token,
    } satisfies StoredFirebaseSession),
  );

  return refreshed.id_token;
}

export async function logoutMobileUser() {
  if (getMobileAuthMode() === 'firebase') {
    await Promise.all([
      SecureStore.deleteItemAsync(firebaseSessionKey),
      signOut(getFirebaseAuth()),
    ]);
  }
}

async function persistFirebaseSession(user: {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  refreshToken: string;
}) {
  const idToken = await user.getIdToken();

  await SecureStore.setItemAsync(
    firebaseSessionKey,
    JSON.stringify({ idToken, refreshToken: user.refreshToken } satisfies StoredFirebaseSession),
  );

  return idToken;
}
