import {
  getIdToken,
  onIdTokenChanged,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from '@react-native-firebase/auth';

import { firebaseIsConfigured, getFirebaseAuth } from './firebase';

let phoneConfirmation: ConfirmationResult | undefined;

export function assertFirebaseAuthConfigured() {
  if (!firebaseIsConfigured()) {
    throw new Error('This build is missing its native Firebase configuration.');
  }
}

export async function sendPhoneCode(phone: string) {
  assertFirebaseAuthConfigured();
  phoneConfirmation = await signInWithPhoneNumber(getFirebaseAuth(), phone);
}

export async function verifyPhoneCode(
  code: string,
): Promise<string | undefined> {
  if (!phoneConfirmation) {
    const auth = getFirebaseAuth();
    await auth.authStateReady();

    if (auth.currentUser) {
      return getIdToken(auth.currentUser);
    }

    throw new Error('Request a new verification code before continuing.');
  }

  const credential = await phoneConfirmation.confirm(code);
  phoneConfirmation = undefined;
  return getIdToken(credential.user);
}

export async function restoreFirebaseIdToken(): Promise<string | undefined> {
  assertFirebaseAuthConfigured();
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser ? getIdToken(auth.currentUser) : undefined;
}

export async function resolveFirebaseIdToken(fallback: string) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser ? getIdToken(auth.currentUser) : fallback;
}

export function subscribeToFirebaseIdToken(
  listener: (idToken?: string) => void,
) {
  return onIdTokenChanged(getFirebaseAuth(), (user) => {
    if (!user) {
      listener(undefined);
      return;
    }

    void getIdToken(user)
      .then(listener)
      .catch((error) => {
        console.warn('Unable to refresh the Firebase ID token.', error);
      });
  });
}

export async function logoutMobileUser() {
  await signOut(getFirebaseAuth());
}
