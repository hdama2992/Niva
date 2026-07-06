# Niva Closed-Beta Implementation

This document explains the implemented Niva path end to end, the local-preview
mode, and the external configuration required before real users are invited.

## Member Flow

1. The member enters a phone number in the Expo mobile app.
2. In production mode, Firebase Phone Auth sends an SMS after the Firebase
   reCAPTCHA check. The member confirms the six-digit code.
3. Firebase returns an ID token and refresh token. The app stores the refresh
   token in Expo SecureStore, which uses the mobile operating system's protected
   keychain/keystore. On a later app launch, the app exchanges it with Firebase
   for a fresh ID token before calling the Niva API.
4. The app sends the Firebase ID token to `POST /auth/session`. NestJS verifies
   it through Firebase Admin, then creates or updates the corresponding
   PostgreSQL `User`, `TrustProfile`, and authentication signals.
5. The member completes username, profile, and self-declaration. Each screen
   writes to the API; PostgreSQL, not the device, is the system of record.
6. The member can browse events and circles. A join attempt requires a verified
   trust state.
7. If unverified, the member takes or chooses a selfie. The app uploads it to
   Firebase Storage under the Firebase user ID and sends only the internal
   storage path to `POST /users/me/selfie`. The backend creates or resets a pending
   `SelfieVerification` and `VerificationReview` record.
8. An admin opens the Next.js dashboard, enters the server-side admin key, and
   loads the queue from `GET /admin/verification-reviews`.
9. Before an admin opens a selfie, the backend creates a five-minute signed
   viewer URL from that internal storage path. Approve, hold, or reject calls
   `PATCH /admin/verification-reviews/:userId`. The backend updates the review,
   selfie state, trust events, score, tier, and verification access.
10. A verified member can create a persisted event/circle join request. The
    backend stores membership and creates an in-app notification. Feedback is
    persisted after a joined event.

## Local Preview Versus Production

`EXPO_PUBLIC_AUTH_MODE=beta` is only for local Expo development. It allows a
valid-looking phone number and any six digits to create a local beta token when
the backend has `NIVA_BETA_AUTH_ENABLED=true`.

Production must set `EXPO_PUBLIC_AUTH_MODE=firebase`, complete the Firebase
configuration below, and set `NIVA_BETA_AUTH_ENABLED=false`. The backend then
only accepts Firebase Admin-verified tokens.

## Firebase Configuration

Add the following values to `apps/mobile/.env`; the template is in
`apps/mobile/.env.example`.

```dotenv
EXPO_PUBLIC_AUTH_MODE=firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
```

In Firebase Console:

1. Enable Phone as a Firebase Authentication sign-in method.
2. Register the iOS and Android app identifiers used by the Expo build.
3. Add the development and production domains required for the web reCAPTCHA
   flow.
4. Create a Storage bucket in the same project.
5. Supply the backend Firebase Admin service account variables from
   `apps/backend/.env.example`.

Use Firebase Storage rules that restrict each member to writes in their own
folder and do not permit public reads of verification selfies. The admin
dashboard requests a five-minute signed viewer URL from the backend only after
the operator has supplied the admin credential.

## Admin Security

The current closed-beta dashboard accepts `NIVA_ADMIN_KEY` at runtime and keeps
it only in page memory. It is sent as `x-niva-admin-key` to the backend. This is
appropriate for a small, trusted operator group but must be replaced before a
public launch with named administrator accounts, server-side authorization, and
an audit log.

## Implemented Data Ownership

| Concern | System of record | Mobile behavior |
| --- | --- | --- |
| Authentication identity | Firebase Auth | SMS authentication and protected token refresh |
| User/profile/trust | PostgreSQL via NestJS | API reads and writes |
| Profile photos/selfies | Firebase Storage | Camera/library selection and direct authenticated upload |
| Verification review | PostgreSQL via NestJS | Pending state in the app; live admin decision queue |
| Events, circles, memberships, feedback | PostgreSQL via NestJS | API-backed discovery, joining, activity, feedback |
| In-app notifications | PostgreSQL via NestJS | API-backed list in the Home experience |

## Still Required Before Inviting Users

- Apply real Firebase credentials and disable beta auth.
- Apply Firebase Storage rules and confirm that staff cannot access selfies
  outside the verification workflow.
- Replace the shared admin key with individual admin authentication and add
  audit history.
- Add event/circle chat for joined members only.
- Add push notification delivery for approvals, joins, reminders, and updates.
- Add attendance/no-show and feedback-to-trust rules.
- Add privacy policy, selfie consent, retention/deletion rules, and operator
  escalation procedures.
- Build the held report reasons flow and community-guidelines page when the
  product decision is reopened.
