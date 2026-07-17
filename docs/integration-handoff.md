# Niva integration handoff

Updated: 2026-07-18

## Completed in the repository

- Expo/EAS project linked to `@hdama2992s-team/niva`.
- EAS project ID: `2f2d3081-f1e0-4893-aebd-615bed1bd316`.
- Development, preview, closed-test, and production build profiles defined.
- `expo-dev-client` installed.
- Deprecated `expo-firebase-recaptcha` integration removed.
- Mobile Firebase Auth and Storage migrated to React Native Firebase 25.1.0.
- Native Firebase Config Plugins configured.
- EAS secret-file support added for `GOOGLE_SERVICES_JSON`.
- Native Firebase session persistence replaces manual refresh-token storage.
- Named admin sign-in now creates/restores the backend Niva user session.
- Production database migration command added.
- Staging seed activities now remain future-dated when seeded.

## Android signing credentials

EAS stores the default credential named `Niva Android Upload Key`.

- Package: `com.niva.niva`
- SHA-1: `E4:1F:4B:EE:59:EF:81:A0:7C:5E:3F:1E:E2:39:D7:24:45:ED:31:22`
- SHA-256: `9C:E3:C3:0F:6A:3C:B5:23:39:8B:2B:8A:D7:F9:3E:B1:C9:57:3A:09:47:85:85:5C:53:FB:61:4C:AC:0D:39:03`

Do not replace or delete this keystore. Google Play app-signing fingerprints
will be added separately after the first Play bundle upload.

## Next manual Firebase actions

1. Open Niva Staging in the Firebase Console.
2. Register Android package `com.niva.niva`, if it is not registered already.
3. Add the SHA-1 and SHA-256 fingerprints above.
4. Download a fresh `google-services.json`.
5. In the Expo project, open Project settings > Environment variables.
6. Create the secret file variable `GOOGLE_SERVICES_JSON` for the
   `development` and `preview` environments and upload the downloaded file.
7. Enable Firebase Authentication > Phone.
8. Allow India in the SMS region policy.
9. Add at least one fictional phone number and six-digit test code.
10. Enable Firebase Authentication > Email/Password for named admins.

Do not commit `google-services.json` or send it through chat.

## Build command after the Firebase file is uploaded

```bash
cd /Users/hdama/Desktop/Niva/apps/mobile
pnpm dlx eas-cli@latest build --platform android --profile development
```

The development build, rather than Expo Go, is required for native Firebase.

## Remaining external dependencies

- Firebase Blaze billing and budget alerts before Storage is provisioned.
- Firebase Storage bucket and checked-in rule deployment.
- Hosted PostgreSQL/API/admin/website URLs and secrets.
- Firebase Admin service-account values in the backend secret manager.
- Named Firebase admin creation and initial role grant.
- FCM V1 service-account upload to EAS.
- Physical-device OTP, upload, session, WebSocket, and push testing.
- Google Play account/app setup, closed testing, and production submission.
