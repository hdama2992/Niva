# Niva Firebase backend

Niva's backend runs entirely on Firebase:

- Firebase Authentication proves member and administrator identities.
- Cloud Firestore stores application records.
- Cloud Functions exposes the guarded REST API and scheduled push dispatcher.
- Cloud Storage stores profile photos, activity covers, and private selfies.
- Firebase Cloud Messaging delivers device notifications.
- Firestore listeners provide cohort chat and membership updates.

No PostgreSQL database, ORM, standalone WebSocket server, Firebase service-account
file, Render service, or Vercel backend is required.

## Commands

From the repository root:

```bash
pnpm firebase:emulators
pnpm --filter @niva/backend test
pnpm --filter @niva/backend test:emulator
pnpm firebase:deploy:backend
```

Production deployment uses the Cloud Functions service identity automatically.
Set the one-time admin bootstrap secret with:

```bash
firebase functions:secrets:set NIVA_ADMIN_KEY --project niva-staging
```

See [`docs/firebase-only-backend.md`](../../docs/firebase-only-backend.md) for
the complete architecture, setup, testing, and deployment checklist.
