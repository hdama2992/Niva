import {
  getIdToken,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from '@react-native-firebase/auth';
import { Platform } from 'react-native';

import { firebaseIsConfigured, getFirebaseAuth } from './firebase';
import NivaPhoneNumberVerification from '../../modules/niva-phone-number-verification';

export type MobileAuthMode = 'beta' | 'firebase';

export type PhoneNumberVerificationAvailability = {
  available: boolean;
  reason?: string;
};

let phoneConfirmation: ConfirmationResult | undefined;
let pnvTestSessionEnabled = false;

export function getMobileAuthMode(): MobileAuthMode {
  const configuredMode = process.env.EXPO_PUBLIC_AUTH_MODE;

  if (configuredMode === 'beta') {
    return 'beta';
  }

  if (configuredMode === 'firebase') {
    if (!firebaseIsConfigured()) {
      throw new Error(
        'EXPO_PUBLIC_AUTH_MODE is firebase, but the native Firebase app is not configured in this build.',
      );
    }

    return 'firebase';
  }

  return firebaseIsConfigured() ? 'firebase' : 'beta';
}

export async function sendPhoneCode(phone: string) {
  if (getMobileAuthMode() === 'beta') {
    return;
  }

  if (Platform.OS === 'web') {
    throw new Error(
      'Phone authentication is available in the Android or iOS development build, not the mobile web preview.',
    );
  }

  phoneConfirmation = await signInWithPhoneNumber(getFirebaseAuth(), phone);
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
  return getIdToken(credential.user);
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
  return getIdToken(credential.user);
}

export async function restoreFirebaseIdToken(): Promise<string | undefined> {
  if (getMobileAuthMode() === 'beta') {
    return undefined;
  }

  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser ? getIdToken(auth.currentUser) : undefined;
}

export async function logoutMobileUser() {
  if (getMobileAuthMode() === 'firebase') {
    await signOut(getFirebaseAuth());
  }
}

async function enablePnvTestSessionIfConfigured() {
  const testToken = process.env.EXPO_PUBLIC_FIREBASE_PNV_TEST_TOKEN;

  if (!testToken || pnvTestSessionEnabled || !NivaPhoneNumberVerification) {
    return;
  }

  await NivaPhoneNumberVerification.enableTestSessionAsync(testToken);
  pnvTestSessionEnabled = true;
}
