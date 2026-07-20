# Niva Firebase-only backend

This is the authoritative integration and production guide for the active Niva
backend. Older sprint notes describe historical implementations and must not be
used for deployment.

## Final architecture

| Responsibility           | Firebase service         | Niva implementation                                                                         |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------- |
| Phone and admin identity | Authentication           | Phone OTP in mobile; email/password for named admins                                        |
| Product data             | Cloud Firestore          | Users, plans, memberships, trust evidence, reports, settings, notifications, and audit logs |
| Business rules           | Cloud Functions          | Firebase-token-authenticated REST API in `asia-south1`                                      |
| Realtime                 | Cloud Firestore          | Approved cohort chat, membership, and notification listeners                                |
| Images                   | Cloud Storage            | Profile photos, activity covers, and private verification selfies                           |
| Push                     | Firebase Cloud Messaging | Native FCM device tokens and scheduled delivery                                             |
| Web                      | Firebase Hosting         | Website at `/`; admin dashboard at `/admin`; same-origin API at `/api`                      |
| Android build            | Expo/EAS                 | Development, closed-test, and Play Store builds                                             |

Niva does not require PostgreSQL, Prisma, NestJS, Socket.IO, Render, Neon,
Vercel, a Firebase service-account JSON file, or a separately hosted API.

## Collections

The server owns writes. Firestore rules deny client writes and allow only the
few realtime reads required by the signed-in app.

- `users` embeds profile, trust evidence, selfie state, settings, and emergency contact.
- `usernames` atomically reserves unique public usernames.
- `events`, `circles`, and `circleOccurrences` store plan details and schedules.
- `eventMembers` and `circleMembers` use deterministic `<activityId>_<uid>` IDs.
- `chatThreads/{type_activityId}/messages` stores approved-cohort chat.
- `notifications` and `pushTokens` drive in-app and FCM delivery.
- `reports`, `blocks`, `feedback`, and `continuityPreferences` support safety and retention.
- `verificationReviews`, `hostApprovals`, `adminAccess`, and `adminAuditLogs` support named administration.
- `betaAccessRequests` and `accountDeletionRequests` support the public website.

Capacity changes and join requests use Firestore transactions. Exact meeting
coordinates remain hidden from unapproved members because discovery reads pass
through the Function API rather than exposing activity documents directly.

## One-time Firebase Console setup

