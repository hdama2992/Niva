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
