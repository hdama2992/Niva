# Niva

Helping women build meaningful friendships through recurring activities.

## Repository

This repository is a pnpm/Turborepo monorepo containing the Niva mobile app,
backend API, admin dashboard, and shared packages.

## Tech Stack

- React Native Expo
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

`pnpm dev` starts the API, admin dashboard, docs site, and Expo dev server.
For focused mobile work, run:

```bash
pnpm mobile:start
```

For focused documentation work, run:

```bash
pnpm docs:dev
```

The admin dashboard runs on port 3000, the API on port 3001, and the docs site
on port 3002.

## Workspace Layout

```text
apps/mobile      React Native Expo mobile application
apps/backend     NestJS API
apps/admin       Next.js administration dashboard
apps/docs        Niva Academy documentation website
packages/ui      Shared web UI components
packages/shared  Shared utilities
packages/config  Shared tooling configuration
packages/types   Shared TypeScript types
docker            Local infrastructure
docs              Project documentation
```

## Status

🚧 MVP in development