Use the [Firebase Console](https://console.firebase.google.com/) and select
**Niva Staging** (`niva-staging`).

1. Open **Build → Authentication → Sign-in method**. Keep **Phone** enabled and
   enable **Email/Password** for named administrators. Under **Settings → SMS
   region policy**, allow India.
2. Open **Project settings → Your apps → Android app** and confirm the package
   is `com.niva.niva`, the staging `google-services.json` is current, and the
   development/Play signing SHA-1 and SHA-256 fingerprints are registered.
3. Open **Build → Firestore Database → Create database**. Choose a production
   rules baseline and the Mumbai/India-compatible location if the project has
   not already chosen an immutable database location.
4. Confirm **Build → Storage** has the `niva-staging.firebasestorage.app`
   bucket.
5. Confirm **Cloud Messaging** is enabled. The Android build obtains an FCM
   registration token; the scheduled Function sends notifications through FCM.
6. Upgrade the project to the **Blaze** plan before deploying Cloud Functions.
   Blaze requires a billing account, although low initial usage can remain
   inside Firebase's no-cost quotas. Configure Google Cloud budget alerts.

Console links:

- [Authentication](https://console.firebase.google.com/project/niva-staging/authentication/providers)
- [Firestore](https://console.firebase.google.com/project/niva-staging/firestore)
- [Storage](https://console.firebase.google.com/project/niva-staging/storage)
- [Cloud Messaging settings](https://console.firebase.google.com/project/niva-staging/settings/cloudmessaging)
- [Android app settings](https://console.firebase.google.com/project/niva-staging/settings/general/android:com.niva.niva)
- [Firebase usage and billing](https://console.firebase.google.com/project/niva-staging/usage)

## CLI setup and deployment

From the repository root:

```bash
firebase login
firebase use staging
firebase projects:list
```

The final command must show `niva-staging`. Then create a strong, unique,
one-time administrator bootstrap secret:

```bash
firebase functions:secrets:set NIVA_ADMIN_KEY --project niva-staging
```

Deploy all Firebase services:

```bash
pnpm install --frozen-lockfile
pnpm firebase:deploy
```

This builds both static Next.js applications, compiles the Functions source,
and deploys Functions, Firestore rules/indexes, Storage rules, and Hosting.

Expected staging URLs:

- Website: `https://niva-staging.web.app/`
- Admin: `https://niva-staging.web.app/admin/`
- Same-origin API: `https://niva-staging.web.app/api`
- Direct Function: `https://asia-south1-niva-staging.cloudfunctions.net/api`

Use the Hosting `/api` URL for the mobile environment. It gives the website and
admin a same-origin API and lets Niva change the underlying Function URL later.

## First named administrator

1. In Firebase Console, open **Authentication → Users → Add user** and create
   your administrator email/password account.
2. Open `https://niva-staging.web.app/admin/` and sign in.
3. The dashboard creates your `users/{firebaseUid}` record and displays the UID.
4. Enter the one-time `NIVA_ADMIN_KEY` in the bootstrap box and choose **Grant
   my admin access**.
5. The backend atomically creates `adminAccess/{uid}` with `SUPER_ADMIN` and
   marks `system/adminBootstrap` complete. The bootstrap secret cannot create a
   second first administrator.
6. Future administrators must be granted by an existing `SUPER_ADMIN`; all
   review and moderation actions are written to `adminAuditLogs`.

After bootstrap, rotate the stored secret in Secret Manager. The completed
Firestore guard remains the primary one-time control.

## EAS environment

Set these values for preview/closed-test and production environments in the
[Expo dashboard](https://expo.dev/):

```text
EXPO_PUBLIC_API_URL=https://niva-staging.web.app/api
EXPO_PUBLIC_AUTH_MODE=firebase
EXPO_PUBLIC_EAS_PROJECT_ID=2f2d3081-f1e0-4893-aebd-615bed1bd316
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://niva-staging.web.app/privacy
EXPO_PUBLIC_TERMS_URL=https://niva-staging.web.app/terms
EXPO_PUBLIC_SUPPORT_URL=https://niva-staging.web.app/support
```

Keep `GOOGLE_SERVICES_JSON` as an EAS secret file containing the staging
Android configuration. A Firebase Admin credential must never be placed in EAS
or in an `EXPO_PUBLIC_*` variable.

Because Firestore and FCM add native modules, create a fresh development build
once after this change:

```bash
cd apps/mobile
pnpm dlx eas-cli@latest build --profile development --platform android
```

After installing that build, ordinary JavaScript/UI edits continue through
Metro without rebuilding. Rebuild only when native dependencies or native app
configuration changes.

## Local verification

```bash
pnpm --filter @niva/backend test
pnpm --filter @niva/backend test:emulator
pnpm --filter @niva/mobile typecheck
pnpm firebase:hosting:build
```

The emulator E2E test creates separate host, participant, outsider, and admin
identities. It verifies profile setup, plan creation, join approval, capacity,
chat, Firestore access denial for outsiders/direct writes, attendance, feedback,
host approval, reports, admin audit paths, and analytics.

## Required checks before real users

- Deploy to `niva-staging` and repeat phone OTP on the physical Android device.
- Confirm the new native build receives an FCM token and a test notification.
- Create one event as the named administrator/host, join from a separate member
  account, approve it, verify exact-location reveal, chat, attendance, and feedback.
- Review Firestore/Functions/Authentication usage dashboards and create billing alerts.
- Enable Firebase App Check with Play Integrity in monitor mode; enforce it only
  after both the Play-distributed Android app and hosted admin are registered.
- Enable Google Cloud log-based alerts for Function 5xx errors and test the
  account-deletion and private-selfie review procedures.
- Create a separate production Firebase project before the public Play release;
  do not turn the staging database into the permanent production database.

Official references:

- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firebase Hosting rewrites](https://firebase.google.com/docs/hosting/functions)
- [FCM for Android](https://firebase.google.com/docs/cloud-messaging/android/client)
- [App Check with Play Integrity](https://firebase.google.com/docs/app-check/android/play-integrity-provider)
- [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
