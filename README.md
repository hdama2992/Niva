# Niva

Helping women build meaningful friendships through trusted, recurring plans.

## Architecture

Niva is a pnpm/Turborepo monorepo with one Firebase backend:

- React Native + Expo mobile app
- Firebase Authentication for phone and named-admin sign-in
- Cloud Firestore for application data and realtime cohort updates
- Cloud Functions for guarded business rules, REST endpoints, and schedules
- Cloud Storage for profile, activity-cover, and verification images
- Firebase Cloud Messaging for push notifications
- Firebase Hosting for the Next.js admin dashboard and public website
- Expo/EAS for Android development and Play Store builds

There is no separate SQL database, ORM, WebSocket server, or third-party backend
host in the active architecture.

## Local setup

```bash
pnpm install
pnpm firebase:emulators
```

Run the Expo app separately:

```bash
pnpm mobile:start
```

The Emulator UI runs at `http://127.0.0.1:4000`; Hosting runs at
`http://127.0.0.1:5000`; the Functions endpoint runs at
`http://127.0.0.1:5001/niva-staging/asia-south1/api`.

## Validation

```bash
pnpm --filter @niva/backend test
pnpm --filter @niva/backend test:emulator
pnpm --filter @niva/mobile typecheck
pnpm firebase:hosting:build
```

The emulator integration test covers Firebase identity/session creation,
profile setup, host and participant flows, capacity, approval, Firestore chat,
attendance, feedback, reports, named-admin actions, and Firestore access rules.

## Deployment

The staging Firebase project is `niva-staging`.

```bash
firebase login
firebase use staging
firebase functions:secrets:set NIVA_ADMIN_KEY
pnpm firebase:deploy
```

Read [the Firebase-only production guide](docs/firebase-only-backend.md) before
deploying or granting the first administrator.

## Workspace

```text
apps/mobile      Expo/React Native application
apps/backend     Firebase Cloud Functions REST and scheduled backend
apps/admin       Firebase-hosted Next.js admin dashboard
apps/website     Firebase-hosted public and policy website
apps/docs        Niva Academy documentation
firebase         Firestore and Storage rules/indexes
packages         Shared monorepo packages
```
