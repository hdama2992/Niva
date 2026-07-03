# Niva

Helping women build meaningful friendships through recurring activities.

## Repository

This repository is a pnpm/Turborepo monorepo containing the Niva mobile app,
backend API, admin dashboard, and shared packages.

## Tech Stack

- Flutter
- NestJS
- Next.js
- PostgreSQL
- Prisma
- Firebase

## Getting Started

```bash
pnpm install
pnpm dev
```

Start the local PostgreSQL service with:

```bash
pnpm db:up
```

Copy the backend environment template before starting the API:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Create or apply local database migrations with:

```bash
pnpm db:migrate
```

`pnpm dev` starts the admin dashboard on port 3000 and the API on port 3001.
Run the Flutter app separately from `apps/mobile` with `flutter run`.

## Workspace Layout

```text
apps/mobile      Flutter mobile application
apps/backend     NestJS API
apps/admin       Next.js administration dashboard
packages/ui      Shared web UI components
packages/shared  Shared utilities
packages/config  Shared tooling configuration
packages/types   Shared TypeScript types
docker            Local infrastructure
docs              Project documentation
```

## Status

🚧 MVP in development
