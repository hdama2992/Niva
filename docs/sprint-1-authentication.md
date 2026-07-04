# Sprint 1: Authentication

## Goal

A verified Firebase phone identity becomes a local Niva user in PostgreSQL.

```text
React Native Expo → Firebase Phone Auth → Firebase ID token → NestJS → Prisma → PostgreSQL
```

## Implemented backend pieces

- `prisma/schema.prisma` defines the minimal `User` table.
- The `init_user` migration creates that table locally.
- `POST /auth/session` accepts a Firebase ID token and creates or updates the
  matching Niva user.
- `GET /users/me` requires a Firebase ID token and returns that user.
- `GET /` returns `Niva Backend Running`.

The API intentionally has no `send-otp` route. Firebase Phone Authentication
sends and verifies the OTP from the React Native Expo client. The backend only verifies
Firebase's signed ID token, which prevents callers from inventing a phone
number.

## Local commands

```bash
pnpm db:up
cp apps/backend/.env.example apps/backend/.env
pnpm db:migrate
pnpm dev
```

In another terminal:

```bash
pnpm mobile:start
```

## Firebase setup still required

This requires access to the Niva Firebase project and cannot be committed to
the repository.

1. Create a Firebase project and enable **Phone** under Authentication sign-in
   providers.
2. Register Android and iOS apps with bundle/package ID `com.niva.niva`.
3. Add Android SHA-1/SHA-256 fingerprints and complete iOS APNs setup as
   Firebase requests.
4. Configure the Expo client with the Firebase project values required by the
   chosen React Native Firebase integration. Commit only non-secret client
   configuration unless your organization has a different policy; never commit
   the Firebase Admin service-account key.
5. Generate a Firebase Admin service account and add these values only to
   `apps/backend/.env`:

   ```dotenv
   FIREBASE_PROJECT_ID="..."
   FIREBASE_CLIENT_EMAIL="..."
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
   ```

The private key must retain escaped `\\n` sequences in `.env`; the backend
converts them to real line breaks before Firebase Admin uses it.

## Current mobile UI limitation

The React Native Expo login screen currently uses a small hardcoded country
list only to unblock the initial UI. Before production, replace that list with
a proper phone-number metadata source or library so country calling codes,
local number lengths, and formatting rules stay accurate.

The mobile flow also includes a temporary username step after OTP verification
so the Home screen can show a product identity such as `Signed in as Maya`
instead of only showing the verified phone number. In production, that username
should be persisted on the backend user profile after Firebase authentication.

Google, Apple, and other social providers can be added later through Firebase
Authentication providers. They are not wired in the current Expo client yet.

## Endpoints

### Create or synchronize a session

```http
POST /auth/session
Content-Type: application/json

{
  "idToken": "<Firebase ID token>"
}
```

### Read the current user

```http
GET /users/me
Authorization: Bearer <Firebase ID token>
```

## Concepts learned

- Prisma schema: the code description of database tables.
- Migration: a versioned change that creates or updates those tables.
- Firebase ID token: proof signed by Firebase that a phone was verified.
- DTO: a validated description of request data (`CreateSessionDto`).
- Guard: code that blocks a protected route without a valid token.
