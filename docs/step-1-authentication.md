# Step 1: Production Authentication

## Outcome

Niva now supports two production authentication paths that converge on the
same Firebase user and the same backend session:

```text
Android device and carrier support Firebase PNV
  -> one consent prompt
  -> signed PNV token
  -> Niva backend validates token
  -> Firebase custom token
  -> Firebase ID token
  -> Niva session

All other devices
  -> Firebase sends SMS OTP
  -> member enters code
  -> Firebase ID token
  -> Niva session
```

The PNV path is Android-only and is guarded behind explicit configuration. It
never removes the SMS fallback.

## What The Member Sees

On a supported Android device, the login page first offers **Verify my phone
number**. Tapping it opens the Android/Firebase consent flow where the member
chooses the SIM to share with Niva. The carrier verifies the number; Niva does
not ask the member to type it and no SMS is sent.

If PNV is unavailable, declined, disabled, or unsupported by the carrier, the
normal country-code, phone-number, and six-digit SMS OTP flow remains available.
On iOS and web, the SMS path is always used.

## PNV End-To-End Flow

1. The mobile app checks that it is running in Firebase mode, on Android, with
   `EXPO_PUBLIC_FIREBASE_PNV_ENABLED=true`.
2. The Android module calls Firebase PNV `getVerificationSupportInfo()` to
   determine whether an installed SIM and its carrier support PNV.
3. The member chooses **Verify my phone number**.
4. Firebase PNV uses Android Credential Manager to obtain explicit consent.
5. The mobile carrier returns a signed Firebase PNV token. The phone number is
   deliberately not passed into JavaScript by the native module.
6. The app posts that signed token to `POST /auth/pnv/exchange`.
7. NestJS verifies its signature against Firebase's PNV JWKS, and validates the
   project-specific issuer, audience, expiry, and phone-number subject.
8. The backend finds or creates the matching Firebase Auth user by verified
   phone number, then mints a Firebase custom token for that Firebase UID.
9. The mobile app uses `signInWithCustomToken()` to turn the custom token into a
   Firebase ID token and refresh token.
10. The app stores the refresh token in Expo SecureStore and posts the ID token
    to `POST /auth/session`.
11. The existing Niva backend session flow verifies the Firebase ID token and
    creates or updates the PostgreSQL user and trust profile.

The backend never accepts a client-supplied phone number for PNV. It reads the
phone number only from a verified PNV token.

## SMS OTP End-To-End Flow

1. The member enters a phone number.
2. Firebase reCAPTCHA or platform verification protects the SMS request from
   abuse.
3. Firebase sends a six-digit code.
4. The member enters the code.
5. Firebase validates it and returns an ID token plus refresh token.
6. Niva persists the refresh token in SecureStore and creates the backend
   session exactly as it does after PNV.

Android's native Firebase SDK may auto-retrieve an SMS on some devices, but the
Niva fallback UX always permits manual entry because auto-retrieval is not
guaranteed.

## Configuration Required

### Firebase Auth And SMS

1. Create a Firebase project and enable Phone Authentication.
2. Register `com.niva.niva` as the Android application and add the Android
   SHA-1 and SHA-256 signing fingerprints.
3. Register the iOS bundle ID and configure the web/reCAPTCHA domains.
4. Add the Firebase client configuration to `apps/mobile/.env`.
5. Add Firebase Admin service-account values to `apps/backend/.env`.
6. Set `EXPO_PUBLIC_AUTH_MODE=firebase`.
7. Set `NIVA_BETA_AUTH_ENABLED=false` in production.

### Web Preview Limitation

Firebase Phone Authentication does not complete from a `localhost` hosted web
preview. The Firebase reCAPTCHA may render, but Firebase rejects the subsequent
phone-verification request because localhost is not an eligible hosted domain
for this flow. Use beta auth for local UI work, or test real Firebase SMS on an
Android development build or an approved HTTPS domain such as Firebase Hosting.

### Firebase PNV

1. Enable billing and the Firebase Phone Number Verification API.
2. Complete Firebase's OAuth brand verification for the project.
3. Add `google-services.json` from the Firebase Android app to
   `apps/mobile/google-services.json` before generating/building Android. The
   checked-in Expo configuration detects that file and supplies it to the
   Android build; the mobile Git ignore rules prevent the file from being
   committed.
4. Set `EXPO_PUBLIC_FIREBASE_PNV_ENABLED=true` in the Android build
   environment.
5. Set `FIREBASE_PNV_ENABLED=true` and `FIREBASE_PROJECT_NUMBER` in the
   backend environment.
6. Generate a Firebase PNV test token only for development testing. Put it in
   `EXPO_PUBLIC_FIREBASE_PNV_TEST_TOKEN`; it expires and must never be placed in
   a production build.
7. Build an Android development client or production build. Expo Go and the web
   preview do not contain the custom native PNV module.

## Source Ownership

| Concern | Code location | Responsibility |
| --- | --- | --- |
| SMS OTP and refresh session | `apps/mobile/src/services/mobile-auth.ts` | Firebase client sign-in and SecureStore session persistence |
| PNV Android consent | `apps/mobile/modules/niva-phone-number-verification` | Native Firebase PNV SDK bridge |
| PNV token exchange | `apps/backend/src/firebase/firebase-admin.service.ts` | Signature validation and Firebase custom-token creation |
| Login routing | `apps/mobile/App.tsx` | Chooses PNV or SMS, then opens normal onboarding/home routes |
| Backend session | `apps/backend/src/auth` | Verifies Firebase ID token and upserts PostgreSQL user |

## Deliberate Limits

- Firebase PNV is currently a Firebase public-preview capability. Keep SMS OTP
  available even after PNV launches.
- PNV verifies SIM phone-number control, not a person's identity or gender.
- PNV is not available in Expo Go, the web browser, or iOS.
- No Firebase credentials, Google services file, carrier capability, or billing
  can be supplied from this repository. Those are external project setup tasks.
